<?php
declare(strict_types=1);
require __DIR__ . '/db.php';
require __DIR__ . '/cors.php';
require __DIR__ . '/auth.php';

mc_cors();
$pdo = mc_db();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // Llamado por proxy.ts en cada escaneo del QR impreso — nunca por un
    // navegador. Antes esto lo hacía la service role key de Supabase, que
    // bypasseaba RLS; aquí la llave de servidor cumple el mismo rol: nadie
    // sin esa llave puede insertar y así inflar el contador.
    mc_require_server_key();
    $body = json_decode(file_get_contents('php://input'), true) ?? [];

    $stmt = $pdo->prepare('INSERT INTO qr_scans (slug, campaign, lang, user_agent) VALUES (?, ?, ?, ?)');
    $stmt->execute([
        $body['slug'] ?? '',
        $body['campaign'] ?? null,
        $body['lang'] ?? null,
        $body['user_agent'] ?? null,
    ]);
    echo json_encode(['ok' => true]);
    exit;
}

if ($method === 'GET') {
    // Contador del panel /admin/qr: ?slug=qr&since=2026-09-01T00:00:00-06:00
    mc_require_admin();
    $slug = $_GET['slug'] ?? 'qr';
    $since = $_GET['since'] ?? null;

    if ($since) {
        $sinceUtc = gmdate('Y-m-d H:i:s', strtotime($since));
        $stmt = $pdo->prepare('SELECT COUNT(*) AS total FROM qr_scans WHERE slug = ? AND scanned_at >= ?');
        $stmt->execute([$slug, $sinceUtc]);
    } else {
        $stmt = $pdo->prepare('SELECT COUNT(*) AS total FROM qr_scans WHERE slug = ?');
        $stmt->execute([$slug]);
    }

    echo json_encode(['total' => (int) $stmt->fetch()['total']]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Método no permitido']);
