const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Подключаемся к базе данных
const db = new sqlite3.Database(path.join(__dirname, 'neuro_knowledge_base.db'), (err) => {
  if (err) {
    console.error('Ошибка при подключении к базе данных:', err.message);
  } else {
    console.log('Подключение к базе данных SQLite установлено.');
  }
});

// Включаем поддержку внешних ключей
db.run('PRAGMA foreign_keys = ON');

// Экспортируем подключение к базе данных
module.exports = db;