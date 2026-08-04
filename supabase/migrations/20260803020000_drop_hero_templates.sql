-- Bloque 2: el hero deja de tener datos propios.
--
-- Los textos de portada se tecleaban aparte del evento, en /admin/portada. Esa
-- doble captura era la causa raíz de la desincronización: alguien actualizaba el
-- evento y olvidaba la portada, y el sitio anunciaba una cosa arriba y otra abajo.
--
-- A partir de aquí el hero se compone desde `events`: el texto nunca se teclea
-- aparte. La flexibilidad visual que se necesitaba —imagen de fondo distinta a la
-- miniatura— la resuelven las tres imágenes que ya trae cada evento.

drop table if exists hero_templates cascade;
