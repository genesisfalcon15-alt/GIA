import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MessageSquare, BookOpen, Image, StickyNote, FileText, ChevronDown, Plus, X } from "lucide-react";
import ReactMarkdown from "react-markdown";

const PESTANAS = [
    { id: "resumen", label: "Resumen", icono: FileText },
    { id: "chat", label: "Chat", icono: MessageSquare },
    { id: "manuales", label: "Manuales", icono: BookOpen },
    { id: "fotos", label: "Fotos", icono: Image },
    { id: "notas", label: "Notas", icono: StickyNote },
];

const ACCIONES_PROYECTO = [
    { id: "continuar", label: "Continuar montaje" },
    { id: "desmontar", label: "Desmontar" },
    { id: "reparar", label: "Reparar" },
    { id: "mejorar", label: "Mejorar" },
    { id: "modificar", label: "Modificar" },
    { id: "restaurar", label: "Restaurar" },
    { id: "reinstalar", label: "Volver a instalar" },
    { id: "averia", label: "Analizar una avería" },
    { id: "accesorios", label: "Añadir accesorios" },
];

const contextoAccion = (accion, titulo) => ({
    continuar: `Quiero continuar el proyecto: ${titulo}. Retoma desde donde lo dejamos.`,
    desmontar: `Quiero desmontar ${titulo}. Reutiliza todo el historial del montaje original: orden de desmontaje, piezas delicadas, cómo clasificar tornillos, cómo embalar y transportar.`,
    reparar: `Quiero reparar ${titulo}. Usa el historial del proyecto para identificar piezas, referencias y herramientas necesarias.`,
    mejorar: `Quiero mejorar ${titulo}. Usa el historial del proyecto para proponer mejoras compatibles con el montaje actual.`,
    modificar: `Quiero modificar ${titulo}. Analiza el proyecto original y propone cómo reutilizar piezas existentes.`,
    restaurar: `Quiero restaurar ${titulo}. Evalúa el estado actual y propone un plan de restauración usando el historial del proyecto.`,
    reinstalar: `Quiero volver a instalar ${titulo}. Usa el historial original para guiarme desde cero con toda la información ya conocida.`,
    averia: `Quiero analizar una avería en ${titulo}. Usa el historial del proyecto para identificar posibles causas y soluciones.`,
    accesorios: `Quiero añadir accesorios a ${titulo}. Usa el historial del proyecto para proponer accesorios compatibles.`,
}[accion]);

const tiempoRelativo = (fechaStr) => {
    if (!fechaStr) return "";
    const diff = Date.now() - new Date(fechaStr).getTime();
    const min = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (min < 60) return `Hace ${min} min`;
    if (h < 24) return `Hace ${h}h`;
    if (d === 1) return "Ayer";
    return `Hace ${d} días`;
};

export const Proyecto = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const fotoInputRef = useRef(null);

    const [proyecto, setProyecto] = useState(null);
    const [mensajes, setMensajes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [pestanaActiva, setPestanaActiva] = useState("resumen");
    const [accionAbierta, setAccionAbierta] = useState(false);
    const [convirtiendoGuia, setConvirtiendoGuia] = useState(false);

    const [notas, setNotas] = useState([]);
    const [notaNueva, setNotaNueva] = useState("");
    const [guardandoNota, setGuardandoNota] = useState(false);

    const [fotos, setFotos] = useState([]);
    const [subiendoFoto, setSubiendoFoto] = useState(false);

    const [progreso, setProgreso] = useState(0);

    useEffect(() => {
        if (!token) { navigate("/login"); return; }

        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/conversations/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => {
                setProyecto(data);
                setMensajes(data.messages || []);
            })
            .catch(() => { })
            .finally(() => setCargando(false));

        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/projects/${id}/notes`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => setNotas(Array.isArray(data) ? data : []))
            .catch(() => { });

        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/projects/${id}/photos`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => setFotos(Array.isArray(data) ? data : []))
            .catch(() => { });

        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/projects/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => { if (data.progress) setProgreso(data.progress); })
            .catch(() => { });

    }, [id]);

    // pestañas visibles según contenido real del proyecto
    const pestanasMostrar = PESTANAS.filter(p => {
        if (p.id === "fotos") return fotos.length > 0;
        if (p.id === "manuales") return proyecto?.has_manual;
        return true;
    });

    const convertirEnGuia = async () => {
        const esGuia = proyecto.category === "guia";
        const mensaje = esGuia
            ? "¿Quieres convertir esta guía de nuevo en un montaje?"
            : "¿Quieres convertir este proyecto en una guía técnica? Aparecerá en Mis Guías.";
        if (!window.confirm(mensaje)) return;
        setConvirtiendoGuia(true);
        try {
            await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/conversations/${id}`, {
                method: "PATCH",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ category: esGuia ? null : "guia" })
            });
            setProyecto(prev => ({ ...prev, category: esGuia ? null : "guia" }));
        } catch (err) {
            console.error("error actualizando categoría:", err);
        } finally {
            setConvirtiendoGuia(false);
        }
    };

    const guardarNota = async () => {
        if (!notaNueva.trim()) return;
        setGuardandoNota(true);
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/projects/${id}/notes`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ content: notaNueva.trim() })
            });
            const data = await res.json();
            setNotas(prev => [...prev, data]);
            setNotaNueva("");
        } catch (err) {
            console.error("error guardando nota:", err);
        } finally {
            setGuardandoNota(false);
        }
    };

    const borrarNota = async (noteId) => {
        try {
            await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/projects/${id}/notes/${noteId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            setNotas(prev => prev.filter(n => n.id !== noteId));
        } catch (err) {
            console.error("error borrando nota:", err);
        }
    };

    const subirFoto = async (e) => {
        const archivo = e.target.files[0];
        if (!archivo) return;
        setSubiendoFoto(true);
        try {
            const formData = new FormData();
            formData.append("photo", archivo);
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/projects/${id}/photos`, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            setFotos(prev => [...prev, data]);
        } catch (err) {
            console.error("error subiendo foto:", err);
        } finally {
            setSubiendoFoto(false);
            if (fotoInputRef.current) fotoInputRef.current.value = "";
        }
    };

    const borrarFoto = async (photoId) => {
        try {
            await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/projects/${id}/photos/${photoId}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            });
            setFotos(prev => prev.filter(f => f.id !== photoId));
        } catch (err) {
            console.error("error borrando foto:", err);
        }
    };

    const iniciarAccion = (accion) => {
        setAccionAbierta(false);
        const titulo = proyecto?.title || "este proyecto";
        if (accion === "continuar") {
            navigate(`/chat?conversation=${id}`);
            return;
        }
        const contexto = contextoAccion(accion, titulo);
        sessionStorage.setItem("gia_contexto_inicial", contexto);
        navigate(`/chat?conversation=${id}`);
    };

    if (cargando) return (
        <div className="bg-ivoire dark:bg-noche min-h-screen flex items-center justify-center">
            <div className="w-4 h-4 border-2 border-douche border-t-gris-piedra rounded-full animate-spin" />
        </div>
    );

    if (!proyecto) return (
        <div className="bg-ivoire dark:bg-noche min-h-screen flex items-center justify-center">
            <p className="text-sm text-gris-piedra">Proyecto no encontrado.</p>
        </div>
    );

    const esGuia = proyecto.category === "guia";

    return (
        <div className="bg-ivoire dark:bg-noche min-h-screen">
            <div className="max-w-2xl mx-auto px-8 pt-10 pb-16">

                <button
                    onClick={() => navigate(esGuia ? "/guias" : "/montajes")}
                    className="flex items-center gap-1.5 text-xs text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire transition-colors mb-8"
                >
                    <ArrowLeft size={13} strokeWidth={1.5} />
                    {esGuia ? "Mis guías" : "Mis montajes"}
                </button>

                <div className="mb-4">
                    <h1 className="text-xl font-medium tracking-tight text-noyer dark:text-mantequilla mb-1">
                        {proyecto.title || "Sin título"}
                    </h1>
                    <div className="flex items-center gap-3">
                        {esGuia && (
                            <span className="text-[10px] font-medium text-deep-ocean dark:text-sky bg-deep-ocean/5 dark:bg-sky/10 px-2 py-0.5 rounded-lg">
                                Guía
                            </span>
                        )}
                        {proyecto.has_manual && (
                            <span className="text-[10px] font-medium text-noyer dark:text-mantequilla">Manual</span>
                        )}
                        <span className="text-[10px] text-gris-piedra">{tiempoRelativo(proyecto.updated_at)}</span>
                        <span className="text-[10px] text-gris-piedra">{mensajes.length} mensajes</span>
                    </div>
                </div>

                <button
                    onClick={convertirEnGuia}
                    disabled={convirtiendoGuia}
                    className="mb-6 text-xs text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire transition disabled:opacity-40"
                >
                    {convirtiendoGuia ? "Guardando..." : esGuia ? "← Volver a Mis Montajes" : "Convertir en guía →"}
                </button>

                {progreso > 0 && (
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-gris-piedra">Progreso</span>
                            <span className="text-[10px] font-medium text-noyer dark:text-mantequilla">{progreso}%</span>
                        </div>
                        <div className="h-0.5 w-full bg-douche dark:bg-noche-borde rounded-full overflow-hidden">
                            <div
                                className="h-full bg-noyer dark:bg-mantequilla rounded-full transition-all duration-500"
                                style={{ width: `${progreso}%` }}
                            />
                        </div>
                    </div>
                )}

                <div className="mb-6">
                    <button
                        onClick={() => setAccionAbierta(!accionAbierta)}
                        className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-deep-ocean dark:bg-noche-suave border border-deep-ocean/10 dark:border-noche-borde hover:opacity-90 transition-all"
                    >
                        <span className="text-sm font-medium text-ivoire dark:text-ivoire">
                            Trabajar sobre este proyecto
                        </span>
                        <ChevronDown size={14} strokeWidth={1.5} className={`text-ivoire/60 transition-transform duration-200 ${accionAbierta ? "rotate-180" : ""}`} />
                    </button>

                    {accionAbierta && (
                        <div className="mt-1 rounded-xl border border-douche dark:border-noche-borde bg-white dark:bg-noche-suave overflow-hidden">
                            {ACCIONES_PROYECTO.map((accion, i) => (
                                <button
                                    key={accion.id}
                                    onClick={() => iniciarAccion(accion.id)}
                                    className={`w-full text-left px-4 py-3 text-sm text-deep-ocean dark:text-ivoire hover:bg-douche/40 dark:hover:bg-white/5 transition ${i !== ACCIONES_PROYECTO.length - 1 ? "border-b border-douche dark:border-noche-borde" : ""}`}
                                >
                                    {accion.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="border-t border-douche dark:border-noche-borde mb-6" />

                {/* pestañas — solo las que tienen contenido */}
                <div className="flex gap-1 mb-6 overflow-x-auto pb-1">
                    {pestanasMostrar.map(({ id: pid, label, icono: Icono }) => (
                        <button
                            key={pid}
                            onClick={() => setPestanaActiva(pid)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${pestanaActiva === pid
                                ? "bg-white dark:bg-noche-suave text-noyer dark:text-mantequilla border border-douche dark:border-noche-borde"
                                : "text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire"
                                }`}
                        >
                            <Icono size={12} strokeWidth={1.5} />
                            {label}
                        </button>
                    ))}
                </div>

                {/* resumen */}
                {pestanaActiva === "resumen" && (
                    <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-white dark:bg-noche-suave border border-douche dark:border-noche-borde">
                            <p className="text-[9px] font-semibold tracking-[0.16em] uppercase text-gris-piedra mb-3">
                                Estado del proyecto
                            </p>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-xs text-gris-piedra">Tipo</span>
                                    <span className="text-xs text-noyer dark:text-mantequilla font-medium">{esGuia ? "Guía técnica" : "Montaje"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs text-gris-piedra">Mensajes</span>
                                    <span className="text-xs text-noyer dark:text-mantequilla font-medium">{mensajes.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs text-gris-piedra">Manual</span>
                                    <span className="text-xs text-noyer dark:text-mantequilla font-medium">{proyecto.has_manual ? "Sí" : "No"}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs text-gris-piedra">Notas</span>
                                    <span className="text-xs text-noyer dark:text-mantequilla font-medium">{notas.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs text-gris-piedra">Fotos</span>
                                    <span className="text-xs text-noyer dark:text-mantequilla font-medium">{fotos.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs text-gris-piedra">Última actividad</span>
                                    <span className="text-xs text-noyer dark:text-mantequilla font-medium">{tiempoRelativo(proyecto.updated_at)}</span>
                                </div>
                            </div>
                        </div>
                        {proyecto.last_message && (
                            <div className="p-4 rounded-xl bg-white dark:bg-noche-suave border border-douche dark:border-noche-borde">
                                <p className="text-[9px] font-semibold tracking-[0.16em] uppercase text-gris-piedra mb-2">
                                    Último mensaje de GIA
                                </p>
                                <p className="text-xs text-gris-piedra leading-relaxed line-clamp-3">
                                    {proyecto.last_message}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* chat */}
                {pestanaActiva === "chat" && (
                    <div className="space-y-3">
                        {mensajes.length === 0 ? (
                            <p className="text-sm text-gris-piedra text-center py-8">Sin mensajes todavía.</p>
                        ) : (
                            mensajes.map((msg, index) => (
                                <div key={index} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                    <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === "user"
                                        ? "bg-deep-ocean text-ivoire dark:bg-sky dark:text-noche rounded-br-sm"
                                        : "bg-white dark:bg-noche-suave text-deep-ocean dark:text-ivoire border border-douche dark:border-noche-borde rounded-bl-sm"
                                        }`}>
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}

                {/* manuales */}
                {pestanaActiva === "manuales" && (
                    <div>
                        {proyecto.has_manual && proyecto.manuales && proyecto.manuales.length > 0 ? (
                            <div className="space-y-2">
                                {proyecto.manuales.map(m => (
                                    <div key={m.id} className="p-4 rounded-xl bg-white dark:bg-noche-suave border border-douche dark:border-noche-borde">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-start gap-3 min-w-0">
                                                <BookOpen size={16} strokeWidth={1.5} className="text-noyer dark:text-mantequilla flex-shrink-0 mt-0.5" />
                                                <div className="min-w-0">
                                                    <p className="text-sm text-noyer dark:text-mantequilla font-medium truncate">
                                                        {m.filename}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-lg ${m.status === "listo"
                                                            ? "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
                                                            : m.status === "procesando"
                                                                ? "text-deep-ocean dark:text-sky bg-deep-ocean/5 dark:bg-sky/10"
                                                                : "text-red-500 bg-red-50 dark:bg-red-900/20"
                                                            }`}>
                                                            {m.status === "listo" ? "Listo" : m.status === "procesando" ? "Procesando" : "Error"}
                                                        </span>
                                                        <span className="text-[10px] text-gris-piedra">
                                                            {m.total_chunks} fragmentos indexados
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            {m.file_url && (
                                                <a
                                                    href={m.file_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex-shrink-0 text-xs text-deep-ocean dark:text-sky hover:opacity-70 transition"
                                                >
                                                    Ver PDF
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gris-piedra text-center py-8">No hay manuales en este proyecto.</p>
                        )}
                    </div>
                )}

                {/* fotos */}
                {pestanaActiva === "fotos" && (
                    <div>
                        <input ref={fotoInputRef} type="file" accept="image/*" onChange={subirFoto} className="hidden" />
                        <button
                            onClick={() => fotoInputRef.current?.click()}
                            disabled={subiendoFoto}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-douche dark:border-noche-borde text-gris-piedra hover:border-deep-ocean/30 hover:text-deep-ocean dark:hover:text-ivoire transition mb-4 disabled:opacity-40"
                        >
                            {subiendoFoto ? <div className="w-3.5 h-3.5 border border-gris-piedra border-t-transparent rounded-full animate-spin" /> : <Plus size={14} strokeWidth={1.5} />}
                            <span className="text-xs">{subiendoFoto ? "Subiendo..." : "Añadir foto"}</span>
                        </button>
                        <div className="grid grid-cols-2 gap-2">
                            {fotos.map(foto => (
                                <div key={foto.id} className="relative group rounded-xl overflow-hidden aspect-square">
                                    <img src={foto.url} alt={foto.caption || "foto"} className="w-full h-full object-cover" />
                                    <button
                                        onClick={() => borrarFoto(foto.id)}
                                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                                    >
                                        <X size={10} strokeWidth={2} className="text-white" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* notas */}
                {pestanaActiva === "notas" && (
                    <div>
                        <div className="flex gap-2 mb-4">
                            <textarea
                                value={notaNueva}
                                onChange={e => setNotaNueva(e.target.value)}
                                placeholder="Escribe una nota..."
                                rows={3}
                                className="flex-1 px-4 py-3 rounded-xl border border-douche dark:border-noche-borde bg-white dark:bg-noche-suave text-deep-ocean dark:text-ivoire placeholder:text-gris-piedra/40 text-sm outline-none focus:border-deep-ocean/40 dark:focus:border-sky/40 transition resize-none"
                            />
                            <button
                                onClick={guardarNota}
                                disabled={!notaNueva.trim() || guardandoNota}
                                className="flex-shrink-0 px-4 py-2 rounded-xl bg-deep-ocean dark:bg-sky text-ivoire dark:text-noche text-xs font-medium hover:opacity-90 transition disabled:opacity-40"
                            >
                                {guardandoNota ? "..." : "Guardar"}
                            </button>
                        </div>
                        {notas.length === 0 ? (
                            <p className="text-sm text-gris-piedra text-center py-8">No hay notas todavía.</p>
                        ) : (
                            <div className="space-y-2">
                                {notas.map(nota => (
                                    <div key={nota.id} className="group flex items-start justify-between px-4 py-3 rounded-xl bg-white dark:bg-noche-suave border border-douche dark:border-noche-borde">
                                        <p className="text-sm text-deep-ocean dark:text-ivoire leading-relaxed flex-1 mr-3">{nota.content}</p>
                                        <button onClick={() => borrarNota(nota.id)} className="flex-shrink-0 opacity-0 group-hover:opacity-100 text-gris-piedra hover:text-red-500 transition">
                                            <X size={12} strokeWidth={1.5} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};