import { useState } from "react";
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

    const crearProyecto = async () => {
        if (!nombre.trim()) return;
        setCargando(true);
        setError("");

        // timeout de 20 segundos — si groq no responde mostramos error
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 20000);

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
                setError("GIA tardó demasiado en responder. Comprueba tu conexión e inténtalo de nuevo.");
            } else {
                setError("Error de conexión. Comprueba que el servidor está activo.");
            }
        } finally {
            setCargando(false);
        }
    };

    const subirManual = async () => {
        if (!archivo || !conversacionId) {
            // si no hay manual saltamos al chat directamente
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
                // doy opción de continuar sin manual
            }
        } catch (err) {
            setError("Error subiendo el manual. Puedes continuar sin él.");
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="bg-ivoire dark:bg-noche min-h-screen">
            <div className="max-w-lg mx-auto px-8 pt-10 pb-16">

                <button
                    onClick={() => paso === 1 ? navigate("/") : setPaso(1)}
                    className="flex items-center gap-1.5 text-xs text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire transition-colors mb-8"
                >
                    <ArrowLeft size={13} strokeWidth={1.5} />
                    {paso === 1 ? "Inicio" : "Atrás"}
                </button>

                {/* stepper */}
                <div className="flex items-center gap-1.5 mb-10">
                    {[1, 2].map(i => (
                        <div
                            key={i}
                            className={`h-0.5 flex-1 rounded-full transition-all ${i <= paso ? "bg-noyer dark:bg-mantequilla" : "bg-douche dark:bg-noche-borde"}`}
                        />
                    ))}
                </div>

                {/* paso 1 — nombre */}
                {paso === 1 && (
                    <div>
                        <p className="text-[9px] font-semibold tracking-[0.16em] uppercase text-gris-piedra mb-2">
                            Paso 1 de 2
                        </p>
                        <h1 className="text-xl font-medium tracking-tight text-noyer dark:text-mantequilla mb-6">
                            ¿Cómo se llama el proyecto?
                        </h1>

                        <input
                            type="text"
                            value={nombre}
                            onChange={e => setNombre(e.target.value)}
                            onKeyDown={e => e.key === "Enter" && nombre.trim() && !cargando && crearProyecto()}
                            placeholder="Ej: Armario IKEA dormitorio"
                            autoFocus
                            className="w-full px-4 py-3 rounded-xl border border-douche dark:border-noche-borde bg-white dark:bg-noche-suave text-deep-ocean dark:text-ivoire placeholder:text-gris-piedra/40 text-sm outline-none focus:border-deep-ocean/40 dark:focus:border-sky/40 transition mb-4"
                        />

                        {error && (
                            <p className="text-xs text-red-500 mb-4">{error}</p>
                        )}

                        <button
                            onClick={crearProyecto}
                            disabled={!nombre.trim() || cargando}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-deep-ocean dark:bg-sky text-ivoire dark:text-noche text-sm font-medium hover:opacity-90 transition disabled:opacity-40"
                        >
                            {cargando ? (
                                <>
                                    <Loader size={14} strokeWidth={1.5} className="animate-spin" />
                                    Creando proyecto...
                                </>
                            ) : (
                                <>
                                    Continuar
                                    <ArrowRight size={14} strokeWidth={1.5} />
                                </>
                            )}
                        </button>

                        {cargando && (
                            <p className="text-xs text-gris-piedra mt-3">
                                GIA está preparando tu proyecto. Puede tardar unos segundos...
                            </p>
                        )}
                    </div>
                )}

                {/* paso 2 — manual */}
                {paso === 2 && (
                    <div>
                        <p className="text-[9px] font-semibold tracking-[0.16em] uppercase text-gris-piedra mb-2">
                            Paso 2 de 2
                        </p>
                        <h1 className="text-xl font-medium tracking-tight text-noyer dark:text-mantequilla mb-2">
                            ¿Tienes el manual en PDF?
                        </h1>
                        <p className="text-sm text-gris-piedra mb-6">
                            Es opcional. Puedes subirlo ahora o más tarde desde el chat.
                        </p>

                        <label className={`w-full flex items-center justify-center gap-2 px-4 py-8 rounded-xl border-2 border-dashed cursor-pointer transition mb-4 ${archivo ? "border-noyer dark:border-mantequilla bg-noyer/5 dark:bg-mantequilla/5" : "border-douche dark:border-noche-borde hover:border-deep-ocean/30 dark:hover:border-sky/30"}`}>
                            <input
                                type="file"
                                accept=".pdf"
                                onChange={e => setArchivo(e.target.files[0])}
                                className="hidden"
                            />
                            <FileText size={16} strokeWidth={1.5} className={archivo ? "text-noyer dark:text-mantequilla" : "text-gris-piedra"} />
                            <span className={`text-sm ${archivo ? "text-noyer dark:text-mantequilla font-medium" : "text-gris-piedra"}`}>
                                {archivo ? archivo.name : "Seleccionar PDF"}
                            </span>
                        </label>

                        {error && (
                            <p className="text-xs text-red-500 mb-4">{error}</p>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={subirManual}
                                disabled={cargando}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-deep-ocean dark:bg-sky text-ivoire dark:text-noche text-sm font-medium hover:opacity-90 transition disabled:opacity-40"
                            >
                                {cargando ? (
                                    <>
                                        <Loader size={14} strokeWidth={1.5} className="animate-spin" />
                                        {archivo ? "Subiendo manual..." : "Abriendo chat..."}
                                    </>
                                ) : (
                                    <>
                                        {archivo ? "Subir y empezar" : "Empezar sin manual"}
                                        <ArrowRight size={14} strokeWidth={1.5} />
                                    </>
                                )}
                            </button>

                            {archivo && (
                                <button
                                    onClick={() => navigate(`/chat?conversation=${conversacionId}`)}
                                    className="px-4 py-2.5 rounded-lg border border-douche dark:border-noche-borde text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire text-sm transition"
                                >
                                    Saltar por ahora
                                </button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};