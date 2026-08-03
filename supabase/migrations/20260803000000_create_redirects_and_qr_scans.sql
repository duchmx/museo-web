-- Bloque 0: ruta /qr editable sin redeploy + conteo de escaneos.
--
-- El destino vive en la base de datos, no en el código, para que la administración
-- pueda repuntar el QR impreso a un evento específico en segundos desde el celular.

create table redirects (
  slug         text primary key,          -- 'qr', y a futuro 'qr-hotel', 'qr-tienda'
  destino      text not null,             -- ruta relativa ('/') o URL absoluta
  activo       boolean not null default true,
  -- Los UTM los agrega el proxy al redirigir; no van impresos en el QR,
  -- para que sigan siendo editables sin reimprimir nada.
  utm_source   text default 'qr',
  utm_medium   text default 'impreso',
  utm_campaign text default 'general',
  updated_at   timestamptz not null default now()
);

create table qr_scans (
  id         bigint generated always as identity primary key,
  slug       text not null,
  scanned_at timestamptz not null default now(),
  campaign   text,
  lang       text,   -- idioma detectado del Accept-Language (insumo del bloque 5)
  user_agent text
);

create index qr_scans_slug_scanned_at_idx on qr_scans (slug, scanned_at desc);

alter table redirects enable row level security;
alter table qr_scans  enable row level security;

create policy "Public read access for redirects"
  on redirects for select
  using (true);

create policy "Authenticated manage redirects"
  on redirects for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "Authenticated read access for qr_scans"
  on qr_scans for select
  using (auth.role() = 'authenticated');

-- qr_scans no lleva policy de INSERT a propósito: solo el proxy escribe ahí,
-- usando la service role key, que bypassea RLS. Así nadie puede inflar el contador.

-- Destino inicial: la portada. El hero muestra el próximo evento, así que el
-- turista obtiene la respuesta en el primer vistazo.
insert into redirects (slug, destino) values ('qr', '/');
