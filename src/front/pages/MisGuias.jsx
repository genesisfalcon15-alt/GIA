import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Search, MoreHorizontal } from "lucide-react";

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

const ESTADOS = ["Todos", "en_progreso", "completado", "pausado", "cancelado"];

const ACCIONES_MENU = [
    { id: "desmontar", label: "Desmontar" },
    { id: "reparar", label: "Reparar" },
    { id: "mejorar", label: "Mejorar" },
    { id: "modificar", label: "Modificar" },
    { id: "archivar", label: "Archivar" },
    { id: "eliminar", label: "Eliminar", peligro: true },
];

const contextoAccion = (accion, titulo) => ({
    desmontar: `Quiero desmontar ${titulo}. Reutiliza todo el historial del montaje original para guiarme en el desmontaje correcto: orden de desmontaje, piezas delicadas, cómo clasificar tornillos, cómo embalar y transportar.`,
    reparar: `Quiero reparar ${titulo}. Usa el historial del proyecto original para identificar las piezas, referencias y herramientas necesarias.`,
    mejorar: `Quiero mejorar ${titulo}. Usa el historial del proyecto para proponer mejoras compatibles con el montaje actual.`,
    modificar: `Quiero modificar ${titulo}. Analiza el proyecto original y propone cómo reutilizar piezas existentes para la modificación.`,
}[accion]);

export const MisGuias = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const [guias, setGuias] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("Todos");
    const [menuAbierto, setMenuAbierto] = useState(null);
    const menuRef = useRef(null);

    useEffect(() => {
        if (!token) { navigate("/login"); return; }
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/conversations`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => setGuias(data.items || []))
            .catch(() => { })
            .finally(() => setCargando(false));
    }, []);

    // cierra el menú al hacer click fuera
    useEffect(() => {
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMenuAbierto(null);
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const guiasFiltradas = guias.filter(g => {
        const coincideBusqueda = !busqueda ||
            (g.title || "").toLowerCase().includes(busqueda.toLowerCase());
        const coincideEstado = filtroEstado === "Todos" || g.status === filtroEstado;
        return coincideBusqueda && coincideEstado;
    });

    const ejecutarAccion = (accion, guia) => {
        setMenuAbierto(null);
        if (accion === "eliminar") {
            if (!window.confirm(`¿Eliminar "${guia.title}"? No se puede deshacer.`)) return;
            fetch(`${import.meta.env.VITE_BACKEND_URL}/api/conversations/${guia.id}`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${token}` }
            }).then(() => setGuias(prev => prev.filter(g => g.id !== guia.id)));
            return;
        }
        if (accion === "archivar") {
            // por ahora navega a la ficha — archivar requiere endpoint PATCH
            navigate(`/proyecto/${guia.id}`);
            return;
        }
        // acciones que abren el chat con contexto específico
        const contexto = contextoAccion(accion, guia.title || "este proyecto");
        sessionStorage.setItem("gia_contexto_inicial", contexto);
        sessionStorage.setItem("gia_proyecto_id", guia.id);
        navigate(`/chat?conversation=${guia.id}`);
    };

    return (
        <div className="bg-ivoire dark:bg-noche min-h-screen">
            <div className="max-w-2xl mx-auto px-8 pt-10 pb-16">

                {/* volver */}
                <button
                    onClick={() => navigate("/")}
                    className="flex items-center gap-1.5 text-xs text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire transition-colors mb-8"
                >
                    <ArrowLeft size={13} strokeWidth={1.5} />
                    Inicio
                </button>

                {/* cabecera */}
                <div className="mb-8">
                    <p className="text-[9px] font-semibold tracking-[0.16em] uppercase text-gris-piedra mb-1">
                        Biblioteca técnica
                    </p>
                    <h1 className="text-xl font-medium tracking-tight text-noyer dark:text-mantequilla">
                        Mis guías
                    </h1>
                    <p className="text-sm text-gris-piedra mt-0.5">
                        El expediente técnico completo de cada objeto.
                    </p>
                </div>

                <div className="border-t border-douche dark:border-noche-borde mb-6" />

                {/* buscador */}
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-douche dark:border-noche-borde bg-white dark:bg-noche-suave mb-4">
                    <Search size={14} strokeWidth={1.5} className="text-gris-piedra flex-shrink-0" />
                    <input
                        type="text"
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        placeholder="Buscar por nombre..."
                        className="flex-1 text-sm bg-transparent text-deep-ocean dark:text-ivoire placeholder:text-gris-piedra/40 outline-none"
                    />
                </div>

                {/* filtros */}
                <div className="flex gap-2 flex-wrap mb-6">
                    {ESTADOS.map(estado => (
                        <button
                            key={estado}
                            onClick={() => setFiltroEstado(estado)}
                            className={`px-3 py-1 rounded-lg text-xs transition-all ${filtroEstado === estado
                                ? "bg-deep-ocean dark:bg-sky text-ivoire dark:text-noche font-medium"
                                : "border border-douche dark:border-noche-borde text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire"
                                }`}
                        >
                            {estado === "Todos" ? "Todos" :
                                estado === "en_progreso" ? "En progreso" :
                                    estado === "completado" ? "Completado" :
                                        estado === "pausado" ? "Pausado" : "Cancelado"}
                        </button>
                    ))}
                </div>

                {/* lista */}
                {cargando ? (
                    <div className="flex justify-center py-16">
                        <div className="w-4 h-4 border-2 border-douche border-t-gris-piedra rounded-full animate-spin" />
                    </div>
                ) : guiasFiltradas.length === 0 ? (
                    <div className="text-center py-16">
                        <BookOpen size={32} strokeWidth={1} className="text-gris-piedra/30 mx-auto mb-4" />
                        <p className="text-sm text-gris-piedra mb-6">
                            {busqueda ? "No hay guías que coincidan." : "Aún no tienes guías."}
                        </p>
                        {!busqueda && (
                            <button
                                onClick={() => navigate("/")}
                                className="px-5 py-2.5 rounded-lg bg-deep-ocean dark:bg-sky text-ivoire dark:text-noche text-sm font-medium hover:opacity-90 transition"
                            >
                                Empezar primer proyecto
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="space-y-1" ref={menuRef}>
                        {guiasFiltradas.map((guia) => (
                            <div
                                key={guia.id}
                                className="relative w-full flex items-center justify-between px-4 py-4 rounded-xl bg-white dark:bg-noche-suave border border-douche dark:border-noche-borde hover:border-deep-ocean/20 dark:hover:border-sky/20 hover:bg-douche/10 dark:hover:bg-noche-borde transition-all"
                            >
                                {/* info principal — clickable */}
                                <button
                                    onClick={() => navigate(`/proyecto/${guia.id}`)}
                                    className="flex-1 text-left min-w-0 mr-4"
                                >
                                    <p className="text-sm font-medium text-noyer dark:text-mantequilla truncate mb-1">
                                        {guia.title || "Sin título"}
                                    </p>
                                    <div className="flex items-center gap-3">
                                        {guia.has_manual && (
                                            <span className="text-[10px] font-medium text-noyer dark:text-mantequilla">
                                                Manual
                                            </span>
                                        )}
                                        <span className="text-[10px] text-gris-piedra">
                                            {tiempoRelativo(guia.updated_at)}
                                        </span>
                                        {guia.message_count > 0 && (
                                            <span className="text-[10px] text-gris-piedra">
                                                · {guia.message_count} mensajes
                                            </span>
                                        )}
                                    </div>
                                </button>

                                {/* menú contextual ··· */}
                                <div className="relative flex-shrink-0">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setMenuAbierto(menuAbierto === guia.id ? null : guia.id);
                                        }}
                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire hover:bg-douche/50 dark:hover:bg-white/5 transition"
                                    >
                                        <MoreHorizontal size={14} strokeWidth={1.5} />
                                    </button>

                                    {menuAbierto === guia.id && (
                                        <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-douche dark:border-noche-borde bg-white dark:bg-noche-suave shadow-lg overflow-hidden z-50">
                                            {ACCIONES_MENU.map(accion => (
                                                <button
                                                    key={accion.id}
                                                    onClick={() => ejecutarAccion(accion.id, guia)}
                                                    className={`w-full text-left px-4 py-2.5 text-xs transition ${accion.peligro
                                                        ? "text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                                                        : "text-deep-ocean dark:text-ivoire hover:bg-douche/40 dark:hover:bg-white/5"
                                                        }`}
                                                >
                                                    {accion.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};