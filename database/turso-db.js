const { createClient } = require('@libsql/client');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

// Загружаем переменные окружения из .env файла
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Проверяем наличие необходимых переменных окружения
if (!process.env.TURSO_DATABASE_URL || !process.env.TURSO_AUTH_TOKEN) {
  console.warn('Turso Database URL or Auth Token not found in environment variables.');
  console.warn('Using local database for development.');
}

// Создаем клиент Turso
const client = createClient({
  url: process.env.TURSO_DATABASE_URL || 'file:local.db',
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Функция для выполнения SQL-запросов
async function query(sql, params = []) {
  try {
    const result = await client.execute({
      sql,
      args: params
    });
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Функция для инициализации базы данных
async function initializeDatabase() {
  console.log('Initializing database...');
  
  try {
    // Создаем таблицу пользователей
    await query(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        full_name TEXT,
        avatar TEXT,
        is_blocked INTEGER DEFAULT 0,
        is_admin INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Users table created or already exists');
    
    // Создаем таблицу категорий
    await query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Categories table created or already exists');
    
    // Создаем таблицу материалов
    await query(`
      CREATE TABLE IF NOT EXISTS materials (
        id INTEGER PRIMARY KEY,
        category_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        content TEXT NOT NULL,
        author_id INTEGER NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (category_id) REFERENCES categories(id),
        FOREIGN KEY (author_id) REFERENCES users(id)
      )
    `);
    console.log('Materials table created or already exists');
    
    // Создаем таблицу сообщений
    await query(`
      CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY,
        sender_id INTEGER NOT NULL,
        receiver_id INTEGER NOT NULL,
        message TEXT NOT NULL,
        is_read INTEGER DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (sender_id) REFERENCES users(id),
        FOREIGN KEY (receiver_id) REFERENCES users(id)
      )
    `);
    console.log('Messages table created or already exists');
    
    // Проверяем наличие администратора
    const adminResult = await query('SELECT * FROM users WHERE username = ?', ['admin']);
    
    if (adminResult.rows.length === 0) {
      console.log('Admin user not found. Creating...');
      const hashedPassword = bcrypt.hashSync('123456789', 10);
      
      await query(
        'INSERT INTO users (username, password, email, full_name, is_admin) VALUES (?, ?, ?, ?, 1)',
        ['admin', hashedPassword, 'admin@neuro.local', 'Администратор']
      );
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }
    
    // Проверяем наличие категорий
    const categoriesResult = await query('SELECT COUNT(*) as count FROM categories');
    
    if (categoriesResult.rows[0].count === 0) {
      console.log('No categories found. Creating default categories...');
      
      const categories = [
        ['Скрипты продаж', 'Готовые скрипты для продаж нейросетевых решений'],
        ['Промпты для агентов', 'Эффективные промпты для создания ИИ-агентов'],
        ['Промпты для голосовых ассистентов', 'Промпты для настройки голосовых помощников'],
        ['Шаблон сайта', 'Готовые шаблоны сайтов с нейросетевыми технологиями'],
        ['Договора', 'Шаблоны договоров для нейросетевых проектов'],
        ['Коммерческие предложения', 'Шаблоны коммерческих предложений']
      ];
      
      for (const category of categories) {
        await query(
          'INSERT INTO categories (name, description) VALUES (?, ?)',
          [category[0], category[1]]
        );
      }
      console.log('Default categories created successfully');
    } else {
      console.log('Categories already exist');
    }
    
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Функция для получения пользователя по имени пользователя
async function getUserByUsername(username) {
  try {
    const result = await query('SELECT * FROM users WHERE username = ?', [username]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting user by username:', error);
    throw error;
  }
}

// Функция для получения пользователя по ID
async function getUserById(id) {
  try {
    const result = await query('SELECT * FROM users WHERE id = ?', [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
}

// Функция для получения всех категорий
async function getAllCategories() {
  try {
    const result = await query('SELECT * FROM categories ORDER BY name');
    return result.rows;
  } catch (error) {
    console.error('Error getting all categories:', error);
    throw error;
  }
}

// Функция для получения категории по ID
async function getCategoryById(id) {
  try {
    const result = await query('SELECT * FROM categories WHERE id = ?', [id]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting category by ID:', error);
    throw error;
  }
}

// Функция для получения материалов по ID категории
async function getMaterialsByCategoryId(categoryId) {
  try {
    const result = await query(`
      SELECT m.*, u.username as author_name 
      FROM materials m 
      JOIN users u ON m.author_id = u.id 
      WHERE m.category_id = ? 
      ORDER BY m.created_at DESC
    `, [categoryId]);
    return result.rows;
  } catch (error) {
    console.error('Error getting materials by category ID:', error);
    throw error;
  }
}

// Функция для получения всех материалов
async function getAllMaterials() {
  try {
    const result = await query(`
      SELECT m.*, c.name as category_name, u.username as author_name 
      FROM materials m 
      JOIN categories c ON m.category_id = c.id 
      JOIN users u ON m.author_id = u.id 
      ORDER BY m.created_at DESC
    `);
    return result.rows;
  } catch (error) {
    console.error('Error getting all materials:', error);
    throw error;
  }
}

// Функция для получения всех пользователей (кроме администраторов)
async function getAllUsers() {
  try {
    const result = await query('SELECT * FROM users WHERE is_admin = 0 ORDER BY created_at DESC');
    return result.rows;
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
}

// Функция для блокировки/разблокировки пользователя
async function toggleUserBlock(userId, isBlocked) {
  try {
    await query('UPDATE users SET is_blocked = ? WHERE id = ?', [isBlocked ? 1 : 0, userId]);
    return true;
  } catch (error) {
    console.error('Error toggling user block status:', error);
    throw error;
  }
}

// Функция для добавления нового материала
async function addMaterial(categoryId, title, content, authorId) {
  try {
    const result = await query(
      'INSERT INTO materials (category_id, title, content, author_id) VALUES (?, ?, ?, ?)',
      [categoryId, title, content, authorId]
    );
    return result.lastInsertRowid;
  } catch (error) {
    console.error('Error adding material:', error);
    throw error;
  }
}

// Функция для удаления материала
async function deleteMaterial(materialId) {
  try {
    await query('DELETE FROM materials WHERE id = ?', [materialId]);
    return true;
  } catch (error) {
    console.error('Error deleting material:', error);
    throw error;
  }
}

// Функция для добавления новой категории
async function addCategory(name, description) {
  try {
    const result = await query(
      'INSERT INTO categories (name, description) VALUES (?, ?)',
      [name, description]
    );
    return result.lastInsertRowid;
  } catch (error) {
    console.error('Error adding category:', error);
    throw error;
  }
}

// Функция для удаления категории
async function deleteCategory(categoryId) {
  try {
    // Сначала удаляем все материалы в этой категории
    await query('DELETE FROM materials WHERE category_id = ?', [categoryId]);
    // Затем удаляем саму категорию
    await query('DELETE FROM categories WHERE id = ?', [categoryId]);
    return true;
  } catch (error) {
    console.error('Error deleting category:', error);
    throw error;
  }
}

// Функция для создания нового пользователя
async function createUser(username, email, password, fullName = null) {
  try {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = await query(
      'INSERT INTO users (username, email, password, full_name) VALUES (?, ?, ?, ?)',
      [username, email, hashedPassword, fullName]
    );
    return result.lastInsertRowid;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
}

// Функция для получения статистики
async function getStats() {
  try {
    const totalUsers = await query('SELECT COUNT(*) as count FROM users WHERE is_admin = 0');
    const blockedUsers = await query('SELECT COUNT(*) as count FROM users WHERE is_blocked = 1');
    const totalMaterials = await query('SELECT COUNT(*) as count FROM materials');
    const totalMessages = await query('SELECT COUNT(*) as count FROM messages');
    
    return {
      total_users: totalUsers.rows[0].count,
      blocked_users: blockedUsers.rows[0].count,
      total_materials: totalMaterials.rows[0].count,
      total_messages: totalMessages.rows[0].count
    };
  } catch (error) {
    console.error('Error getting stats:', error);
    throw error;
  }
}

// Инициализируем базу данных при запуске
initializeDatabase().catch(console.error);

// Экспортируем функции для работы с базой данных
module.exports = {
  query,
  getUserByUsername,
  getUserById,
  getAllCategories,
  getCategoryById,
  getMaterialsByCategoryId,
  getAllMaterials,
  getAllUsers,
  toggleUserBlock,
  addMaterial,
  deleteMaterial,
  addCategory,
  deleteCategory,
  createUser,
  getStats,
  initializeDatabase
};