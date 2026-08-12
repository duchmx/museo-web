import { revalidatePath } from 'next/cache';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Route handler de revalidación bajo demanda.
 *
 * Permite purgar la caché de Vercel cuando se inserta, actualiza o elimina un evento.
 * Puede ser llamado desde el panel de admin o mediante un Webhook de Supabase.
 */
export async function POST(request: NextRequest) {
  const secret =
    request.nextUrl.searchParams.get('secret') ||
    request.headers.get('x-revalidate-secret');

  const expectedSecret = process.env.REVALIDATE_SECRET;

  if (expectedSecret && secret !== expectedSecret) {
    return NextResponse.json({ message: 'Token de revalidación inválido' }, { status: 401 });
  }

  try {
    // Revalida el diseño principal y todas las páginas dependientes de eventos
    revalidatePath('/', 'layout');
    revalidatePath('/');
    revalidatePath('/agenda');
    revalidatePath('/evento/[slug]', 'page');

    return NextResponse.json({ revalidated: true, now: Date.now() });
  } catch (error) {
    return NextResponse.json(
      { message: 'Error al revalidar', error: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
