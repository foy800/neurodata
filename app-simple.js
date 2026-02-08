const express = require('express');
const app = express();
const PORT = process.env.PORT || 8080;

// Serve static files
app.use(express.static(__dirname));

// Simple HTML response for testing
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>База знаний по нейросетям</title>
            <link rel="stylesheet" href="/css/style.css">
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
    `);
});

app.get('/login', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Вход в систему</title>
            <link rel="stylesheet" href="/css/style.css">
        </head>
        <body>
            <div class="auth-container">
                <div class="auth-card">
                    <h2>Вход в систему</h2>
                    <form method="POST" action="/login" class="auth-form">
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
    `);
});

app.get('/register', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Регистрация</title>
            <link rel="stylesheet" href="/css/style.css">
        </head>
        <body>
            <div class="auth-container">
                <div class="auth-card">
                    <h2>Регистрация</h2>
                    <form method="POST" action="/register" class="auth-form">
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

app.post('/login', (req, res) => {
    // Simple login simulation
    res.redirect('/');
});

app.post('/register', (req, res) => {
    // Simple registration simulation
    res.redirect('/login');
});

app.get('/category/:id', (req, res) => {
    const categoryId = req.params.id;
    res.send(`
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Категория ${categoryId}</title>
            <link rel="stylesheet" href="/css/style.css">
        </head>
        <body>
            <header class="header">
                <div class="container">
                    <h1>Категория ${categoryId}</h1>
                    <nav class="nav">
                        <a href="/" class="nav-link">Главная</a>
                        <a href="/login" class="nav-link">Вход</a>
                    </nav>
                </div>
            </header>
            <main class="main">
                <div class="container">
                    <div class="category-container">
                        <h2>Материалы категории ${categoryId}</h2>
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
                                    <p>Здесь будет содержание материала для категории ${categoryId}.</p>
                                    <p>Для полноценной работы необходимо завершить настройку базы данных.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </body>
        </html>
    `);
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

const server = app.listen(PORT, () => {
    console.log(`🚀 Simple server running on port ${PORT}`);
    console.log(`📱 Access the app at: http://localhost:${PORT}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
        process.exit(1);
    } else {
        console.error('Server error:', err);
    }
});

module.exports = app;