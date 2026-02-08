<?php
session_start();
require_once 'config/database.php';
require_once 'includes/functions.php';

requireLogin();

$error = '';
$success = '';

// Получение текущего пользователя
if (isAdmin()) {
    $user_id = $_SESSION['admin_id'];
} else {
    $user_id = $_SESSION['user_id'];
}

$user = getUserById($user_id);

if (!$user) {
    redirect('logout.php');
}

// Обработка обновления профиля
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $full_name = trim($_POST['full_name'] ?? '');
    $email = trim($_POST['email'] ?? '');
    
    if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
        $error = 'Пожалуйста, введите корректный email';
    } else {
        // Проверка уникальности email
        $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ? AND id != ?");
        $stmt->execute([$email, $user_id]);
        
        if ($stmt->fetch()) {
            $error = 'Email уже используется другим пользователем';
        } else {
            // Обработка загрузки аватара
            $avatar_path = $user['avatar'];
            
            if (isset($_FILES['avatar']) && $_FILES['avatar']['error'] === UPLOAD_ERR_OK) {
                $uploaded_avatar = uploadAvatar($_FILES['avatar']);
                if ($uploaded_avatar) {
                    // Удаление старого аватара
                    if ($avatar_path && file_exists($avatar_path)) {
                        unlink($avatar_path);
                    }
                    $avatar_path = $uploaded_avatar;
                } else {
                    $error = 'Ошибка при загрузке аватара. Проверьте формат и размер файла';
                }
            }
            
            if (!$error) {
                // Обновление профиля
                $stmt = $pdo->prepare("UPDATE users SET full_name = ?, email = ?, avatar = ? WHERE id = ?");
                
                if ($stmt->execute([$full_name, $email, $avatar_path, $user_id])) {
                    $success = 'Профиль успешно обновлен';
                    // Обновление данных пользователя
                    $user = getUserById($user_id);
                } else {
                    $error = 'Ошибка при обновлении профиля';
                }
            }
        }
    }
}

// Обработка смены пароля
if (isset($_POST['change_password'])) {
    $current_password = $_POST['current_password'] ?? '';
    $new_password = $_POST['new_password'] ?? '';
    $confirm_password = $_POST['confirm_password'] ?? '';
    
    if (empty($current_password) || empty($new_password) || empty($confirm_password)) {
        $error = 'Пожалуйста, заполните все поля для смены пароля';
    } elseif (strlen($new_password) < 6) {
        $error = 'Новый пароль должен содержать минимум 6 символов';
    } elseif ($new_password !== $confirm_password) {
        $error = 'Новые пароли не совпадают';
    } else {
        // Проверка текущего пароля
        $stmt = $pdo->prepare("SELECT password FROM users WHERE id = ?");
        $stmt->execute([$user_id]);
        $user_data = $stmt->fetch();
        
        if ($user_data && password_verify($current_password, $user_data['password'])) {
            // Обновление пароля
            $hashed_password = password_hash($new_password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("UPDATE users SET password = ? WHERE id = ?");
            
            if ($stmt->execute([$hashed_password, $user_id])) {
                $success = 'Пароль успешно изменен';
            } else {
                $error = 'Ошибка при смене пароля';
            }
        } else {
            $error = 'Текущий пароль неверный';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Профиль пользователя</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <header class="header">
        <div class="container">
            <h1>Профиль пользователя</h1>
            <nav class="nav">
                <a href="index.php" class="nav-link">Главная</a>
                <a href="chat.php" class="nav-link">Чат</a>
                <a href="logout.php" class="nav-link">Выход</a>
            </nav>
        </div>
    </header>

    <main class="main">
        <div class="container">
            <div class="profile-container">
                <?php if ($error): ?>
                    <div class="error-message"><?php echo htmlspecialchars($error); ?></div>
                <?php endif; ?>
                
                <?php if ($success): ?>
                    <div class="success-message"><?php echo htmlspecialchars($success); ?></div>
                <?php endif; ?>
                
                <div class="profile-card">
                    <div class="profile-avatar">
                        <?php if ($user['avatar']): ?>
                            <img src="<?php echo htmlspecialchars($user['avatar']); ?>" alt="Аватар">
                        <?php else: ?>
                            <div class="avatar-placeholder">
                                <?php echo strtoupper(substr($user['username'], 0, 1)); ?>
                            </div>
                        <?php endif; ?>
                    </div>
                    
                    <div class="profile-info">
                        <h2><?php echo htmlspecialchars($user['full_name'] ?: $user['username']); ?></h2>
                        <p><strong>Имя пользователя:</strong> <?php echo htmlspecialchars($user['username']); ?></p>
                        <p><strong>Email:</strong> <?php echo htmlspecialchars($user['email']); ?></p>
                        <p><strong>Дата регистрации:</strong> <?php echo date('d.m.Y', strtotime($user['created_at'])); ?></p>
                    </div>
                </div>
                
                <div class="profile-tabs">
                    <div class="tab-buttons">
                        <button class="tab-button active" onclick="showTab('edit-profile')">Редактировать профиль</button>
                        <button class="tab-button" onclick="showTab('change-password')">Сменить пароль</button>
                    </div>
                    
                    <div id="edit-profile" class="tab-content active">
                        <form method="POST" enctype="multipart/form-data" class="profile-form">
                            <div class="form-group">
                                <label for="full_name">Полное имя:</label>
                                <input type="text" id="full_name" name="full_name" 
                                       value="<?php echo htmlspecialchars($user['full_name'] ?? ''); ?>">
                            </div>
                            
                            <div class="form-group">
                                <label for="email">Email *:</label>
                                <input type="email" id="email" name="email" required 
                                       value="<?php echo htmlspecialchars($user['email']); ?>">
                            </div>
                            
                            <div class="form-group">
                                <label for="avatar">Аватар:</label>
                                <input type="file" id="avatar" name="avatar" accept="image/*">
                                <small>Форматы: JPEG, PNG, GIF. Максимальный размер: 2MB</small>
                            </div>
                            
                            <button type="submit" class="btn btn-primary">Сохранить изменения</button>
                        </form>
                    </div>
                    
                    <div id="change-password" class="tab-content">
                        <form method="POST" class="profile-form">
                            <div class="form-group">
                                <label for="current_password">Текущий пароль *:</label>
                                <input type="password" id="current_password" name="current_password" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="new_password">Новый пароль *:</label>
                                <input type="password" id="new_password" name="new_password" required>
                                <small>Минимум 6 символов</small>
                            </div>
                            
                            <div class="form-group">
                                <label for="confirm_password">Подтверждение нового пароля *:</label>
                                <input type="password" id="confirm_password" name="confirm_password" required>
                            </div>
                            
                            <button type="submit" name="change_password" class="btn btn-primary">Сменить пароль</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <script>
        function showTab(tabId) {
            // Скрыть все вкладки
            document.querySelectorAll('.tab-content').forEach(tab => {
                tab.classList.remove('active');
            });
            document.querySelectorAll('.tab-button').forEach(button => {
                button.classList.remove('active');
            });
            
            // Показать выбранную вкладку
            document.getElementById(tabId).classList.add('active');
            event.target.classList.add('active');
        }
    </script>
</body>
</html>