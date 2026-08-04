import Link from 'next/link';
import styles from './NextEvents.module.css';
import EventCard from './EventCard';
import { type Evento } from '@/lib/events';

export default function NextEvents({ events }: { events: Evento[] }) {
  if (!events || events.length === 0) return null;

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <div className={styles.header}>
          <h2 className={styles.title}>Próximos Eventos</h2>
        </div>

        <div className={styles.grid}>
          {events.map((evento) => (
            <EventCard key={evento.id} evento={evento} />
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
