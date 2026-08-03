-- Bloque 1: modelo de datos de eventos.
--
-- Sustituye el par title/subtitle (ambiguo: nadie sabía si el título era el ciclo
-- o el artista) por un esqueleto fijo más ranuras opcionales que colapsan sin
-- dejar hueco cuando están vacías.
--
-- Se recrea la tabla en vez de convertirla: no hay datos que conservar, la
-- información se vuelve a cargar completa después del cambio.

drop table if exists events cascade;

create table events (
  id              uuid primary key default gen_random_uuid(),

  -- Esqueleto fijo: siempre presente en la interfaz
  ciclo           text not null,   -- 'Miércoles de Trova'
  artista         text,            -- nulo se muestra como "Artista por confirmar"
  -- Fecha y hora sin zona horaria, interpretadas siempre como hora de Mérida.
  -- Es seguro porque Yucatán es UTC−6 todo el año, sin horario de verano: 20:00
  -- significa las 8 de la noche en Mérida sin importar desde dónde se capture.
  event_date      date not null,
  event_time      time not null,
  precio          text,            -- texto, por casos como '2 x $100'

  -- Ranuras opcionales
  destacado       text,            -- 'Directamente desde Colombia'
  invitados       text,            -- 'Trío Nova'
  descripcion     text,

  -- Tres imágenes con propósitos distintos
  imagen_hero     text,            -- apaisada, fondo del hero
  imagen_thumb    text,            -- cuadrada, miniatura de card
  imagen_poster   text,            -- vertical, póster de redes / modal

  mostrar_en_hero boolean not null default false,
  created_at      timestamptz not null default now()
);

create index events_fecha_idx on events (event_date, event_time);

alter table events enable row level security;

create policy "Public read access for events"
  on events for select
  using (true);

-- La migración original habilitaba RLS pero solo definía SELECT, así que las
-- escrituras del admin dependían de policies agregadas a mano desde el dashboard
-- y no reflejadas en el repo. Aquí quedan explícitas.
create policy "Authenticated manage events"
  on events for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
