import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <div className={styles.heroOverlay}></div>
        <div className={styles.heroContent}>
          <p className={styles.heroLabel}>Próximo Evento</p>
          <h1 className={styles.heroTitle}>Noche de Trova<br/><em>Yucateca</em></h1>
          <p className={styles.heroSub}>Jueves 24 de Octubre · 20:00 h</p>
          <div className={styles.heroDivider}></div>
          <button className={styles.heroButton}>Ver Calendario</button>
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
