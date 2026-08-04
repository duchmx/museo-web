"use client";
import { useState, useEffect } from 'react';
import styles from './HeroCarousel.module.css';
import HeroSlide from './HeroSlide';
import { type Evento } from '@/lib/events';

export default function HeroCarousel({ eventos }: { eventos: Evento[] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    // El automático solo tiene sentido con más de una diapositiva.
    if (eventos.length <= 1) return;

    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % eventos.length);
    }, 6000);

    return () => clearInterval(timer);
  }, [eventos.length]);

  // Sin eventos futuros, diapositiva institucional en lugar de una portada vacía.
  if (eventos.length === 0) {
    return (
      <section className={styles.hero}>
        <div className={`${styles.slide} ${styles.active}`}>
          <HeroSlide evento={null} />
        </div>
      </section>
    );
  }

  return (
    <section className={styles.hero}>
      {eventos.map((evento, index) => (
        <div
          key={evento.id}
          className={`${styles.slide} ${index === current ? styles.active : ''}`}
        >
          <HeroSlide evento={evento} />
        </div>
      ))}

      {eventos.length > 1 && (
        <div className={styles.dots}>
          {eventos.map((evento, idx) => (
            <button
              key={evento.id}
              className={`${styles.dot} ${idx === current ? styles.dotActive : ''}`}
              onClick={() => setCurrent(idx)}
              aria-label={`Ir a diapositiva ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
