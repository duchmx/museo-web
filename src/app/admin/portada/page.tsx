"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import styles from "./page.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminPortada() {
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [slides, setSlides] = useState<any[]>([]);

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
        fetchSlides();
      }
    });
  }, [router]);

  const fetchSlides = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("hero_templates")
      .select("*")
      .order("created_at", { ascending: false });
    
    if (data) setSlides(data);
    setLoading(false);
  };

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
        const { error: uploadError } = await supabase.storage.from('museum-assets').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data } = supabase.storage.from('museum-assets').getPublicUrl(fileName);
        imageUrl = data.publicUrl;
      }

      const { error } = await supabase.from("hero_templates").insert([{
        title, subtitle, date_text: dateText, button_text: buttonText, button_link: buttonLink, background_image_url: imageUrl, is_active: true
      }]);

      if (error) throw error;
      
      // Reset form
      setTitle(""); setSubtitle(""); setDateText(""); setFile(null);
      alert("Diapositiva añadida exitosamente!");
      fetchSlides();
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    await supabase.from("hero_templates").update({ is_active: !currentStatus }).eq("id", id);
    fetchSlides();
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de eliminar esta diapositiva?")) {
      await supabase.from("hero_templates").delete().eq("id", id);
      fetchSlides();
    }
  };

  if (loading && !session) return <div className={styles.container}>Cargando...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <Link href="/admin" className={styles.backLink}>← Volver al Panel</Link>
        <h1 className={styles.title}>Administrar Carrusel</h1>
      </header>

      <div className={styles.layout}>
        <div className={styles.formSection}>
          <div className={styles.card}>
            <h2>Añadir Nueva Diapositiva</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label>Título Principal *</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej. Noche de Trova" />
              </div>
              <div className={styles.inputGroup}>
                <label>Etiqueta Superior</label>
                <input type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Ej. Próximo Evento" />
              </div>
              <div className={styles.inputGroup}>
                <label>Texto Secundario / Fecha</label>
                <input type="text" value={dateText} onChange={e => setDateText(e.target.value)} placeholder="Ej. Jueves 24 de Octubre" />
              </div>
              <div className={styles.inputGroup}>
                <label>Imagen de Fondo</label>
                <input type="file" accept="image/*" onChange={handleFileChange} />
              </div>
              <button type="submit" disabled={saving} className={styles.submitButton}>
                {saving ? "Guardando..." : "Añadir Diapositiva"}
              </button>
            </form>
          </div>
        </div>

        <div className={styles.listSection}>
          <h2>Diapositivas Actuales</h2>
          <div className={styles.slidesList}>
            {slides.map(slide => (
              <div key={slide.id} className={`${styles.slideItem} ${slide.is_active ? styles.activeItem : styles.inactiveItem}`}>
                <div className={styles.slideInfo}>
                  <h3>{slide.title}</h3>
                  <p>{slide.subtitle || 'Sin etiqueta'} · {slide.date_text || 'Sin fecha'}</p>
                </div>
                <div className={styles.slideActions}>
                  <button 
                    onClick={() => toggleActive(slide.id, slide.is_active)}
                    className={slide.is_active ? styles.deactivateBtn : styles.activateBtn}
                  >
                    {slide.is_active ? "Desactivar" : "Activar"}
                  </button>
                  <button onClick={() => handleDelete(slide.id)} className={styles.deleteBtn}>Eliminar</button>
                </div>
              </div>
            ))}
            {slides.length === 0 && (
              <p style={{fontFamily: 'var(--font-garamond)', color: 'var(--carbon-medio)'}}>No hay diapositivas.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
