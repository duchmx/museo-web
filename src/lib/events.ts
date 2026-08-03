import { supabase } from './supabase/client';

/**
 * Yucatán es UTC−6 todo el año, sin horario de verano. Fijarla explícitamente
 * importa: los servidores de Vercel corren en UTC y, sin esto, el evento del
 * miércoles desaparecería a las 6 de la tarde del martes.
 */
export const ZONA_HORARIA = 'America/Merida';

export type ProximoEvento = {
  titulo: string;
  fecha: string;
  hora: string;
};

/**
 * Próximo evento futuro, ya formateado en hora de Mérida.
 *
 * El bloque 1 cambia este esquema (`title` se parte en `ciclo`/`artista`, y
 * `event_date` timestamptz se parte en `event_date` date + `event_time` time).
 * Al vivir aislado aquí, ese cambio toca un solo archivo y no cada consumidor.
 */
export async function getProximoEvento(): Promise<ProximoEvento | null> {
  const { data, error } = await supabase
    .from('events')
    .select('title, event_date')
    .gte('event_date', new Date().toISOString())
    .order('event_date', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error || !data) return null;

  const fecha = new Date(data.event_date);

  return {
    titulo: data.title,
    fecha: new Intl.DateTimeFormat('es-MX', {
      timeZone: ZONA_HORARIA,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(fecha),
    hora: new Intl.DateTimeFormat('es-MX', {
      timeZone: ZONA_HORARIA,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(fecha),
  };
}
