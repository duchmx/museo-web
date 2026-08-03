export type Idioma = 'es' | 'en';

/**
 * Español si el navegador pide español; inglés para todo lo demás.
 *
 * Se lee Accept-Language, que refleja la configuración del dispositivo y no su
 * ubicación — es lo correcto aquí, porque prácticamente todos los visitantes
 * van a estar físicamente en Yucatán.
 *
 * Por ahora solo alimenta la columna `lang` de qr_scans. El bloque 5 lo reutiliza
 * para el ruteo bilingüe.
 */
export function detectLanguage(acceptLanguage: string | null): Idioma {
  if (!acceptLanguage) return 'en';

  const preferencias = acceptLanguage
    .split(',')
    .map((parte) => {
      const [etiqueta, ...params] = parte.trim().split(';');
      const q = params
        .map((p) => p.trim())
        .find((p) => p.startsWith('q='))
        ?.slice(2);
      return { etiqueta: etiqueta.toLowerCase(), q: q ? Number(q) : 1 };
    })
    .filter(({ etiqueta, q }) => etiqueta && !Number.isNaN(q) && q > 0)
    .sort((a, b) => b.q - a.q);

  const preferida = preferencias[0];
  if (!preferida) return 'en';

  return preferida.etiqueta === 'es' || preferida.etiqueta.startsWith('es-')
    ? 'es'
    : 'en';
}
