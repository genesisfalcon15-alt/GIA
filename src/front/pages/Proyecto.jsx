import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, MessageSquare, BookOpen, Image, FileText, Wrench, Package, StickyNote, Clock } from "lucide-react";
import ReactMarkdown from "react-markdown";

const PESTANAS = [
    { id: "resumen", label: "Resumen", icono: FileText },
    { id: "chat", label: "Chat", icono: MessageSquare },
    { id: "manuales", label: "Manuales", icono: BookOpen },
    { id: "fotos", label: "Fotos", icono: Image },
    { id: "notas", label: "Notas", icono: StickyNote },
];

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

    const [proyecto, setProyecto] = useState(null);
    const [mensajes, setMensajes] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [pestanaActiva, setPestanaActiva] = useState("resumen");
    const [nota, setNota] = useState("");

    useEffect(() => {
        if (!token) { navigate("/login"); return; }
        Promise.all([
            fetch(`${import.meta.env.VITE_BACKEND_URL}/api/conversations/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            }).then(r => r.json()),
        ]).then(([data]) => {
            setProyecto(data);
            setMensajes(data.messages || []);
        }).catch(() => { })
            .finally(() => setCargando(false));
    }, [id]);

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

    return (
        <div className="bg-ivoire dark:bg-noche min-h-screen">
            <div className="max-w-2xl mx-auto px-8 pt-10 pb-16">

                {/* volver */}
                <button
                    onClick={() => navigate("/montajes")}
                    className="flex items-center gap-1.5 text-xs text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire transition-colors mb-8"
                >
                    <ArrowLeft size={13} strokeWidth={1.5} />
                    Mis montajes
                </button>

                {/* cabecera del proyecto */}
                <div className="mb-6">
                    <h1 className="text-xl font-medium tracking-tight text-noyer dark:text-mantequilla mb-1">
                        {proyecto.title || "Sin título"}
                    </h1>
                    <div className="flex items-center gap-3">
                        {proyecto.has_manual && (
                            <span className="text-[10px] font-medium text-noyer dark:text-mantequilla">Manual</span>
                        )}
                        <span className="text-[10px] text-gris-piedra">
                            {tiempoRelativo(proyecto.updated_at)}
                        </span>
                        <span className="text-[10px] text-gris-piedra">
                            {mensajes.length} mensajes
                        </span>
                    </div>
                </div>

                {/* botón ir al chat */}
                <button
                    onClick={() => navigate(`/chat?conversation=${id}`)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-deep-ocean dark:bg-noche-suave border border-deep-ocean/10 dark:border-noche-borde hover:opacity-90 transition-all group mb-6"
                >
                    <div className="flex items-center gap-3">
                        <MessageSquare size={16} strokeWidth={1.5} className="text-ivoire dark:text-sky" />
                        <span className="text-sm font-medium text-ivoire dark:text-ivoire">
                            Continuar con GIA
                        </span>
                    </div>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-ivoire/40 group-hover:translate-x-0.5 transition-transform">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                </button>

                <div className="border-t border-douche dark:border-noche-borde mb-6" />

                {/* pestañas */}
                <div className="flex gap-1 mb-6 overflow-x-auto">
                    {PESTANAS.map(({ id: pid, label, icono: Icono }) => (
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
                                    <span className="text-xs text-gris-piedra">Mensajes</span>
                                    <span className="text-xs text-noyer dark:text-mantequilla font-medium">{mensajes.length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-xs text-gris-piedra">Manual</span>
                                    <span className="text-xs text-noyer dark:text-mantequilla font-medium">{proyecto.has_manual ? "Sí" : "No"}</span>
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
                                    Último mensaje
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
                        {proyecto.has_manual ? (
                            <div className="p-4 rounded-xl bg-white dark:bg-noche-suave border border-douche dark:border-noche-borde">
                                <div className="flex items-center gap-3">
                                    <BookOpen size={16} strokeWidth={1.5} className="text-noyer dark:text-mantequilla" />
                                    <p className="text-sm text-noyer dark:text-mantequilla font-medium">Manual disponible</p>
                                </div>
                            </div>
                        ) : (
                            <p className="text-sm text-gris-piedra text-center py-8">No hay manuales en este proyecto.</p>
                        )}
                    </div>
                )}

                {/* fotos */}
                {pestanaActiva === "fotos" && (
                    <div className="text-center py-8">
                        <Image size={32} strokeWidth={1} className="text-gris-piedra/30 mx-auto mb-3" />
                        <p className="text-sm text-gris-piedra">Las fotos del proyecto aparecerán aquí.</p>
                        <p className="text-xs text-gris-piedra/50 mt-1">Próximamente</p>
                    </div>
                )}

                {/* notas */}
                {pestanaActiva === "notas" && (
                    <div>
                        <textarea
                            value={nota}
                            onChange={e => setNota(e.target.value)}
                            placeholder="Escribe notas sobre este proyecto..."
                            rows={6}
                            className="w-full px-4 py-3 rounded-xl border border-douche dark:border-noche-borde bg-white dark:bg-noche-suave text-deep-ocean dark:text-ivoire placeholder:text-gris-piedra/40 text-sm outline-none focus:border-deep-ocean/40 dark:focus:border-sky/40 transition resize-none"
                        />
                        <p className="text-[10px] text-gris-piedra/50 mt-2">
                            Las notas se guardarán en el backend próximamente.
                        </p>
                    </div>
                )}

            </div>
        </div>
    );
};