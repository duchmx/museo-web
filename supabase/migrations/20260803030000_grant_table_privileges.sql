-- Permisos de tabla para los roles de la API.
--
-- Las tablas creadas por las migraciones de los bloques 0, 1 y 2 quedaron sin
-- GRANT de DML para anon, authenticated ni service_role: los default privileges
-- del esquema public solo cubren REFERENCES, TRIGGER y TRUNCATE. Con RLS activo
-- las policies eran correctas, pero PostgREST ni siquiera llegaba a evaluarlas
-- y respondía "permission denied for table events".
--
-- Síntomas que esto evita en producción:
--   · el sitio entero sin eventos, aunque la tabla tenga datos;
--   · el proxy de /qr cayendo siempre al destino de emergencia;
--   · el contador de escaneos clavado en cero.
--
-- Los GRANT abren la puerta; las policies de RLS siguen decidiendo qué filas
-- ve cada quien. Van en migración aparte para que aplique igual si las
-- anteriores ya se habían subido.

-- events: lectura pública, escritura solo autenticada (la limita la policy).
grant select on table public.events to anon, authenticated, service_role;
grant insert, update, delete on table public.events to authenticated, service_role;

-- redirects: lectura pública para resolver el QR, escritura desde el admin.
grant select on table public.redirects to anon, authenticated, service_role;
grant insert, update, delete on table public.redirects to authenticated, service_role;

-- qr_scans: solo el proxy escribe (service_role); el admin lee el contador.
grant select on table public.qr_scans to authenticated, service_role;
grant insert on table public.qr_scans to service_role;

grant usage on all sequences in schema public to anon, authenticated, service_role;
