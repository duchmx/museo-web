<?php
declare(strict_types=1);

/**
 * El panel /admin corre en el navegador y llama a este API directamente (igual
 * que hoy llama a Supabase desde el cliente), así que necesita CORS explícito.
 * Las llamadas servidor-a-servidor desde Vercel no pasan por aquí con un Origin
 * de navegador, así que no las bloquea la falta de coincidencia.
 */
function mc_cors(): void
{
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    $allowed = mc_config()['allowed_origins'];

    if (in_array($origin, $allowed, true)) {
        header("Access-Control-Allow-Origin: $origin");
        header('Vary: Origin');
    }
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Api-Key');
    header('Content-Type: application/json; charset=utf-8');

    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(204);
        exit;
    }
}
