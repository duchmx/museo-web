"use client";
import { useState, useEffect } from 'react';
import styles from './HeroCarousel.module.css';

interface Hero {
  id: string;
  title: string;
  subtitle: string;
  date_text: string;
  button_text: string;
  button_link: string;
  background_image_url: string;
}

export default function HeroCarousel({ heroes }: { heroes: Hero[] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (heroes.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent(c => (c + 1) % heroes.length);
    }, 6000); // 6 seconds per slide
    return () => clearInterval(timer);
  }, [heroes.length]);

  if (!heroes || heroes.length === 0) {
    return (
      <section className={styles.hero}>
        <div className={styles.slide} style={{ opacity: 1 }}>
          <div className={styles.heroOverlay}></div>
          <div className={styles.heroContent}>
            <p className={styles.heroLabel}>Bienvenidos</p>
            <h1 className={styles.heroTitle}>Museo de la Canción Yucateca</h1>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className={styles.hero}>
      {heroes.map((hero, index) => {
        const backgroundStyle = hero.background_image_url 
          ? { backgroundImage: `linear-gradient(rgba(26, 74, 46, 0.75), rgba(26, 74, 46, 0.9)), url(${hero.background_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
          : { backgroundColor: 'var(--verde-profundo)' };

        return (
          <div 
            key={hero.id} 
            className={`${styles.slide} ${index === current ? styles.active : ''}`}
            style={backgroundStyle}
          >
            <div className={styles.heroOverlay}></div>
            <div className={styles.heroContent}>
              <p className={styles.heroLabel}>{hero.subtitle}</p>
              <h1 className={styles.heroTitle}>{hero.title}</h1>
              <p className={styles.heroSub}>{hero.date_text}</p>
              <div className={styles.heroDivider}></div>
              <a href={hero.button_link || "/agenda"} className={styles.heroButton}>{hero.button_text || "Ver Calendario"}</a>
            </div>
          </div>
        );
      })}
      
      {heroes.length > 1 && (
        <div className={styles.dots}>
          {heroes.map((_, idx) => (
            <button 
              key={idx} 
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
