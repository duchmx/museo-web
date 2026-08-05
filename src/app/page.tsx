import styles from "./page.module.css";
import Image from "next/image";
import HeroCarousel from "@/components/HeroCarousel";
import NextEvents from "@/components/NextEvents";
import { getEventosFuturos, getEventosHero } from "@/lib/events";

export const revalidate = 0;

export default async function Home() {
  // El hero se compone desde los mismos eventos que la agenda: no hay textos de
  // portada que puedan quedarse desfasados.
  const [eventosHero, events] = await Promise.all([
    getEventosHero(),
    getEventosFuturos(6),
  ]);

  return (
    <main className={styles.main}>
      <HeroCarousel eventos={eventosHero} />

      <NextEvents events={events} />

      <section className={styles.quoteBuffer}>
        <div className={styles.quoteContainer}>
          <h2 className={styles.quote}>&ldquo;Un espacio donde el pasado canta y el futuro escucha&rdquo;</h2>
          <div className={styles.quoteDivider}></div>
        </div>
      </section>

      <section className={styles.aboutSection}>
        <div className={styles.aboutContainer}>
          <div className={styles.aboutContent}>
            <h2 className={styles.sectionTitle}>Acerca del Museo</h2>
            <p className={styles.sectionText}>
              Fundado con la misión de preservar y difundir el invaluable patrimonio musical de Yucatán, el Museo de la Canción Yucateca es mucho más que un recinto de exhibición: es un guardián vivo de nuestra identidad.
            </p>
            <p className={styles.sectionText}>
              A través de nuestras exposiciones, rendimos homenaje a los poetas, compositores e intérpretes que han dado forma a la trova yucateca, compartiendo su legado con las nuevas generaciones y el mundo.
            </p>
          </div>
          <div className={styles.aboutImageWrapper}>
            <Image src="/corredor.jpg" alt="Interiores del Museo" fill style={{ objectFit: 'cover' }} />
          </div>
        </div>
      </section>

      <section className={styles.contactSection}>
        <div className={styles.contactContainer}>
          <div className={styles.contactHeader}>
            <h2 className={styles.sectionTitle}>Visítanos</h2>
            <p className={styles.sectionSubtitle}>Planifica tu visita y descubre la magia de nuestra música.</p>
          </div>

          <div className={styles.contactGrid}>
            <div className={styles.contactCard}>
              <h3>Horarios</h3>
              <ul>
                <li><strong>Martes a Viernes:</strong> 9:00 a 17:00 hrs.</li>
                <li><strong>Sábados:</strong> 9:00 a 15:00 hrs.</li>
                <li><strong>Domingos y Lunes:</strong> Cerrado</li>
              </ul>
            </div>

            <div className={styles.contactCard}>
              <h3>Tarifas</h3>
              <ul>
                <li><strong>Entrada General:</strong> $50 MXN</li>
                <li><strong>Estudiantes e INAPAM:</strong> $25 MXN</li>
              </ul>
            </div>

            <div className={styles.contactCard}>
              <h3>Ubicación y Contacto</h3>
              <p>
                <a href="https://maps.google.com/?q=Museo+de+la+Canción+Yucateca" target="_blank" rel="noopener noreferrer" className={styles.contactLink}>
                  Calle 57 x 48, Centro Histórico.<br />Mérida, Yucatán, México.
                </a>
              </p>
              <p style={{ marginTop: '1rem' }}>
                <strong>Teléfono:</strong>{' '}
                <a href="tel:+529999237224" className={styles.contactLink}>
                  +52 (999) 923-7224
                </a>
                <br />
                <strong>Email:</strong>{' '}
                <a href="mailto:info@mucy.mx" className={styles.contactLink}>
                  info@mucy.mx
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
