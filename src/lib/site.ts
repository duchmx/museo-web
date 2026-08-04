/**
 * Dominio canónico del sitio.
 *
 * Open Graph exige URLs absolutas: si esto no es correcto, la vista previa al
 * compartir apunta a otro lado o no carga la imagen. `mucy.mx` es el dominio al
 * que apuntan los QR impresos y al que redirigen los demás.
 */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'https://mucy.mx';
