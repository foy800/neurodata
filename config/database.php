<?php
// Определение пути к базе данных в зависимости от окружения
if (getenv('VERCEL')) {
    // Для Vercel используем временную директорию
    $database_path = '/tmp/neuro_knowledge_base.db';
} else {
    // Для локальной разработки
    $database_path = __DIR__ . '/../database/neuro_knowledge_base.db';
    
    // Создаем директорию если её нет
    $database_dir = dirname($database_path);
    if (!file_exists($database_dir)) {
        mkdir($database_dir, 0755, true);
    }
}

try {
    $pdo = new PDO("sqlite:" . $database_path);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    
    // Создание таблиц при первом запуске
    createTables($pdo);
    
} catch (PDOException $e) {
    die("Ошибка подключения к базе данных: " . $e->getMessage());
}

function createTables($pdo) {
    // Таблица пользователей
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username VARCHAR(50) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            full_name VARCHAR(100),
            avatar VARCHAR(255),
            is_blocked BOOLEAN DEFAULT 0,
            is_admin BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    // Таблица категорий
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    // Таблица материалов
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS materials (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category_id INTEGER NOT NULL,
            title VARCHAR(200) NOT NULL,
            content TEXT NOT NULL,
            author_id INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (category_id) REFERENCES categories(id),
            FOREIGN KEY (author_id) REFERENCES users(id)
        )
    ");
    
    // Таблица сообщений чата
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            sender_id INTEGER NOT NULL,
            receiver_id INTEGER NOT NULL,
            message TEXT NOT NULL,
            is_read BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (sender_id) REFERENCES users(id),
            FOREIGN KEY (receiver_id) REFERENCES users(id)
        )
    ");
    
    // Добавление категорий по умолчанию
    $stmt = $pdo->query("SELECT COUNT(*) FROM categories");
    if ($stmt->fetchColumn() == 0) {
        $categories = [
            ['name' => 'Скрипты продаж', 'description' => 'Готовые скрипты для продаж нейросетевых решений'],
            ['name' => 'Промпты для агентов', 'description' => 'Эффективные промпты для создания ИИ-агентов'],
            ['name' => 'Промпты для голосовых ассистентов', 'description' => 'Промпты для настройки голосовых помощников'],
            ['name' => 'Шаблон сайта', 'description' => 'Готовые шаблоны сайтов с нейросетевыми технологиями'],
            ['name' => 'Договора', 'description' => 'Шаблоны договоров для нейросетевых проектов'],
            ['name' => 'Коммерческие предложения', 'description' => 'Шаблоны коммерческих предложений']
        ];
        
        $stmt = $pdo->prepare("INSERT INTO categories (name, description) VALUES (?, ?)");
        foreach ($categories as $category) {
            $stmt->execute([$category['name'], $category['description']]);
        }
    }
    
    // Создание администратора по умолчанию
    $stmt = $pdo->query("SELECT COUNT(*) FROM users WHERE username = 'admin'");
    if ($stmt->fetchColumn() == 0) {
        $stmt = $pdo->prepare("INSERT INTO users (username, password, email, full_name, is_admin) VALUES (?, ?, ?, ?, 1)");
        $stmt->execute(['admin', password_hash('123456789', PASSWORD_DEFAULT), 'admin@neuro.local', 'Администратор']);
    }
}