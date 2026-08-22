import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Hammer, Wrench, Plus, Trash2, ArrowRight,
    Lightbulb, Tv, Armchair, Wind, Drill, Thermometer,
    WashingMachine, Refrigerator, Layers, Package, FolderOpen
} from "lucide-react";

const detectarIcono = (titulo) => {
    if (!titulo) return Hammer;
    const t = titulo.toLowerCase();
    if (t.includes("lámpara") || t.includes("luz") || t.includes("iluminación")) return Lightbulb;
    if (t.includes("tv") || t.includes("televisor") || t.includes("pantalla")) return Tv;
    if (t.includes("silla") || t.includes("sillón") || t.includes("sofá")) return Armchair;
    if (t.includes("aire") || t.includes("ventilador") || t.includes("climatización")) return Wind;
    if (t.includes("calefacción") || t.includes("radiador") || t.includes("termostato")) return Thermometer;
    if (t.includes("nevera") || t.includes("frigorífico")) return Refrigerator;
    if (t.includes("lavadora") || t.includes("secadora") || t.includes("lavavajillas")) return WashingMachine;
    if (t.includes("taladro") || t.includes("colgar") || t.includes("pared")) return Drill;
    if (t.includes("mueble") || t.includes("armario") || t.includes("cómoda") || t.includes("mesa") || t.includes("estantería")) return Layers;
    if (t.includes("reparar") || t.includes("arreglar") || t.includes("restaurar")) return Wrench;
    if (t.includes("instalar")) return Package;
    return Hammer;
};

const tiempoRelativo = (fechaStr) => {
    if (!fechaStr) return "";
    const diff = Date.now() - new Date(fechaStr).getTime();
    const min = Math.floor(diff / 60000);
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (min < 2) return "Ahora mismo";
    if (min < 60) return `Hace ${min} min`;
    if (h < 24) return `Hace ${h}h`;
    if (d === 1) return "Ayer";
    return `Hace ${d} días`;
};

const FILTROS = [
    { id: "en_progreso", label: "En progreso" },
    { id: "completado", label: "Completados" },
];

export const Montajes = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const [conversaciones, setConversaciones] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [borrandoId, setBorrandoId] = useState(null);
    const [filtro, setFiltro] = useState("en_progreso");
    const [isDark, setIsDark] = useState(
        document.documentElement.classList.contains("dark")
    );

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains("dark"));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!token) return;
        cargarConversaciones();
    }, []);

    const cargarConversaciones = async () => {
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/conversations`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();
            setConversaciones(data.items || []);
        } catch (err) {
            console.error("error cargando conversaciones:", err);
        } finally {
            setCargando(false);
        }
    };

    const borrarConversacion = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("¿Seguro que quieres borrar este proyecto?")) return;
        setBorrandoId(id);
        try {
            await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/conversations/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            setConversaciones(prev => prev.filter(c => c.id !== id));
        } catch (err) {
            console.error("error borrando conversacion:", err);
        } finally {
            setBorrandoId(null);
        }
    };

    const conversacionesFiltradas = conversaciones.filter(c => c.status === filtro);
    const enProgreso = conversaciones.filter(c => c.status === "en_progreso").length;
    const completados = conversaciones.filter(c => c.status === "completado").length;

    const borderColor = isDark ? "#3A4150" : "#DDD6CE";
    const bg = isDark ? "#232830" : "#FAF8F6";

    return (
        <div style={{ background: bg, minHeight: "100%", padding: "40px 48px" }}>
            <div style={{ maxWidth: "1200px", width: "100%" }}>

                {/* cabecera */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
                    <div>
                        <h1 style={{ fontSize: "24px", fontWeight: "500", color: isDark ? "#F0DFA8" : "#A9895C", letterSpacing: "-0.02em", marginBottom: "4px" }}>
                            Mis montajes
                        </h1>
                        <p style={{ fontSize: "13px", color: "#BAB3AE" }}>
                            {enProgreso} en progreso · {completados} completados
                        </p>
                    </div>
                    <button
                        onClick={() => navigate("/nuevo-proyecto")}
                        style={{
                            display: "flex", alignItems: "center", gap: "8px",
                            padding: "10px 18px", borderRadius: "10px",
                            background: "#3C5160", color: "#FAF8F6",
                            fontSize: "13px", fontWeight: "500",
                            border: "none", cursor: "pointer"
                        }}
                    >
                        <Plus size={15} strokeWidth={2} />
                        Nuevo proyecto
                    </button>
                </div>

                {/* filtros */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "28px" }}>
                    {FILTROS.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setFiltro(f.id)}
                            style={{
                                padding: "6px 16px",
                                borderRadius: "8px",
                                fontSize: "13px",
                                border: `1px solid ${filtro === f.id ? "#A9895C" : borderColor}`,
                                background: filtro === f.id
                                    ? (isDark ? "rgba(169,137,92,0.15)" : "rgba(169,137,92,0.08)")
                                    : "transparent",
                                color: filtro === f.id ? "#A9895C" : "#BAB3AE",
                                cursor: "pointer",
                                fontWeight: filtro === f.id ? "500" : "400",
                                transition: "all 0.15s"
                            }}
                        >
                            {f.label}
                            <span style={{
                                marginLeft: "6px",
                                fontSize: "11px",
                                color: filtro === f.id ? "#A9895C" : "#BAB3AE"
                            }}>
                                {f.id === "en_progreso" ? enProgreso : completados}
                            </span>
                        </button>
                    ))}
                </div>

                {/* contenido */}
                {cargando ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
                        <div style={{ width: "24px", height: "24px", border: `2px solid ${borderColor}`, borderTopColor: "#A9895C", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    </div>
                ) : conversacionesFiltradas.length === 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: "12px" }}>
                        <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: isDark ? "#2C323C" : "#F0EDE8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <FolderOpen size={22} strokeWidth={1.4} style={{ color: "#A9895C" }} />
                        </div>
                        <p style={{ fontSize: "15px", fontWeight: "500", color: isDark ? "#FAF8F6" : "#3C5160" }}>
                            {filtro === "en_progreso" ? "No tienes proyectos en progreso" : "No tienes proyectos completados"}
                        </p>
                        {filtro === "en_progreso" && (
                            <button
                                onClick={() => navigate("/nuevo-proyecto")}
                                style={{ marginTop: "8px", padding: "10px 20px", borderRadius: "10px", background: "#3C5160", color: "#FAF8F6", fontSize: "13px", border: "none", cursor: "pointer" }}
                            >
                                Nuevo proyecto
                            </button>
                        )}
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
                        {conversacionesFiltradas.map(conv => {
                            const Icono = detectarIcono(conv.title);
                            const esBorrando = borrandoId === conv.id;
                            const progreso = filtro === "completado" ? 100 : (conv.progress || 0);

                            return (
                                <div
                                    key={conv.id}
                                    onClick={() => navigate(`/chat?conversation=${conv.id}`)}
                                    style={{
                                        background: isDark ? "rgba(44,50,60,0.50)" : "#ffffff",
                                        border: `1px solid ${borderColor}`,
                                        borderRadius: "12px",
                                        padding: "20px",
                                        cursor: "pointer",
                                        transition: "all 0.15s"
                                    }}
                                    className="hover:-translate-y-0.5"
                                >
                                    {/* cabecera card */}
                                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "14px" }}>
                                        <div style={{
                                            width: "40px", height: "40px", borderRadius: "10px",
                                            background: isDark ? "#3A4150" : "#F0EDE8",
                                            display: "flex", alignItems: "center", justifyContent: "center"
                                        }}>
                                            <Icono size={18} strokeWidth={1.4} style={{ color: "#A9895C" }} />
                                        </div>
                                        <button
                                            onClick={(e) => borrarConversacion(e, conv.id)}
                                            disabled={esBorrando}
                                            style={{
                                                width: "28px", height: "28px", borderRadius: "7px",
                                                display: "flex", alignItems: "center", justifyContent: "center",
                                                background: "transparent", border: "none", cursor: "pointer",
                                                color: "#BAB3AE"
                                            }}
                                            className="hover:text-red-400"
                                        >
                                            {esBorrando
                                                ? <div style={{ width: "12px", height: "12px", border: "1.5px solid #BAB3AE", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                                                : <Trash2 size={14} strokeWidth={1.5} />
                                            }
                                        </button>
                                    </div>

                                    {/* título */}
                                    <p style={{ fontSize: "14px", fontWeight: "500", color: isDark ? "#FAF8F6" : "#3C5160", marginBottom: "6px", lineHeight: "1.4" }}>
                                        {conv.title || "Proyecto sin título"}
                                    </p>

                                    {/* meta */}
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                                        <span style={{ fontSize: "11px", color: "#BAB3AE" }}>
                                            {tiempoRelativo(conv.updated_at)}
                                        </span>
                                        {conv.has_manual && (
                                            <>
                                                <span style={{ color: borderColor }}>·</span>
                                                <span style={{ fontSize: "11px", color: "#A9895C" }}>Manual</span>
                                            </>
                                        )}
                                    </div>

                                    {/* barra progreso — siempre visible */}
                                    <div style={{ marginBottom: "16px" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                                            <span style={{ fontSize: "11px", color: "#BAB3AE" }}>Progreso</span>
                                            <span style={{ fontSize: "11px", color: filtro === "completado" ? "#4CAF50" : "#A9895C", fontWeight: "500" }}>
                                                {progreso}%
                                            </span>
                                        </div>
                                        <div style={{ height: "3px", background: isDark ? "#3A4150" : "#DDD6CE", borderRadius: "2px" }}>
                                            <div style={{
                                                height: "100%",
                                                width: `${progreso}%`,
                                                background: filtro === "completado" ? "#4CAF50" : "#A9895C",
                                                borderRadius: "2px",
                                                transition: "width 0.5s ease"
                                            }} />
                                        </div>
                                    </div>

                                    {/* continuar */}
                                    <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: isDark ? "#A9B5C2" : "#3C5160", fontWeight: "500" }}>
                                        {filtro === "completado" ? "Ver proyecto" : "Continuar"}
                                        <ArrowRight size={13} strokeWidth={1.5} />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};