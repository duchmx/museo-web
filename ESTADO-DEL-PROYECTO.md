# Estado del proyecto · Sitio web MUCY

**Última actualización:** 4 de agosto de 2026
**Estado:** en producción, en periodo de prueba por la administración del museo.

Este documento resume qué hace el sitio hoy, cómo está construido, y qué mejoras ya están identificadas para una siguiente etapa. Sirve como punto de partida para cualquier persona (o cualquier IA) que retome el proyecto más adelante.

---

## 1. Qué es esto

El sitio del Museo de la Canción Yucateca (mucy.mx), construido con Next.js 16 (App Router) y Supabase (Postgres + Storage + Auth). Resuelve tres necesidades: mostrar la agenda de conciertos (*Miércoles de Trova*) sin doble captura de datos, dar a la administración un panel para gestionarla desde el celular, y hacer que un código QR impreso pueda repuntarse sin reimprimir nada.

**Stack:**
- Next.js 16.2.4, App Router, React 19
- Supabase: base de datos, storage de imágenes (`museum-assets`), autenticación del admin
- Vercel: hosting + Analytics
- Sin frameworks de estilos: CSS Modules a mano, con variables definidas en `src/app/globals.css`

---

## 2. Cómo está organizado el código

```
src/
├── proxy.ts                    # Intercepta /qr y variantes antes del enrutado
├── lib/
│   ├── events.ts                # Módulo central del modelo de eventos (ver §4)
│   ├── redirects.ts             # Resolución del destino del QR, con fallback
│   ├── language.ts              # Detección de idioma (solo alimenta analítica hoy)
│   ├── site.ts                  # SITE_URL canónico (mucy.mx)
│   └── supabase/
│       ├── client.ts             # Cliente anon, para componentes cliente y páginas públicas
│       └── admin.ts              # Cliente con service role — SOLO usado por proxy.ts
├── components/
│   ├── HeroCarousel.tsx / HeroSlide.tsx   # El hero de portada, alimentado por eventos
│   ├── NextEvents.tsx / EventCard.tsx     # Sección "Próximos Eventos" de la portada
│   └── ShareEvento.tsx           # Botones de compartir en la página de evento
└── app/
    ├── page.tsx                  # Portada
    ├── agenda/page.tsx           # Agenda completa
    ├── evento/[slug]/page.tsx    # Página individual de cada evento (Open Graph)
    ├── not-found.tsx             # 404 con identidad del museo
    ├── admin/
    │   ├── page.tsx               # Panel de acceso (login)
    │   ├── agenda/page.tsx        # Captura y edición de eventos + vista previa
    │   └── qr/page.tsx            # Configuración del QR + contador de escaneos
    ├── exposiciones/ y talleres/  # Placeholders "Próximamente"
    └── layout.tsx                 # Metadata global, fuentes, Navigation/Footer/Analytics
```

**Migraciones de Supabase** (`supabase/migrations/`, en orden): creación de `events`/`hero_templates` (histórica), buckets de storage, tabla `redirects`+`qr_scans` para el QR, reconstrucción completa de `events` con el modelo nuevo, eliminación de `hero_templates`, permisos de tabla para los roles de la API, y slug por evento.

---

## 3. Funcionalidades actuales

### 3.1 Ruta `/qr` editable sin redeploy
Los códigos impresos apuntan a `mucy.mx/qr` (o `/QR`, `/Qr`, `/qR` — insensible a mayúsculas). Un archivo `proxy.ts` intercepta la petición antes de que llegue a cualquier página, consulta en Supabase a dónde debe ir (tabla `redirects`), y responde con una **redirección temporal (307)** — nunca permanente, porque una 301/308 se cachea en el navegador de forma indefinida y con papel ya repartido en la calle sería irreversible.

- El destino se edita desde `/admin/qr` y el cambio surte efecto de inmediato, sin volver a desplegar.
- **Si Supabase no responde a tiempo (timeout de 1.5s) o está caído, cae a la portada (`/`) en vez de dar error.** Un QR impreso nunca debe fallar.
- Cada escaneo se registra en `qr_scans` con fecha, campaña e idioma detectado del navegador — un contador propio, sin depender de cookies ni de analítica externa.
- El sistema está preparado para variantes (`/qr-hotel`, `/qr-tienda`) sin tocar código: basta insertar una fila en `redirects`.
- El proxy agrega parámetros UTM al redirigir (no van impresos en el QR, así siguen siendo editables).

### 3.2 Modelo de datos de eventos
La tabla `events` reemplazó el par ambiguo `title`/`subtitle` por un esqueleto fijo:

| Siempre presente | Opcional (colapsa sin dejar hueco si está vacío) |
|---|---|
| `ciclo` (p. ej. "Miércoles de Trova") | `destacado` (máx. ~50 car., p. ej. "Directamente desde Colombia") |
| `artista` (o "Artista por confirmar") | `invitados` (se muestra como "Trío invitado: …") |
| `event_date` (date) + `event_time` (time) | `descripcion` (solo en la página del evento) |
| `precio` (o "Costo por confirmar") | |

Tres imágenes con propósitos distintos: `imagen_thumb` (cuadrada, miniatura), `imagen_hero` (apaisada, fondo de portada), `imagen_poster` (vertical, para compartir). Más `mostrar_en_hero` (boolean) y `slug` (URL legible, ver §3.5).

**Zona horaria:** `event_date` y `event_time` son tipos *sin* zona horaria — se interpretan siempre como hora de Mérida (UTC−6 fijo, sin horario de verano). Toda la lógica de fechas vive centralizada en `src/lib/events.ts` (`instanteDe`, `hoyEnMerida`, `formatearFecha`, `formatearHora`, etc.), así que ningún componente calcula fechas por su cuenta.

### 3.3 Portada y agenda alimentadas por el mismo dato
El hero de la portada y la sección "Próximos Eventos" **leen directamente de `events`** — no hay ningún texto de portada capturado aparte. Esto elimina de raíz el problema que existía antes: editar un evento y olvidar actualizar la portada por separado.

- El carrusel del hero muestra siempre primero el evento más próximo; después, los que tengan `mostrar_en_hero` activo.
- Si no hay ningún evento futuro, se muestra una diapositiva institucional fija (logo + nombre del museo) en vez de una portada vacía.
- El carrusel automático (6s) solo corre si hay más de una diapositiva.
- En móvil el hero no ocupa el 100% de la pantalla, para que se note que hay contenido debajo.
- La card de "Próximos Eventos" es compacta a propósito (miniatura, ciclo, artista, fecha, hora, precio); toda la información completa vive en `/agenda` y en la página de cada evento.
- Un evento sin foto y sin artista confirmado se ve completo, no roto — es el caso de diseño base, no el caso raro.

### 3.4 Admin unificado
Un solo panel (`/admin/agenda`) reemplaza los dos formularios que existían antes (eventos + portada por separado):

- Formulario con todos los campos, atajos de precio ("Entrada libre" / "Por confirmar" / "$50" / "$100" / campo abierto), y las tres imágenes con su proporción indicada.
- Permite **editar** eventos existentes, no solo crear y borrar.
- **Vista previa en vivo**: mientras se captura, se ve al lado una miniatura real de cómo se va a ver en el hero y en la card de agenda, usando los mismos componentes que el sitio público (no una imitación). *Nota: la administración reportó que la miniatura de portada no se aprecia bien en la previa — queda como algo a revisar (ver §5).*
- Funciona desde el celular.
- `/admin/qr` para cambiar el destino del QR y ver el contador de escaneos del mes.

### 3.5 Página individual por evento + compartir
Cada evento tiene una URL propia y legible: `mucy.mx/evento/26-ago-artes-trio`. El slug se genera automáticamente al guardar en el admin (y se regenera si se confirma el artista después), sin que la administración tenga que pensar en URLs.

- La página muestra todo: ciclo, artista, destacado, invitados, fecha, hora, precio, descripción, póster y enlace al mapa.
- **Metadatos Open Graph por evento**, usando la **miniatura** (`imagen_thumb`) como imagen de vista previa — no el póster, porque el póster lleva texto y los clientes de mensajería lo recortan. Cada evento genera su propia tarjeta al compartirse; antes de esto no era posible porque un ancla (`#evento-id`) no se envía al servidor.
- **Compartir tiene dos botones con propósitos distintos**, pensados para la costumbre local de mandar pósteres por WhatsApp:
  - **"Compartir póster"** (solo en dispositivos que soportan compartir archivos, y solo si el evento tiene póster): descarga la imagen y abre el menú nativo del sistema, para que llegue como imagen real a la conversación.
  - **"Compartir enlace"**: en móvil abre el menú nativo con la URL; en escritorio copia el enlace al portapapeles. Este es el que arrastra la tarjeta de Open Graph.
- Un slug que ya no existe (evento borrado, o cambiado antes de que se regenerara) redirige a `/agenda` en vez de dar error.
- El texto siempre está en HTML, nunca solo en la imagen del póster — así lo puede leer un buscador o un lector de pantalla.

### 3.6 Sección "Visítanos"
Ya existía y se conservó, reubicada debajo de la agenda (menos fricción: quien solo quería la fecha ya la obtuvo arriba). Incluye horarios, tarifas, ubicación y contacto. El usuario confirmó que el contenido y el enlace de mapa ya están correctos y no requieren cambios.

### 3.7 Página 404 con identidad
Errores de dedo genuinos (`/qqr`, rutas inexistentes) muestran una página con la identidad del museo y el próximo evento, en vez del 404 genérico de Next.

### 3.8 Lo que se dejó igual, deliberadamente
- `/exposiciones` y `/talleres`: placeholders "Próximamente disponible". Informan al visitante y recuerdan a la administración lo que falta por generar.
- Header minimal: solo el logo, sin menú de navegación (no hay suficientes secciones para justificarlo).
- Sitio en español únicamente (ver §6, bilingüe).

---

## 4. Decisiones técnicas que vale la pena recordar

- **Next.js 16 renombró `middleware.ts` a `proxy.ts`.** El archivo vive en `src/proxy.ts`, exporta una función `proxy` (no `middleware`), y corre en runtime Node.js por defecto — así que puede usar `@supabase/supabase-js` directamente sin adaptaciones para Edge.
- **Permisos de Supabase:** las tablas necesitan `GRANT` explícito de SELECT/INSERT/UPDATE/DELETE para los roles `anon`/`authenticated`/`service_role`, además de las policies de RLS. Los *default privileges* del esquema `public` no lo cubren. Esto causó una falla real durante el desarrollo (el sitio se quedaba sin datos aunque la tabla los tuviera) y quedó corregido en la migración `20260803030000_grant_table_privileges.sql`. **Si se crea una tabla nueva en el futuro, hay que repetir este paso.**
- **La service role key de Supabase solo se usa en `src/lib/supabase/admin.ts`**, importado únicamente desde `proxy.ts` (para registrar escaneos del QR). Nunca debe usarse desde un componente cliente ni llegar al bundle del navegador — quedó verificado explícitamente que no aparece en `.next/static/`.
- **`SITE_URL`** (dominio canónico para Open Graph) vive en `src/lib/site.ts`, configurable con la variable de entorno `NEXT_PUBLIC_SITE_URL`; por defecto `https://mucy.mx`.
- **Todas las fechas pasan por `src/lib/events.ts`.** Cualquier cambio a cómo se calcula "próximo evento", "evento pasado" o el formato de fecha/hora debe hacerse ahí, no en cada componente — es lo que garantiza que la zona horaria de Mérida se respete en todos lados por igual.
- **Las variables CSS `--carbon-medio` y `--crema-oscura`** se usaban en varios componentes pero nunca se habían definido en `globals.css` (quedaban en un color heredado por accidente). Se definieron explícitamente para estandarizar la paleta antes de que el sitio siga creciendo.

---

## 5. Mejoras ya identificadas (pendientes, sin programar)

Ordenadas por lo cerca que están de ser un bug vs. una mejora de fondo:

1. **Vista previa del hero en el admin no se aprecia bien en miniatura.** Reportado por la administración durante el uso; no se ha diagnosticado a fondo. Candidato a revisar primero porque afecta la herramienta de captura diaria.
2. **Revisión visual de las variables de color recién definidas** (`--carbon-medio`, `--crema-oscura`) en el sitio ya en producción con datos reales — se verificó en desarrollo pero vale la pena un vistazo con contenido real y en distintos dispositivos.
3. **Mantenimiento de la agenda es responsabilidad manual de la administración.** Se decidió explícitamente no autogenerar eventos futuros ("autollenado de miércoles") porque no se puede asumir que hay concierto todas las semanas. Si en la práctica *sí* lo hay siempre, esto podría reconsiderarse.

## 6. Expansión futura (fuera de alcance por ahora)

Estas son piezas completas del documento original de planeación que **se decidió no construir todavía**, ninguna por limitación técnica sino por alcance/costo:

- **Sitio bilingüe (ES/EN).** Next 16 no trae la config `i18n` de Pages Router — requeriría un segmento `[lang]` y mover las páginas debajo. La detección por `Accept-Language` ya está resuelta en `src/lib/language.ts` y cada escaneo del QR ya guarda el idioma detectado del dispositivo, así que en unas semanas la tabla `qr_scans` va a dar un dato real de qué proporción de visitantes tiene el teléfono en inglés — eso puede informar si vale la pena. Además, traducir bien exige textos escritos por una persona (no traducción automática), que es trabajo de contenido, no de código.
- **Exposiciones y Talleres reales** (hoy son placeholders). Se construirían con el mismo patrón que eventos si el museo decide generar ese contenido.

## 7. Configuración fuera del repositorio (recordatorio)

No se resuelve en código, pero es necesario para que todo funcione:

- **DNS (GoDaddy):** los cuatro dominios apuntando a Vercel. El dominio ápice (sin `www`) no admite CNAME.
- **Vercel:** dominios alternos configurados como 308 permanente hacia `mucy.mx` (ahí sí es correcto usar redirección permanente, porque ese destino no va a cambiar).
- **Variable `SUPABASE_SERVICE_ROLE_KEY`** debe estar configurada en Vercel (Settings → Environment Variables) para que el conteo de escaneos del QR funcione en producción.
- **Vercel Web Analytics:** el código ya lo integra (`@vercel/analytics`); activarlo en el panel de Vercel si el plan lo incluye.

---

## 8. Cómo retomar el trabajo

Si vuelves a este proyecto después de un tiempo:

1. Lee este documento primero.
2. Revisa `git log` para ver si hubo cambios posteriores a esta fecha.
3. Antes de tocar el modelo de eventos, migraciones o el proxy del QR, vuelve a leer las secciones §3.1–§3.2 y §4 — ahí están las decisiones que no son obvias solo leyendo el código (zona horaria, permisos de Supabase, por qué existe `proxy.ts` y no `middleware.ts`).
4. Las funcionalidades de la §6 (bilingüe, exposiciones/talleres reales) tienen valor pero requieren decisiones de alcance y contenido antes de ser trabajo de programación — no son un "falta implementar" técnico.
