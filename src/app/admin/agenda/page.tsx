"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import styles from "./page.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EventoPreview from "./EventoPreview";
import {
  type Evento,
  CAMPOS_EVENTO,
  diaDelMes,
  formatearFecha,
  formatearHora,
  formatearPrecio,
  generarSlug,
  hoyEnMerida,
  instanteDe,
  mesAbreviado,
  nombreArtista,
} from "@/lib/events";

const CICLOS_FRECUENTES = ["Miércoles de Trova"];

/**
 * "Por confirmar" deja el campo vacío en vez de escribir un literal: el texto
 * visible sale siempre de formatearPrecio(), así que hay una sola fuente de
 * verdad y no acaba un mes diciendo "Gratis", otro "Entrada libre" y otro "GRATIS".
 */
const ATAJOS_PRECIO = [
  { etiqueta: "Entrada libre", valor: "Entrada libre" },
  { etiqueta: "Por confirmar", valor: "" },
  { etiqueta: "$50", valor: "$50" },
  { etiqueta: "$100", valor: "$100" },
];

type RanuraImagen = "imagen_thumb" | "imagen_hero" | "imagen_poster";

const RANURAS_IMAGEN: { campo: RanuraImagen; etiqueta: string; ayuda: string }[] = [
  { campo: "imagen_thumb", etiqueta: "Miniatura", ayuda: "Cuadrada · se ve en las tarjetas de la agenda" },
  { campo: "imagen_hero", etiqueta: "Fondo de portada", ayuda: "Apaisada · se ve detrás del texto en el inicio" },
  { campo: "imagen_poster", etiqueta: "Póster", ayuda: "Vertical · para redes sociales y al compartir" },
];

const FORM_VACIO = {
  ciclo: "",
  artista: "",
  event_date: "",
  event_time: "20:00",
  precio: "",
  destacado: "",
  invitados: "",
  descripcion: "",
  mostrar_en_hero: false,
};

export default function AdminAgenda() {
  const router = useRouter();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [guardando, setGuardando] = useState(false);

  const [form, setForm] = useState(FORM_VACIO);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [imagenesActuales, setImagenesActuales] = useState<
    Partial<Record<RanuraImagen, string | null>>
  >({});
  const [archivos, setArchivos] = useState<Partial<Record<RanuraImagen, File>>>({});
  // Instante de referencia para decidir qué evento es el más próximo. Se toma
  // junto con la lista, para que ambos sean la misma foto del momento.
  const [ahora, setAhora] = useState(0);

  // Las imágenes recién elegidas todavía no están en Supabase: se muestran desde
  // el archivo local.
  const urlsPreview = useMemo(() => {
    const urls: Partial<Record<RanuraImagen, string>> = {};
    for (const { campo } of RANURAS_IMAGEN) {
      const archivo = archivos[campo];
      if (archivo) urls[campo] = URL.createObjectURL(archivo);
    }
    return urls;
  }, [archivos]);

  // Se liberan al cambiarlas o al salir, para no filtrar memoria.
  useEffect(
    () => () => Object.values(urlsPreview).forEach((url) => URL.revokeObjectURL(url)),
    [urlsPreview]
  );

  const cargarEventos = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("events")
      .select(CAMPOS_EVENTO)
      .order("event_date", { ascending: true })
      .order("event_time", { ascending: true });

    setEventos((data as Evento[]) ?? []);
    setAhora(Date.now());
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        router.push("/admin");
      } else {
        cargarEventos();
      }
    });
  }, [router, cargarEventos]);

  const actualizar = <K extends keyof typeof FORM_VACIO>(
    campo: K,
    valor: (typeof FORM_VACIO)[K]
  ) => setForm((previo) => ({ ...previo, [campo]: valor }));

  const limpiarFormulario = () => {
    setForm(FORM_VACIO);
    setEditandoId(null);
    setImagenesActuales({});
    setArchivos({});
  };

  const editar = (evento: Evento) => {
    setForm({
      ciclo: evento.ciclo,
      artista: evento.artista ?? "",
      event_date: evento.event_date,
      event_time: evento.event_time.slice(0, 5),
      precio: evento.precio ?? "",
      destacado: evento.destacado ?? "",
      invitados: evento.invitados ?? "",
      descripcion: evento.descripcion ?? "",
      mostrar_en_hero: evento.mostrar_en_hero,
    });
    setEditandoId(evento.id);
    setImagenesActuales({
      imagen_thumb: evento.imagen_thumb,
      imagen_hero: evento.imagen_hero,
      imagen_poster: evento.imagen_poster,
    });
    setArchivos({});
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const subirImagen = async (campo: RanuraImagen, archivo: File) => {
    const extension = archivo.name.split(".").pop();
    const ruta = `evento/${crypto.randomUUID()}-${campo}.${extension}`;

    const { error } = await supabase.storage
      .from("museum-assets")
      .upload(ruta, archivo);
    if (error) throw error;

    return supabase.storage.from("museum-assets").getPublicUrl(ruta).data.publicUrl;
  };

  /**
   * El slug se regenera en cada guardado, para que deje de decir
   * "por-confirmar" en cuanto se confirma el artista. Si otro evento ya lo
   * tiene, se le agrega sufijo.
   */
  const slugDisponible = async (base: string) => {
    for (let n = 1; n <= 20; n++) {
      const candidato = n === 1 ? base : `${base}-${n}`;
      let consulta = supabase.from("events").select("id").eq("slug", candidato).limit(1);
      if (editandoId) consulta = consulta.neq("id", editandoId);

      const { data } = await consulta;
      if (!data || data.length === 0) return candidato;
    }
    return `${base}-${Date.now()}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);

    try {
      // Al editar, las ranuras sin archivo nuevo conservan la imagen que ya tenían.
      const imagenes: Partial<Record<RanuraImagen, string | null>> = {
        ...imagenesActuales,
      };
      for (const { campo } of RANURAS_IMAGEN) {
        const archivo = archivos[campo];
        if (archivo) imagenes[campo] = await subirImagen(campo, archivo);
      }

      const registro = {
        slug: await slugDisponible(
          generarSlug({ event_date: form.event_date, artista: form.artista.trim() || null })
        ),
        ciclo: form.ciclo.trim(),
        artista: form.artista.trim() || null,
        event_date: form.event_date,
        event_time: form.event_time,
        precio: form.precio.trim() || null,
        destacado: form.destacado.trim() || null,
        invitados: form.invitados.trim() || null,
        descripcion: form.descripcion.trim() || null,
        mostrar_en_hero: form.mostrar_en_hero,
        imagen_thumb: imagenes.imagen_thumb ?? null,
        imagen_hero: imagenes.imagen_hero ?? null,
        imagen_poster: imagenes.imagen_poster ?? null,
      };

      const { error } = editandoId
        ? await supabase.from("events").update(registro).eq("id", editandoId)
        : await supabase.from("events").insert([registro]);

      if (error) throw error;

      solicitarRevalidacion();

      limpiarFormulario();
      cargarEventos();
    } catch (error) {
      alert("Error al guardar: " + (error as Error).message);
    } finally {
      setGuardando(false);
    }
  };

  const solicitarRevalidacion = async () => {
    try {
      await fetch("/api/revalidate", { method: "POST" });
    } catch {
      // Revalidación silenciosa: si falla no bloquea la experiencia del admin
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este evento? Esta acción no se puede deshacer.")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (!error) {
      solicitarRevalidacion();
    }
    if (editandoId === id) limpiarFormulario();
    cargarEventos();
  };

  if (loading) return <div className={styles.container}>Cargando...</div>;

  const eventoPreview: Evento = {
    id: "preview",
    slug: null,
    ciclo: form.ciclo.trim() || "Ciclo del evento",
    artista: form.artista.trim() || null,
    event_date: form.event_date || hoyEnMerida(),
    event_time: form.event_time || "20:00",
    precio: form.precio.trim() || null,
    destacado: form.destacado.trim() || null,
    invitados: form.invitados.trim() || null,
    descripcion: form.descripcion.trim() || null,
    imagen_hero: urlsPreview.imagen_hero ?? imagenesActuales.imagen_hero ?? null,
    imagen_thumb: urlsPreview.imagen_thumb ?? imagenesActuales.imagen_thumb ?? null,
    imagen_poster: urlsPreview.imagen_poster ?? imagenesActuales.imagen_poster ?? null,
    mostrar_en_hero: form.mostrar_en_hero,
  };

  // El hero muestra el más próximo más los marcados: la previa dice la verdad
  // sobre si este evento va a salir en portada o no.
  const instantePreview = instanteDe(eventoPreview).getTime();
  const esElMasProximo =
    Boolean(form.event_date) &&
    instantePreview >= ahora &&
    eventos
      .filter((ev) => ev.id !== editandoId && instanteDe(ev).getTime() >= ahora)
      .every((ev) => instantePreview <= instanteDe(ev).getTime());

  const saleEnHero = form.mostrar_en_hero || esElMasProximo;

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
            <h2>{editandoId ? "Editar evento" : "Añadir nuevo evento"}</h2>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.inputGroup}>
                <label htmlFor="ciclo">Ciclo</label>
                <input
                  id="ciclo"
                  required
                  type="text"
                  value={form.ciclo}
                  onChange={(e) => actualizar("ciclo", e.target.value)}
                  placeholder="Ej. Miércoles de Trova"
                />
                <div className={styles.atajos}>
                  {CICLOS_FRECUENTES.map((ciclo) => (
                    <button
                      key={ciclo}
                      type="button"
                      className={styles.atajo}
                      onClick={() => actualizar("ciclo", ciclo)}
                    >
                      {ciclo}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.inputGroup}>
                <label htmlFor="artista">Artista</label>
                <input
                  id="artista"
                  type="text"
                  value={form.artista}
                  onChange={(e) => actualizar("artista", e.target.value)}
                  placeholder="Artista por confirmar"
                />
                <p className={styles.hint}>
                  Si lo dejas vacío, el sitio muestra “Artista por confirmar”.
                </p>
              </div>

              <div className={styles.row}>
                <div className={styles.inputGroup}>
                  <label htmlFor="fecha">Fecha</label>
                  <input
                    id="fecha"
                    required
                    type="date"
                    value={form.event_date}
                    onChange={(e) => actualizar("event_date", e.target.value)}
                  />
                </div>
                <div className={styles.inputGroup}>
                  <label htmlFor="hora">Hora</label>
                  <input
                    id="hora"
                    required
                    type="time"
                    value={form.event_time}
                    onChange={(e) => actualizar("event_time", e.target.value)}
                  />
                </div>
              </div>
              <p className={styles.hint}>
                Siempre hora de Mérida, sin importar desde dónde captures.
              </p>

              <div className={styles.inputGroup}>
                <label htmlFor="precio">Precio</label>
                <input
                  id="precio"
                  type="text"
                  value={form.precio}
                  onChange={(e) => actualizar("precio", e.target.value)}
                  placeholder="Costo por confirmar"
                />
                <div className={styles.atajos}>
                  {ATAJOS_PRECIO.map((atajo) => (
                    <button
                      key={atajo.etiqueta}
                      type="button"
                      className={styles.atajo}
                      onClick={() => actualizar("precio", atajo.valor)}
                    >
                      {atajo.etiqueta}
                    </button>
                  ))}
                </div>
              </div>

              <div className={styles.opcionales}>
                <p className={styles.opcionalesTitulo}>Opcionales</p>

                <div className={styles.inputGroup}>
                  <label htmlFor="destacado">Destacado</label>
                  <input
                    id="destacado"
                    type="text"
                    maxLength={50}
                    value={form.destacado}
                    onChange={(e) => actualizar("destacado", e.target.value)}
                    placeholder="Ej. Directamente desde Colombia"
                  />
                  <p className={styles.hint}>{form.destacado.length}/50 caracteres</p>
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="invitados">Trío invitado</label>
                  <input
                    id="invitados"
                    type="text"
                    value={form.invitados}
                    onChange={(e) => actualizar("invitados", e.target.value)}
                    placeholder="Ej. Trío Nova"
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label htmlFor="descripcion">Descripción</label>
                  <textarea
                    id="descripcion"
                    rows={4}
                    value={form.descripcion}
                    onChange={(e) => actualizar("descripcion", e.target.value)}
                    placeholder="Detalles del evento..."
                  />
                </div>

                {RANURAS_IMAGEN.map(({ campo, etiqueta, ayuda }) => (
                  <div className={styles.inputGroup} key={campo}>
                    <label htmlFor={campo}>{etiqueta}</label>
                    <input
                      id={campo}
                      type="file"
                      accept="image/*"
                      onChange={(e) =>
                        setArchivos((previo) => ({
                          ...previo,
                          [campo]: e.target.files?.[0],
                        }))
                      }
                    />
                    <p className={styles.hint}>
                      {ayuda}
                      {imagenesActuales[campo] && !archivos[campo] && " · ya tiene imagen"}
                    </p>
                  </div>
                ))}

                <label className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={form.mostrar_en_hero}
                    onChange={(e) => actualizar("mostrar_en_hero", e.target.checked)}
                  />
                  <span>Mostrar en la portada</span>
                </label>
              </div>

              <div className={styles.acciones}>
                <button type="submit" disabled={guardando} className={styles.submitButton}>
                  {guardando
                    ? "Guardando..."
                    : editandoId
                      ? "Guardar cambios"
                      : "Guardar evento"}
                </button>
                {editandoId && (
                  <button
                    type="button"
                    className={styles.cancelButton}
                    onClick={limpiarFormulario}
                  >
                    Cancelar
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>

        <div className={styles.listSection}>
          <div className={styles.previewSticky}>
            <EventoPreview evento={eventoPreview} saleEnHero={saleEnHero} />
          </div>

          <h2>Eventos programados</h2>
          {eventos.length === 0 ? (
            <p className={styles.emptyMsg}>No hay eventos programados.</p>
          ) : (
            <div className={styles.eventsList}>
              {eventos.map((evento) => (
                <div key={evento.id} className={styles.eventItem}>
                  <div className={styles.eventBadge}>
                    <span className={styles.eventDay}>{diaDelMes(evento)}</span>
                    <span className={styles.eventMonth}>{mesAbreviado(evento)}</span>
                  </div>
                  <div className={styles.eventInfo}>
                    <p className={styles.eventCiclo}>{evento.ciclo}</p>
                    <h3>{nombreArtista(evento)}</h3>
                    <p className={styles.eventDate}>
                      {formatearFecha(evento)} · {formatearHora(evento)} h ·{" "}
                      {formatearPrecio(evento)}
                    </p>
                  </div>
                  <div className={styles.eventActions}>
                    <button onClick={() => editar(evento)} className={styles.editButton}>
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(evento.id)}
                      className={styles.deleteButton}
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
