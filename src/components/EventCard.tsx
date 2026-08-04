import Image from 'next/image';
import Link from 'next/link';
import styles from './EventCard.module.css';
import {
  type Evento,
  diaDelMes,
  formatearFecha,
  formatearHora,
  formatearPrecio,
  nombreArtista,
} from '@/lib/events';

/**
 * Card compacta. Solo miniatura, ciclo, artista, fecha, hora y precio: nada más.
 * `destacado`, `invitados` y `descripcion` viven en /agenda — si entraran aquí,
 * unas cards quedarían más altas que otras y la cuadrícula se vería rota.
 *
 * La usan la portada y la vista previa del admin, para que lo que se ve al
 * capturar sea exactamente lo que se va a publicar.
 */
export default function EventCard({
  evento,
  estatico = false,
}: {
  evento: Evento;
  /** En la vista previa no debe navegar a ningún lado. */
  estatico?: boolean;
}) {
  const contenido = (
    <>
      <span className={styles.priceTag}>{formatearPrecio(evento)}</span>
      <div className={styles.imageWrapper}>
        {evento.imagen_thumb ? (
          <Image
            src={evento.imagen_thumb}
            alt={nombreArtista(evento)}
            fill
            className={styles.image}
            unoptimized={estatico}
          />
        ) : (
          <div className={styles.imagePlaceholder}>
            <span className={styles.dateDay}>{diaDelMes(evento)}</span>
          </div>
        )}
      </div>
      <div className={styles.content}>
        <div className={styles.headerRow}>
          <p className={styles.date}>
            {formatearFecha(evento, 'corto')} · {formatearHora(evento)} h
          </p>
        </div>
        <h3 className={styles.eventTitle}>{nombreArtista(evento)}</h3>
        <p className={styles.ciclo}>{evento.ciclo}</p>
      </div>
    </>
  );

  if (estatico) {
    return <div className={styles.card}>{contenido}</div>;
  }

  return (
    <Link href={`/agenda#evento-${evento.id}`} className={styles.card}>
      {contenido}
    </Link>
  );
}
