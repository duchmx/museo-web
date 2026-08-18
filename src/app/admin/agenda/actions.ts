'use server';

import { revalidatePath } from 'next/cache';

/**
 * Revalida las páginas públicas que dependen de `events`, justo después de
 * guardar o eliminar un evento desde el admin.
 *
 * Server Action a propósito, y no una llamada a /api/revalidate: ese route
 * handler exige REVALIDATE_SECRET (pensado para un futuro webhook externo de
 * Supabase), pero un componente cliente no tiene forma segura de conocer ese
 * secreto. Al correr en el servidor, esta función no necesita el handshake.
 */
export async function revalidarPaginasDeEventos() {
  revalidatePath('/', 'layout');
  revalidatePath('/');
  revalidatePath('/agenda');
  revalidatePath('/evento/[slug]', 'page');
}
