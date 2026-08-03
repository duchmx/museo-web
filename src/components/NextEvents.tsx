import Image from 'next/image';
import Link from 'next/link';
import styles from './NextEvents.module.css';
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
 */
export default function NextEvents({ events }: { events: Evento[] }) {
  if (!events || events.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Próximos Eventos</h2>
        </div>

        <div className={styles.grid}>
          {events.map((ev) => (
            <Link href="/agenda" key={ev.id} className={styles.card}>
              <div className={styles.imageWrapper}>
                {ev.imagen_thumb ? (
                  <Image
                    src={ev.imagen_thumb}
                    alt={nombreArtista(ev)}
                    fill
                    className={styles.image}
                  />
                ) : (
                  <div className={styles.imagePlaceholder}>
                    <span className={styles.dateDay}>{diaDelMes(ev)}</span>
                  </div>
                )}
              </div>
              <div className={styles.content}>
                <div className={styles.headerRow}>
                  <p className={styles.date}>
                    {formatearFecha(ev, 'corto')} · {formatearHora(ev)} h
                  </p>
                  <span className={styles.priceTag}>{formatearPrecio(ev)}</span>
                </div>
                <h3 className={styles.eventTitle}>{nombreArtista(ev)}</h3>
                <p className={styles.ciclo}>{ev.ciclo}</p>
              </div>
            </Link>
          ))}
        </div>

        <div className={styles.footer}>
          <Link href="/agenda" className={styles.viewAllButton}>
            Ver Agenda Completa
          </Link>
        </div>
      </div>
    </section>
  );
}
