"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import styles from "../agenda/page.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminPortada() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [dateText, setDateText] = useState("");
  const [buttonText, setButtonText] = useState("Ver Calendario");
  const [buttonLink, setButtonLink] = useState("/agenda");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/admin");
      } else {
        setSession(session);
        fetchHero();
      }
    });
  }, [router]);

  async function fetchHero() {
    setLoading(true);
    const { data } = await supabase
      .from("hero_templates")
      .select("*")
      .eq("is_active", true)
      .limit(1)
      .single();
    
    if (data) {
      setTitle(data.title);
      setSubtitle(data.subtitle || "");
      setDateText(data.date_text || "");
      setButtonText(data.button_text || "Ver Calendario");
      setButtonLink(data.button_link || "/agenda");
    }
    setLoading(false);
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let imageUrl = null;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `hero_${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('museum-assets')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('museum-assets')
          .getPublicUrl(filePath);
        
        imageUrl = publicUrlData.publicUrl;
      } else {
        // Fetch current active image to reuse if not changed
        const { data: current } = await supabase
          .from("hero_templates")
          .select("background_image_url")
          .eq("is_active", true)
          .limit(1)
          .single();
        if (current) imageUrl = current.background_image_url;
      }

      // First, set all other heroes to inactive
      await supabase.from("hero_templates").update({ is_active: false }).neq("id", "00000000-0000-0000-0000-000000000000");

      // Insert the new active hero
      const { error } = await supabase.from("hero_templates").insert([
        {
          title,
          subtitle,
          date_text: dateText,
          button_text: buttonText,
          button_link: buttonLink,
          background_image_url: imageUrl,
          is_active: true
        }
      ]);

      if (error) throw error;

      alert("Portada actualizada exitosamente!");
      fetchHero();
    } catch (error: any) {
      alert("Error al guardar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading && !session) return <div className={styles.container}>Cargando...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <Link href="/admin" className={styles.backLink}>← Volver al Panel</Link>
          <h1 className={styles.title}>Administrar Portada</h1>
        </div>
      </header>

      <div className={styles.layout}>
        <div className={styles.formSection} style={{ gridColumn: '1 / -1' }}>
          <div className={styles.card}>
            <h2>Actualizar Portada Principal</h2>
            <p style={{ marginBottom: '2rem', fontFamily: 'var(--font-garamond)', fontSize: '1.2rem' }}>
              Utiliza este formulario para cambiar la imagen y el texto que aparece en la pantalla principal del sitio.
            </p>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label>Título Principal *</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej. Noche de Trova Yucateca" />
              </div>
              
              <div className={styles.inputGroup}>
                <label>Etiqueta Superior</label>
                <input type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Ej. Próximo Evento" />
              </div>

              <div className={styles.inputGroup}>
                <label>Texto de Fecha / Detalles</label>
                <input type="text" value={dateText} onChange={e => setDateText(e.target.value)} placeholder="Ej. Jueves 24 de Octubre · 20:00 h" />
              </div>

              <div className={styles.inputGroup}>
                <label>Imagen de Fondo</label>
                <input type="file" accept="image/*" onChange={handleFileChange} />
                <small style={{ marginTop: '5px', color: '#666' }}>Si no seleccionas una imagen nueva, se mantendrá la actual (o fondo verde oscuro).</small>
              </div>

              <button type="submit" disabled={saving} className={styles.submitButton}>
                {saving ? "Guardando..." : "Actualizar Portada"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
