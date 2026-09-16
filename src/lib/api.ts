const BASE_URL = process.env.NEXT_PUBLIC_HOSTINGER_API_URL;

/**
 * URL sin secretos (por eso lleva el prefijo NEXT_PUBLIC_): el panel /admin
 * corre en el navegador y llama a este API directamente, igual que antes
 * llamaba a Supabase con la anon key. Lo que protege las escrituras es el
 * token de sesión (ver adminAuth.ts), no que la URL sea privada.
 */
export function apiUrl(path: string, params?: Record<string, string>): string {
  if (!BASE_URL) {
    throw new Error('Falta NEXT_PUBLIC_HOSTINGER_API_URL en el entorno.');
  }

  const url = new URL(`${BASE_URL}/${path}`);
  if (params) {
    for (const [clave, valor] of Object.entries(params)) {
      url.searchParams.set(clave, valor);
    }
  }
  return url.toString();
}
