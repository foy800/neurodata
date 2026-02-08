<?php
session_start();
require_once 'config/database.php';
require_once 'includes/functions.php';

// Проверка администратора
if (!isAdmin()) {
    redirect('index.php');
}

$message = '';

// Обработка действий администратора
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['block_user'])) {
        $user_id = $_POST['user_id'];
        if (blockUser($user_id)) {
            $message = 'Пользователь заблокирован';
        } else {
            $message = 'Ошибка при блокировке пользователя';
        }
    } elseif (isset($_POST['unblock_user'])) {
        $user_id = $_POST['user_id'];
        if (unblockUser($user_id)) {
            $message = 'Пользователь разблокирован';
        } else {
            $message = 'Ошибка при разблокировке пользователя';
        }
    }
}

// Получение всех пользователей
$users = getAllUsers();

// Получение статистики
$stats = [
    'total_users' => $pdo->query("SELECT COUNT(*) FROM users WHERE is_admin = 0")->fetchColumn(),
    'blocked_users' => $pdo->query("SELECT COUNT(*) FROM users WHERE is_blocked = 1 AND is_admin = 0")->fetchColumn(),
    'total_materials' => $pdo->query("SELECT COUNT(*) FROM materials")->fetchColumn(),
    'total_messages' => $pdo->query("SELECT COUNT(*) FROM messages")->fetchColumn()
];
?>
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Административная панель</title>
    <link rel="stylesheet" href="css/style.css">
</head>
<body>
    <header class="header">
        <div class="container">
            <h1>Административная панель</h1>
            <nav class="nav">
                <a href="index.php" class="nav-link">Главная</a>
                <a href="profile.php" class="nav-link">Профиль</a>
                <a href="chat.php" class="nav-link">Чат</a>
                <a href="logout.php" class="nav-link">Выход</a>
            </nav>
        </div>
    </header>

    <main class="main">
        <div class="container">
            <div class="admin-container">
                <?php if ($message): ?>
                    <div class="info-message"><?php echo htmlspecialchars($message); ?></div>
                <?php endif; ?>
                
                <div class="stats-grid">
                    <div class="stat-card">
                        <h3>Всего пользователей</h3>
                        <p class="stat-number"><?php echo $stats['total_users']; ?></p>
                    </div>
                    <div class="stat-card">
                        <h3>Заблокированных</h3>
                        <p class="stat-number"><?php echo $stats['blocked_users']; ?></p>
                    </div>
                    <div class="stat-card">
                        <h3>Материалов</h3>
                        <p class="stat-number"><?php echo $stats['total_materials']; ?></p>
                    </div>
                    <div class="stat-card">
                        <h3>Сообщений</h3>
                        <p class="stat-number"><?php echo $stats['total_messages']; ?></p>
                    </div>
                </div>
                
                <div class="admin-section">
                    <h2>Управление пользователями</h2>
                    
                    <div class="users-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Имя пользователя</th>
                                    <th>Email</th>
                                    <th>Полное имя</th>
                                    <th>Дата регистрации</th>
                                    <th>Статус</th>
                                    <th>Действия</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($users as $user): ?>
                                    <tr class="<?php echo $user['is_blocked'] ? 'blocked' : ''; ?>">
                                        <td><?php echo $user['id']; ?></td>
                                        <td><?php echo htmlspecialchars($user['username']); ?></td>
                                        <td><?php echo htmlspecialchars($user['email']); ?></td>
                                        <td><?php echo htmlspecialchars($user['full_name'] ?: 'Не указано'); ?></td>
                                        <td><?php echo date('d.m.Y', strtotime($user['created_at'])); ?></td>
                                        <td>
                                            <span class="status <?php echo $user['is_blocked'] ? 'blocked' : 'active'; ?>">
                                                <?php echo $user['is_blocked'] ? 'Заблокирован' : 'Активен'; ?>
                                            </span>
                                        </td>
                                        <td>
                                            <form method="POST" style="display: inline;">
                                                <input type="hidden" name="user_id" value="<?php echo $user['id']; ?>">
                                                <?php if ($user['is_blocked']): ?>
                                                    <button type="submit" name="unblock_user" class="btn btn-success btn-sm">
                                                        Разблокировать
                                                    </button>
                                                <?php else: ?>
                                                    <button type="submit" name="block_user" class="btn btn-danger btn-sm" 
                                                            onclick="return confirm('Вы уверены, что хотите заблокировать этого пользователя?')">
                                                        Заблокировать
                                                    </button>
                                                <?php endif; ?>
                                            </form>
                                        </td>
                                    </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="admin-section">
                    <h2>Добавить материал</h2>
                    <p>Для добавления новых материалов перейдите в нужную категорию на главной странице и используйте форму добавления материалов.</p>
                    <a href="index.php" class="btn btn-primary">Перейти на главную</a>
                </div>
            </div>
        </div>
    </main>
</body>
</html>