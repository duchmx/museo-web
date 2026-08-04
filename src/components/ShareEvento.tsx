"use client";

import { useState } from "react";
import styles from "./ShareEvento.module.css";

type Props = {
  url: string;
  titulo: string;
  texto: string;
  poster: string | null;
};

/**
 * Dos acciones, porque resuelven dos hábitos distintos:
 *
 * - Compartir el póster como imagen. En México la costumbre es mandarse el
 *   cartel por WhatsApp, porque después se encuentra en las fotos del chat.
 * - Compartir el enlace, que es el que arrastra la tarjeta de Open Graph y,
 *   a diferencia de una imagen suelta, trae gente de regreso al sitio.
 */
export default function ShareEvento({ url, titulo, texto, poster }: Props) {
  const [estado, setEstado] = useState<"" | "copiado" | "error">("");
  const [compartiendo, setCompartiendo] = useState(false);

  const puedeCompartirArchivos =
    typeof navigator !== "undefined" &&
    typeof navigator.canShare === "function" &&
    typeof navigator.share === "function";

  const compartirPoster = async () => {
    if (!poster) return;
    setCompartiendo(true);
    setEstado("");

    try {
      // Descargar el póster para poder mandarlo como imagen. Si el bucket no
      // responde con CORS permisivo esto falla, y entonces se comparte el enlace.
      const respuesta = await fetch(poster);
      if (!respuesta.ok) throw new Error("No se pudo descargar el póster");

      const blob = await respuesta.blob();
      const extension = blob.type.split("/")[1]?.split("+")[0] || "jpg";
      const archivo = new File([blob], `${titulo}.${extension}`, { type: blob.type });

      if (!navigator.canShare({ files: [archivo] })) {
        throw new Error("El dispositivo no comparte archivos");
      }

      await navigator.share({ files: [archivo], title: titulo, text: texto });
    } catch (error) {
      // Cancelar el menú del sistema también lanza: no es un error que reportar.
      if ((error as Error).name !== "AbortError") await compartirEnlace();
    } finally {
      setCompartiendo(false);
    }
  };

  const compartirEnlace = async () => {
    setEstado("");

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: titulo, text: texto, url });
        return;
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
        // Sin menú del sistema se cae al portapapeles.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setEstado("copiado");
      setTimeout(() => setEstado(""), 2500);
    } catch {
      setEstado("error");
    }
  };

  return (
    <div className={styles.contenedor}>
      {poster && puedeCompartirArchivos && (
        <button
          type="button"
          onClick={compartirPoster}
          disabled={compartiendo}
          className={styles.botonPrincipal}
        >
          {compartiendo ? "Preparando…" : "Compartir póster"}
        </button>
      )}

      <button type="button" onClick={compartirEnlace} className={styles.boton}>
        Compartir enlace
      </button>

      {estado === "copiado" && (
        <span className={styles.aviso} role="status">
          Enlace copiado
        </span>
      )}
      {estado === "error" && (
        <span className={styles.avisoError} role="status">
          No se pudo copiar. El enlace es {url}
        </span>
      )}
    </div>
  );
}
