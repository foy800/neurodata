// Этот файл используется для отладки на Vercel
const express = require('express');
const router = express.Router();
const db = require('../database/db');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Маршрут для проверки состояния сервера
router.get('/status', (req, res) => {
  const status = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    session: req.session || 'Сессия не инициализирована',
    database_path: path.join(__dirname, '..', 'database', 'neuro_knowledge_base.db'),
    database_exists: fs.existsSync(path.join(__dirname, '..', 'database', 'neuro_knowledge_base.db')),
    node_version: process.version,
    memory_usage: process.memoryUsage(),
    uptime: process.uptime()
  };
  
  res.json(status);
});

// Маршрут для проверки базы данных
router.get('/db-check', (req, res) => {
  // Проверяем таблицы
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      return res.status(500).json({ error: 'Ошибка при проверке таблиц', details: err.message });
    }
    
    // Проверяем пользователей
    db.all("SELECT id, username, email, is_admin, is_blocked FROM users", (err, users) => {
      if (err) {
        return res.status(500).json({ error: 'Ошибка при проверке пользователей', details: err.message });
      }
      
      // Проверяем категории
      db.all("SELECT * FROM categories", (err, categories) => {
        if (err) {
          return res.status(500).json({ error: 'Ошибка при проверке категорий', details: err.message });
        }
        
        res.json({
          tables,
          users,
          categories
        });
      });
    });
  });
});

// Маршрут для создания администратора
router.get('/create-admin', (req, res) => {
  const hashedPassword = bcrypt.hashSync('123456789', 10);
  
  // Проверяем, существует ли администратор
  db.get("SELECT * FROM users WHERE username = 'admin'", (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Ошибка при проверке администратора', details: err.message });
    }
    
    if (user) {
      // Обновляем пароль администратора
      db.run("UPDATE users SET password = ?, is_admin = 1 WHERE username = 'admin'", [hashedPassword], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Ошибка при обновлении администратора', details: err.message });
        }
        
        res.json({ success: true, message: 'Администратор обновлен', user_id: user.id });
      });
    } else {
      // Создаем администратора
      db.run("INSERT INTO users (username, password, email, full_name, is_admin) VALUES (?, ?, ?, ?, 1)", 
        ['admin', hashedPassword, 'admin@neuro.local', 'Администратор'], function(err) {
        if (err) {
          return res.status(500).json({ error: 'Ошибка при создании администратора', details: err.message });
        }
        
        res.json({ success: true, message: 'Администратор создан', user_id: this.lastID });
      });
    }
  });
});

// Маршрут для установки сессии администратора
router.get('/set-admin-session', (req, res) => {
  db.get("SELECT * FROM users WHERE username = 'admin' AND is_admin = 1", (err, user) => {
    if (err || !user) {
      return res.status(500).json({ 
        error: 'Ошибка при поиске администратора', 
        details: err ? err.message : 'Администратор не найден' 
      });
    }
    
    req.session.admin_logged_in = true;
    req.session.admin_id = user.id;
    req.session.username = user.username;
    
    res.json({ 
      success: true, 
      message: 'Сессия администратора установлена', 
      session: req.session 
    });
  });
});

// Маршрут для проверки сессии
router.get('/check-session', (req, res) => {
  res.json({ 
    session: req.session,
    admin_logged_in: req.session.admin_logged_in || false,
    admin_id: req.session.admin_id || null,
    username: req.session.username || null
  });
});

module.exports = router;