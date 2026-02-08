const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Подключаемся к базе данных
const db = new sqlite3.Database(path.join(__dirname, 'database', 'neuro_knowledge_base.db'), (err) => {
  if (err) {
    console.error('Ошибка при подключении к базе данных:', err.message);
    process.exit(1);
  }
  console.log('Подключение к базе данных SQLite установлено.');
});

// Проверяем наличие администратора
db.get("SELECT * FROM users WHERE username = 'admin'", (err, row) => {
  if (err) {
    console.error('Ошибка при проверке администратора:', err.message);
    db.close();
    process.exit(1);
  }
  
  console.log('Данные администратора:', row);
  
  if (!row) {
    console.log('Администратор не найден. Создаем...');
    
    const bcrypt = require('bcryptjs');
    const hashedPassword = bcrypt.hashSync('123456789', 10);
    
    db.run("INSERT INTO users (username, password, email, full_name, is_admin) VALUES (?, ?, ?, ?, 1)", 
      ['admin', hashedPassword, 'admin@neuro.local', 'Администратор'], function(err) {
      if (err) {
        console.error('Ошибка при создании администратора:', err.message);
      } else {
        console.log('Администратор создан успешно с ID:', this.lastID);
      }
      
      db.close();
    });
  } else {
    console.log('Администратор найден.');
    db.close();
  }
});