import Link from 'next/link';

export const metadata = {
  title: 'Exposiciones | Museo de la Canción Yucateca',
};

export default function ExposicionesPage() {
  return (
    <main style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', backgroundColor: 'var(--crema-base)' }}>
      <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '3rem', color: 'var(--verde-profundo)', marginBottom: '1rem', textAlign: 'center' }}>
        Exposiciones
      </h1>
      <p style={{ fontFamily: 'var(--font-garamond)', fontSize: '1.25rem', color: 'var(--carbon-medio)', marginBottom: '2rem', textAlign: 'center' }}>
        Próximamente disponible.
      </p>
      <Link href="/" style={{ fontFamily: 'var(--font-jost)', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--verde-medio)', borderBottom: '1px solid var(--verde-medio)', paddingBottom: '4px', textDecoration: 'none' }}>
        Volver al Inicio
      </Link>
    </main>
  );
}
