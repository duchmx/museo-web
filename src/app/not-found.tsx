import Link from 'next/link';
import Image from 'next/image';
import styles from './not-found.module.css';
import { getProximoEvento } from '@/lib/events';

// El proxy rescata /QR y sus variantes, pero no los errores de dedo genuinos
// (/qqr). Esta página los recibe con la identidad del museo en vez del 404 pelón
// de Next. force-dynamic para que el próximo evento sea el de hoy y no el del build.
export const dynamic = 'force-dynamic';

export default async function NotFound() {
  const proximoEvento = await getProximoEvento().catch(() => null);

  return (
    <main className={styles.main}>
      <div className={styles.container}>
        <Image
          src="/logo.jpg"
          alt="Museo de la Canción Yucateca"
          width={90}
          height={90}
          className={styles.logo}
        />

        <p className={styles.eyebrow}>Museo de la Canción Yucateca</p>
        <h1 className={styles.title}>No encontramos esta página</h1>
        <p className={styles.text}>
          La dirección que buscas no existe o cambió de lugar. Desde el inicio
          puedes ver la programación completa.
        </p>

        {proximoEvento && (
          <div className={styles.eventCard}>
            <p className={styles.eventLabel}>Próximo evento</p>
            <p className={styles.eventTitle}>{proximoEvento.titulo}</p>
            <p className={styles.eventDate}>
              {proximoEvento.fecha} · {proximoEvento.hora} hrs.
            </p>
          </div>
        )}

        <Link href="/" className={styles.button}>
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
