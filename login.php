<?php
session_start();
require_once 'config/database.php';
require_once 'includes/functions.php';

$error = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
    
    if (empty($username) || empty($password)) {
        $error = 'Пожалуйста, заполните все поля';
    } else {
        // Проверка администратора
        if ($username === 'admin') {
            $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? AND is_admin = 1");
            $stmt->execute([$username]);
            $user = $stmt->fetch();
            
            if ($user && password_verify($password, $user['password'])) {
                $_SESSION['admin_logged_in'] = true;
                $_SESSION['admin_id'] = $user['id'];
                header('Location: index.php');
                exit;
            }
        }
        
        // Проверка обычного пользователя
        $stmt = $pdo->prepare("SELECT * FROM users WHERE username = ? AND is_admin = 0");
        $stmt->execute([$username]);
        $user = $stmt->fetch();
        
        if ($user && password_verify($password, $user['password'])) {
            if ($user['is_blocked']) {
                $error = 'Ваш аккаунт заблокирован';
            } else {
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['username'] = $user['username'];
                header('Location: index.php');
                exit;
            }
        } else {
            $error = 'Неверное имя пользователя или пароль';
        }
    }
}

if (isset($_GET['blocked'])) {
    $error = 'Ваш аккаунт был заблокирован администратором';
}
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Вход в систему</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <div class="auth-container">
        <div class="auth-card">
            <h2>Вход в систему</h2>
            
            <?php if ($error): ?>
                <div class="error-message"><?php echo htmlspecialchars($error); ?></div>
            <?php endif; ?>
            
            <form method="POST" class="auth-form">
                <div class="form-group">
                    <label for="username">Имя пользователя:</label>
                    <input type="text" id="username" name="username" required>
                </div>
                
                <div class="form-group">
                    <label for="password">Пароль:</label>
                    <input type="password" id="password" name="password" required>
                </div>
                
                <button type="submit" class="btn btn-primary">Войти</button>
            </form>
            
            <p class="auth-link">
                Нет аккаунта? <a href="register.php">Зарегистрироваться</a>
            </p>
            
            <div class="admin-info">
                <p><strong>Админ:</strong> login: admin, password: 123456789</p>
            </div>
        </div>
    </div>
</body>
</html>