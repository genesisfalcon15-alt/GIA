import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Upload, ArrowRight, ArrowLeft, Check, X } from "lucide-react";

const PASOS = ["Nombre", "Manual", "Análisis", "Resumen"];

export const NuevoProyecto = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const fileInputRef = useRef(null);

    const [paso, setPaso] = useState(0);
    const [nombre, setNombre] = useState("");
    const [projectId, setProjectId] = useState(null);
    const [analizando, setAnalizando] = useState(false);
    const [resumen, setResumen] = useState(null);
    const [error, setError] = useState(null);

    const volver = () => {
        if (paso === 0) navigate("/");
        else setPaso(paso - 1);
    };

    const crearProyecto = async () => {
        if (!nombre.trim()) return;
        setError(null);
        try {
            const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/chat`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    conversation_id: null,
                    message: `Voy a empezar un nuevo proyecto: ${nombre}`
                })
            });
            const data = await res.json();
            setProjectId(data.conversation_id);
            setPaso(1);
        } catch {
            setError("No se pudo crear el proyecto. Inténtalo de nuevo.");
        }
    };

    const subirManual = async (file) => {
        if (!file || !projectId) return;
        setAnalizando(true);
        setError(null);
        setPaso(2);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const res = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/manuals/${projectId}/upload`,
                {
                    method: "POST",
                    headers: { Authorization: `Bearer ${token}` },
                    body: formData
                }
            );

            if (!res.ok) throw new Error("Error al procesar el manual");

            const resChat = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/chat`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    conversation_id: projectId,
                    message: "He subido el manual. Hazme un resumen del proyecto: herramientas necesarias, tiempo estimado, dificultad, número de pasos y advertencias importantes."
                })
            });

            const dataChat = await resChat.json();
            setResumen(dataChat.message?.content || null);
            setPaso(3);
        } catch {
            setError("No se pudo procesar el manual. Puedes continuar sin él.");
            setPaso(3);
        } finally {
            setAnalizando(false);
        }
    };

    const comenzarProyecto = () => {
        navigate(`/chat?conversation=${projectId}`);
    };

    return (
        <div className="bg-ivoire dark:bg-noche min-h-screen">
            <div className="max-w-lg mx-auto px-8 pt-10 pb-16">

                {/* botón volver */}
                <button
                    onClick={volver}
                    className="flex items-center gap-1.5 text-xs text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire transition-colors mb-8"
                >
                    <ArrowLeft size={13} strokeWidth={1.5} />
                    {paso === 0 ? "Inicio" : "Atrás"}
                </button>

                {/* cabecera */}
                <div className="mb-8">
                    <p className="text-[9px] font-semibold tracking-[0.16em] uppercase text-gris-piedra mb-1">
                        Nuevo proyecto
                    </p>
                    <h1 className="text-xl font-medium tracking-tight text-noyer dark:text-mantequilla">
                        El inicio de una nueva obra
                    </h1>
                </div>

                {/* indicador de pasos */}
                <div className="flex items-center gap-2 mb-8">
                    {PASOS.map((label, index) => (
                        <div key={label} className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                                <div className={`
                                    w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium transition-all
                                    ${index < paso ? "bg-deep-ocean dark:bg-sky text-ivoire dark:text-noche" : ""}
                                    ${index === paso ? "border border-deep-ocean dark:border-sky text-deep-ocean dark:text-sky" : ""}
                                    ${index > paso ? "border border-douche dark:border-noche-borde text-gris-piedra/40" : ""}
                                `}>
                                    {index < paso ? <Check size={10} strokeWidth={2.5} /> : index + 1}
                                </div>
                                <span className={`text-[10px] tracking-wide ${index === paso ? "text-deep-ocean dark:text-sky" : "text-gris-piedra/40"}`}>
                                    {label}
                                </span>
                            </div>
                            {index < PASOS.length - 1 && (
                                <div className="w-6 h-px bg-douche dark:bg-noche-borde" />
                            )}
                        </div>
                    ))}
                </div>

                <div className="border-t border-douche dark:border-noche-borde mb-8" />

                {/* paso 0 — nombre */}
                {paso === 0 && (
                    <div>
                        <p className="text-sm text-gris-piedra mb-6 leading-relaxed">
                            Dale un nombre a tu proyecto. Puede ser el nombre del mueble, la habitación o lo que vayas a montar.
                        </p>
                        <div className="mb-6">
                            <label className="text-[9px] font-semibold tracking-[0.16em] uppercase text-gris-piedra block mb-2">
                                Nombre del proyecto
                            </label>
                            <input
                                type="text"
                                value={nombre}
                                onChange={e => setNombre(e.target.value)}
                                onKeyDown={e => e.key === "Enter" && crearProyecto()}
                                placeholder="Ej: Armario IKEA, Soporte TV, Cocina..."
                                className="w-full px-4 py-3 rounded-lg border border-douche dark:border-noche-borde bg-white dark:bg-noche-suave text-deep-ocean dark:text-ivoire placeholder:text-gris-piedra/40 text-sm outline-none focus:border-deep-ocean/40 dark:focus:border-sky/40 transition"
                                autoFocus
                            />
                        </div>
                        {error && <p className="text-xs text-red-400 mb-4">{error}</p>}
                        <button
                            onClick={crearProyecto}
                            disabled={!nombre.trim()}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-deep-ocean dark:bg-sky text-ivoire dark:text-noche text-sm font-medium hover:opacity-90 transition disabled:opacity-30"
                        >
                            Continuar
                            <ArrowRight size={14} strokeWidth={1.5} />
                        </button>
                    </div>
                )}

                {/* paso 1 — manual */}
                {paso === 1 && (
                    <div>
                        <p className="text-base font-medium text-noyer dark:text-mantequilla mb-1">
                            {nombre}
                        </p>
                        <p className="text-sm text-gris-piedra mb-8 leading-relaxed">
                            ¿Tienes el manual de instrucciones en PDF? Si lo subes, GIA lo analizará automáticamente antes de empezar.
                        </p>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf"
                            className="hidden"
                            onChange={e => e.target.files[0] && subirManual(e.target.files[0])}
                        />

                        <div className="space-y-2">
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full flex items-center justify-between p-4 rounded-xl bg-white dark:bg-noche-suave border border-douche dark:border-noche-borde hover:border-deep-ocean/20 dark:hover:border-sky/20 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <Upload size={18} strokeWidth={1.25} className="text-gris-piedra group-hover:text-deep-ocean dark:group-hover:text-sky transition-colors" />
                                    <div className="text-left">
                                        <p className="text-sm font-medium text-noyer dark:text-mantequilla">
                                            Subir manual PDF
                                        </p>
                                        <p className="text-[11px] text-gris-piedra">
                                            GIA lo analiza automáticamente
                                        </p>
                                    </div>
                                </div>
                                <ArrowRight size={14} strokeWidth={1.5} className="text-gris-piedra/30 group-hover:text-gris-piedra transition-colors" />
                            </button>

                            <button
                                onClick={() => setPaso(3)}
                                className="w-full flex items-center justify-between p-4 rounded-xl border border-dashed border-douche dark:border-noche-borde hover:border-deep-ocean/20 dark:hover:border-sky/20 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <FileText size={18} strokeWidth={1.25} className="text-gris-piedra/40" />
                                    <p className="text-sm text-gris-piedra">
                                        Continuar sin manual
                                    </p>
                                </div>
                                <ArrowRight size={14} strokeWidth={1.5} className="text-gris-piedra/20 group-hover:text-gris-piedra/50 transition-colors" />
                            </button>
                        </div>
                    </div>
                )}

                {/* paso 2 — analizando */}
                {paso === 2 && (
                    <div className="py-8">
                        <p className="text-base font-medium text-noyer dark:text-mantequilla mb-2">
                            Analizando el manual
                        </p>
                        <p className="text-sm text-gris-piedra mb-8">
                            GIA está leyendo las instrucciones, detectando herramientas, piezas y pasos del montaje.
                        </p>
                        <div className="space-y-3">
                            {["Extrayendo texto", "Generando fragmentos", "Analizando contenido", "Preparando resumen"].map((label, i) => (
                                <div key={label} className="flex items-center gap-3">
                                    {analizando ? (
                                        <div
                                            className="w-3.5 h-3.5 rounded-full border border-gris-piedra/30 border-t-gris-piedra animate-spin flex-shrink-0"
                                            style={{ animationDelay: `${i * 200}ms` }}
                                        />
                                    ) : (
                                        <Check size={14} className="text-deep-ocean dark:text-sky flex-shrink-0" />
                                    )}
                                    <span className="text-sm text-gris-piedra">{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* paso 3 — resumen */}
                {paso === 3 && (
                    <div>
                        <p className="text-base font-medium text-noyer dark:text-mantequilla mb-1">
                            {nombre}
                        </p>
                        {resumen ? (
                            <>
                                <p className="text-[9px] font-semibold tracking-[0.16em] uppercase text-deep-ocean dark:text-sky mb-4 mt-4">
                                    Resumen del proyecto
                                </p>
                                <div className="p-4 rounded-xl bg-white dark:bg-noche-suave border border-douche dark:border-noche-borde mb-6">
                                    <p className="text-sm text-deep-ocean dark:text-ivoire leading-relaxed whitespace-pre-wrap">
                                        {resumen}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <p className="text-sm text-gris-piedra mt-2 mb-6">
                                Proyecto creado sin manual. GIA te acompañará durante todo el proceso.
                            </p>
                        )}

                        {error && (
                            <div className="flex items-center gap-2 mb-4 text-xs text-gris-piedra">
                                <X size={12} />
                                {error}
                            </div>
                        )}

                        <button
                            onClick={comenzarProyecto}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-deep-ocean dark:bg-sky text-ivoire dark:text-noche text-sm font-medium hover:opacity-90 transition"
                        >
                            Comenzar proyecto
                            <ArrowRight size={14} strokeWidth={1.5} />
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};