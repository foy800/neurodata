<?php
session_start();
require_once 'config/database.php';
require_once 'includes/functions.php';

requireLogin();

// Получение текущего пользователя
if (isAdmin()) {
    $current_user_id = $_SESSION['admin_id'];
} else {
    $current_user_id = $_SESSION['user_id'];
}

// Получение всех пользователей для чата (кроме текущего)
$stmt = $pdo->prepare("
    SELECT id, username, full_name, avatar, is_blocked 
    FROM users 
    WHERE id != ? AND is_admin = 0 
    ORDER BY username
");
$stmt->execute([$current_user_id]);
$users = $stmt->fetchAll();

// Получение ID собеседника из URL
$chat_with = isset($_GET['with']) ? (int)$_GET['with'] : null;

// Проверка, что собеседник существует и не заблокирован
$chat_partner = null;
if ($chat_with) {
    $stmt = $pdo->prepare("SELECT id, username, full_name, avatar FROM users WHERE id = ? AND is_blocked = 0");
    $stmt->execute([$chat_with]);
    $chat_partner = $stmt->fetch();
}

// Обработка отправки сообщения
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['message']) && $chat_partner) {
    $message = trim($_POST['message']);
    if (!empty($message)) {
        sendMessage($current_user_id, $chat_with, $message);
        // Перенаправление для предотвращения повторной отправки
        header("Location: chat.php?with=$chat_with");
        exit;
    }
}

// Получение сообщений
$messages = [];
if ($chat_partner) {
    $messages = getMessages($current_user_id, $chat_with);
    // Отметка сообщений как прочитанных
    markMessagesAsRead($chat_with, $current_user_id);
}
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Чат</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <header class="header">
        <div class="container">
            <h1>Чат</h1>
            <nav class="nav">
                <a href="index.php" class="nav-link">Главная</a>
                <a href="profile.php" class="nav-link">Профиль</a>
                <a href="logout.php" class="nav-link">Выход</a>
            </nav>
        </div>
    </header>

    <main class="main">
        <div class="container">
            <div class="chat-container">
                <div class="chat-sidebar">
                    <h3>Пользователи</h3>
                    <div class="users-list">
                        <?php foreach ($users as $user): ?>
                            <?php if ($user['is_blocked']) continue; ?>
                            <div class="user-item <?php echo ($chat_with == $user['id']) ? 'active' : ''; ?>">
                                <a href="chat.php?with=<?php echo $user['id']; ?>">
                                    <div class="user-avatar">
                                        <?php if ($user['avatar']): ?>
                                            <img src="<?php echo htmlspecialchars($user['avatar']); ?>" alt="Аватар">
                                        <?php else: ?>
                                            <div class="avatar-placeholder">
                                                <?php echo strtoupper(substr($user['username'], 0, 1)); ?>
                                            </div>
                                        <?php endif; ?>
                                    </div>
                                    <div class="user-info">
                                        <div class="user-name"><?php echo htmlspecialchars($user['full_name'] ?: $user['username']); ?></div>
                                        <div class="user-username">@<?php echo htmlspecialchars($user['username']); ?></div>
                                    </div>
                                </a>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>
                
                <div class="chat-main">
                    <?php if ($chat_partner): ?>
                        <div class="chat-header">
                            <div class="chat-partner">
                                <div class="user-avatar">
                                    <?php if ($chat_partner['avatar']): ?>
                                        <img src="<?php echo htmlspecialchars($chat_partner['avatar']); ?>" alt="Аватар">
                                    <?php else: ?>
                                        <div class="avatar-placeholder">
                                            <?php echo strtoupper(substr($chat_partner['username'], 0, 1)); ?>
                                        </div>
                                    <?php endif; ?>
                                </div>
                                <div class="user-info">
                                    <div class="user-name"><?php echo htmlspecialchars($chat_partner['full_name'] ?: $chat_partner['username']); ?></div>
                                    <div class="user-username">@<?php echo htmlspecialchars($chat_partner['username']); ?></div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="chat-messages" id="chat-messages">
                            <?php if (empty($messages)): ?>
                                <div class="no-messages">
                                    <p>Начните диалог с <?php echo htmlspecialchars($chat_partner['full_name'] ?: $chat_partner['username']); ?></p>
                                </div>
                            <?php else: ?>
                                <?php foreach ($messages as $message): ?>
                                    <div class="message <?php echo ($message['sender_id'] == $current_user_id) ? 'sent' : 'received'; ?>">
                                        <div class="message-content">
                                            <?php echo htmlspecialchars($message['message']); ?>
                                        </div>
                                        <div class="message-time">
                                            <?php echo date('H:i', strtotime($message['created_at'])); ?>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </div>
                        
                        <div class="chat-input">
                            <form method="POST" class="message-form">
                                <input type="text" name="message" placeholder="Введите сообщение..." required>
                                <button type="submit" class="btn btn-primary">Отправить</button>
                            </form>
                        </div>
                    <?php else: ?>
                        <div class="no-chat-selected">
                            <h3>Выберите пользователя для начала чата</h3>
                            <p>Кликните на имя пользователя в списке слева</p>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </main>

    <script>
        // Автоматическая прокрутка к последнему сообщению
        window.onload = function() {
            var messagesContainer = document.getElementById('chat-messages');
            if (messagesContainer) {
                messagesContainer.scrollTop = messagesContainer.scrollHeight;
            }
        };
        
        // Обновление чата каждые 5 секунд
        <?php if ($chat_partner): ?>
        setInterval(function() {
            location.reload();
        }, 5000);
        <?php endif; ?>
    </script>
</body>
</html>