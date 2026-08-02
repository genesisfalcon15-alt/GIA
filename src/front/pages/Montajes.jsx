import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const tiempoRelativo = (fechaStr) => {
    const diff = Date.now() - new Date(fechaStr).getTime();
    const min = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (min < 60) return `Hace ${min} min`;
    if (h < 24) return `Hace ${h}h`;
    if (d === 1) return "Ayer";
    return `Hace ${d} días`;
};

export const Montajes = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const [conversaciones, setConversaciones] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        if (!token) { navigate("/login"); return; }
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/conversations`, {
            headers: { "Authorization": `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => setConversaciones(data.items || []))
            .catch(() => { })
            .finally(() => setCargando(false));
    }, []);

    return (
        <div className="min-h-screen bg-ivoire dark:bg-noche">
            <div className="max-w-xl mx-auto px-6 pt-14 pb-24">

                <div className="mb-8">
                    <h1 className="text-lg font-semibold text-deep-ocean dark:text-ivoire tracking-tight">
                        Mis montajes
                    </h1>
                    <p className="text-sm text-gris-piedra mt-0.5">
                        Todos tus proyectos en un solo lugar.
                    </p>
                </div>

                {cargando ? (
                    <div className="flex justify-center py-16">
                        <div className="w-4 h-4 border-2 border-douche border-t-gris-piedra rounded-full animate-spin" />
                    </div>
                ) : conversaciones.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-sm text-gris-piedra">Aún no tienes montajes.</p>
                        <button
                            onClick={() => navigate("/chat")}
                            className="mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold bg-deep-ocean text-ivoire hover:bg-ocean-vivo transition dark:bg-sky dark:text-noche"
                        >
                            Empezar ahora
                        </button>
                    </div>
                ) : (
                    <div className="rounded-xl border border-douche dark:border-noche-borde overflow-hidden">
                        {conversaciones.map((conv, index) => (
                            <button
                                key={conv.id}
                                onClick={() => navigate(`/chat?conversation=${conv.id}`)}
                                className={`
                                    w-full flex items-center justify-between px-4 py-3.5 text-left
                                    bg-white dark:bg-noche-suave
                                    hover:bg-douche/30 dark:hover:bg-noche-borde transition-all group
                                    ${index !== conversaciones.length - 1 ? "border-b border-douche dark:border-noche-borde" : ""}
                                `}
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium text-deep-ocean dark:text-ivoire truncate">
                                        {conv.title || "Sin título"}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        {conv.has_manual && (
                                            <span className="text-[10px] font-medium text-noyer dark:text-mantequilla">
                                                Manual
                                            </span>
                                        )}
                                        <span className="text-[10px] text-gris-piedra">
                                            {tiempoRelativo(conv.updated_at)}
                                        </span>
                                        {conv.message_count > 0 && (
                                            <span className="text-[10px] text-gris-piedra">
                                                · {conv.message_count} mensajes
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="text-gris-piedra/30 group-hover:translate-x-0.5 transition-transform flex-shrink-0 ml-4">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};