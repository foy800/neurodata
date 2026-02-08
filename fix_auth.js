const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

// Подключаемся к базе данных
const db = new sqlite3.Database(path.join(__dirname, 'database', 'neuro_knowledge_base.db'), (err) => {
  if (err) {
    console.error('Ошибка при подключении к базе данных:', err.message);
    process.exit(1);
  }
  console.log('Подключение к базе данных SQLite установлено.');
});

// Проверяем и исправляем проблему с аутентификацией
console.log('Проверка и исправление проблемы с аутентификацией...');

// Проверяем наличие администратора
db.get("SELECT * FROM users WHERE username = 'admin'", (err, admin) => {
  if (err) {
    console.error('Ошибка при проверке администратора:', err.message);
    db.close();
    process.exit(1);
  }
  
  if (!admin) {
    console.log('Администратор не найден. Создаем...');
    
    const hashedPassword = bcrypt.hashSync('123456789', 10);
    
    db.run("INSERT INTO users (username, password, email, full_name, is_admin) VALUES (?, ?, ?, ?, 1)", 
      ['admin', hashedPassword, 'admin@neuro.local', 'Администратор'], function(err) {
      if (err) {
        console.error('Ошибка при создании администратора:', err.message);
        db.close();
        process.exit(1);
      }
      
      console.log('Администратор создан успешно с ID:', this.lastID);
      db.close();
    });
  } else {
    console.log('Администратор найден. Проверяем пароль...');
    
    // Проверяем, правильно ли хеширован пароль
    const testPassword = '123456789';
    if (bcrypt.compareSync(testPassword, admin.password)) {
      console.log('Пароль администратора корректен.');
    } else {
      console.log('Пароль администратора некорректен. Обновляем...');
      
      const hashedPassword = bcrypt.hashSync('123456789', 10);
      
      db.run("UPDATE users SET password = ? WHERE username = 'admin'", [hashedPassword], function(err) {
        if (err) {
          console.error('Ошибка при обновлении пароля администратора:', err.message);
          db.close();
          process.exit(1);
        }
        
        console.log('Пароль администратора обновлен успешно.');
        db.close();
      });
    }
  }
});