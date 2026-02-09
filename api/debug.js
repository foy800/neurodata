// Этот файл используется для отладки на Vercel
const express = require('express');
const router = express.Router();
const db = require('../database/turso-db');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Загружаем переменные окружения
dotenv.config();

// Маршрут для проверки состояния сервера
router.get('/status', (req, res) => {
  const status = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    session: req.session || 'Сессия не инициализирована',
    turso_database_url: process.env.TURSO_DATABASE_URL || 'Не настроен',
    turso_auth_token: process.env.TURSO_AUTH_TOKEN ? 'Настроен' : 'Не настроен',
    node_version: process.version,
    memory_usage: process.memoryUsage(),
    uptime: process.uptime()
  };
  
  res.json(status);
});

// Маршрут для проверки базы данных
router.get('/db-check', async (req, res) => {
  try {
    // Проверяем таблицы
    const tablesResult = await db.query("SELECT name FROM sqlite_master WHERE type='table'");
    
    // Проверяем пользователей
    const usersResult = await db.query("SELECT id, username, email, is_admin, is_blocked FROM users");
    
    // Проверяем категории
    const categoriesResult = await db.query("SELECT * FROM categories");
    
    res.json({
      tables: tablesResult.rows,
      users: usersResult.rows,
      categories: categoriesResult.rows
    });
  } catch (error) {
    return res.status(500).json({ error: 'Ошибка при проверке базы данных', details: error.message });
  }
});

// Маршрут для создания администратора
router.get('/create-admin', async (req, res) => {
  try {
    const hashedPassword = bcrypt.hashSync('123456789', 10);
    
    // Проверяем, существует ли администратор
    const adminResult = await db.query("SELECT * FROM users WHERE username = 'admin'");
    const admin = adminResult.rows[0];
    
    if (admin) {
      // Обновляем пароль администратора
      await db.query(
        "UPDATE users SET password = ?, is_admin = 1 WHERE username = 'admin'", 
        [hashedPassword]
      );
      
      res.json({ success: true, message: 'Администратор обновлен', user_id: admin.id });
    } else {
      // Создаем администратора
      const result = await db.query(
        "INSERT INTO users (username, password, email, full_name, is_admin) VALUES (?, ?, ?, ?, 1)", 
        ['admin', hashedPassword, 'admin@neuro.local', 'Администратор']
      );
      
      res.json({ success: true, message: 'Администратор создан', user_id: result.lastInsertRowid });
    }
  } catch (error) {
    return res.status(500).json({ error: 'Ошибка при создании/обновлении администратора', details: error.message });
  }
});

// Маршрут для установки сессии администратора
router.get('/set-admin-session', async (req, res) => {
  try {
    const adminResult = await db.query("SELECT * FROM users WHERE username = 'admin' AND is_admin = 1");
    const admin = adminResult.rows[0];
    
    if (!admin) {
      return res.status(500).json({ 
        error: 'Ошибка при поиске администратора', 
        details: 'Администратор не найден' 
      });
    }
    
    req.session.admin_logged_in = true;
    req.session.admin_id = admin.id;
    req.session.username = admin.username;
    
    // Сохраняем сессию перед отправкой ответа
    req.session.save((err) => {
      if (err) {
        return res.status(500).json({ 
          error: 'Ошибка при сохранении сессии', 
          details: err.message 
        });
      }
      
      res.json({ 
        success: true, 
        message: 'Сессия администратора установлена', 
        session: req.session 
      });
    });
  } catch (error) {
    return res.status(500).json({ error: 'Ошибка при установке сессии администратора', details: error.message });
  }
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

// Маршрут для инициализации базы данных
router.get('/init-db', async (req, res) => {
  try {
    await db.initializeDatabase();
    res.json({ success: true, message: 'База данных успешно инициализирована' });
  } catch (error) {
    return res.status(500).json({ error: 'Ошибка при инициализации базы данных', details: error.message });
  }
});

module.exports = router;