import styles from './page.module.css';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';

export const metadata = {
  title: 'Agenda de Eventos | Museo de la Canción Yucateca',
};

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export const revalidate = 0; // Disable cache to ensure fresh data for now

export default async function AgendaPage() {
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('event_date', { ascending: true });

  const displayEvents = events || [];

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
          {displayEvents.length === 0 ? (
            <p style={{ textAlign: 'center', fontFamily: 'var(--font-garamond)', fontSize: '1.2rem' }}>No hay eventos programados por el momento.</p>
          ) : (
            displayEvents.map(event => {
              const eventDate = new Date(event.event_date);
              const tzOptions = { timeZone: 'America/Merida' };
              const day = new Intl.DateTimeFormat('es-MX', { ...tzOptions, day: 'numeric' }).format(eventDate);
              const monthStr = new Intl.DateTimeFormat('es-MX', { ...tzOptions, month: 'short' }).format(eventDate);
              const month = monthStr.charAt(0).toUpperCase() + monthStr.slice(1).replace('.', '');
              const time = new Intl.DateTimeFormat('es-MX', { ...tzOptions, hour: '2-digit', minute: '2-digit', hour12: false }).format(eventDate) + ' h';

              return (
                <article key={event.id} className={`${styles.eventCard} ${event.image_url ? styles.hasImage : ''}`}>
                  <div className={styles.dateBadge}>
                    <span className={styles.dateDay}>{day}</span>
                    <span className={styles.dateMonth}>{month}</span>
                  </div>
                  
                  {event.image_url && (
                    <div className={styles.eventImageWrapper}>
                      <Image src={event.image_url} alt={event.title} fill className={styles.eventImage} />
                    </div>
                  )}
                  
                  <div className={styles.eventContent}>
                    <p className={styles.eventTime}>{time} · {event.subtitle || 'Evento'}</p>
                    <h3 className={styles.eventTitle}>{event.title}</h3>
                    <p className={styles.eventDesc}>{event.description}</p>
                    <div className={styles.eventFooter}>
                      <button className={styles.eventButton}>Más Detalles</button>
                      {event.price && <span className={styles.eventPrice}>{event.price}</span>}
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
