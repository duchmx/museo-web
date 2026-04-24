import styles from "./page.module.css";
import { createClient } from '@supabase/supabase-js';

export const revalidate = 0;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default async function Home() {
  const { data: heroData } = await supabase
    .from('hero_templates')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  const hero = heroData || {
    title: "Noche de Trova Yucateca",
    subtitle: "Próximo Evento",
    date_text: "Jueves 24 de Octubre · 20:00 h",
    button_text: "Ver Calendario",
    button_link: "/agenda",
    background_image_url: null,
  };

  const backgroundStyle = hero.background_image_url 
    ? { backgroundImage: `linear-gradient(rgba(26, 74, 46, 0.8), rgba(26, 74, 46, 0.9)), url(${hero.background_image_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {};

  return (
    <main className={styles.main}>
      <section className={styles.hero} style={backgroundStyle}>
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroContent}>
          <p className={styles.heroLabel}>{hero.subtitle}</p>
          <h1 className={styles.heroTitle}>{hero.title}</h1>
          <p className={styles.heroSub}>{hero.date_text}</p>
          <div className={styles.heroDivider}></div>
          <a href={hero.button_link} className={styles.heroButton} style={{ textDecoration: 'none', display: 'inline-block' }}>{hero.button_text}</a>
        </div>
      </section>

      <section className={styles.intro}>
        <h2 className={styles.introTitle}>El guardián vivo de la tradición musical yucateca.</h2>
        <p className={styles.introText}>
          Somos el espacio vivo donde el patrimonio musical de Yucatán se preserva, se cuenta y se hereda — cultivando en las nuevas generaciones la pasión por la canción que define nuestra identidad colectiva.
        </p>
      </section>
    </main>
  );
}
