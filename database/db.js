const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Проверяем существование директории для базы данных
const dbDir = __dirname;
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Проверяем существование файла базы данных
const dbPath = path.join(__dirname, 'neuro_knowledge_base.db');
const dbExists = fs.existsSync(dbPath);

// Подключаемся к базе данных
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Ошибка при подключении к базе данных:', err.message);
  } else {
    console.log('Подключение к базе данных SQLite установлено.');
    
    // Если база данных не существовала, инициализируем её
    if (!dbExists) {
      console.log('База данных не существует. Инициализация...');
      initializeDatabase();
    }
  }
});

// Включаем поддержку внешних ключей
db.run('PRAGMA foreign_keys = ON');

// Функция инициализации базы данных
function initializeDatabase() {
  // Создаем таблицы
  db.serialize(() => {
    // Таблица пользователей
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      full_name VARCHAR(100),
      avatar VARCHAR(255),
      is_blocked BOOLEAN DEFAULT 0,
      is_admin BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Ошибка при создании таблицы users:', err.message);
      } else {
        console.log('Таблица users создана или уже существует.');
        
        // Создаем администратора
        const hashedPassword = bcrypt.hashSync('123456789', 10);
        db.run("INSERT INTO users (username, password, email, full_name, is_admin) VALUES (?, ?, ?, ?, 1)", 
          ['admin', hashedPassword, 'admin@neuro.local', 'Администратор'], (err) => {
          if (err) {
            console.error('Ошибка при создании администратора:', err.message);
          } else {
            console.log('Администратор создан успешно.');
          }
        });
      }
    });

    // Таблица категорий
    db.run(`CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Ошибка при создании таблицы categories:', err.message);
      } else {
        console.log('Таблица categories создана или уже существует.');
        
        // Создаем категории
        const categories = [
          ['Скрипты продаж', 'Готовые скрипты для продаж нейросетевых решений'],
          ['Промпты для агентов', 'Эффективные промпты для создания ИИ-агентов'],
          ['Промпты для голосовых ассистентов', 'Промпты для настройки голосовых помощников'],
          ['Шаблон сайта', 'Готовые шаблоны сайтов с нейросетевыми технологиями'],
          ['Договора', 'Шаблоны договоров для нейросетевых проектов'],
          ['Коммерческие предложения', 'Шаблоны коммерческих предложений']
        ];
        
        categories.forEach(cat => {
          db.run("INSERT INTO categories (name, description) VALUES (?, ?)", 
            [cat[0], cat[1]], (err) => {
            if (err) {
              console.error('Ошибка при создании категории:', err.message);
            }
          });
        });
      }
    });

    // Таблица материалов
    db.run(`CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      title VARCHAR(200) NOT NULL,
      content TEXT NOT NULL,
      author_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (author_id) REFERENCES users(id)
    )`, (err) => {
      if (err) {
        console.error('Ошибка при создании таблицы materials:', err.message);
      } else {
        console.log('Таблица materials создана или уже существует.');
      }
    });

    // Таблица сообщений
    db.run(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (receiver_id) REFERENCES users(id)
    )`, (err) => {
      if (err) {
        console.error('Ошибка при создании таблицы messages:', err.message);
      } else {
        console.log('Таблица messages создана или уже существует.');
      }
    });
  });
}

// Экспортируем подключение к базе данных
module.exports = db;