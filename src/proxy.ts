import { NextResponse } from 'next/server';
import type { NextFetchEvent, NextRequest } from 'next/server';
import { buildDestination, resolveRedirect } from '@/lib/redirects';
import { detectLanguage } from '@/lib/language';
import { createAdminClient } from '@/lib/supabase/admin';

/**
 * En Next.js 16 el archivo `middleware.ts` se renombró a `proxy.ts` y la función
 * a `proxy`. Corre en runtime Node.js por defecto (poner `export const runtime`
 * aquí lanza error), así que @supabase/supabase-js funciona sin adaptaciones.
 *
 * Las rutas de Next son sensibles a mayúsculas, así que la insensibilidad va en
 * el matcher: las clases [qQ][rR] cubren /qr, /QR, /Qr y /qR. El segundo patrón
 * deja listas las variantes /qr-hotel y /qr-tienda — basta insertar la fila en
 * la tabla `redirects`, sin tocar código.
 */
export const config = {
  matcher: ['/:slug([qQ][rR])', '/:slug([qQ][rR]-[a-zA-Z0-9-]+)'],
};

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  const slug = request.nextUrl.pathname.slice(1).toLowerCase();

  if (esRutaQR(slug)) {
    return manejarQR(request, event, slug);
  }

  // Aquí se enchufa la detección de idioma del bloque 5, en la misma pasada.
  return NextResponse.next();
}

function esRutaQR(slug: string) {
  return slug === 'qr' || slug.startsWith('qr-');
}

async function manejarQR(
  request: NextRequest,
  event: NextFetchEvent,
  slug: string
) {
  const redirect = await resolveRedirect(slug);
  const destino = buildDestination(redirect, request.nextUrl);

  // El conteo no bloquea la redirección: perder un registro de analítica es
  // aceptable, perder un escaneo no.
  event.waitUntil(registrarEscaneo(request, slug, redirect.utm_campaign));

  // 307 temporal, nunca 301/308: las permanentes se cachean de forma indefinida
  // en el navegador y, con papel ya repartido en la calle, sería irreversible.
  const response = NextResponse.redirect(destino, 307);

  // Sin esta cabecera el CDN podría cachear el 307 y el destino editado desde
  // el admin no surtiría efecto — que es la razón de ser de todo el bloque.
  response.headers.set('Cache-Control', 'no-store, max-age=0');

  return response;
}

async function registrarEscaneo(
  request: NextRequest,
  slug: string,
  campaign: string | null
) {
  try {
    await createAdminClient().from('qr_scans').insert({
      slug,
      campaign,
      lang: detectLanguage(request.headers.get('accept-language')),
      user_agent: request.headers.get('user-agent'),
    });
  } catch {
    // Silencio a propósito: el escaneo ya se resolvió.
  }
}
