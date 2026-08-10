import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, BookOpen, Search, MoreHorizontal, CheckCircle, Circle, XCircle, Clock } from "lucide-react";

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
    desmontar: `Quiero desmontar ${titulo}. Reutiliza todo el historial del montaje original para guiarme en el desmontaje correcto.`,
    reparar: `Quiero reparar ${titulo}. Usa el historial del proyecto original para identificar las piezas, referencias y herramientas necesarias.`,
    mejorar: `Quiero mejorar ${titulo}. Usa el historial del proyecto para proponer mejoras compatibles con el montaje actual.`,
    modificar: `Quiero modificar ${titulo}. Analiza el proyecto original y propone cómo reutilizar piezas existentes.`,
}[accion]);

const EstadoBadge = ({ status }) => {
    const config = {
        completado: {
            icono: <CheckCircle size={12} strokeWidth={1.5} />,
            label: "Completado",
            clase: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20"
        },
        en_progreso: {
            icono: <Circle size={12} strokeWidth={1.5} />,
            label: "En curso",
            clase: "text-deep-ocean dark:text-sky bg-deep-ocean/5 dark:bg-sky/10"
        },
        cancelado: {
            icono: <XCircle size={12} strokeWidth={1.5} />,
            label: "Cancelado",
            clase: "text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20"
        },
        pausado: {
            icono: <Clock size={12} strokeWidth={1.5} />,
            label: "Pausado",
            clase: "text-gris-piedra bg-douche dark:bg-noche-borde"
        },
    };

    const c = config[status] || config["en_progreso"];

    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium ${c.clase}`}>
            {c.icono}
            {c.label}
        </span>
    );
};

const BarraProgreso = ({ progreso }) => (
    <div className="flex items-center gap-2 min-w-[80px]">
        <div className="flex-1 h-1 bg-douche dark:bg-noche-borde rounded-full overflow-hidden">
            <div
                className="h-full bg-noyer dark:bg-mantequilla rounded-full transition-all duration-500"
                style={{ width: `${progreso || 0}%` }}
            />
        </div>
        <span className="text-[10px] text-gris-piedra flex-shrink-0 w-7 text-right">
            {progreso || 0}%
        </span>
    </div>
);

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
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/conversations?type=guia`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => setGuias(data.items || []))
            .catch(() => { })
            .finally(() => setCargando(false));
    }, []);

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
            navigate(`/proyecto/${guia.id}`);
            return;
        }
        const contexto = contextoAccion(accion, guia.title || "este proyecto");
        if (contexto) {
            sessionStorage.setItem("gia_contexto_inicial", contexto);
            sessionStorage.setItem("gia_proyecto_id", guia.id);
            navigate(`/chat?conversation=${guia.id}`);
        }
    };

    return (
        <div className="bg-ivoire dark:bg-noche min-h-screen">
            <div className="max-w-4xl mx-auto px-8 pt-10 pb-16">

                <button
                    onClick={() => navigate("/")}
                    className="flex items-center gap-1.5 text-xs text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire transition-colors mb-8"
                >
                    <ArrowLeft size={13} strokeWidth={1.5} />
                    Inicio
                </button>

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

                {/* buscador y filtros */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-douche dark:border-noche-borde bg-white dark:bg-noche-suave flex-1">
                        <Search size={14} strokeWidth={1.5} className="text-gris-piedra flex-shrink-0" />
                        <input
                            type="text"
                            value={busqueda}
                            onChange={e => setBusqueda(e.target.value)}
                            placeholder="Buscar por nombre..."
                            className="flex-1 text-sm bg-transparent text-deep-ocean dark:text-ivoire placeholder:text-gris-piedra/40 outline-none"
                        />
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {ESTADOS.map(estado => (
                            <button
                                key={estado}
                                onClick={() => setFiltroEstado(estado)}
                                className={`px-3 py-1 rounded-lg text-xs transition-all whitespace-nowrap ${filtroEstado === estado
                                    ? "bg-deep-ocean dark:bg-sky text-ivoire dark:text-noche font-medium"
                                    : "border border-douche dark:border-noche-borde text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire"
                                    }`}
                            >
                                {estado === "Todos" ? "Todos" :
                                    estado === "en_progreso" ? "En curso" :
                                        estado === "completado" ? "Completado" :
                                            estado === "pausado" ? "Pausado" : "Cancelado"}
                            </button>
                        ))}
                    </div>
                </div>

                {/* panel de datos */}
                {cargando ? (
                    <div className="flex justify-center py-16">
                        <div className="w-4 h-4 border-2 border-douche border-t-gris-piedra rounded-full animate-spin" />
                    </div>
                ) : guiasFiltradas.length === 0 ? (
                    <div className="text-center py-16">
                        <BookOpen size={32} strokeWidth={1} className="text-gris-piedra/30 mx-auto mb-4" />
                        <p className="text-sm text-gris-piedra mb-2">
                            {busqueda ? "No hay guías que coincidan." : "Aún no tienes guías."}
                        </p>
                        {!busqueda && (
                            <p className="text-xs text-gris-piedra/50">
                                Las guías son expedientes técnicos de objetos.
                            </p>
                        )}
                    </div>
                ) : (
                    <div className="rounded-xl border border-douche dark:border-noche-borde overflow-hidden">

                        {/* cabecera tabla */}
                        <div className="grid grid-cols-[1fr_120px_100px_80px] gap-4 px-4 py-2.5 bg-white dark:bg-noche-suave border-b border-douche dark:border-noche-borde">
                            <span className="text-[9px] font-semibold tracking-[0.14em] uppercase text-gris-piedra">Proyecto</span>
                            <span className="text-[9px] font-semibold tracking-[0.14em] uppercase text-gris-piedra">Estado</span>
                            <span className="text-[9px] font-semibold tracking-[0.14em] uppercase text-gris-piedra">Progreso</span>
                            <span className="text-[9px] font-semibold tracking-[0.14em] uppercase text-gris-piedra text-right">Acciones</span>
                        </div>

                        {/* filas */}
                        <div ref={menuRef}>
                            {guiasFiltradas.map((guia, i) => (
                                <div
                                    key={guia.id}
                                    className={`grid grid-cols-[1fr_120px_100px_80px] gap-4 px-4 py-3.5 items-center hover:bg-douche/30 dark:hover:bg-white/3 transition ${i !== guiasFiltradas.length - 1 ? "border-b border-douche dark:border-noche-borde" : ""}`}
                                >
                                    {/* nombre */}
                                    <button
                                        onClick={() => navigate(`/proyecto/${guia.id}`)}
                                        className="text-left min-w-0"
                                    >
                                        <p className="text-sm font-medium text-noyer dark:text-mantequilla truncate">
                                            {guia.title || "Sin título"}
                                        </p>
                                        {guia.has_manual && (
                                            <span className="text-[10px] text-gris-piedra">Manual</span>
                                        )}
                                    </button>

                                    {/* estado */}
                                    <div>
                                        <EstadoBadge status={guia.status} />
                                    </div>

                                    {/* progreso */}
                                    <BarraProgreso progreso={guia.progress} />

                                    {/* acciones */}
                                    <div className="flex justify-end relative">
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
                    </div>
                )}
            </div>
        </div>
    );
};