import styles from './page.module.css';
import Image from 'next/image';
import {
  diaDelMes,
  formatearFecha,
  formatearHora,
  formatearPrecio,
  getEventosFuturos,
  mesAbreviado,
  nombreArtista,
  textoInvitados,
} from '@/lib/events';

export const metadata = {
  title: 'Agenda de Eventos | Museo de la Canción Yucateca',
};

export const revalidate = 0; // Disable cache to ensure fresh data for now

export default async function AgendaPage() {
  const eventos = await getEventosFuturos();

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <p className={styles.label}>Calendario</p>
          <h1 className={styles.title}>Agenda de Eventos</h1>
          <div className={styles.divider}></div>
          <p className={styles.subtitle}>Descubre las próximas presentaciones, talleres y exposiciones en nuestro museo.</p>
        </div>
      </header>

      <section className={styles.agendaSection}>
        <div className={styles.eventsGrid}>
          {eventos.length === 0 ? (
            <p className={styles.emptyMsg}>No hay eventos programados por el momento.</p>
          ) : (
            eventos.map((evento) => {
              const invitados = textoInvitados(evento);

              return (
                <article
                  key={evento.id}
                  id={`evento-${evento.id}`}
                  className={`${styles.eventCard} ${evento.imagen_thumb ? styles.hasImage : ''}`}
                >
                  <div className={styles.dateBadge}>
                    <span className={styles.dateDay}>{diaDelMes(evento)}</span>
                    <span className={styles.dateMonth}>{mesAbreviado(evento)}</span>
                  </div>

                  {evento.imagen_thumb && (
                    <div className={styles.eventImageWrapper}>
                      <Image
                        src={evento.imagen_thumb}
                        alt={nombreArtista(evento)}
                        fill
                        className={styles.eventImage}
                      />
                    </div>
                  )}

                  <div className={styles.eventContent}>
                    <p className={styles.eventCiclo}>{evento.ciclo}</p>
                    <h3 className={styles.eventTitle}>{nombreArtista(evento)}</h3>

                    {/* Las ranuras opcionales se omiten enteras: sin hueco cuando faltan. */}
                    {evento.destacado && (
                      <p className={styles.eventDestacado}>{evento.destacado}</p>
                    )}
                    {invitados && <p className={styles.eventInvitados}>{invitados}</p>}

                    <p className={styles.eventWhen}>
                      {formatearFecha(evento)} · {formatearHora(evento)} h
                    </p>

                    {evento.descripcion && (
                      <p className={styles.eventDesc}>{evento.descripcion}</p>
                    )}

                    <div className={styles.eventFooter}>
                      <span className={styles.eventPrice}>{formatearPrecio(evento)}</span>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}
