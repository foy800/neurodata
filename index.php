<?php
session_start();
require_once 'config/database.php';
require_once 'includes/functions.php';

// Проверка авторизации
if (!isset($_SESSION['user_id']) && !isset($_SESSION['admin_logged_in'])) {
    header('Location: login.php');
    exit;
}

// Проверка блокировки пользователя
if (isset($_SESSION['user_id'])) {
    $stmt = $pdo->prepare("SELECT is_blocked FROM users WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch();
    
    if ($user && $user['is_blocked']) {
        session_destroy();
        header('Location: login.php?blocked=1');
        exit;
    }
}

// Получение категорий
$categories = getCategories();
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>База знаний по нейросетям</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <header class="header">
        <div class="container">
            <h1>База знаний по нейросетям</h1>
            <nav class="nav">
                <?php if (isset($_SESSION['admin_logged_in'])): ?>
                    <a href="admin.php" class="nav-link">Админ панель</a>
                <?php endif; ?>
                <a href="profile.php" class="nav-link">Профиль</a>
                <a href="chat.php" class="nav-link">Чат</a>
                <a href="logout.php" class="nav-link">Выход</a>
            </nav>
        </div>
    </header>

    <main class="main">
        <div class="container">
            <div class="categories-grid">
                <?php foreach ($categories as $category): ?>
                    <div class="category-card">
                        <h3><?php echo htmlspecialchars($category['name']); ?></h3>
                        <p><?php echo htmlspecialchars($category['description']); ?></p>
                        <a href="category.php?id=<?php echo $category['id']; ?>" class="btn">Перейти</a>
                    </div>
                <?php endforeach; ?>
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