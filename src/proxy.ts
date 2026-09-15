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
 *
 * El tercer patrón corta en seco a los escáneres que prueban rutas tipo
 * /info/1234567.phtml: el sitio nunca sirve esas extensiones, así que cualquier
 * intento se responde con 404 aquí mismo en vez de dejarlo caer hasta el render
 * completo de la página 404. A propósito no se amplía el matcher a "todo",
 * porque Proxy corre en Node.js antes que el caché — matchear de más movería
 * tráfico que hoy sirve gratis el CDN (p. ej. "/") a través de una función.
 */
const EXTENSIONES_SOSPECHOSAS = /\.(php|phtml|asp|aspx|jsp|cgi|env)$/i;

export const config = {
  matcher: [
    '/:slug([qQ][rR])',
    '/:slug([qQ][rR]-[a-zA-Z0-9-]+)',
    '/(.*)\\.(php|phtml|asp|aspx|jsp|cgi|env)$',
  ],
};

export async function proxy(request: NextRequest, event: NextFetchEvent) {
  const slug = request.nextUrl.pathname.slice(1).toLowerCase();

  if (esRutaQR(slug)) {
    return manejarQR(request, event, slug);
  }

  if (EXTENSIONES_SOSPECHOSAS.test(request.nextUrl.pathname)) {
    return new NextResponse(null, { status: 404 });
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
