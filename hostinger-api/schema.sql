-- Esquema MySQL equivalente al Postgres de Supabase (events, redirects, qr_scans).
--
-- Diferencias deliberadas respecto al original:
--   · IDs como CHAR(36) rellenados por PHP (no DEFAULT (UUID()) de MySQL), para no
--     depender de que Hostinger tenga MySQL 8.0.13+ con expression defaults.
--   · TIMESTAMPTZ -> DATETIME. MySQL's TIMESTAMP auto-convierte con el time_zone de
--     la sesión, algo que no controlamos en hosting compartido; DATETIME guarda el
--     valor tal cual, y el código en PHP siempre escribe/lee en UTC explícito.
--   · No hay Row Level Security: toda la autorización vive en el código PHP
--     (ver auth.php). Cada endpoint decide qué puede hacer quién.
--
-- Ejecutar una sola vez, vía phpMyAdmin o `mysql < schema.sql` por SSH.

SET NAMES utf8mb4;

CREATE TABLE events (
  id              CHAR(36)     NOT NULL PRIMARY KEY,
  slug            VARCHAR(255)     NULL,
  ciclo           VARCHAR(255) NOT NULL,
  artista         VARCHAR(255)     NULL,
  event_date      DATE         NOT NULL,
  event_time      TIME         NOT NULL,
  precio          VARCHAR(255)     NULL,
  destacado       VARCHAR(255)     NULL,
  invitados       VARCHAR(255)     NULL,
  descripcion     TEXT             NULL,
  imagen_hero     VARCHAR(500)     NULL,
  imagen_thumb    VARCHAR(500)     NULL,
  imagen_poster   VARCHAR(500)     NULL,
  mostrar_en_hero TINYINT(1)   NOT NULL DEFAULT 0,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY events_slug_idx (slug),
  KEY events_fecha_idx (event_date, event_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE redirects (
  slug         VARCHAR(255) NOT NULL PRIMARY KEY,
  destino      VARCHAR(500) NOT NULL,
  activo       TINYINT(1)   NOT NULL DEFAULT 1,
  utm_source   VARCHAR(255)     NULL DEFAULT 'qr',
  utm_medium   VARCHAR(255)     NULL DEFAULT 'impreso',
  utm_campaign VARCHAR(255)     NULL DEFAULT 'general',
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE qr_scans (
  id         BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  slug       VARCHAR(255) NOT NULL,
  scanned_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  campaign   VARCHAR(255)     NULL,
  lang       VARCHAR(10)      NULL,
  user_agent VARCHAR(500)     NULL,
  KEY qr_scans_slug_scanned_at_idx (slug, scanned_at DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- Datos reales, exportados de Supabase (museo-web / ernhqsrqazewubupaiex) el
-- 2026-09-15. imagen_* todavía apuntan a Supabase Storage: se reescriben a la
-- URL de Hostinger en el Phase 3 (migración de imágenes), antes del cutover.
-- qr_scans NO se migra aquí: son 35 filas de bajo valor (solo alimentan el
-- contador mensual del admin); si se quiere conservar el conteo del mes en
-- curso, expórtalas por separado justo antes del cutover.
-- ---------------------------------------------------------------------------

INSERT INTO events
  (id, slug, ciclo, artista, event_date, event_time, precio, destacado, invitados, descripcion, imagen_hero, imagen_thumb, imagen_poster, mostrar_en_hero, created_at)
VALUES
  ('8d1eba0b-266b-4c38-bcc6-560114fb6240', '5-ago-trio-andante', 'Miércoles de Trova', 'Trío Andante', '2026-08-05', '20:00:00', '$100', NULL, NULL,
   'Disfruta una velada con lo mejor de nuestra música.',
   'https://ernhqsrqazewubupaiex.supabase.co/storage/v1/object/public/museum-assets/evento/db8b1999-bbb6-4983-8185-b87cbbad5189-imagen_hero.jpg',
   'https://ernhqsrqazewubupaiex.supabase.co/storage/v1/object/public/museum-assets/evento/97d8f506-fa72-4e62-a272-8dfdbe010d96-imagen_thumb.jpg',
   'https://ernhqsrqazewubupaiex.supabase.co/storage/v1/object/public/museum-assets/evento/430ccece-4f29-4915-90fe-4a91baefdfd2-imagen_poster.jpg',
   1, '2026-08-04 00:38:38'),

  ('00595ca3-77a0-4f18-88dd-bb722e10b6a6', '19-ago-mari-carmen-perez', 'Miércoles de Trova', 'Mari Carmen Pérez', '2026-08-19', '20:00:00', '$100', 'y reconocidos intérpretes', NULL,
   'Grandes voces, una misma tradición. Vive una noche de trova yucateca con Maricarmen Pérez y otros reconocidos intérpretes.',
   'https://ernhqsrqazewubupaiex.supabase.co/storage/v1/object/public/museum-assets/evento/f9c23b6c-1207-4f25-8ac7-0ea6ce3c4e41-imagen_hero.jpg',
   'https://ernhqsrqazewubupaiex.supabase.co/storage/v1/object/public/museum-assets/evento/7ce8a0d2-d1e8-48f5-9025-f96679232ea7-imagen_thumb.jpeg',
   'https://ernhqsrqazewubupaiex.supabase.co/storage/v1/object/public/museum-assets/evento/7f0c0f6a-5403-433b-93a9-32976ad61338-imagen_poster.jpeg',
   1, '2026-08-18 03:38:38'),

  ('d8312ccb-72bd-4aac-92f3-fa02cce958e8', '26-ago-artes-trio', 'Miércoles de Trova', 'Artes Trío', '2026-08-26', '20:00:00', '$200', 'Directamente desde Colombia', NULL,
   'Una velada imperdible para los amantes de la música clásica y para quienes desean descubrir el poder expresivo de la música de cámara.',
   'https://ernhqsrqazewubupaiex.supabase.co/storage/v1/object/public/museum-assets/evento/23fab7b4-1205-4ee1-b407-957f335b6304-imagen_hero.jpg',
   'https://ernhqsrqazewubupaiex.supabase.co/storage/v1/object/public/museum-assets/evento/76c6bcb8-bbd4-4665-8e3b-f7b55607c6eb-imagen_thumb.jpg',
   'https://ernhqsrqazewubupaiex.supabase.co/storage/v1/object/public/museum-assets/evento/3ec1670d-d005-4bfa-82d4-124b51d70b7d-imagen_poster.jpg',
   1, '2026-08-21 05:12:20'),

  ('c9ab9915-61d9-47f2-9e67-f74ccd6cdba2', '9-sep-trio-armonico', 'Miércoles de Trova', 'Trío Armónico', '2026-09-09', '20:00:00', '$100', NULL, NULL,
   'Disfruta una noche de música y bohemia en el MuCY con el Trío Armónico.',
   NULL,
   'https://ernhqsrqazewubupaiex.supabase.co/storage/v1/object/public/museum-assets/evento/3a000b0e-ec0a-4ff1-80b5-f2cc19deb495-imagen_thumb.jpeg',
   'https://ernhqsrqazewubupaiex.supabase.co/storage/v1/object/public/museum-assets/evento/2ef12b51-d756-4e9b-8b3b-8c79c375b492-imagen_poster.jpeg',
   1, '2026-09-03 23:04:48');

INSERT INTO redirects (slug, destino, activo, utm_source, utm_medium, utm_campaign, updated_at)
VALUES ('qr', '/', 1, 'qr', 'impreso', 'general', '2026-08-03 18:45:46');
