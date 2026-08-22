import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, FileText, Loader } from "lucide-react";

export const NuevoProyecto = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    const [paso, setPaso] = useState(1);
    const [nombre, setNombre] = useState("");
    const [archivo, setArchivo] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");
    const [conversacionId, setConversacionId] = useState(null);
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

    const crearProyecto = async () => {
        if (!nombre.trim()) return;
        setCargando(true);
        setError("");

        // timeout 60 segundos
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 60000);

        try {
            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/chat`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        message: `Voy a empezar un nuevo proyecto: ${nombre}`,
                        conversation_id: null,
                        current_time: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
                    }),
                    signal: controller.signal
                }
            );

            clearTimeout(timeout);
            const data = await response.json();

            if (data.conversation_id) {
                setConversacionId(data.conversation_id);
                setPaso(2);
            } else {
                setError("No se pudo crear el proyecto. Inténtalo de nuevo.");
            }
        } catch (err) {
            clearTimeout(timeout);
            if (err.name === "AbortError") {
                setError("GIA tardó demasiado. Comprueba tu conexión e inténtalo de nuevo.");
            } else {
                setError("Error de conexión. Comprueba que el servidor está activo.");
            }
        } finally {
            setCargando(false);
        }
    };

    const subirManual = async () => {
        if (!archivo || !conversacionId) {
            navigate(`/chat?conversation=${conversacionId}`);
            return;
        }

        setCargando(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("file", archivo);

            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/manuals/${conversacionId}/upload`,
                {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` },
                    body: formData
                }
            );

            if (response.ok) {
                navigate(`/chat?conversation=${conversacionId}`);
            } else {
                setError("No se pudo subir el manual. Puedes subirlo más tarde desde el chat.");
            }
        } catch (err) {
            setError("Error subiendo el manual. Puedes continuar sin él.");
        } finally {
            setCargando(false);
        }
    };

    const borderColor = isDark ? "#3A4150" : "#DDD6CE";
    const bg = isDark ? "#232830" : "#FAF8F6";
    const cardBg = isDark ? "rgba(44,50,60,0.50)" : "#ffffff";

    return (
        <div style={{ background: bg, minHeight: "100%", padding: "40px 48px" }}>
            <div style={{ maxWidth: "560px" }}>

                {/* volver */}
                <button
                    onClick={() => paso === 1 ? navigate("/") : setPaso(1)}
                    style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        fontSize: "13px", color: "#BAB3AE",
                        background: "none", border: "none", cursor: "pointer",
                        marginBottom: "40px", padding: 0
                    }}
                    className="hover:text-deep-ocean dark:hover:text-ivoire transition"
                >
                    <ArrowLeft size={14} strokeWidth={1.5} />
                    {paso === 1 ? "Inicio" : "Atrás"}
                </button>

                {/* stepper */}
                <div style={{ display: "flex", gap: "6px", marginBottom: "40px" }}>
                    {[1, 2].map(i => (
                        <div
                            key={i}
                            style={{
                                flex: 1, height: "3px", borderRadius: "2px",
                                background: i <= paso ? "#A9895C" : borderColor,
                                transition: "background 0.3s"
                            }}
                        />
                    ))}
                </div>

                {/* paso 1 */}
                {paso === 1 && (
                    <div>
                        <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.12em", textTransform: "uppercase", color: "#BAB3AE", marginBottom: "8px" }}>
                            Paso 1 de 2
                        </p>
                        <h1 style={{ fontSize: "24px", fontWeight: "500", color: isDark ? "#F0DFA8" : "#A9895C", letterSpacing: "-0.02em", marginBottom: "8px" }}>
                            ¿Qué vas a hacer?
                        </h1>
                        <p style={{ fontSize: "13px", color: "#BAB3AE", marginBottom: "32px" }}>
                            Dale un nombre a tu proyecto — puede ser el mueble, electrodoméstico o lo que vayas a montar, reparar o instalar.
                        </p>

                        <input
                            type="text"
                            value={nombre}
                            onChange={e => setNombre(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && nombre.trim() && !cargando && crearProyecto()}
                            placeholder="Ej: Armario IKEA dormitorio"
                            autoFocus
                            style={{
                                width: "100%",
                                padding: "14px 16px",
                                borderRadius: "10px",
                                border: `1px solid ${borderColor}`,
                                background: cardBg,
                                color: isDark ? "#FAF8F6" : "#3C5160",
                                fontSize: "14px",
                                outline: "none",
                                marginBottom: "8px",
                                boxSizing: "border-box"
                            }}
                        />

                        {error && (
                            <p style={{ fontSize: "12px", color: "#ef4444", marginBottom: "16px" }}>{error}</p>
                        )}

                        <button
                            onClick={crearProyecto}
                            disabled={!nombre.trim() || cargando}
                            style={{
                                display: "flex", alignItems: "center", gap: "8px",
                                padding: "12px 24px", borderRadius: "10px",
                                background: nombre.trim() && !cargando ? "#3C5160" : (isDark ? "#3A4150" : "#DDD6CE"),
                                color: nombre.trim() && !cargando ? "#FAF8F6" : "#BAB3AE",
                                fontSize: "14px", fontWeight: "500",
                                border: "none", cursor: nombre.trim() && !cargando ? "pointer" : "default",
                                marginTop: "16px", transition: "all 0.2s"
                            }}
                        >
                            {cargando ? (
                                <>
                                    <Loader size={15} strokeWidth={1.5} style={{ animation: "spin 0.8s linear infinite" }} />
                                    Creando proyecto...
                                </>
                            ) : (
                                <>
                                    Continuar
                                    <ArrowRight size={15} strokeWidth={1.5} />
                                </>
                            )}
                        </button>

                        {cargando && (
                            <p style={{ fontSize: "12px", color: "#BAB3AE", marginTop: "12px" }}>
                                GIA está preparando tu proyecto. Puede tardar hasta 30 segundos...
                            </p>
                        )}
                    </div>
                )}

                {/* paso 2 */}
                {paso === 2 && (
                    <div>
                        <p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.12em", textTransform: "uppercase", color: "#BAB3AE", marginBottom: "8px" }}>
                            Paso 2 de 2
                        </p>
                        <h1 style={{ fontSize: "24px", fontWeight: "500", color: isDark ? "#F0DFA8" : "#A9895C", letterSpacing: "-0.02em", marginBottom: "8px" }}>
                            ¿Tienes el manual en PDF?
                        </h1>
                        <p style={{ fontSize: "13px", color: "#BAB3AE", marginBottom: "32px" }}>
                            Es opcional. Puedes subirlo ahora o más tarde desde el chat.
                        </p>

                        <label style={{
                            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                            gap: "10px", padding: "40px 24px",
                            borderRadius: "12px",
                            border: `2px dashed ${archivo ? "#A9895C" : borderColor}`,
                            background: archivo ? (isDark ? "rgba(169,137,92,0.08)" : "rgba(169,137,92,0.05)") : "transparent",
                            cursor: "pointer", marginBottom: "24px",
                            transition: "all 0.2s"
                        }}>
                            <input type="file" accept=".pdf" onChange={e => setArchivo(e.target.files[0])} style={{ display: "none" }} />
                            <FileText size={24} strokeWidth={1.4} style={{ color: archivo ? "#A9895C" : "#BAB3AE" }} />
                            <span style={{ fontSize: "14px", color: archivo ? "#A9895C" : "#BAB3AE", fontWeight: archivo ? "500" : "400" }}>
                                {archivo ? archivo.name : "Seleccionar PDF"}
                            </span>
                            {!archivo && (
                                <span style={{ fontSize: "12px", color: "#BAB3AE" }}>
                                    Pulsa para seleccionar
                                </span>
                            )}
                        </label>

                        {error && (
                            <p style={{ fontSize: "12px", color: "#ef4444", marginBottom: "16px" }}>{error}</p>
                        )}

                        <div style={{ display: "flex", gap: "12px" }}>
                            <button
                                onClick={subirManual}
                                disabled={cargando}
                                style={{
                                    display: "flex", alignItems: "center", gap: "8px",
                                    padding: "12px 24px", borderRadius: "10px",
                                    background: "#3C5160", color: "#FAF8F6",
                                    fontSize: "14px", fontWeight: "500",
                                    border: "none", cursor: cargando ? "default" : "pointer",
                                    opacity: cargando ? 0.7 : 1, transition: "opacity 0.2s"
                                }}
                            >
                                {cargando ? (
                                    <>
                                        <Loader size={15} strokeWidth={1.5} style={{ animation: "spin 0.8s linear infinite" }} />
                                        {archivo ? "Subiendo..." : "Abriendo chat..."}
                                    </>
                                ) : (
                                    <>
                                        {archivo ? "Subir y empezar" : "Empezar sin manual"}
                                        <ArrowRight size={15} strokeWidth={1.5} />
                                    </>
                                )}
                            </button>

                            {archivo && (
                                <button
                                    onClick={() => navigate(`/chat?conversation=${conversacionId}`)}
                                    style={{
                                        padding: "12px 20px", borderRadius: "10px",
                                        background: "transparent", color: "#BAB3AE",
                                        fontSize: "14px", border: `1px solid ${borderColor}`,
                                        cursor: "pointer"
                                    }}
                                >
                                    Saltar por ahora
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
};