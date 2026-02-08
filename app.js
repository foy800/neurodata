const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const fileUpload = require('express-fileupload');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).send('Internal Server Error');
});

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(__dirname));

// Handle file upload errors
app.use((err, req, res, next) => {
    if (err instanceof fileUpload.FileUploadError) {
        return res.status(400).send('File upload error');
    }
    next(err);
});

try {
    app.use(fileUpload({
        limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
        abortOnLimit: true,
        responseOnLimit: 'File size limit exceeded'
    }));
} catch (err) {
    console.log('File upload middleware disabled:', err.message);
}

// Session configuration - simplified for production
app.use(session({
    secret: process.env.SESSION_SECRET || 'neuro-knowledge-base-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: false,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Set EJS as template engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Database setup with better error handling
let db;
const dbPath = process.env.VERCEL ? '/tmp/neuro_knowledge_base.db' : './database/neuro_knowledge_base.db';

try {
    const dbDir = path.dirname(dbPath);
    if (!process.env.VERCEL && !fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
    }
    
    db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Database connection error:', err);
            // Create in-memory database as fallback
            db = new sqlite3.Database(':memory:', (err) => {
                if (err) {
                    console.error('Failed to create in-memory database:', err);
                } else {
                    console.log('Using in-memory SQLite database');
                    initializeDatabase();
                }
            });
        } else {
            console.log('Connected to SQLite database');
            initializeDatabase();
        }
    });
} catch (err) {
    console.error('Database setup error:', err);
    // Fallback to in-memory database
    db = new sqlite3.Database(':memory:', (err) => {
        if (err) {
            console.error('Critical: Cannot create any database');
        } else {
            console.log('Using fallback in-memory SQLite database');
            initializeDatabase();
        }
    });
}

// Initialize database tables
function initializeDatabase() {
    if (!db) {
        console.error('Database not available for initialization');
        return;
    }

    try {
        // Users table
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
            if (err) console.error('Error creating users table:', err);
        });

        // Categories table
        db.run(`CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error('Error creating categories table:', err);
        });

        // Materials table
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
            if (err) console.error('Error creating materials table:', err);
        });

        // Messages table
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
            if (err) console.error('Error creating messages table:', err);
        });

        // Insert default categories
        setTimeout(() => {
            if (!db) return;
            
            db.get("SELECT COUNT(*) as count FROM categories", (err, row) => {
                if (err) {
                    console.error('Error checking categories:', err);
                    return;
                }
                
                if (!row || row.count === 0) {
                    const categories = [
                        ['Скрипты продаж', 'Готовые скрипты для продаж нейросетевых решений'],
                        ['Промпты для агентов', 'Эффективные промпты для создания ИИ-агентов'],
                        ['Промпты для голосовых ассистентов', 'Промпты для настройки голосовых помощников'],
                        ['Шаблон сайта', 'Готовые шаблоны сайтов с нейросетевыми технологиями'],
                        ['Договора', 'Шаблоны договоров для нейросетевых проектов'],
                        ['Коммерческие предложения', 'Шаблоны коммерческих предложений']
                    ];
                    
                    categories.forEach(cat => {
                        db.run("INSERT OR IGNORE INTO categories (name, description) VALUES (?, ?)", 
                            [cat[0], cat[1]], (err) => {
                            if (err) console.error('Error inserting category:', err);
                        });
                    });
                }
            });

            // Create default admin user
            db.get("SELECT COUNT(*) as count FROM users WHERE username = 'admin'", (err, row) => {
                if (err) {
                    console.error('Error checking admin user:', err);
                    return;
                }
                
                if (!row || row.count === 0) {
                    try {
                        const hashedPassword = bcrypt.hashSync('123456789', 10);
                        db.run("INSERT OR IGNORE INTO users (username, password, email, full_name, is_admin) VALUES (?, ?, ?, ?, 1)", 
                            ['admin', hashedPassword, 'admin@neuro.local', 'Администратор'], (err) => {
                            if (err) console.error('Error creating admin user:', err);
                        });
                    } catch (hashErr) {
                        console.error('Error hashing admin password:', hashErr);
                    }
                }
            });
        }, 1000);
    } catch (err) {
        console.error('Error in initializeDatabase:', err);
    }
}

// Authentication middleware
function requireAuth(req, res, next) {
    if (!req.session.user_id && !req.session.admin_logged_in) {
        return res.redirect('/login');
    }
    next();
}

function requireAdmin(req, res, next) {
    if (!req.session.admin_logged_in) {
        return res.redirect('/');
    }
    next();
}

// Routes with error handling
app.get('/', requireAuth, (req, res, next) => {
    if (!db) {
        return res.status(500).send('Database unavailable');
    }
    
    db.all("SELECT * FROM categories ORDER BY name", (err, categories) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Database error');
        }
        
        try {
            res.render('index', { 
                title: 'Главная',
                categories, 
                user: req.session,
                isAdmin: req.session.admin_logged_in 
            });
        } catch (renderErr) {
            console.error('Render error:', renderErr);
            res.status(500).send('Render error');
        }
    });
});

app.get('/login', (req, res) => {
    if (req.session.user_id || req.session.admin_logged_in) {
        return res.redirect('/');
    }
    
    try {
        res.render('login', { 
            title: 'Вход',
            user: null,
            error: req.query.error, 
            blocked: req.query.blocked 
        });
    } catch (renderErr) {
        console.error('Login render error:', renderErr);
        res.status(500).send('Login render error');
    }
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.redirect('/login?error=Пожалуйста, заполните все поля');
    }

    if (!db) {
        return res.status(500).send('Database unavailable');
    }

    // Check for admin login
    if (username === 'admin') {
        db.get("SELECT * FROM users WHERE username = ? AND is_admin = 1", [username], (err, user) => {
            if (err) {
                console.error('Admin login error:', err);
                return res.status(500).send('Database error');
            }
            
            if (user && bcrypt.compareSync(password, user.password)) {
                req.session.admin_logged_in = true;
                req.session.admin_id = user.id;
                return res.redirect('/');
            }
            res.redirect('/login?error=Неверное имя пользователя или пароль');
        });
        return;
    }

    // Regular user login
    db.get("SELECT * FROM users WHERE username = ? AND is_admin = 0", [username], (err, user) => {
        if (err) {
            console.error('User login error:', err);
            return res.status(500).send('Database error');
        }
        
        if (user && bcrypt.compareSync(password, user.password)) {
            if (user.is_blocked) {
                return res.redirect('/login?blocked=1');
            }
            
            req.session.user_id = user.id;
            req.session.username = user.username;
            res.redirect('/');
        } else {
            res.redirect('/login?error=Неверное имя пользователя или пароль');
        }
    });
});

app.get('/logout', (req, res) => {
    try {
        req.session.destroy();
        res.redirect('/login');
    } catch (err) {
        console.error('Logout error:', err);
        res.redirect('/');
    }
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Access the app at: http://localhost:${PORT}`);
});

server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`Port ${PORT} is already in use`);
        process.exit(1);
    } else {
        console.error('Server error:', err);
    }
});

module.exports = app;