"use client";
import Link from 'next/link';
import Image from 'next/image';
import styles from './Navigation.module.css';

export default function Navigation() {
  return (
    <nav className={styles.nav}>
      <div className={styles.navContainer}>
        <div className={styles.logoContainer}>
          <Link href="/">
            <Image src="/logo.jpg" alt="Logo Museo" width={60} height={60} className={styles.logo} />
          </Link>
        </div>
      </div>
    </nav>
  );
}
