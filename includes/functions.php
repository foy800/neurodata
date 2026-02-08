<?php

function getCategories() {
    global $pdo;
    $stmt = $pdo->query("SELECT * FROM categories ORDER BY name");
    return $stmt->fetchAll();
}

function getCategoryById($id) {
    global $pdo;
    $stmt = $pdo->prepare("SELECT * FROM categories WHERE id = ?");
    $stmt->execute([$id]);
    return $stmt->fetch();
}

function getMaterialsByCategory($category_id) {
    global $pdo;
    $stmt = $pdo->prepare("
        SELECT m.*, u.full_name as author_name 
        FROM materials m 
        JOIN users u ON m.author_id = u.id 
        WHERE m.category_id = ? 
        ORDER BY m.created_at DESC
    ");
    $stmt->execute([$category_id]);
    return $stmt->fetchAll();
}

function getUserById($id) {
    global $pdo;
    $stmt = $pdo->prepare("SELECT id, username, email, full_name, avatar, created_at FROM users WHERE id = ?");
    $stmt->execute([$id]);
    return $stmt->fetch();
}

function getAllUsers() {
    global $pdo;
    $stmt = $pdo->query("SELECT id, username, email, full_name, avatar, is_blocked, created_at FROM users ORDER BY created_at DESC");
    return $stmt->fetchAll();
}

function blockUser($user_id) {
    global $pdo;
    $stmt = $pdo->prepare("UPDATE users SET is_blocked = 1 WHERE id = ?");
    return $stmt->execute([$user_id]);
}

function unblockUser($user_id) {
    global $pdo;
    $stmt = $pdo->prepare("UPDATE users SET is_blocked = 0 WHERE id = ?");
    return $stmt->execute([$user_id]);
}

function getMessages($user_id, $other_user_id) {
    global $pdo;
    $stmt = $pdo->prepare("
        SELECT m.*, u1.full_name as sender_name, u2.full_name as receiver_name 
        FROM messages m 
        JOIN users u1 ON m.sender_id = u1.id 
        JOIN users u2 ON m.receiver_id = u2.id 
        WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
        ORDER BY m.created_at ASC
    ");
    $stmt->execute([$user_id, $other_user_id, $other_user_id, $user_id]);
    return $stmt->fetchAll();
}

function sendMessage($sender_id, $receiver_id, $message) {
    global $pdo;
    $stmt = $pdo->prepare("INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)");
    return $stmt->execute([$sender_id, $receiver_id, $message]);
}

function getUnreadMessagesCount($user_id) {
    global $pdo;
    $stmt = $pdo->prepare("SELECT COUNT(*) FROM messages WHERE receiver_id = ? AND is_read = 0");
    $stmt->execute([$user_id]);
    return $stmt->fetchColumn();
}

function markMessagesAsRead($sender_id, $receiver_id) {
    global $pdo;
    $stmt = $pdo->prepare("UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0");
    return $stmt->execute([$sender_id, $receiver_id]);
}

function uploadAvatar($file) {
    if ($file['error'] !== UPLOAD_ERR_OK) {
        return false;
    }
    
    $allowed_types = ['image/jpeg', 'image/png', 'image/gif'];
    if (!in_array($file['type'], $allowed_types)) {
        return false;
    }
    
    $max_size = 2 * 1024 * 1024; // 2MB
    if ($file['size'] > $max_size) {
        return false;
    }
    
    // Для Vercel используем временную директорию
    if (getenv('VERCEL')) {
        $upload_dir = '/tmp/uploads/avatars/';
    } else {
        $upload_dir = 'uploads/avatars/';
    }
    
    if (!file_exists($upload_dir)) {
        mkdir($upload_dir, 0755, true);
    }
    
    $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
    $filename = uniqid() . '.' . $extension;
    $filepath = $upload_dir . $filename;
    
    if (move_uploaded_file($file['tmp_name'], $filepath)) {
        return $filepath;
    }
    
    return false;
}

function sanitizeInput($data) {
    return htmlspecialchars(strip_tags(trim($data)));
}

function redirect($url) {
    header("Location: $url");
    exit;
}

function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

function isAdmin() {
    return isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true;
}

function requireLogin() {
    if (!isLoggedIn() && !isAdmin()) {
        redirect('login.php');
    }
}