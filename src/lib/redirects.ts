import { apiUrl } from './api';

/**
 * Destino de emergencia. Vive en código a propósito: hay papel impreso en la
 * calle apuntando a mucy.mx/QR y un escaneo nunca debe terminar en error porque
 * el API en Hostinger esté caído o lento. El destino normal vive en la base
 * de datos.
 */
export const DESTINO_FALLBACK = '/';

/** Si la consulta tarda más que esto, se redirige al fallback y ya. */
const TIMEOUT_CONSULTA_MS = 1500;

export type Redirect = {
  slug: string;
  destino: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
};

function fallbackPara(slug: string): Redirect {
  return {
    slug,
    destino: DESTINO_FALLBACK,
    utm_source: 'qr',
    utm_medium: 'impreso',
    utm_campaign: 'general',
  };
}

/**
 * Busca el destino del slug. Nunca lanza ni devuelve null: ante cualquier
 * problema (sin fila, slug desactivado, error de red, timeout) cae al fallback.
 */
export async function resolveRedirect(slug: string): Promise<Redirect> {
  try {
    const res = await fetch(apiUrl('redirects.php', { slug }), {
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_CONSULTA_MS),
    });
    if (!res.ok) return fallbackPara(slug);

    // El API no filtra por "activo" (el admin necesita leer la fila incluso
    // desactivada, para mostrar el toggle) — ese filtro que antes hacía la
    // query de Supabase se aplica aquí.
    const data = (await res.json()) as (Redirect & { activo: boolean }) | null;
    if (!data?.destino || !data.activo) return fallbackPara(slug);

    return data;
  } catch {
    return fallbackPara(slug);
  }
}

/**
 * Arma la URL final: resuelve el destino y le adjunta los UTM de la fila.
 *
 * `destino` acepta ruta relativa ('/agenda') o URL absoluta. Los query params
 * que ya traía la petición se conservan; los UTM de la base de datos mandan.
 */
export function buildDestination(redirect: Redirect, requestUrl: URL): URL {
  const destino = redirect.destino.trim() || DESTINO_FALLBACK;

  let target: URL;
  try {
    target = destino.startsWith('/')
      ? new URL(destino, requestUrl.origin)
      : new URL(destino);
  } catch {
    target = new URL(DESTINO_FALLBACK, requestUrl.origin);
  }

  requestUrl.searchParams.forEach((valor, clave) => {
    if (!target.searchParams.has(clave)) target.searchParams.set(clave, valor);
  });

  const utm = {
    utm_source: redirect.utm_source,
    utm_medium: redirect.utm_medium,
    utm_campaign: redirect.utm_campaign,
  };
  for (const [clave, valor] of Object.entries(utm)) {
    if (valor) target.searchParams.set(clave, valor);
  }

  return target;
}
