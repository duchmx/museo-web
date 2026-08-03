import { createClient } from '@supabase/supabase-js';

/**
 * Cliente con service role: bypassea RLS.
 *
 * SOLO SERVIDOR. Nunca importar este módulo desde un componente cliente ni desde
 * nada que termine en el bundle del navegador. La llave no lleva prefijo
 * NEXT_PUBLIC_ justamente para que Next.js se niegue a exponerla.
 *
 * Hoy lo usa únicamente src/proxy.ts, para registrar escaneos del QR sin abrir
 * una policy de INSERT pública que cualquiera podría usar para inflar el contador.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en el entorno.'
    );
  }

  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
