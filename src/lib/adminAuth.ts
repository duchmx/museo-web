import { apiUrl } from './api';

const STORAGE_KEY = 'mc_admin_token';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

/**
 * true si hay un token guardado y no expiró. Solo lee el payload, sin
 * verificar la firma: es una comodidad de UI para no mandar al login a cada
 * rato. La barrera real vive en el servidor, que sí verifica la firma en
 * cada escritura (ver hostinger-api/auth.php).
 *
 * Async a propósito, aunque la lectura de localStorage es síncrona: así el
 * chequeo se resuelve en un microtask, igual que antes lo hacía el .then()
 * de supabase.auth.getSession(), y react-hooks/set-state-in-effect no se
 * queja de un setState "directo" dentro del efecto.
 */
export async function haySesion(): Promise<boolean> {
  const token = getToken();
  if (!token || !token.includes('.')) return false;

  try {
    const [payloadB64] = token.split('.');
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' && payload.exp > Date.now() / 1000;
  } catch {
    return false;
  }
}

export async function iniciarSesion(password: string): Promise<void> {
  const res = await fetch(apiUrl('login.php'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const cuerpo = await res.json().catch(() => null);
    throw new Error(cuerpo?.error ?? 'No se pudo iniciar sesión');
  }

  const { token } = await res.json();
  window.localStorage.setItem(STORAGE_KEY, token);
}

export function cerrarSesion(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

/** Cabecera lista para pegar en cualquier fetch de escritura del admin. */
export function authHeaders(): HeadersInit {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
