const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// Создаем директорию для базы данных, если она не существует
const dbDir = path.dirname(path.join(__dirname, 'neuro_knowledge_base.db'));
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Подключаемся к базе данных
const db = new sqlite3.Database(path.join(__dirname, 'neuro_knowledge_base.db'), (err) => {
  if (err) {
    console.error('Ошибка при подключении к базе данных:', err.message);
    process.exit(1);
  }
  console.log('Подключение к базе данных SQLite установлено.');
});

// Включаем поддержку внешних ключей
db.run('PRAGMA foreign_keys = ON');

// Создаем таблицы
const createTables = () => {
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
      
      // Проверяем, существует ли администратор
      db.get("SELECT COUNT(*) as count FROM users WHERE username = 'admin'", (err, row) => {
        if (err) {
          console.error('Ошибка при проверке администратора:', err.message);
          return;
        }
        
        if (!row || row.count === 0) {
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
        } else {
          console.log('Администратор уже существует.');
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
      
      // Проверяем, существуют ли категории
      db.get("SELECT COUNT(*) as count FROM categories", (err, row) => {
        if (err) {
          console.error('Ошибка при проверке категорий:', err.message);
          return;
        }
        
        if (!row || row.count === 0) {
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
          console.log('Категории созданы успешно.');
        } else {
          console.log('Категории уже существуют.');
        }
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
      
      // Добавляем пример материала для каждой категории
      setTimeout(() => {
        db.get("SELECT COUNT(*) as count FROM materials", (err, row) => {
          if (err) {
            console.error('Ошибка при проверке материалов:', err.message);
            return;
          }
          
          if (!row || row.count === 0) {
            db.get("SELECT id FROM users WHERE username = 'admin'", (err, adminRow) => {
              if (err || !adminRow) {
                console.error('Ошибка при получении ID администратора:', err ? err.message : 'Администратор не найден');
                return;
              }
              
              const adminId = adminRow.id;
              
              // Получаем все категории
              db.all("SELECT id, name FROM categories", (err, categories) => {
                if (err) {
                  console.error('Ошибка при получении категорий:', err.message);
                  return;
                }
                
                categories.forEach(category => {
                  const title = `Пример материала для категории "${category.name}"`;
                  const content = `Это пример материала для категории "${category.name}". Здесь будет размещено содержание материала с полезной информацией по данной теме. В реальном использовании этот текст будет заменен на актуальный контент, созданный администраторами или пользователями системы.`;
                  
                  db.run("INSERT INTO materials (category_id, title, content, author_id) VALUES (?, ?, ?, ?)", 
                    [category.id, title, content, adminId], (err) => {
                    if (err) {
                      console.error(`Ошибка при создании материала для категории ${category.name}:`, err.message);
                    } else {
                      console.log(`Материал для категории ${category.name} создан успешно.`);
                    }
                  });
                });
              });
            });
          } else {
            console.log('Материалы уже существуют.');
          }
        });
      }, 1000); // Задержка для завершения создания других таблиц
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
};

// Запускаем создание таблиц
createTables();

// Экспортируем подключение к базе данных
module.exports = db;

// Если скрипт запущен напрямую, закрываем соединение после выполнения
if (require.main === module) {
  setTimeout(() => {
    console.log('Инициализация базы данных завершена.');
    db.close((err) => {
      if (err) {
        console.error('Ошибка при закрытии соединения с базой данных:', err.message);
      } else {
        console.log('Соединение с базой данных закрыто.');
      }
      process.exit(0);
    });
  }, 3000); // Даем время на выполнение всех асинхронных операций
}