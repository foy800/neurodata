const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Определяем, какую базу данных использовать
let db;
if (process.env.NODE_ENV === 'production') {
  // В продакшене используем базу данных в памяти
  console.log('Используем базу данных в памяти для Vercel');
  db = require('./memory-db');
} else {
  // Локально используем файловую базу данных
  console.log('Используем файловую базу данных SQLite');
  db = require('../database/db');
}

const debugRoutes = require('./debug');

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, '..')));

// Настройка сессий
app.use(session({
  secret: process.env.SESSION_SECRET || 'neuro-knowledge-base-secret-key-2024',
  resave: true,
  saveUninitialized: true,
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // В продакшене используем secure cookies
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 часа
    sameSite: 'lax'
  }
}));

// Middleware для проверки аутентификации
function requireAuth(req, res, next) {
  if (!req.session.user_id && !req.session.admin_logged_in) {
    return res.redirect('/login');
  }
  next();
}

// Middleware для проверки прав администратора
function requireAdmin(req, res, next) {
  console.log('Проверка прав администратора:', req.session);
  
  // Проверка на наличие специального параметра для отладки (только для разработки)
  if (req.query.admin_debug === 'true' && process.env.NODE_ENV !== 'production') {
    console.log('Доступ разрешен через параметр отладки');
    req.session.admin_logged_in = true;
    req.session.admin_id = 1;
    req.session.username = 'admin';
    return next();
  }
  
  if (!req.session.admin_logged_in) {
    console.log('Доступ запрещен: не администратор');
    return res.redirect('/login');
  }
  console.log('Доступ разрешен: администратор');
  next();
}

// Главная страница
app.get('/', requireAuth, (req, res) => {
  db.all("SELECT * FROM categories ORDER BY name", (err, categories) => {
    if (err) {
      console.error('Ошибка базы данных:', err);
      return res.status(500).send('Ошибка сервера');
    }
    
    res.send(`
      <!DOCTYPE html>
      <html lang="ru">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>База знаний по нейросетям</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f8f9fa; }
          .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1rem 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header .container { display: flex; justify-content: space-between; align-items: center; }
          .header h1 { font-size: 1.8rem; font-weight: 600; }
          .nav { display: flex; gap: 1.5rem; }
          .nav-link { color: white; text-decoration: none; padding: 0.5rem 1rem; border-radius: 5px; transition: background-color 0.3s; }
          .nav-link:hover { background-color: rgba(255,255,255,0.2); }
          .main { min-height: calc(100vh - 120px); padding: 2rem 0; }
          .categories-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem; margin-top: 2rem; }
          .category-card { background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); transition: transform 0.3s, box-shadow 0.3s; }
          .category-card:hover { transform: translateY(-5px); box-shadow: 0 8px 25px rgba(0,0,0,0.15); }
          .category-card h3 { color: #667eea; margin-bottom: 1rem; font-size: 1.3rem; }
          .category-card p { margin-bottom: 1.5rem; color: #666; }
          .btn { display: inline-block; padding: 0.75rem 1.5rem; background: #667eea; color: white; text-decoration: none; border: none; border-radius: 5px; cursor: pointer; transition: background-color 0.3s; font-size: 1rem; }
          .btn:hover { background: #5a6fd8; }
          .footer { background: #333; color: white; text-align: center; padding: 1.5rem 0; margin-top: 3rem; }
          .admin-link { background-color: #ff5722; }
          .admin-link:hover { background-color: #e64a19; }
          .user-info { display: flex; align-items: center; gap: 1rem; }
          .user-name { font-weight: 500; }
        </style>
      </head>
      <body>
        <header class="header">
          <div class="container">
            <h1>База знаний по нейросетям</h1>
            <nav class="nav">
              <a href="/" class="nav-link">Главная</a>
              ${req.session.admin_logged_in ? '<a href="/admin" class="nav-link admin-link">Админ-панель</a>' : ''}
              <a href="/logout" class="nav-link">Выход</a>
            </nav>
          </div>
        </header>
        <main class="main">
          <div class="container">
            <div class="user-info">
              <span class="user-name">Пользователь: ${req.session.username || 'Администратор'}</span>
            </div>
            <div class="categories-grid">
              ${categories.map(category => `
                <div class="category-card">
                  <h3>${category.name}</h3>
                  <p>${category.description}</p>
                  <a href="/category/${category.id}" class="btn">Перейти</a>
                </div>
              `).join('')}
            </div>
          </div>
        </main>
        <footer class="footer">
          <div class="container">
            <p>&copy; 2024 База знаний по нейросетям</p>
          </div>
        </footer>
      </body>
      </html>
    `);
  });
});

// Страница входа
app.get('/login', (req, res) => {
  if (req.session.user_id || req.session.admin_logged_in) {
    return res.redirect('/');
  }
  
  res.send(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Вход в систему</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f8f9fa; }
        .auth-container { display: flex; justify-content: center; align-items: center; min-height: calc(100vh - 120px); padding: 2rem 0; }
        .auth-card { background: white; padding: 2.5rem; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); width: 100%; max-width: 400px; }
        .auth-card h2 { text-align: center; margin-bottom: 2rem; color: #333; }
        .auth-form .form-group { margin-bottom: 1.5rem; }
        .auth-form label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #555; }
        .auth-form input[type="text"], .auth-form input[type="password"] { width: 100%; padding: 0.75rem; border: 2px solid #e9ecef; border-radius: 5px; font-size: 1rem; transition: border-color 0.3s; }
        .auth-form input:focus { outline: none; border-color: #667eea; }
        .auth-form button { width: 100%; margin-top: 1rem; }
        .auth-link { text-align: center; margin-top: 1.5rem; }
        .auth-link a { color: #667eea; text-decoration: none; }
        .admin-info { margin-top: 2rem; padding: 1rem; background: #f8f9fa; border-radius: 5px; border-left: 4px solid #667eea; }
        .btn { display: inline-block; padding: 0.75rem 1.5rem; background: #667eea; color: white; text-decoration: none; border: none; border-radius: 5px; cursor: pointer; transition: background-color 0.3s; font-size: 1rem; }
        .btn:hover { background: #5a6fd8; }
        .error-message { background-color: #f8d7da; color: #721c24; padding: 0.75rem; border-radius: 5px; margin-bottom: 1rem; }
      </style>
    </head>
    <body>
      <div class="auth-container">
        <div class="auth-card">
          <h2>Вход в систему</h2>
          ${req.query.error ? `<div class="error-message">${req.query.error}</div>` : ''}
          ${req.query.blocked ? `<div class="error-message">Ваш аккаунт заблокирован. Обратитесь к администратору.</div>` : ''}
          <form method="POST" action="/api/login" class="auth-form">
            <div class="form-group">
              <label for="username">Имя пользователя:</label>
              <input type="text" id="username" name="username" required>
            </div>
            <div class="form-group">
              <label for="password">Пароль:</label>
              <input type="password" id="password" name="password" required>
            </div>
            <button type="submit" class="btn btn-primary">Войти</button>
          </form>
          <p class="auth-link">
            Нет аккаунта? <a href="/register">Зарегистрироваться</a>
          </p>
          <div class="admin-info">
            <p><strong>Админ:</strong> login: admin, password: 123456789</p>
          </div>
          
          <!-- Прямая ссылка на админ-панель для отладки -->
          <div style="margin-top: 20px; text-align: center;">
            <a href="/admin-login" style="color: #999; font-size: 12px;">Прямой вход администратора</a>
          </div>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Страница регистрации
app.get('/register', (req, res) => {
  if (req.session.user_id || req.session.admin_logged_in) {
    return res.redirect('/');
  }
  
  res.send(`
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Регистрация</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f8f9fa; }
        .auth-container { display: flex; justify-content: center; align-items: center; min-height: calc(100vh - 120px); padding: 2rem 0; }
        .auth-card { background: white; padding: 2.5rem; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); width: 100%; max-width: 400px; }
        .auth-card h2 { text-align: center; margin-bottom: 2rem; color: #333; }
        .auth-form .form-group { margin-bottom: 1.5rem; }
        .auth-form label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: #555; }
        .auth-form input[type="text"], .auth-form input[type="email"], .auth-form input[type="password"] { width: 100%; padding: 0.75rem; border: 2px solid #e9ecef; border-radius: 5px; font-size: 1rem; transition: border-color 0.3s; }
        .auth-form input:focus { outline: none; border-color: #667eea; }
        .auth-form button { width: 100%; margin-top: 1rem; }
        .auth-link { text-align: center; margin-top: 1.5rem; }
        .auth-link a { color: #667eea; text-decoration: none; }
        .btn { display: inline-block; padding: 0.75rem 1.5rem; background: #667eea; color: white; text-decoration: none; border: none; border-radius: 5px; cursor: pointer; transition: background-color 0.3s; font-size: 1rem; }
        .btn:hover { background: #5a6fd8; }
        small { color: #666; font-size: 0.9rem; }
        .error-message { background-color: #f8d7da; color: #721c24; padding: 0.75rem; border-radius: 5px; margin-bottom: 1rem; }
      </style>
    </head>
    <body>
      <div class="auth-container">
        <div class="auth-card">
          <h2>Регистрация</h2>
          ${req.query.error ? `<div class="error-message">${req.query.error}</div>` : ''}
          <form method="POST" action="/api/register" class="auth-form">
            <div class="form-group">
              <label for="username">Имя пользователя *:</label>
              <input type="text" id="username" name="username" required>
            </div>
            <div class="form-group">
              <label for="email">Email *:</label>
              <input type="email" id="email" name="email" required>
            </div>
            <div class="form-group">
              <label for="full_name">Полное имя:</label>
              <input type="text" id="full_name" name="full_name">
            </div>
            <div class="form-group">
              <label for="password">Пароль *:</label>
              <input type="password" id="password" name="password" required>
              <small>Минимум 6 символов</small>
            </div>
            <div class="form-group">
              <label for="confirm_password">Подтверждение пароля *:</label>
              <input type="password" id="confirm_password" name="confirm_password" required>
            </div>
            <button type="submit" class="btn btn-primary">Зарегистрироваться</button>
          </form>
          <p class="auth-link">
            Уже есть аккаунт? <a href="/login">Войти</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `);
});

// Страница категории
app.get('/category/:id', requireAuth, (req, res) => {
  const categoryId = req.params.id;
  
  // Получаем информацию о категории
  db.get("SELECT * FROM categories WHERE id = ?", [categoryId], (err, category) => {
    if (err) {
      console.error('Ошибка базы данных:', err);
      return res.status(500).send('Ошибка сервера');
    }
    
    if (!category) {
      return res.status(404).send('Категория не найдена');
    }
    
    // Получаем материалы категории
    db.all(`
      SELECT m.*, u.username as author_name 
      FROM materials m 
      JOIN users u ON m.author_id = u.id 
      WHERE m.category_id = ? 
      ORDER BY m.created_at DESC
    `, [categoryId], (err, materials) => {
      if (err) {
        console.error('Ошибка базы данных:', err);
        return res.status(500).send('Ошибка сервера');
      }
      
      res.send(`
        <!DOCTYPE html>
        <html lang="ru">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${category.name}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f8f9fa; }
            .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 1rem 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .header .container { display: flex; justify-content: space-between; align-items: center; }
            .header h1 { font-size: 1.8rem; font-weight: 600; }
            .nav { display: flex; gap: 1.5rem; }
            .nav-link { color: white; text-decoration: none; padding: 0.5rem 1rem; border-radius: 5px; transition: background-color 0.3s; }
            .nav-link:hover { background-color: rgba(255,255,255,0.2); }
            .main { min-height: calc(100vh - 120px); padding: 2rem 0; }
            .category-container { max-width: 1000px; margin: 0 auto; }
            .category-header { text-align: center; margin-bottom: 2rem; }
            .category-header h2 { color: #333; margin-bottom: 0.5rem; }
            .materials-list { display: flex; flex-direction: column; gap: 1.5rem; }
            .material-card { background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
            .material-header { margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid #e9ecef; }
            .material-header h3 { color: #333; margin-bottom: 0.5rem; }
            .material-meta { display: flex; gap: 1rem; font-size: 0.9rem; color: #666; }
            .material-content { line-height: 1.8; color: #555; }
            .footer { background: #333; color: white; text-align: center; padding: 1.5rem 0; margin-top: 3rem; }
            .admin-link { background-color: #ff5722; }
            .admin-link:hover { background-color: #e64a19; }
          </style>
        </head>
        <body>
          <header class="header">
            <div class="container">
              <h1>${category.name}</h1>
              <nav class="nav">
                <a href="/" class="nav-link">Главная</a>
                ${req.session.admin_logged_in ? '<a href="/admin" class="nav-link admin-link">Админ-панель</a>' : ''}
                <a href="/logout" class="nav-link">Выход</a>
              </nav>
            </div>
          </header>
          <main class="main">
            <div class="container">
              <div class="category-container">
                <div class="category-header">
                  <h2>${category.name}</h2>
                  <p>${category.description}</p>
                </div>
                <div class="materials-list">
                  ${materials.length > 0 ? materials.map(material => `
                    <div class="material-card">
                      <div class="material-header">
                        <h3>${material.title}</h3>
                        <div class="material-meta">
                          <span class="author">Автор: ${material.author_name}</span>
                          <span class="date">${new Date(material.created_at).toLocaleDateString('ru-RU')}</span>
                        </div>
                      </div>
                      <div class="material-content">
                        <p>${material.content}</p>
                      </div>
                    </div>
                  `).join('') : '<p>В этой категории пока нет материалов.</p>'}
                </div>
              </div>
            </div>
          </main>
          <footer class="footer">
            <div class="container">
              <p>&copy; 2024 База знаний по нейросетям</p>
            </div>
          </footer>
        </body>
        </html>
      `);
    });
  });
});

// Административная панель
app.get('/admin', requireAdmin, (req, res) => {
  // Получаем статистику
  db.get(`
    SELECT 
      (SELECT COUNT(*) FROM users WHERE is_admin = 0) as total_users,
      (SELECT COUNT(*) FROM users WHERE is_blocked = 1) as blocked_users,
      (SELECT COUNT(*) FROM materials) as total_materials,
      (SELECT COUNT(*) FROM messages) as total_messages
  `, (err, stats) => {
    if (err) {
      console.error('Ошибка базы данных:', err);
      return res.status(500).send('Ошибка сервера');
    }
    
    // Получаем список пользователей
    db.all("SELECT * FROM users WHERE is_admin = 0 ORDER BY created_at DESC", (err, users) => {
      if (err) {
        console.error('Ошибка базы данных:', err);
        return res.status(500).send('Ошибка сервера');
      }
      
      // Получаем список категорий
      db.all("SELECT * FROM categories ORDER BY name", (err, categories) => {
        if (err) {
          console.error('Ошибка базы данных:', err);
          return res.status(500).send('Ошибка сервера');
        }
        
        // Получаем список материалов
        db.all(`
          SELECT m.*, c.name as category_name, u.username as author_name 
          FROM materials m 
          JOIN categories c ON m.category_id = c.id 
          JOIN users u ON m.author_id = u.id 
          ORDER BY m.created_at DESC
        `, (err, materials) => {
          if (err) {
            console.error('Ошибка базы данных:', err);
            return res.status(500).send('Ошибка сервера');
          }
          
          res.send(`
            <!DOCTYPE html>
            <html lang="ru">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>Административная панель</title>
              <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f8f9fa; }
                .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
                .header { background: linear-gradient(135deg, #ff5722 0%, #ff9800 100%); color: white; padding: 1rem 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .header .container { display: flex; justify-content: space-between; align-items: center; }
                .header h1 { font-size: 1.8rem; font-weight: 600; }
                .nav { display: flex; gap: 1.5rem; }
                .nav-link { color: white; text-decoration: none; padding: 0.5rem 1rem; border-radius: 5px; transition: background-color 0.3s; }
                .nav-link:hover { background-color: rgba(255,255,255,0.2); }
                .main { min-height: calc(100vh - 120px); padding: 2rem 0; }
                .admin-container { max-width: 1200px; margin: 0 auto; }
                .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem; margin-bottom: 2rem; }
                .stat-card { background: white; padding: 1.5rem; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); text-align: center; }
                .stat-card h3 { color: #333; margin-bottom: 0.5rem; font-size: 1.1rem; }
                .stat-number { font-size: 2rem; font-weight: 700; color: #ff5722; }
                .admin-section { background: white; padding: 2rem; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 2rem; }
                .admin-section h2 { color: #333; margin-bottom: 1.5rem; border-bottom: 2px solid #f1f1f1; padding-bottom: 0.5rem; }
                .users-table, .materials-table, .categories-table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
                .users-table th, .users-table td, .materials-table th, .materials-table td, .categories-table th, .categories-table td { padding: 0.75rem; text-align: left; border-bottom: 1px solid #e9ecef; }
                .users-table th, .materials-table th, .categories-table th { background-color: #f8f9fa; font-weight: 600; }
                .users-table tr:hover, .materials-table tr:hover, .categories-table tr:hover { background-color: #f8f9fa; }
                .status { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 50px; font-size: 0.85rem; }
                .active { background-color: #d4edda; color: #155724; }
                .blocked { background-color: #f8d7da; color: #721c24; }
                .btn { display: inline-block; padding: 0.5rem 1rem; text-decoration: none; border: none; border-radius: 5px; cursor: pointer; transition: background-color 0.3s; font-size: 0.9rem; }
                .btn-sm { padding: 0.25rem 0.5rem; font-size: 0.8rem; }
                .btn-primary { background-color: #667eea; color: white; }
                .btn-primary:hover { background-color: #5a6fd8; }
                .btn-danger { background-color: #dc3545; color: white; }
                .btn-danger:hover { background-color: #c82333; }
                .btn-success { background-color: #28a745; color: white; }
                .btn-success:hover { background-color: #218838; }
                .btn-warning { background-color: #ffc107; color: #212529; }
                .btn-warning:hover { background-color: #e0a800; }
                .form-group { margin-bottom: 1rem; }
                .form-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; }
                .form-control { width: 100%; padding: 0.75rem; border: 1px solid #ced4da; border-radius: 5px; font-size: 1rem; }
                .form-control:focus { outline: none; border-color: #667eea; }
                textarea.form-control { min-height: 150px; }
                .footer { background: #333; color: white; text-align: center; padding: 1.5rem 0; margin-top: 3rem; }
                .tabs { display: flex; margin-bottom: 1.5rem; border-bottom: 1px solid #dee2e6; }
                .tab { padding: 0.75rem 1.5rem; cursor: pointer; border-bottom: 2px solid transparent; }
                .tab.active { border-bottom: 2px solid #ff5722; font-weight: 600; }
                .tab-content { display: none; }
                .tab-content.active { display: block; }
                .info-message { background-color: #d1ecf1; color: #0c5460; padding: 0.75rem; border-radius: 5px; margin-bottom: 1rem; }
                tr.blocked { background-color: #fff8f8; }
              </style>
            </head>
            <body>
              <header class="header">
                <div class="container">
                  <h1>Административная панель</h1>
                  <nav class="nav">
                    <a href="/" class="nav-link">Главная</a>
                    <a href="/logout" class="nav-link">Выход</a>
                  </nav>
                </div>
              </header>
              <main class="main">
                <div class="container">
                  <div class="admin-container">
                    ${req.query.message ? `<div class="info-message">${req.query.message}</div>` : ''}
                    
                    <div class="stats-grid">
                      <div class="stat-card">
                        <h3>Всего пользователей</h3>
                        <p class="stat-number">${stats.total_users}</p>
                      </div>
                      <div class="stat-card">
                        <h3>Заблокированных</h3>
                        <p class="stat-number">${stats.blocked_users}</p>
                      </div>
                      <div class="stat-card">
                        <h3>Материалов</h3>
                        <p class="stat-number">${stats.total_materials}</p>
                      </div>
                      <div class="stat-card">
                        <h3>Сообщений</h3>
                        <p class="stat-number">${stats.total_messages}</p>
                      </div>
                    </div>
                    
                    <div class="tabs">
                      <div class="tab active" onclick="openTab(event, 'users-tab')">Пользователи</div>
                      <div class="tab" onclick="openTab(event, 'materials-tab')">Материалы</div>
                      <div class="tab" onclick="openTab(event, 'categories-tab')">Категории</div>
                    </div>
                    
                    <div id="users-tab" class="tab-content active">
                      <div class="admin-section">
                        <h2>Управление пользователями</h2>
                        
                        <div class="users-table">
                          <table>
                            <thead>
                              <tr>
                                <th>ID</th>
                                <th>Имя пользователя</th>
                                <th>Email</th>
                                <th>Полное имя</th>
                                <th>Дата регистрации</th>
                                <th>Статус</th>
                                <th>Действия</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${users.map(user => `
                                <tr class="${user.is_blocked ? 'blocked' : ''}">
                                  <td>${user.id}</td>
                                  <td>${user.username}</td>
                                  <td>${user.email}</td>
                                  <td>${user.full_name || 'Не указано'}</td>
                                  <td>${new Date(user.created_at).toLocaleDateString('ru-RU')}</td>
                                  <td>
                                    <span class="status ${user.is_blocked ? 'blocked' : 'active'}">
                                      ${user.is_blocked ? 'Заблокирован' : 'Активен'}
                                    </span>
                                  </td>
                                  <td>
                                    <form method="POST" action="/api/admin/users" style="display: inline;">
                                      <input type="hidden" name="user_id" value="${user.id}">
                                      ${user.is_blocked ? `
                                        <button type="submit" name="action" value="unblock" class="btn btn-success btn-sm">
                                          Разблокировать
                                        </button>
                                      ` : `
                                        <button type="submit" name="action" value="block" class="btn btn-danger btn-sm" 
                                                onclick="return confirm('Вы уверены, что хотите заблокировать этого пользователя?')">
                                          Заблокировать
                                        </button>
                                      `}
                                    </form>
                                  </td>
                                </tr>
                              `).join('')}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                    
                    <div id="materials-tab" class="tab-content">
                      <div class="admin-section">
                        <h2>Управление материалами</h2>
                        
                        <form method="POST" action="/api/admin/materials" class="mb-4">
                          <h3>Добавить новый материал</h3>
                          <div class="form-group">
                            <label for="category_id">Категория:</label>
                            <select id="category_id" name="category_id" class="form-control" required>
                              ${categories.map(category => `
                                <option value="${category.id}">${category.name}</option>
                              `).join('')}
                            </select>
                          </div>
                          <div class="form-group">
                            <label for="title">Заголовок:</label>
                            <input type="text" id="title" name="title" class="form-control" required>
                          </div>
                          <div class="form-group">
                            <label for="content">Содержание:</label>
                            <textarea id="content" name="content" class="form-control" required></textarea>
                          </div>
                          <button type="submit" name="action" value="add" class="btn btn-primary">Добавить материал</button>
                        </form>
                        
                        <div class="materials-table">
                          <table>
                            <thead>
                              <tr>
                                <th>ID</th>
                                <th>Категория</th>
                                <th>Заголовок</th>
                                <th>Автор</th>
                                <th>Дата создания</th>
                                <th>Действия</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${materials.map(material => `
                                <tr>
                                  <td>${material.id}</td>
                                  <td>${material.category_name}</td>
                                  <td>${material.title}</td>
                                  <td>${material.author_name}</td>
                                  <td>${new Date(material.created_at).toLocaleDateString('ru-RU')}</td>
                                  <td>
                                    <form method="POST" action="/api/admin/materials" style="display: inline;">
                                      <input type="hidden" name="material_id" value="${material.id}">
                                      <button type="submit" name="action" value="delete" class="btn btn-danger btn-sm"
                                              onclick="return confirm('Вы уверены, что хотите удалить этот материал?')">
                                        Удалить
                                      </button>
                                    </form>
                                  </td>
                                </tr>
                              `).join('')}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                    
                    <div id="categories-tab" class="tab-content">
                      <div class="admin-section">
                        <h2>Управление категориями</h2>
                        
                        <form method="POST" action="/api/admin/categories" class="mb-4">
                          <h3>Добавить новую категорию</h3>
                          <div class="form-group">
                            <label for="name">Название:</label>
                            <input type="text" id="name" name="name" class="form-control" required>
                          </div>
                          <div class="form-group">
                            <label for="description">Описание:</label>
                            <textarea id="description" name="description" class="form-control" required></textarea>
                          </div>
                          <button type="submit" name="action" value="add" class="btn btn-primary">Добавить категорию</button>
                        </form>
                        
                        <div class="categories-table">
                          <table>
                            <thead>
                              <tr>
                                <th>ID</th>
                                <th>Название</th>
                                <th>Описание</th>
                                <th>Дата создания</th>
                                <th>Действия</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${categories.map(category => `
                                <tr>
                                  <td>${category.id}</td>
                                  <td>${category.name}</td>
                                  <td>${category.description}</td>
                                  <td>${new Date(category.created_at).toLocaleDateString('ru-RU')}</td>
                                  <td>
                                    <form method="POST" action="/api/admin/categories" style="display: inline;">
                                      <input type="hidden" name="category_id" value="${category.id}">
                                      <button type="submit" name="action" value="delete" class="btn btn-danger btn-sm"
                                              onclick="return confirm('Вы уверены, что хотите удалить эту категорию? Все материалы в этой категории также будут удалены.')">
                                        Удалить
                                      </button>
                                    </form>
                                  </td>
                                </tr>
                              `).join('')}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </main>
              <footer class="footer">
                <div class="container">
                  <p>&copy; 2024 База знаний по нейросетям</p>
                </div>
              </footer>
              
              <script>
                function openTab(evt, tabName) {
                  var i, tabcontent, tablinks;
                  
                  // Скрываем все вкладки
                  tabcontent = document.getElementsByClassName("tab-content");
                  for (i = 0; i < tabcontent.length; i++) {
                    tabcontent[i].classList.remove("active");
                  }
                  
                  // Удаляем активный класс со всех вкладок
                  tablinks = document.getElementsByClassName("tab");
                  for (i = 0; i < tablinks.length; i++) {
                    tablinks[i].classList.remove("active");
                  }
                  
                  // Показываем текущую вкладку и добавляем активный класс
                  document.getElementById(tabName).classList.add("active");
                  evt.currentTarget.classList.add("active");
                }
              </script>
            </body>
            </html>
          `);
        });
      });
    });
  });
});

// API для входа
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  console.log('Попытка входа:', { username, hasPassword: !!password });
  
  if (!username || !password) {
    return res.redirect('/login?error=Пожалуйста, заполните все поля');
  }
  
  // Проверяем, является ли пользователь администратором
  if (username === 'admin') {
    db.get("SELECT * FROM users WHERE username = ? AND is_admin = 1", [username], (err, user) => {
      if (err) {
        console.error('Ошибка базы данных:', err);
        return res.redirect('/login?error=Ошибка сервера');
      }
      
      console.log('Попытка входа администратора:', user);
      
      if (user && bcrypt.compareSync(password, user.password)) {
        console.log('Аутентификация администратора успешна');
        req.session.admin_logged_in = true;
        req.session.admin_id = user.id;
        req.session.username = user.username;
        
        console.log('Сессия администратора:', req.session);
        
        // Сохраняем сессию перед отправкой ответа
        req.session.save((err) => {
          if (err) {
            console.error('Ошибка при сохранении сессии:', err);
            return res.redirect('/login?error=Ошибка сервера при сохранении сессии');
          }
          
          return res.redirect('/admin');
        });
      } else {
        console.log('Аутентификация администратора не удалась');
        res.redirect('/login?error=Неверное имя пользователя или пароль');
      }
    });
    return;
  }
  
  // Проверяем обычного пользователя
  db.get("SELECT * FROM users WHERE username = ? AND is_admin = 0", [username], (err, user) => {
    if (err) {
      console.error('Ошибка базы данных:', err);
      return res.redirect('/login?error=Ошибка сервера');
    }
    
    if (user && bcrypt.compareSync(password, user.password)) {
      if (user.is_blocked) {
        return res.redirect('/login?blocked=1');
      }
      
      req.session.user_id = user.id;
      req.session.username = user.username;
      
      // Сохраняем сессию перед отправкой ответа
      req.session.save((err) => {
        if (err) {
          console.error('Ошибка при сохранении сессии:', err);
          return res.redirect('/login?error=Ошибка сервера при сохранении сессии');
        }
        
        res.redirect('/');
      });
    } else {
      res.redirect('/login?error=Неверное имя пользователя или пароль');
    }
  });
});

// API для регистрации
app.post('/api/register', (req, res) => {
  const { username, email, full_name, password, confirm_password } = req.body;
  
  if (!username || !email || !password || !confirm_password) {
    return res.redirect('/register?error=Пожалуйста, заполните все обязательные поля');
  }
  
  if (password !== confirm_password) {
    return res.redirect('/register?error=Пароли не совпадают');
  }
  
  if (password.length < 6) {
    return res.redirect('/register?error=Пароль должен содержать не менее 6 символов');
  }
  
  // Проверяем, существует ли пользователь с таким именем или email
  db.get("SELECT * FROM users WHERE username = ? OR email = ?", [username, email], (err, user) => {
    if (err) {
      console.error('Ошибка базы данных:', err);
      return res.status(500).send('Ошибка сервера');
    }
    
    if (user) {
      if (user.username === username) {
        return res.redirect('/register?error=Пользователь с таким именем уже существует');
      } else {
        return res.redirect('/register?error=Пользователь с таким email уже существует');
      }
    }
    
    // Создаем нового пользователя
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    db.run("INSERT INTO users (username, email, full_name, password) VALUES (?, ?, ?, ?)", 
      [username, email, full_name || null, hashedPassword], function(err) {
      if (err) {
        console.error('Ошибка базы данных:', err);
        return res.status(500).send('Ошибка сервера');
      }
      
      // Автоматически входим в систему
      req.session.user_id = this.lastID;
      req.session.username = username;
      res.redirect('/');
    });
  });
});

// API для выхода
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Ошибка при выходе из системы:', err);
    }
    res.redirect('/login');
  });
});

// Специальный маршрут для прямого входа администратора (только для разработки)
app.get('/admin-login', (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(404).send('Страница не найдена');
  }
  
  db.get("SELECT * FROM users WHERE username = 'admin' AND is_admin = 1", (err, user) => {
    if (err || !user) {
      console.error('Ошибка при поиске администратора:', err || 'Администратор не найден');
      return res.status(500).send('Ошибка сервера');
    }
    
    req.session.admin_logged_in = true;
    req.session.admin_id = user.id;
    req.session.username = user.username;
    
    console.log('Прямой вход администратора выполнен успешно');
    res.redirect('/admin');
  });
});

// API для управления пользователями (админ)
app.post('/api/admin/users', requireAdmin, (req, res) => {
  const { user_id, action } = req.body;
  
  if (!user_id || !action) {
    return res.redirect('/admin?message=Неверные параметры');
  }
  
  if (action === 'block') {
    db.run("UPDATE users SET is_blocked = 1 WHERE id = ?", [user_id], (err) => {
      if (err) {
        console.error('Ошибка базы данных:', err);
        return res.status(500).send('Ошибка сервера');
      }
      
      res.redirect('/admin?message=Пользователь успешно заблокирован');
    });
  } else if (action === 'unblock') {
    db.run("UPDATE users SET is_blocked = 0 WHERE id = ?", [user_id], (err) => {
      if (err) {
        console.error('Ошибка базы данных:', err);
        return res.status(500).send('Ошибка сервера');
      }
      
      res.redirect('/admin?message=Пользователь успешно разблокирован');
    });
  } else {
    res.redirect('/admin?message=Неверное действие');
  }
});

// API для управления материалами (админ)
app.post('/api/admin/materials', requireAdmin, (req, res) => {
  const { action, material_id, category_id, title, content } = req.body;
  
  if (!action) {
    return res.redirect('/admin?message=Неверные параметры');
  }
  
  if (action === 'add') {
    if (!category_id || !title || !content) {
      return res.redirect('/admin?message=Пожалуйста, заполните все поля');
    }
    
    db.get("SELECT id FROM users WHERE is_admin = 1 LIMIT 1", (err, admin) => {
      if (err || !admin) {
        console.error('Ошибка базы данных:', err || 'Администратор не найден');
        return res.status(500).send('Ошибка сервера');
      }
      
      db.run("INSERT INTO materials (category_id, title, content, author_id) VALUES (?, ?, ?, ?)", 
        [category_id, title, content, admin.id], (err) => {
        if (err) {
          console.error('Ошибка базы данных:', err);
          return res.status(500).send('Ошибка сервера');
        }
        
        res.redirect('/admin?message=Материал успешно добавлен');
      });
    });
  } else if (action === 'delete') {
    if (!material_id) {
      return res.redirect('/admin?message=Неверные параметры');
    }
    
    db.run("DELETE FROM materials WHERE id = ?", [material_id], (err) => {
      if (err) {
        console.error('Ошибка базы данных:', err);
        return res.status(500).send('Ошибка сервера');
      }
      
      res.redirect('/admin?message=Материал успешно удален');
    });
  } else {
    res.redirect('/admin?message=Неверное действие');
  }
});

// API для управления категориями (админ)
app.post('/api/admin/categories', requireAdmin, (req, res) => {
  const { action, category_id, name, description } = req.body;
  
  if (!action) {
    return res.redirect('/admin?message=Неверные параметры');
  }
  
  if (action === 'add') {
    if (!name || !description) {
      return res.redirect('/admin?message=Пожалуйста, заполните все поля');
    }
    
    db.run("INSERT INTO categories (name, description) VALUES (?, ?)", 
      [name, description], (err) => {
      if (err) {
        console.error('Ошибка базы данных:', err);
        return res.status(500).send('Ошибка сервера');
      }
      
      res.redirect('/admin?message=Категория успешно добавлена');
    });
  } else if (action === 'delete') {
    if (!category_id) {
      return res.redirect('/admin?message=Неверные параметры');
    }
    
    // Удаляем все материалы в этой категории
    db.run("DELETE FROM materials WHERE category_id = ?", [category_id], (err) => {
      if (err) {
        console.error('Ошибка базы данных:', err);
        return res.status(500).send('Ошибка сервера');
      }
      
      // Удаляем категорию
      db.run("DELETE FROM categories WHERE id = ?", [category_id], (err) => {
        if (err) {
          console.error('Ошибка базы данных:', err);
          return res.status(500).send('Ошибка сервера');
        }
        
        res.redirect('/admin?message=Категория успешно удалена');
      });
    });
  } else {
    res.redirect('/admin?message=Неверное действие');
  }
});

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('Ошибка:', err);
  res.status(500).send('Внутренняя ошибка сервера');
});

// Маршруты отладки
app.use('/debug', debugRoutes);

// Обработка 404
app.use((req, res) => {
  res.status(404).send('Страница не найдена');
});

// Запускаем сервер, если скрипт запущен напрямую
if (require.main === module) {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`📱 Доступ к приложению: http://localhost:${PORT}`);
  });
}

// Экспортируем приложение для Vercel
module.exports = app;