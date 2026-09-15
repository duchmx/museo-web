<?php
// Copia este archivo a config.php DIRECTAMENTE en el servidor (nunca por git)
// y completa los valores reales. config.php está en .gitignore a propósito:
// los secretos no deben pasar nunca por el repositorio ni por el deploy de Git.

return [
    'db' => [
        'host' => '127.0.0.1',
        'name' => 'u123456789_museo',
        'user' => 'u123456789_museo',
        'pass' => 'CAMBIA_ESTO',
        'charset' => 'utf8mb4',
    ],

    // Contraseña del panel /admin. Generar con:
    //   php -r "echo password_hash('tu-password', PASSWORD_DEFAULT), PHP_EOL;"
    'admin_password_hash' => '$2y$10$CAMBIA_ESTE_HASH',

    // Firma los tokens de sesión del admin. Generar con:
    //   php -r "echo bin2hex(random_bytes(32)), PHP_EOL;"
    'session_secret' => 'CAMBIA_ESTO_POR_64_HEX_ALEATORIOS',

    // Llave fija para llamadas servidor-a-servidor desde Vercel (proxy.ts y el
    // build de ISR). Debe coincidir con HOSTINGER_API_KEY en Vercel.
    // Generar igual que session_secret.
    'server_api_key' => 'CAMBIA_ESTO_TAMBIEN',

    // Orígenes desde los que el navegador puede llamar a este API directamente
    // (el panel /admin corre en el navegador y llama aquí con el token de sesión).
    'allowed_origins' => [
        'https://mucy.mx',
        'https://www.mucy.mx',
        'https://museodelacancionyucateca.com',
        'https://www.museodelacancionyucateca.com',
        'http://localhost:3000',
    ],

    // Carpeta pública donde se guardan las imágenes subidas desde el admin, y
    // la URL bajo la que ese mismo directorio queda accesible por HTTPS.
    'uploads_dir' => __DIR__ . '/uploads',
    'uploads_public_url' => 'https://mucy.mx/api/uploads',
];
