"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase/client";
import styles from "./page.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function AdminAgenda() {
  const router = useRouter();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/admin");
      } else {
        setSession(session);
        fetchEvents();
      }
    });
  }, [router]);

  const fetchEvents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .order("event_date", { ascending: true });
    
    if (data) setEvents(data);
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
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('museum-assets')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('museum-assets')
          .getPublicUrl(filePath);
        
        imageUrl = publicUrlData.publicUrl;
      }

      const eventDateTime = new Date(`${date}T${time}`).toISOString();

      const { error } = await supabase.from("events").insert([
        {
          title,
          subtitle,
          description,
          event_date: eventDateTime,
          image_url: imageUrl,
        }
      ]);

      if (error) throw error;

      // Reset form
      setTitle("");
      setSubtitle("");
      setDate("");
      setTime("");
      setDescription("");
      setFile(null);
      alert("Evento guardado exitosamente!");
      fetchEvents();
    } catch (error: any) {
      alert("Error al guardar: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar este evento? Esta acción no se puede deshacer.")) {
      await supabase.from("events").delete().eq("id", id);
      fetchEvents();
    }
  };

  if (loading && !session) return <div className={styles.container}>Cargando...</div>;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <Link href="/admin" className={styles.backLink}>← Volver al Panel</Link>
          <h1 className={styles.title}>Administrar Eventos</h1>
        </div>
      </header>

      <div className={styles.layout}>
        <div className={styles.formSection}>
          <div className={styles.card}>
            <h2>Añadir Nuevo Evento</h2>
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label>Título del Evento *</label>
                <input required type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ej. Noche de Trova" />
              </div>
              
              <div className={styles.inputGroup}>
                <label>Subtítulo (Opcional)</label>
                <input type="text" value={subtitle} onChange={e => setSubtitle(e.target.value)} placeholder="Ej. Concierto de Aniversario" />
              </div>

              <div className={styles.row}>
                <div className={styles.inputGroup}>
                  <label>Fecha *</label>
                  <input required type="date" value={date} onChange={e => setDate(e.target.value)} />
                </div>
                <div className={styles.inputGroup}>
                  <label>Hora *</label>
                  <input required type="time" value={time} onChange={e => setTime(e.target.value)} />
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label>Descripción *</label>
                <textarea required rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalles del evento..."></textarea>
              </div>

              <div className={styles.inputGroup}>
                <label>Imagen (Opcional)</label>
                <input type="file" accept="image/*" onChange={handleFileChange} />
              </div>

              <button type="submit" disabled={saving} className={styles.submitButton}>
                {saving ? "Guardando..." : "Guardar Evento"}
              </button>
            </form>
          </div>
        </div>

        <div className={styles.listSection}>
          <h2>Eventos Programados</h2>
          {loading ? (
            <p>Cargando eventos...</p>
          ) : events.length === 0 ? (
            <p className={styles.emptyMsg}>No hay eventos programados.</p>
          ) : (
            <div className={styles.eventsList}>
              {events.map(ev => {
                const evDate = new Date(ev.event_date);
                return (
                  <div key={ev.id} className={styles.eventItem}>
                    <div className={styles.eventInfo}>
                      <h3>{ev.title}</h3>
                      <p className={styles.eventDate}>
                        {evDate.toLocaleDateString('es-MX')} a las {evDate.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <button onClick={() => handleDelete(ev.id)} className={styles.deleteButton}>Eliminar</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
