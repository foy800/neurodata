const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();

// Настройка сессий
app.use(session({
  secret: 'neuro-knowledge-base-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    maxAge: 24 * 60 * 60 * 1000 // 24 часа
  }
}));

// Тестовая страница
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Отладка сессий</title>
    </head>
    <body>
      <h1>Отладка сессий</h1>
      <p>Текущая сессия: ${JSON.stringify(req.session)}</p>
      <form method="POST" action="/set-session">
        <button type="submit">Установить тестовую сессию</button>
      </form>
    </body>
    </html>
  `);
});

// Установка тестовой сессии
app.post('/set-session', (req, res) => {
  req.session.admin_logged_in = true;
  req.session.admin_id = 1;
  req.session.username = 'admin';
  res.redirect('/');
});

// Запуск сервера
const PORT = 9090;
app.listen(PORT, () => {
  console.log(`Сервер отладки запущен на порту ${PORT}`);
  console.log(`Откройте http://localhost:${PORT} для проверки сессий`);
});