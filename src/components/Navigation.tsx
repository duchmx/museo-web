"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import styles from './Navigation.module.css';

export default function Navigation() {
  const pathname = usePathname();

  const navItems = [
    { name: 'Inicio', path: '/' },
    { name: 'Agenda', path: '/agenda' },
    { name: 'Acerca del Museo', path: '/acerca' },
    { name: 'Visítanos', path: '/visitanos' },
  ];

  return (
    <nav className={styles.nav}>
      <div className={styles.navContainer}>
        <div className={styles.logoContainer}>
          <Link href="/">
            <Image src="/logo.jpg" alt="Logo Museo" width={60} height={60} className={styles.logo} />
          </Link>
        </div>
        <div className={styles.links}>
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              href={item.path}
              className={`${styles.navLink} ${pathname === item.path ? styles.active : ''}`}
            >
              {item.name}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
