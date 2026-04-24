import styles from './Footer.module.css';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.column}>
          <h3 className={styles.title}>Museo de la Canción Yucateca</h3>
          <p className={styles.text}>
            Un espacio donde el pasado canta y el futuro escucha.<br/>
            El guardián vivo de la tradición musical yucateca.
          </p>
        </div>
        
        <div className={styles.column}>
          <h4 className={styles.subtitle}>Ubicación</h4>
          <p className={styles.text}>
            Calle 57 x 48, Centro, Mérida, Yucatán.<br/>
            México.
          </p>
        </div>

        <div className={styles.column}>
          <h4 className={styles.subtitle}>Contacto</h4>
          <p className={styles.text}>
            Tel: (999) 923-7224<br/>
            info@museodelacancionyucateca.com
          </p>
        </div>
      </div>
      
      <div className={styles.bottomBar}>
        <p className={styles.meta}>&copy; {new Date().getFullYear()} Museo de la Canción Yucateca, A.C. Todos los derechos reservados.</p>
        <Link href="/admin" className={styles.adminLink}>Acceso Administrativo</Link>
      </div>
    </footer>
  );
}
