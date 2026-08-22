import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Hammer, Wrench, Plus, Trash2, ArrowRight, BookOpen,
    Lightbulb, Tv, Armchair, Wind, Drill, Thermometer,
    WashingMachine, Refrigerator, Layers, Package, FileText
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

export const MisGuias = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const [guias, setGuias] = useState([]);
    const [cargando, setCargando] = useState(true);
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
        fetch(`${import.meta.env.VITE_BACKEND_URL}/api/conversations`, {
            headers: { "Authorization": `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => {
                // solo proyectos que tienen manual
                const conManual = (data.items || []).filter(c => c.has_manual);
                setGuias(conManual);
            })
            .catch(() => { })
            .finally(() => setCargando(false));
    }, []);

    const borderColor = isDark ? "#3A4150" : "#DDD6CE";
    const bg = isDark ? "#232830" : "#FAF8F6";

    return (
        <div style={{ background: bg, minHeight: "100%", padding: "40px 48px" }}>
            <div style={{ maxWidth: "1200px", width: "100%" }}>

                {/* cabecera */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "32px" }}>
                    <div>
                        <h1 style={{ fontSize: "24px", fontWeight: "500", color: isDark ? "#F0DFA8" : "#A9895C", letterSpacing: "-0.02em", marginBottom: "4px" }}>
                            Manuales
                        </h1>
                        <p style={{ fontSize: "13px", color: "#BAB3AE" }}>
                            {guias.length} {guias.length === 1 ? "manual analizado" : "manuales analizados"}
                        </p>
                    </div>
                    <button
                        onClick={() => navigate("/chat")}
                        style={{
                            display: "flex", alignItems: "center", gap: "8px",
                            padding: "10px 18px", borderRadius: "10px",
                            background: "#3C5160", color: "#FAF8F6",
                            fontSize: "13px", fontWeight: "500",
                            border: "none", cursor: "pointer"
                        }}
                    >
                        <Plus size={15} strokeWidth={2} />
                        Subir manual
                    </button>
                </div>

                {/* contenido */}
                {cargando ? (
                    <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
                        <div style={{ width: "24px", height: "24px", border: `2px solid ${borderColor}`, borderTopColor: "#A9895C", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                    </div>
                ) : guias.length === 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: "12px" }}>
                        <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: isDark ? "#2C323C" : "#F0EDE8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <BookOpen size={22} strokeWidth={1.4} style={{ color: "#A9895C" }} />
                        </div>
                        <p style={{ fontSize: "15px", fontWeight: "500", color: isDark ? "#FAF8F6" : "#3C5160" }}>
                            Aún no tienes manuales analizados
                        </p>
                        <p style={{ fontSize: "13px", color: "#BAB3AE", textAlign: "center", maxWidth: "300px" }}>
                            Sube un PDF en cualquier conversación y GIA lo analizará automáticamente.
                        </p>
                        <button
                            onClick={() => navigate("/chat")}
                            style={{ marginTop: "8px", padding: "10px 20px", borderRadius: "10px", background: "#3C5160", color: "#FAF8F6", fontSize: "13px", border: "none", cursor: "pointer" }}
                        >
                            Ir al chat
                        </button>
                    </div>
                ) : (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
                        {guias.map(guia => {
                            const Icono = detectarIcono(guia.title);
                            return (
                                <div
                                    key={guia.id}
                                    onClick={() => navigate(`/chat?conversation=${guia.id}`)}
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
                                    <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "14px" }}>
                                        <div style={{
                                            width: "40px", height: "40px", borderRadius: "10px",
                                            background: isDark ? "#3A4150" : "#F0EDE8",
                                            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                                        }}>
                                            <Icono size={18} strokeWidth={1.4} style={{ color: "#A9895C" }} />
                                        </div>
                                        <div style={{ minWidth: 0 }}>
                                            <p style={{ fontSize: "14px", fontWeight: "500", color: isDark ? "#FAF8F6" : "#3C5160", marginBottom: "3px", lineHeight: "1.3" }}>
                                                {guia.title || "Sin título"}
                                            </p>
                                            <p style={{ fontSize: "11px", color: "#BAB3AE" }}>
                                                {tiempoRelativo(guia.updated_at)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* badge manual */}
                                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px" }}>
                                        <FileText size={12} strokeWidth={1.5} style={{ color: "#A9895C" }} />
                                        <span style={{ fontSize: "11px", color: "#A9895C", fontWeight: "500" }}>
                                            Manual analizado
                                        </span>
                                        {guia.status === "completado" && (
                                            <>
                                                <span style={{ color: borderColor }}>·</span>
                                                <span style={{ fontSize: "11px", color: "#4CAF50", fontWeight: "500" }}>Completado</span>
                                            </>
                                        )}
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "12px", color: isDark ? "#A9B5C2" : "#3C5160", fontWeight: "500" }}>
                                        Abrir guía <ArrowRight size={13} strokeWidth={1.5} />
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