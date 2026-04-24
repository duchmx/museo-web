import Image from 'next/image';
import Link from 'next/link';
import styles from './NextEvents.module.css';

interface Event {
  id: string;
  title: string;
  subtitle: string;
  event_date: string;
  image_url: string;
  price?: string;
}

export default function NextEvents({ events }: { events: Event[] }) {
  if (!events || events.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Próximos Eventos</h2>
        </div>
        
        <div className={styles.grid}>
          {events.map(ev => {
            const date = new Date(ev.event_date);
            const tzOptions = { timeZone: 'America/Merida' };
            const dateStringRaw = new Intl.DateTimeFormat('es-MX', { ...tzOptions, weekday: 'short', day: 'numeric', month: 'short' }).format(date);
            const dateString = dateStringRaw.replace(/\./g, '');
            const timeString = new Intl.DateTimeFormat('es-MX', { ...tzOptions, hour: '2-digit', minute: '2-digit', hour12: false }).format(date) + ' h';
            const day = new Intl.DateTimeFormat('es-MX', { ...tzOptions, day: 'numeric' }).format(date);
            
            return (
              <Link href="/agenda" key={ev.id} className={styles.card}>
                <div className={styles.imageWrapper}>
                  {ev.image_url ? (
                    <Image src={ev.image_url} alt={ev.title} fill className={styles.image} />
                  ) : (
                    <div className={styles.imagePlaceholder}>
                      <span className={styles.dateDay}>{day}</span>
                    </div>
                  )}
                </div>
                <div className={styles.content}>
                  <p className={styles.date}>{dateString} · {timeString}{ev.price ? ` · ${ev.price}` : ''}</p>
                  <h3 className={styles.eventTitle}>{ev.title}</h3>
                  {ev.subtitle && <p className={styles.eventSubtitle}>{ev.subtitle}</p>}
                </div>
              </Link>
            );
          })}
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
