"use client";

import { useState, useEffect } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";
import styles from "./page.module.css";
import Link from "next/link";

export default function AdminDashboard() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) setError(error.message);
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return <div className={styles.container}>Cargando...</div>;
  }

  if (!session) {
    return (
      <div className={styles.container}>
        <div className={styles.loginBox}>
          <h1 className={styles.title}>Acceso Administrativo</h1>
          <p className={styles.subtitle}>Museo de la Canción Yucateca</p>
          
          {error && <div className={styles.error}>{error}</div>}
          
          <form onSubmit={handleLogin} className={styles.form}>
            <div className={styles.inputGroup}>
              <label>Correo Electrónico</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className={styles.inputGroup}>
              <label>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className={styles.button} disabled={loading}>
              {loading ? "Entrando..." : "Entrar al Sistema"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.dashHeader}>
        <h1 className={styles.dashTitle}>Panel de Control</h1>
        <button onClick={handleLogout} className={styles.logoutButton}>Cerrar Sesión</button>
      </header>
      
      <p className={styles.dashIntro}>
        Cada evento se captura una sola vez. De ahí salen la portada y la agenda,
        así que no hay nada que actualizar por separado.
      </p>

      <div className={styles.bigButtonsGrid}>
        <Link href="/admin/agenda" className={styles.bigButton}>
          <span className={styles.bigButtonIcon}>📅</span>
          <h2>Administrar Eventos</h2>
          <p>Añadir, editar o eliminar eventos. Lo que captures aquí aparece en la portada y en la agenda.</p>
        </Link>

        <Link href="/admin/qr" className={styles.bigButton}>
          <span className={styles.bigButtonIcon}>📲</span>
          <h2>Código QR Impreso</h2>
          <p>Cambiar a dónde llevan los códigos impresos y ver cuántos se han escaneado.</p>
        </Link>
      </div>
    </div>
  );
}
