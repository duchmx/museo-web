import Image from 'next/image';
import styles from './HeroSlide.module.css';
import {
  type Evento,
  formatearFecha,
  formatearHora,
  formatearPrecio,
  nombreArtista,
  rutaEvento,
} from '@/lib/events';

/**
 * Una diapositiva del hero, compuesta automáticamente desde el evento: el texto
 * nunca se teclea aparte, así que el hero no puede desincronizarse de la agenda.
 *
 * La maqueta base es el caso pobre —sin foto y sin artista confirmado—, que con
 * programación de última hora va a ser el frecuente. La versión con retrato y
 * nombre es el caso enriquecido, no al revés.
 *
 * Toma su altura del contenedor para que la vista previa del admin pueda
 * renderizarla en miniatura sin duplicar marcado.
 */
export default function HeroSlide({
  evento,
  estatico = false,
}: {
  /** `null` muestra la diapositiva institucional. */
  evento: Evento | null;
  /** En la vista previa no debe navegar a ningún lado. */
  estatico?: boolean;
}) {
  if (!evento) {
    return (
      <div className={styles.slideInner} style={{ backgroundColor: 'var(--verde-profundo)' }}>
        <div className={styles.overlay} />
        <div className={styles.content}>
          <Image
            src="/logo.jpg"
            alt="Museo de la Canción Yucateca"
            width={120}
            height={120}
            className={styles.logo}
          />
          <h1 className={styles.titulo}>Museo de la Canción Yucateca</h1>
        </div>
      </div>
    );
  }

  const fondo = evento.imagen_hero
    ? {
        backgroundImage: `linear-gradient(rgba(26, 74, 46, 0.75), rgba(26, 74, 46, 0.9)), url(${evento.imagen_hero})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : { backgroundColor: 'var(--verde-profundo)' };

  return (
    <div className={styles.slideInner} style={fondo}>
      <div className={styles.overlay} />
      <div className={styles.content}>
        <p className={styles.ciclo}>{evento.ciclo}</p>
        <h1 className={styles.titulo}>{nombreArtista(evento)}</h1>

        {evento.destacado && <p className={styles.destacado}>{evento.destacado}</p>}

        {/* Para un turista que no conoce al artista, la fecha es el dato
            decisivo: va casi al nivel del título, no como pie de foto. */}
        <p className={styles.cuando}>
          {formatearFecha(evento)} · {formatearHora(evento)} h
        </p>

        {/* El precio es la segunda pregunta del turista. */}
        <p className={styles.precio}>{formatearPrecio(evento)}</p>

        <div className={styles.divider} />

        {estatico ? (
          <span className={styles.boton}>Ver detalles</span>
        ) : (
          <a href={rutaEvento(evento)} className={styles.boton}>
            Ver detalles
          </a>
        )}
      </div>
    </div>
  );
}
