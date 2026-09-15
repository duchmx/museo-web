<?php
declare(strict_types=1);
require __DIR__ . '/db.php';
require __DIR__ . '/cors.php';
require __DIR__ . '/auth.php';

mc_cors();
$pdo = mc_db();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    // Lectura pública: la usa tanto el proxy de /qr en Vercel como el panel
    // /admin/qr para mostrar el destino actual. Equivale a resolveRedirect().
    $slug = $_GET['slug'] ?? '';
    $stmt = $pdo->prepare('SELECT slug, destino, activo, utm_source, utm_medium, utm_campaign FROM redirects WHERE slug = ? LIMIT 1');
    $stmt->execute([$slug]);
    $fila = $stmt->fetch();
    echo json_encode($fila ?: null, JSON_UNESCAPED_UNICODE);
    exit;
}

if ($method === 'PUT') {
    mc_require_admin();
    $body = json_decode(file_get_contents('php://input'), true) ?? [];
    $slug = $body['slug'] ?? '';
    if (!$slug) {
        http_response_code(400);
        exit(json_encode(['error' => 'Falta slug']));
    }

    $stmt = $pdo->prepare('UPDATE redirects SET destino = ?, activo = ?, updated_at = UTC_TIMESTAMP() WHERE slug = ?');
    $stmt->execute([$body['destino'] ?? '/', !empty($body['activo']) ? 1 : 0, $slug]);
    echo json_encode(['ok' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Método no permitido']);
