import { apiUrl } from './api';

/**
 * Yucatán es UTC−6 todo el año, sin horario de verano. Fijar la zona
 * explícitamente importa: los servidores de Vercel corren en UTC y, sin esto,
 * el evento del miércoles desaparecería a las 6 de la tarde del martes.
 */
export const ZONA_HORARIA = 'America/Merida';
const OFFSET_YUCATAN = '-06:00';

export const ARTISTA_POR_CONFIRMAR = 'Artista por confirmar';
export const PRECIO_POR_CONFIRMAR = 'Costo por confirmar';

export type Evento = {
  id: string;
  /** URL legible: '26-ago-artes-trio'. Puede faltar; entonces se resuelve por id. */
  slug: string | null;
  ciclo: string;
  artista: string | null;
  /** 'YYYY-MM-DD', sin zona horaria */
  event_date: string;
  /** 'HH:MM:SS', sin zona horaria */
  event_time: string;
  precio: string | null;
  destacado: string | null;
  invitados: string | null;
  descripcion: string | null;
  imagen_hero: string | null;
  imagen_thumb: string | null;
  imagen_poster: string | null;
  mostrar_en_hero: boolean;
};

/**
 * Instante real del evento.
 *
 * Adjuntar el offset es el detalle crítico de todo el modelo: `new Date('2026-08-05')`
 * se interpreta como medianoche UTC y, al formatearlo en Mérida, saldría 4 de agosto.
 */
export function instanteDe(evento: Pick<Evento, 'event_date' | 'event_time'>): Date {
  const hora = normalizarHora(evento.event_time);
  return new Date(`${evento.event_date}T${hora}${OFFSET_YUCATAN}`);
}

/** Postgres devuelve 'HH:MM:SS', pero un <input type="time"> manda 'HH:MM'. */
function normalizarHora(hora: string): string {
  const partes = hora.split(':');
  const [hh = '00', mm = '00', ss = '00'] = partes;
  return `${hh.padStart(2, '0')}:${mm}:${ss}`;
}

/** Fecha de hoy en Mérida como 'YYYY-MM-DD', para filtrar del lado de Supabase. */
export function hoyEnMerida(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: ZONA_HORARIA,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * Eventos futuros, ordenados del más próximo al más lejano.
 *
 * Se filtra por fecha en la consulta y por instante en memoria: así los eventos
 * de hoy que ya pasaron desaparecen, pero los de hoy más tarde siguen ahí.
 */
export async function getEventosFuturos(limite?: number): Promise<Evento[]> {
  let eventos: Evento[];
  try {
    const res = await fetch(apiUrl('events.php'));
    if (!res.ok) return [];
    eventos = (await res.json()) as Evento[];
  } catch {
    return [];
  }

  // El filtro por fecha lo hacía Supabase en la consulta; el API ya devuelve
  // todos los eventos ordenados por fecha, así que aquí solo queda filtrar:
  // por fecha (Supabase lo hacía en la query) y por instante (los de hoy que
  // ya pasaron desaparecen, los de más tarde no). El orden ya viene correcto.
  const hoy = hoyEnMerida();
  const ahora = Date.now();
  const futuros = eventos
    .filter((evento) => evento.event_date >= hoy)
    .filter((evento) => instanteDe(evento).getTime() >= ahora);

  return limite ? futuros.slice(0, limite) : futuros;
}

export async function getProximoEvento(): Promise<Evento | null> {
  const [proximo] = await getEventosFuturos(1);
  return proximo ?? null;
}

/**
 * Diapositivas del hero: siempre primero el evento más próximo, después los que
 * tengan `mostrar_en_hero` activo.
 *
 * El más próximo se saca antes de filtrar, así que nunca se duplica aunque
 * también venga marcado.
 */
export async function getEventosHero(): Promise<Evento[]> {
  const [proximo, ...resto] = await getEventosFuturos();
  if (!proximo) return [];

  return [proximo, ...resto.filter((evento) => evento.mostrar_en_hero)];
}

export function formatearFecha(
  evento: Pick<Evento, 'event_date' | 'event_time'>,
  estilo: 'largo' | 'corto' = 'largo'
): string {
  const opciones: Intl.DateTimeFormatOptions =
    estilo === 'largo'
      ? { weekday: 'long', day: 'numeric', month: 'long' }
      : { weekday: 'short', day: 'numeric', month: 'short' };

  return new Intl.DateTimeFormat('es-MX', { timeZone: ZONA_HORARIA, ...opciones })
    .format(instanteDe(evento))
    .replace(/\./g, '');
}

export function formatearHora(
  evento: Pick<Evento, 'event_date' | 'event_time'>
): string {
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: ZONA_HORARIA,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(instanteDe(evento));
}

/** Día del mes, para el badge y el placeholder de miniatura. */
export function diaDelMes(
  evento: Pick<Evento, 'event_date' | 'event_time'>
): string {
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: ZONA_HORARIA,
    day: 'numeric',
  }).format(instanteDe(evento));
}

/** Mes abreviado y capitalizado: 'Ago'. */
export function mesAbreviado(
  evento: Pick<Evento, 'event_date' | 'event_time'>
): string {
  const mes = new Intl.DateTimeFormat('es-MX', {
    timeZone: ZONA_HORARIA,
    month: 'short',
  })
    .format(instanteDe(evento))
    .replace('.', '');

  return mes.charAt(0).toUpperCase() + mes.slice(1);
}

export function nombreArtista(evento: Pick<Evento, 'artista'>): string {
  return evento.artista?.trim() || ARTISTA_POR_CONFIRMAR;
}

/**
 * Nunca devuelve vacío: si el precio no está confirmado, el turista necesita
 * saber que el dato existe y aún no está definido.
 */
export function formatearPrecio(evento: Pick<Evento, 'precio'>): string {
  return evento.precio?.trim() || PRECIO_POR_CONFIRMAR;
}

export function textoInvitados(evento: Pick<Evento, 'invitados'>): string | null {
  const invitados = evento.invitados?.trim();
  return invitados ? `Trío invitado: ${invitados}` : null;
}

const MESES_CORTOS = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

/**
 * Slug legible: '26-ago-artes-trio'. Sin artista confirmado: '26-ago-por-confirmar'.
 *
 * Vive aquí, y no en el admin, para que el formato tenga un solo dueño: lo
 * genera el formulario al guardar y lo consume la página del evento.
 */
export function generarSlug(
  evento: Pick<Evento, 'event_date' | 'artista'>
): string {
  const [, mes, dia] = evento.event_date.split('-');
  const mesCorto = MESES_CORTOS[Number(mes) - 1] ?? '';
  const artista = evento.artista?.trim() || 'por confirmar';

  return `${Number(dia)}-${mesCorto}-${artista}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // quita acentos: 'Trío' -> 'Trio'
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Ruta canónica del evento. Cae al id si por lo que sea no tiene slug. */
export function rutaEvento(evento: Pick<Evento, 'id' | 'slug'>): string {
  return `/evento/${evento.slug || evento.id}`;
}

const ES_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Busca por slug y, si no aparece, por id.
 *
 * El slug se regenera al guardar —para que deje de decir "por-confirmar" cuando
 * se confirma el artista—, así que un enlace compartido antes puede quedar
 * viejo. La página lo resuelve mandando a la agenda en vez de dar error.
 */
export async function getEventoPorSlug(parametro: string): Promise<Evento | null> {
  const porSlug = await fetchEvento({ slug: parametro });
  if (porSlug) return porSlug;

  if (!ES_UUID.test(parametro)) return null;

  return fetchEvento({ id: parametro });
}

async function fetchEvento(params: Record<string, string>): Promise<Evento | null> {
  try {
    const res = await fetch(apiUrl('events.php', params));
    if (!res.ok) return null;
    return (await res.json()) as Evento | null;
  } catch {
    return null;
  }
}
