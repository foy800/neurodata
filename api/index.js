const express = require('express');
const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Main page
app.get('/', (req, res) => {
  const html = `
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
      </style>
    </head>
    <body>
      <header class="header">
        <div class="container">
          <h1>База знаний по нейросетям</h1>
          <nav class="nav">
            <a href="/" class="nav-link">Главная</a>
            <a href="/login" class="nav-link">Вход</a>
            <a href="/register" class="nav-link">Регистрация</a>
          </nav>
        </div>
      </header>
      <main class="main">
        <div class="container">
          <div class="categories-grid">
            <div class="category-card">
              <h3>Скрипты продаж</h3>
              <p>Готовые скрипты для продаж нейросетевых решений</p>
              <a href="/category/1" class="btn">Перейти</a>
            </div>
            <div class="category-card">
              <h3>Промпты для агентов</h3>
              <p>Эффективные промпты для создания ИИ-агентов</p>
              <a href="/category/2" class="btn">Перейти</a>
            </div>
            <div class="category-card">
              <h3>Промпты для голосовых ассистентов</h3>
              <p>Промпты для настройки голосовых помощников</p>
              <a href="/category/3" class="btn">Перейти</a>
            </div>
            <div class="category-card">
              <h3>Шаблон сайта</h3>
              <p>Готовые шаблоны сайтов с нейросетевыми технологиями</p>
              <a href="/category/4" class="btn">Перейти</a>
            </div>
            <div class="category-card">
              <h3>Договора</h3>
              <p>Шаблоны договоров для нейросетевых проектов</p>
              <a href="/category/5" class="btn">Перейти</a>
            </div>
            <div class="category-card">
              <h3>Коммерческие предложения</h3>
              <p>Шаблоны коммерческих предложений</p>
              <a href="/category/6" class="btn">Перейти</a>
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
  `;
  
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

// Login page
app.get('/login', (req, res) => {
  const html = `
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
      </style>
    </head>
    <body>
      <div class="auth-container">
        <div class="auth-card">
          <h2>Вход в систему</h2>
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
        </div>
      </div>
    </body>
    </html>
  `;
  
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

// Register page
app.get('/register', (req, res) => {
  const html = `
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
      </style>
    </head>
    <body>
      <div class="auth-container">
        <div class="auth-card">
          <h2>Регистрация</h2>
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
  `;
  
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

// Category page
app.get('/category/:id', (req, res) => {
  const categoryId = req.params.id;
  
  // Mapping of category IDs to names
  const categories = {
    '1': 'Скрипты продаж',
    '2': 'Промпты для агентов',
    '3': 'Промпты для голосовых ассистентов',
    '4': 'Шаблон сайта',
    '5': 'Договора',
    '6': 'Коммерческие предложения'
  };
  
  const categoryName = categories[categoryId] || 'Категория';
  
  const html = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${categoryName}</title>
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
      </style>
    </head>
    <body>
      <header class="header">
        <div class="container">
          <h1>${categoryName}</h1>
          <nav class="nav">
            <a href="/" class="nav-link">Главная</a>
            <a href="/login" class="nav-link">Вход</a>
          </nav>
        </div>
      </header>
      <main class="main">
        <div class="container">
          <div class="category-container">
            <div class="category-header">
              <h2>${categoryName}</h2>
              <p>Материалы по теме "${categoryName}"</p>
            </div>
            <div class="materials-list">
              <div class="material-card">
                <div class="material-header">
                  <h3>Пример материала</h3>
                  <div class="material-meta">
                    <span class="author">Автор: Администратор</span>
                    <span class="date">08.02.2024</span>
                  </div>
                </div>
                <div class="material-content">
                  <p>Здесь будет содержание материала для категории "${categoryName}".</p>
                  <p>Для полноценной работы необходимо завершить настройку базы данных.</p>
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
    </body>
    </html>
  `;
  
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.send(html);
});

// API endpoints
app.post('/api/login', (req, res) => {
  // Simple login simulation
  res.redirect('/');
});

app.post('/api/register', (req, res) => {
  // Simple registration simulation
  res.redirect('/login');
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).send('Internal Server Error');
});

// 404 handling
app.use((req, res) => {
  res.status(404).send('Page Not Found');
});

// Start server if running directly
if (require.main === module) {
  const PORT = process.env.PORT || 8080;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Access the app at: http://localhost:${PORT}`);
  });
}

// Export for Vercel
module.exports = app;