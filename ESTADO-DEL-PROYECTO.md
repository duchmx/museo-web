# Estado del proyecto · Sitio web MUCY

**Última actualización:** 16 de septiembre de 2026
**Estado:** en producción, en periodo de prueba por la administración del museo.

Este documento resume qué hace el sitio hoy, cómo está construido, y qué mejoras ya están identificadas para una siguiente etapa. Sirve como punto de partida para cualquier persona (o cualquier IA) que retome el proyecto más adelante.

---

## 1. Qué es esto

El sitio del Museo de la Canción Yucateca (mucy.mx), construido con Next.js 16 (App Router) sobre Vercel, con los datos (eventos, redirects del QR, escaneos) servidos por un API en PHP/MySQL alojado en Hostinger. Resuelve tres necesidades: mostrar la agenda de conciertos (*Miércoles de Trova*) sin doble captura de datos, dar a la administración un panel para gestionarla desde el celular, y hacer que un código QR impreso pueda repuntarse sin reimprimir nada.

**Stack:**
- Next.js 16.2.4, App Router, React 19, en Vercel
- API propio en PHP/MySQL (`hostinger-api/`), alojado en Hostinger bajo `api.mucy.mx` — base de datos, imágenes subidas por el admin, y la sesión del panel (ver §4)
- Sin frameworks de estilos: CSS Modules a mano, con variables definidas en `src/app/globals.css`

> **Septiembre 2026 — migración fuera de Supabase.** El proyecto vivía en Supabase (Postgres + Storage + Auth), pero ocupaba uno de los dos proyectos gratuitos de esa cuenta para una base de datos mínima (4 eventos, 1 redirect). Se migró a un API propio en PHP/MySQL sobre el hosting compartido de Hostinger que ya se pagaba por otro motivo. Detalles de la decisión y el diseño en §4; `supabase/migrations/` se conserva como registro histórico del esquema original.

---

## 2. Cómo está organizado el código

```
src/
├── proxy.ts                    # Intercepta /qr y variantes, y corta en seco a escáneres (ver §4)
├── lib/
│   ├── events.ts                # Módulo central del modelo de eventos (ver §4)
│   ├── redirects.ts             # Resolución del destino del QR, con fallback
│   ├── api.ts                   # URL base del API en Hostinger (apiUrl())
│   ├── adminAuth.ts             # Sesión del admin: login, token, cabeceras (ver §4)
│   ├── language.ts              # Detección de idioma (solo alimenta analítica hoy)
│   └── site.ts                  # SITE_URL canónico (mucy.mx)
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

**`hostinger-api/`** (fuera de `src/`, se despliega aparte a Hostinger — ver §4 y su propio historial de commits): `schema.sql` con el esquema MySQL, y un endpoint PHP por recurso (`events.php`, `redirects.php`, `qr-scans.php`, `login.php`, `upload.php`). `config.php` (credenciales reales) vive solo en el servidor, nunca en git.

**Migraciones de Supabase** (`supabase/migrations/`, histórico — la base de datos activa ya es la de Hostinger): creación de `events`/`hero_templates` (histórica), buckets de storage, tabla `redirects`+`qr_scans` para el QR, reconstrucción completa de `events` con el modelo nuevo, eliminación de `hero_templates`, permisos de tabla para los roles de la API, y slug por evento. `hostinger-api/schema.sql` es la traducción a MySQL del estado final de estas migraciones.

---

## 3. Funcionalidades actuales

### 3.1 Ruta `/qr` editable sin redeploy
Los códigos impresos apuntan a `mucy.mx/qr` (o `/QR`, `/Qr`, `/qR` — insensible a mayúsculas). Un archivo `proxy.ts` intercepta la petición antes de que llegue a cualquier página, consulta en el API de Hostinger a dónde debe ir (tabla `redirects`), y responde con una **redirección temporal (307)** — nunca permanente, porque una 301/308 se cachea en el navegador de forma indefinida y con papel ya repartido en la calle sería irreversible.

- El destino se edita desde `/admin/qr` y el cambio surte efecto de inmediato, sin volver a desplegar.
- **Si el API no responde a tiempo (timeout de 1.5s) o está caído, cae a la portada (`/`) en vez de dar error.** Un QR impreso nunca debe fallar.
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

- **Next.js 16 renombró `middleware.ts` a `proxy.ts`.** El archivo vive en `src/proxy.ts`, exporta una función `proxy` (no `middleware`), y corre en runtime Node.js por defecto — así que un `fetch` normal al API en Hostinger funciona sin adaptaciones para Edge.
- **Por qué se migró de Supabase a un API propio en Hostinger (septiembre 2026):** la base de datos era mínima (4 eventos, 1 redirect, un puñado de escaneos de QR) y ocupaba uno de los dos proyectos gratuitos de la cuenta de Supabase del dueño del sitio — no se justificaba seguir usando ese cupo para este tamaño de datos, cuando ya se paga hosting compartido en Hostinger que puede correr esto sin costo adicional. La app en Next.js se quedó igual en Vercel; solo cambió de dónde vienen los datos.
- **Diseño del reemplazo (`hostinger-api/`):** un endpoint PHP por recurso, sin framework ni Composer (para no depender de que el hosting compartido tenga esas herramientas), con PDO + prepared statements. No hay Row Level Security como en Postgres — **toda la autorización vive en el código PHP** (`hostinger-api/auth.php`): las lecturas de `events`/`redirects` son públicas (equivalente a la anon key de Supabase), y las escrituras exigen uno de dos secretos:
  - Un **token de sesión** del admin (HMAC firmado, sin librerías externas), emitido por `login.php` al validar la contraseña y verificado en cada escritura — reemplaza a Supabase Auth. Como es un solo usuario administrador, se optó por una contraseña compartida en vez de un sistema de usuarios.
  - Una **llave de servidor fija** (`HOSTINGER_API_KEY` en Vercel / `server_api_key` en `config.php`), que reemplaza a `SUPABASE_SERVICE_ROLE_KEY`: la usa `src/proxy.ts` para registrar escaneos de QR sin que el navegador pueda inflar el contador. Nunca lleva prefijo `NEXT_PUBLIC_`, así que Next.js se niega a exponerla al navegador.
- **`config.php` (credenciales reales de la base de datos y los dos secretos anteriores) vive solo en el servidor de Hostinger**, nunca en git — está en `hostinger-api/.gitignore`. Un redeploy de Git en Hostinger sincroniza el código pero no debería tocar `config.php` ni `hostinger-api/uploads/`, por estar fuera del repositorio; si algún día un redeploy los borra, hay que crearlos de nuevo a mano (ver `hostinger-api/config.example.php`).
- **`NEXT_PUBLIC_HOSTINGER_API_URL`** (la URL base del API, hoy `https://api.mucy.mx/hostinger-api` — el sufijo `/hostinger-api` quedó así porque el subdominio se apuntó a la raíz de `public_html` en vez de a esa subcarpeta específica; funciona igual, solo hay que recordar incluirlo) se usa tanto desde el servidor (`src/lib/events.ts`, `redirects.ts`, `proxy.ts`) como desde el navegador (los tres formularios de `/admin`), así que **sí** lleva el prefijo `NEXT_PUBLIC_` — no es un secreto, es solo la dirección del API.
- **PDO puede devolver columnas `TINYINT(1)` como el string `"0"`**, y `"0"` es *truthy* en JavaScript. `events.php` y `redirects.php` castean explícitamente `mostrar_en_hero` y `activo` a booleano antes de responder — sin ese cast, un evento con `mostrar_en_hero = false` o un QR desactivado se habrían visto como activos en Next.js.
- **`proxy.ts` también bloquea escáneres de vulnerabilidades** (rutas tipo `/info/1234567.phtml`, que no existen en el sitio) con un 404 inmediato, antes de que lleguen al render completo de la página 404. El matcher que hace esto está acotado a esas extensiones a propósito — Proxy corre en Node.js *antes* del caché de Vercel, así que ampliarlo a todas las rutas movería tráfico que hoy sirve gratis el CDN (como "/") a través de una función.
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

- **DNS (Cloudflare):** los dominios apuntando a Vercel, más un registro A para el subdominio `api.mucy.mx` apuntando directo a la IP del hosting de Hostinger (sin proxy de Cloudflare — "DNS only" — para que Hostinger pueda emitir su propio certificado SSL vía Let's Encrypt). El dominio ápice (sin `www`) no admite CNAME.
- **Vercel:** dominios alternos configurados como 308 permanente hacia `mucy.mx` (ahí sí es correcto usar redirección permanente, porque ese destino no va a cambiar).
- **Variables `NEXT_PUBLIC_HOSTINGER_API_URL` y `HOSTINGER_API_KEY`** deben estar configuradas en Vercel (Settings → Environment Variables) para que el sitio y el conteo de escaneos del QR funcionen en producción. `HOSTINGER_API_KEY` debe ser idéntica a `server_api_key` en `hostinger-api/config.php`.
- **Hostinger:** hosting compartido, PHP 8.3+, base de datos MySQL, subdominio `api.mucy.mx` con document root en `public_html` (el API queda entonces en `public_html/hostinger-api/`). El código de `hostinger-api/` se despliega ahí vía Git deploy (hPanel → Advanced → Git) apuntando al mismo repositorio de GitHub; `config.php` y `hostinger-api/uploads/` se crean a mano en el servidor y quedan fuera de ese deploy (están en `.gitignore`).
- **Vercel Web Analytics:** el código ya lo integra (`@vercel/analytics`); activarlo en el panel de Vercel si el plan lo incluye.

---

## 8. Cómo retomar el trabajo

Si vuelves a este proyecto después de un tiempo:

1. Lee este documento primero.
2. Revisa `git log` para ver si hubo cambios posteriores a esta fecha.
3. Antes de tocar el modelo de eventos, el esquema de `hostinger-api/`, o el proxy del QR, vuelve a leer las secciones §3.1–§3.2 y §4 — ahí están las decisiones que no son obvias solo leyendo el código (zona horaria, por qué el API vive en PHP sobre Hostinger y no en Supabase, cómo funciona la autorización sin RLS, por qué existe `proxy.ts` y no `middleware.ts`).
4. Las funcionalidades de la §6 (bilingüe, exposiciones/talleres reales) tienen valor pero requieren decisiones de alcance y contenido antes de ser trabajo de programación — no son un "falta implementar" técnico.
