<?php
declare(strict_types=1);
require __DIR__ . '/db.php';
require __DIR__ . '/cors.php';
require __DIR__ . '/auth.php';

mc_cors();
mc_require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    exit(json_encode(['error' => 'Método no permitido']));
}

if (empty($_FILES['file'])) {
    http_response_code(400);
    exit(json_encode(['error' => 'Falta el archivo']));
}

$file = $_FILES['file'];
$permitidas = ['jpg' => true, 'jpeg' => true, 'png' => true, 'webp' => true];
$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));

if ($file['error'] !== UPLOAD_ERR_OK || !isset($permitidas[$ext])) {
    http_response_code(400);
    exit(json_encode(['error' => 'Archivo inválido']));
}

// Revalida el contenido real del archivo, no solo la extensión declarada por
// el navegador — evita que un .jpg renombrado cuele otra cosa al servidor.
$tipoReal = mime_content_type($file['tmp_name']);
$tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp'];
if (!in_array($tipoReal, $tiposPermitidos, true)) {
    http_response_code(400);
    exit(json_encode(['error' => 'El contenido del archivo no es una imagen válida']));
}

$config = mc_config();
$nombre = bin2hex(random_bytes(16)) . '.' . $ext;
$carpeta = rtrim($config['uploads_dir'], '/');
$destino = $carpeta . '/' . $nombre;

if (!is_dir($carpeta) && !mkdir($carpeta, 0755, true) && !is_dir($carpeta)) {
    http_response_code(500);
    exit(json_encode(['error' => 'No se pudo preparar la carpeta de imágenes']));
}

if (!move_uploaded_file($file['tmp_name'], $destino)) {
    http_response_code(500);
    exit(json_encode(['error' => 'No se pudo guardar el archivo']));
}

echo json_encode(['url' => rtrim($config['uploads_public_url'], '/') . '/' . $nombre]);
