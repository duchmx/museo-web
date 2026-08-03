"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import styles from "./page.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";

const SLUG = "qr";

const ATAJOS = [
  { etiqueta: "Portada", destino: "/" },
  { etiqueta: "Agenda", destino: "/agenda" },
];

/**
 * Inicio del mes en curso, en hora de Mérida — no en la zona del navegador ni
 * en UTC. Yucatán es UTC−6 todo el año, sin horario de verano.
 */
function inicioDeMesMerida() {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Merida",
    year: "numeric",
    month: "2-digit",
  }).formatToParts(new Date());

  const anio = partes.find((p) => p.type === "year")!.value;
  const mes = partes.find((p) => p.type === "month")!.value;

  return `${anio}-${mes}-01T00:00:00-06:00`;
}

export default function AdminQR() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const [destino, setDestino] = useState("");
  const [activo, setActivo] = useState(true);
  const [escaneos, setEscaneos] = useState<number | null>(null);

  const cargarDatos = useCallback(async () => {
    setCargando(true);

    const { data, error: errorRedirect } = await supabase
      .from("redirects")
      .select("destino, activo")
      .eq("slug", SLUG)
      .maybeSingle();

    if (errorRedirect) {
      setError("No se pudo leer la configuración: " + errorRedirect.message);
    } else if (data) {
      setDestino(data.destino ?? "");
      setActivo(data.activo ?? true);
    }

    const { count } = await supabase
      .from("qr_scans")
      .select("*", { count: "exact", head: true })
      .eq("slug", SLUG)
      .gte("scanned_at", inicioDeMesMerida());

    setEscaneos(count ?? 0);
    setCargando(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/admin");
      } else {
        cargarDatos();
      }
    });
  }, [router, cargarDatos]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setMensaje("");
    setError("");

    const { error: errorGuardar } = await supabase
      .from("redirects")
      .update({ destino: destino.trim(), activo, updated_at: new Date().toISOString() })
      .eq("slug", SLUG);

    if (errorGuardar) {
      setError("Error al guardar: " + errorGuardar.message);
    } else {
      setMensaje("Guardado. El cambio ya está activo.");
    }

    setGuardando(false);
  };

  if (cargando) return <div className={styles.container}>Cargando...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <Link href="/admin" className={styles.backLink}>← Volver al Panel</Link>
          <h1 className={styles.title}>Código QR Impreso</h1>
        </div>
      </header>

      <div className={styles.layout}>
        <div className={styles.card}>
          <h2>¿A dónde lleva el QR?</h2>
          <p className={styles.help}>
            Los códigos impresos apuntan a <strong>mucy.mx/qr</strong>. Aquí cambias
            a dónde llegan los visitantes al escanearlos. El cambio surte efecto
            de inmediato: no hay que reimprimir nada ni esperar a que el sitio se
            vuelva a publicar.
          </p>

          {mensaje && <div className={styles.success}>{mensaje}</div>}
          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label>Destino</label>
              <input
                required
                type="text"
                value={destino}
                onChange={(e) => setDestino(e.target.value)}
                placeholder="/"
              />
              <div className={styles.atajos}>
                {ATAJOS.map((atajo) => (
                  <button
                    key={atajo.destino}
                    type="button"
                    className={styles.atajo}
                    onClick={() => setDestino(atajo.destino)}
                  >
                    {atajo.etiqueta}
                  </button>
                ))}
              </div>
              <p className={styles.hint}>
                Una ruta del sitio, como <code>/</code> o <code>/agenda</code>.
              </p>
            </div>

            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
              />
              <span>
                QR activo
                <em>Si lo desactivas, los escaneos van a la portada.</em>
              </span>
            </label>

            <button type="submit" disabled={guardando} className={styles.submitButton}>
              {guardando ? "Guardando..." : "Guardar"}
            </button>
          </form>
        </div>

        <div className={styles.card}>
          <h2>Escaneos</h2>
          <p className={styles.contador}>{escaneos ?? 0}</p>
          <p className={styles.contadorLabel}>este mes</p>
          <p className={styles.help}>
            Se cuenta cada vez que alguien escanea un código impreso. El conteo es
            propio del museo: no depende de cookies ni de servicios externos.
          </p>
        </div>
      </div>
    </div>
  );
}
