<?php
declare(strict_types=1);

/**
 * Sesión del admin sin librerías externas (el hosting no garantiza Composer):
 * token = payload_b64.firma, firmado con HMAC-SHA256 sobre `session_secret`.
 * Reemplaza a Supabase Auth para el único usuario administrador del museo.
 */
function mc_issue_token(int $ttlSeconds = 4 * 3600): string
{
    $payload = json_encode(['exp' => time() + $ttlSeconds]);
    $payloadB64 = rtrim(strtr(base64_encode($payload), '+/', '-_'), '=');
    $signature = hash_hmac('sha256', $payloadB64, mc_config()['session_secret']);
    return "$payloadB64.$signature";
}

function mc_verify_token(?string $token): bool
{
    if (!$token || !str_contains($token, '.')) return false;

    [$payloadB64, $signature] = explode('.', $token, 2);
    $expected = hash_hmac('sha256', $payloadB64, mc_config()['session_secret']);
    if (!hash_equals($expected, $signature)) return false;

    $payload = json_decode(base64_decode(strtr($payloadB64, '-_', '+/')), true);
    return is_array($payload) && ($payload['exp'] ?? 0) > time();
}

function mc_bearer_token(): ?string
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    return preg_match('/^Bearer\s+(.+)$/i', $header, $m) ? $m[1] : null;
}

/** Llamar al inicio de cualquier escritura que solo el admin logueado puede hacer. */
function mc_require_admin(): void
{
    if (!mc_verify_token(mc_bearer_token())) {
        http_response_code(401);
        echo json_encode(['error' => 'No autenticado']);
        exit;
    }
}

/**
 * Llamar al inicio de endpoints que solo Vercel llama por su cuenta (sin que
 * haya un admin logueado detrás) — hoy, únicamente el registro de escaneos de QR.
 * Equivale a lo que antes hacía SUPABASE_SERVICE_ROLE_KEY en src/lib/supabase/admin.ts.
 */
function mc_require_server_key(): void
{
    $key = $_SERVER['HTTP_X_API_KEY'] ?? '';
    if (!hash_equals(mc_config()['server_api_key'], $key)) {
        http_response_code(401);
        echo json_encode(['error' => 'Llave inválida']);
        exit;
    }
}
