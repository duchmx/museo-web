<?php
declare(strict_types=1);
require __DIR__ . '/db.php';
require __DIR__ . '/cors.php';
require __DIR__ . '/auth.php';

mc_cors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['error' => 'Método no permitido']));
}

$body = json_decode(file_get_contents('php://input'), true) ?? [];
$password = $body['password'] ?? '';

if (!is_string($password) || $password === '' || !password_verify($password, mc_config()['admin_password_hash'])) {
    // Mismo mensaje para "no existe" y "contraseña incorrecta": no hay nada
    // más que enumerar (un solo usuario admin), así que no hace falta distinguir.
    http_response_code(401);
    exit(json_encode(['error' => 'Contraseña incorrecta']));
}

echo json_encode(['token' => mc_issue_token()]);
