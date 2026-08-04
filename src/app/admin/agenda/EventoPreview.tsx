"use client";

import { useEffect, useRef, useState } from "react";
import HeroSlide from "@/components/HeroSlide";
import EventCard from "@/components/EventCard";
import { type Evento } from "@/lib/events";
import styles from "./EventoPreview.module.css";

/**
 * El hero se maqueta a este tamaño y se reduce con transform, en vez de
 * renderizarse chiquito: así la miniatura es una reducción fiel y no un layout
 * distinto que mienta sobre cómo va a verse publicado.
 */
const ANCHO_BASE = 1200;
const ALTO_BASE = 580;

export default function EventoPreview({
  evento,
  saleEnHero,
}: {
  evento: Evento;
  saleEnHero: boolean;
}) {
  const contenedor = useRef<HTMLDivElement>(null);
  const [escala, setEscala] = useState(0);

  useEffect(() => {
    const nodo = contenedor.current;
    if (!nodo) return;

    const observer = new ResizeObserver(([entrada]) => {
      setEscala(entrada.contentRect.width / ANCHO_BASE);
    });
    observer.observe(nodo);

    return () => observer.disconnect();
  }, []);

  return (
    <div className={styles.panel}>
      <h2 className={styles.titulo}>Vista previa</h2>
      <p className={styles.ayuda}>Así se va a ver antes de guardar.</p>

      <div className={styles.bloque}>
        <p className={styles.etiqueta}>En la portada</p>
        {saleEnHero ? (
          <div
            ref={contenedor}
            className={styles.marcoHero}
            style={{ height: escala ? ALTO_BASE * escala : undefined }}
          >
            <div
              className={styles.lienzoHero}
              style={{
                width: ANCHO_BASE,
                height: ALTO_BASE,
                transform: `scale(${escala})`,
                visibility: escala ? "visible" : "hidden",
              }}
            >
              <HeroSlide evento={evento} estatico />
            </div>
          </div>
        ) : (
          <p className={styles.noSale}>
            Este evento no va a salir en la portada. Sale el más próximo, y los
            que tengan activado <strong>Mostrar en la portada</strong>.
          </p>
        )}
      </div>

      <div className={styles.bloque}>
        <p className={styles.etiqueta}>En la agenda</p>
        <div className={styles.marcoCard}>
          <EventCard evento={evento} estatico />
        </div>
      </div>
    </div>
  );
}
