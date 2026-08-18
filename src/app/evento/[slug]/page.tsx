import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import styles from "./page.module.css";
import ShareEvento from "@/components/ShareEvento";
import { SITE_URL } from "@/lib/site";
import {
  formatearFecha,
  formatearHora,
  formatearPrecio,
  getEventoPorSlug,
  nombreArtista,
  rutaEvento,
  textoInvitados,
} from "@/lib/events";

// Ver la nota en src/app/page.tsx: si un evento pasa, este slug debe dejar de
// resolver como "próximo" (afecta sobre todo su Open Graph); un intervalo
// corto lo autocorrige sin depender de que alguien edite algo en el admin.
export const revalidate = 3600;

const MAPA =
  "https://maps.google.com/?q=Museo+de+la+Canción+Yucateca";

// En Next 16 los params llegan como promesa.
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const evento = await getEventoPorSlug(slug);

  if (!evento) {
    return { title: "Evento no encontrado | Museo de la Canción Yucateca" };
  }

  const titulo = `${nombreArtista(evento)} · ${evento.ciclo}`;

  // En español los días van en minúscula, pero esto abre la frase que se lee en
  // la vista previa de WhatsApp, así que se capitaliza la inicial.
  const cuando = formatearFecha(evento);
  const descripcion = `${cuando.charAt(0).toUpperCase()}${cuando.slice(1)} · ${formatearHora(
    evento
  )} h · ${formatearPrecio(evento)}. Museo de la Canción Yucateca, Mérida.`;

  // La miniatura, no el póster: el póster lleva texto y los clientes de
  // mensajería recortan la imagen de vista previa.
  const imagen = evento.imagen_thumb ?? `${SITE_URL}/logo.jpg`;

  return {
    title: `${titulo} | Museo de la Canción Yucateca`,
    description: descripcion,
    alternates: { canonical: `${SITE_URL}${rutaEvento(evento)}` },
    openGraph: {
      type: "article",
      locale: "es_MX",
      siteName: "Museo de la Canción Yucateca",
      url: `${SITE_URL}${rutaEvento(evento)}`,
      title: titulo,
      description: descripcion,
      images: [{ url: imagen, alt: titulo }],
    },
    twitter: {
      // La miniatura es cuadrada, no apaisada.
      card: "summary",
      title: titulo,
      description: descripcion,
      images: [imagen],
    },
  };
}

export default async function EventoPage({ params }: Props) {
  const { slug } = await params;
  const evento = await getEventoPorSlug(slug);

  // El slug se regenera al confirmar el artista, así que un enlace compartido
  // antes puede quedar viejo. Aterrizar en la agenda es mejor que un error.
  if (!evento) redirect("/agenda");

  const invitados = textoInvitados(evento);
  const url = `${SITE_URL}${rutaEvento(evento)}`;

  return (
    <main className={styles.main}>
      <div className={styles.contenedor}>
        <Link href="/agenda" className={styles.volver}>
          ← Volver a la agenda
        </Link>

        <div className={styles.layout}>
          {/* El póster es complemento visual. Todo lo que dice está también
              como texto: una imagen no la lee Google ni un lector de pantalla. */}
          {evento.imagen_poster && (
            <div className={styles.posterWrapper}>
              <Image
                src={evento.imagen_poster}
                alt={`Póster de ${nombreArtista(evento)}`}
                width={800}
                height={1200}
                className={styles.poster}
                priority
              />
            </div>
          )}

          <article className={styles.info}>
            <p className={styles.ciclo}>{evento.ciclo}</p>
            <h1 className={styles.titulo}>{nombreArtista(evento)}</h1>

            {evento.destacado && (
              <p className={styles.destacado}>{evento.destacado}</p>
            )}
            {invitados && <p className={styles.invitados}>{invitados}</p>}

            <dl className={styles.datos}>
              <div className={styles.dato}>
                <dt>Cuándo</dt>
                <dd className={styles.cuando}>
                  {formatearFecha(evento)} · {formatearHora(evento)} h
                </dd>
              </div>
              <div className={styles.dato}>
                <dt>Entrada al concierto</dt>
                <dd className={styles.precio}>{formatearPrecio(evento)}</dd>
              </div>
              <div className={styles.dato}>
                <dt>Dónde</dt>
                <dd>
                  <a
                    href={MAPA}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.enlace}
                  >
                    Museo de la Canción Yucateca
                    <br />
                    Calle 57 x 48, Centro, Mérida
                  </a>
                </dd>
              </div>
            </dl>

            {evento.descripcion && (
              <p className={styles.descripcion}>{evento.descripcion}</p>
            )}

            <div className={styles.compartir}>
              <p className={styles.compartirTitulo}>Compartir</p>
              <ShareEvento
                url={url}
                titulo={`${nombreArtista(evento)} · ${evento.ciclo}`}
                texto={`${formatearFecha(evento)} · ${formatearHora(evento)} h · ${formatearPrecio(
                  evento
                )} · Museo de la Canción Yucateca`}
                poster={evento.imagen_poster}
              />
            </div>
          </article>
        </div>
      </div>
    </main>
  );
}
