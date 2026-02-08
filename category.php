<?php
session_start();
require_once 'config/database.php';
require_once 'includes/functions.php';

requireLogin();

$category_id = isset($_GET['id']) ? (int)$_GET['id'] : 0;
$category = getCategoryById($category_id);

if (!$category) {
    redirect('index.php');
}

$materials = getMaterialsByCategory($category_id);

// Обработка добавления нового материала (только для администратора)
if (isAdmin() && $_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['add_material'])) {
    $title = trim($_POST['title'] ?? '');
    $content = trim($_POST['content'] ?? '');
    
    if (empty($title) || empty($content)) {
        $error = 'Пожалуйста, заполните все поля';
    } else {
        $stmt = $pdo->prepare("INSERT INTO materials (category_id, title, content, author_id) VALUES (?, ?, ?, ?)");
        
        if (isAdmin()) {
            $author_id = $_SESSION['admin_id'];
        } else {
            $author_id = $_SESSION['user_id'];
        }
        
        if ($stmt->execute([$category_id, $title, $content, $author_id])) {
            $success = 'Материал успешно добавлен';
            // Обновление списка материалов
            $materials = getMaterialsByCategory($category_id);
        } else {
            $error = 'Ошибка при добавлении материала';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo htmlspecialchars($category['name']); ?></title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <header class="header">
        <div class="container">
            <h1><?php echo htmlspecialchars($category['name']); ?></h1>
            <nav class="nav">
                <a href="index.php" class="nav-link">Главная</a>
                <a href="profile.php" class="nav-link">Профиль</a>
                <a href="chat.php" class="nav-link">Чат</a>
                <?php if (isAdmin()): ?>
                    <a href="admin.php" class="nav-link">Админ панель</a>
                <?php endif; ?>
                <a href="logout.php" class="nav-link">Выход</a>
            </nav>
        </div>
    </header>

    <main class="main">
        <div class="container">
            <div class="category-container">
                <div class="category-header">
                    <h2><?php echo htmlspecialchars($category['name']); ?></h2>
                    <p><?php echo htmlspecialchars($category['description']); ?></p>
                </div>
                
                <?php if (isAdmin()): ?>
                    <?php if (isset($error)): ?>
                        <div class="error-message"><?php echo htmlspecialchars($error); ?></div>
                    <?php endif; ?>
                    
                    <?php if (isset($success)): ?>
                        <div class="success-message"><?php echo htmlspecialchars($success); ?></div>
                    <?php endif; ?>
                    
                    <div class="add-material-form">
                        <h3>Добавить новый материал</h3>
                        <form method="POST">
                            <div class="form-group">
                                <label for="title">Название материала:</label>
                                <input type="text" id="title" name="title" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="content">Содержание:</label>
                                <textarea id="content" name="content" rows="10" required></textarea>
                            </div>
                            
                            <button type="submit" name="add_material" class="btn btn-primary">Добавить материал</button>
                        </form>
                    </div>
                <?php endif; ?>
                
                <div class="materials-list">
                    <?php if (empty($materials)): ?>
                        <div class="no-materials">
                            <p>В этой категории пока нет материалов.</p>
                            <?php if (isAdmin()): ?>
                                <p>Используйте форму выше, чтобы добавить первый материал.</p>
                            <?php endif; ?>
                        </div>
                    <?php else: ?>
                        <?php foreach ($materials as $material): ?>
                            <div class="material-card">
                                <div class="material-header">
                                    <h3><?php echo htmlspecialchars($material['title']); ?></h3>
                                    <div class="material-meta">
                                        <span class="author">Автор: <?php echo htmlspecialchars($material['author_name']); ?></span>
                                        <span class="date"><?php echo date('d.m.Y H:i', strtotime($material['created_at'])); ?></span>
                                    </div>
                                </div>
                                <div class="material-content">
                                    <?php echo nl2br(htmlspecialchars($material['content'])); ?>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </main>

    <footer class="footer">
        <div class="container">
            <p>&copy; 2024 База знаний по нейросетям</p>
        </div>
    </footer>
</body>
</html>