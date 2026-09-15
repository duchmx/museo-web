<?php
declare(strict_types=1);
require __DIR__ . '/db.php';
require __DIR__ . '/cors.php';
require __DIR__ . '/auth.php';

mc_cors();
$pdo = mc_db();
$method = $_SERVER['REQUEST_METHOD'];

const CAMPOS_EVENTO = 'id, slug, ciclo, artista, event_date, event_time, precio, destacado, invitados, descripcion, imagen_hero, imagen_thumb, imagen_poster, mostrar_en_hero';

if ($method === 'GET') {
    // Lecturas públicas: igual que el select con la anon key de Supabase, sin
    // token. Equivalen a getEventosFuturos/getEventoPorSlug en src/lib/events.ts.
    if (isset($_GET['slug'])) {
        $stmt = $pdo->prepare('SELECT ' . CAMPOS_EVENTO . ' FROM events WHERE slug = ? LIMIT 1');
        $stmt->execute([$_GET['slug']]);
        $fila = $stmt->fetch();
        echo json_encode($fila ?: null, JSON_UNESCAPED_UNICODE);
        exit;
    }
    if (isset($_GET['id'])) {
        $stmt = $pdo->prepare('SELECT ' . CAMPOS_EVENTO . ' FROM events WHERE id = ? LIMIT 1');
        $stmt->execute([$_GET['id']]);
        $fila = $stmt->fetch();
        echo json_encode($fila ?: null, JSON_UNESCAPED_UNICODE);
        exit;
    }

    $stmt = $pdo->query('SELECT ' . CAMPOS_EVENTO . ' FROM events ORDER BY event_date, event_time');
    echo json_encode($stmt->fetchAll(), JSON_UNESCAPED_UNICODE);
    exit;
}

// Todo lo que escribe requiere el token de sesión del admin.
mc_require_admin();
$body = json_decode(file_get_contents('php://input'), true) ?? [];

if ($method === 'POST') {
    $id = mc_uuid();
    $stmt = $pdo->prepare(
        'INSERT INTO events (id, slug, ciclo, artista, event_date, event_time, precio, destacado, invitados, descripcion, imagen_hero, imagen_thumb, imagen_poster, mostrar_en_hero)
         VALUES (:id, :slug, :ciclo, :artista, :event_date, :event_time, :precio, :destacado, :invitados, :descripcion, :imagen_hero, :imagen_thumb, :imagen_poster, :mostrar_en_hero)'
    );
    $stmt->execute(mc_evento_params($body, $id));
    echo json_encode(['id' => $id]);
    exit;
}

if ($method === 'PUT') {
    $id = $body['id'] ?? '';
    if (!$id) {
        http_response_code(400);
        exit(json_encode(['error' => 'Falta id']));
    }

    $stmt = $pdo->prepare(
        'UPDATE events SET slug=:slug, ciclo=:ciclo, artista=:artista, event_date=:event_date, event_time=:event_time,
         precio=:precio, destacado=:destacado, invitados=:invitados, descripcion=:descripcion,
         imagen_hero=:imagen_hero, imagen_thumb=:imagen_thumb, imagen_poster=:imagen_poster, mostrar_en_hero=:mostrar_en_hero
         WHERE id=:id'
    );
    $stmt->execute(mc_evento_params($body, $id));
    echo json_encode(['ok' => true]);
    exit;
}

if ($method === 'DELETE') {
    $id = $_GET['id'] ?? '';
    if (!$id) {
        http_response_code(400);
        exit(json_encode(['error' => 'Falta id']));
    }
    $stmt = $pdo->prepare('DELETE FROM events WHERE id = ?');
    $stmt->execute([$id]);
    echo json_encode(['ok' => true]);
    exit;
}

http_response_code(405);
echo json_encode(['error' => 'Método no permitido']);

function mc_evento_params(array $body, string $id): array
{
    return [
        'id' => $id,
        'slug' => $body['slug'] ?? null,
        'ciclo' => $body['ciclo'] ?? '',
        'artista' => $body['artista'] ?? null,
        'event_date' => $body['event_date'] ?? null,
        'event_time' => $body['event_time'] ?? null,
        'precio' => $body['precio'] ?? null,
        'destacado' => $body['destacado'] ?? null,
        'invitados' => $body['invitados'] ?? null,
        'descripcion' => $body['descripcion'] ?? null,
        'imagen_hero' => $body['imagen_hero'] ?? null,
        'imagen_thumb' => $body['imagen_thumb'] ?? null,
        'imagen_poster' => $body['imagen_poster'] ?? null,
        'mostrar_en_hero' => !empty($body['mostrar_en_hero']) ? 1 : 0,
    ];
}
