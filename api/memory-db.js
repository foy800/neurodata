// Этот файл создает базу данных в памяти для использования на Vercel
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');

// Создаем базу данных в памяти
const db = new sqlite3.Database(':memory:', (err) => {
  if (err) {
    console.error('Ошибка при создании базы данных в памяти:', err.message);
  } else {
    console.log('База данных в памяти создана успешно.');
    
    // Инициализируем базу данных
    initializeDatabase();
  }
});

// Функция инициализации базы данных
function initializeDatabase() {
  console.log('Инициализация базы данных в памяти...');
  
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
        console.log('Таблица users создана.');
        
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
        console.log('Таблица categories создана.');
        
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
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Ошибка при создании таблицы materials:', err.message);
      } else {
        console.log('Таблица materials создана.');
      }
    });

    // Таблица сообщений
    db.run(`CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER NOT NULL,
      receiver_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      is_read BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`, (err) => {
      if (err) {
        console.error('Ошибка при создании таблицы messages:', err.message);
      } else {
        console.log('Таблица messages создана.');
      }
    });
  });
}

// Экспортируем подключение к базе данных
module.exports = db;