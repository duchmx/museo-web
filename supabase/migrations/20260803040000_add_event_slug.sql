-- Bloque 4: URL propia por evento.
--
-- Compartir por WhatsApp con una tarjeta distinta por evento exige una URL real
-- por evento: el fragmento (/agenda#evento-...) nunca se envía al servidor, así
-- que todos los eventos habrían mostrado la misma vista previa genérica.
--
-- El slug queda NULLABLE a propósito: si alguna vez faltara, la página del
-- evento sigue resolviendo por id y el enlace no se rompe.

alter table events add column slug text;

-- Backfill de los eventos ya cargados: '26-ago-artes-trio'.
-- Se usa translate() en vez de la extensión unaccent para no depender de ella.
with generado as (
  select
    id,
    lower(
      to_char(event_date, 'FMDD') || '-' ||
      case extract(month from event_date)
        when 1 then 'ene' when 2  then 'feb' when 3  then 'mar' when 4  then 'abr'
        when 5 then 'may' when 6  then 'jun' when 7  then 'jul' when 8  then 'ago'
        when 9 then 'sep' when 10 then 'oct' when 11 then 'nov' else 'dic'
      end || '-' ||
      coalesce(nullif(trim(artista), ''), 'por confirmar')
    ) as base
  from events
),
normalizado as (
  select
    id,
    trim(both '-' from regexp_replace(
      translate(base, 'áàäâéèëêíìïîóòöôúùüûñç', 'aaaaeeeeiiiioooouuuunc'),
      '[^a-z0-9]+', '-', 'g'
    )) as slug
  from generado
),
numerado as (
  select id, slug, row_number() over (partition by slug order by id) as n
  from normalizado
)
update events e
set slug = case when n = 1 then numerado.slug else numerado.slug || '-' || n end
from numerado
where e.id = numerado.id;

-- Permite varios NULL, pero no dos slugs iguales.
create unique index events_slug_idx on events (slug);
