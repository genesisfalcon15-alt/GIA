import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";

const APARATOS = [
    "Lavadora", "Lavavajillas", "Horno", "Nevera",
    "Campana", "Microondas", "Cafetera", "Aspiradora", "Otro"
];

const SINTOMAS = [
    "No enciende", "Hace ruido", "Pierde agua",
    "No calienta", "No gira", "Huele a quemado", "Otro"
];

export const Reparar = () => {
    const navigate = useNavigate();
    const [paso, setPaso] = useState(0);
    const [aparato, setAparato] = useState("");
    const [sintoma, setSintoma] = useState("");

    const continuar = () => {
        const contexto = `El usuario quiere reparar su ${aparato}. El problema es: ${sintoma}. Empieza descartando las causas más simples primero. Ve paso a paso. Una sola pregunta o comprobación a la vez. No des un bloque enorme de texto.`;
        sessionStorage.setItem("gia_contexto_inicial", contexto);
        navigate("/chat");
    };

    return (
        <div className="bg-ivoire dark:bg-noche min-h-screen">
            <div className="max-w-lg mx-auto px-8 pt-10 pb-16">

                {/* volver */}
                <button
                    onClick={() => paso === 0 ? navigate("/") : setPaso(0)}
                    className="flex items-center gap-1.5 text-xs text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire transition-colors mb-8"
                >
                    <ArrowLeft size={13} strokeWidth={1.5} />
                    {paso === 0 ? "Inicio" : "Atrás"}
                </button>

                {/* cabecera */}
                <div className="mb-8">
                    <p className="text-[9px] font-semibold tracking-[0.16em] uppercase text-gris-piedra mb-1">
                        Reparar un electrodoméstico
                    </p>
                    <h1 className="text-xl font-medium tracking-tight text-noyer dark:text-mantequilla">
                        {paso === 0 ? "¿Qué aparato quieres reparar?" : "¿Qué problema tiene?"}
                    </h1>
                </div>

                <div className="border-t border-douche dark:border-noche-borde mb-8" />

                {/* paso 0 — aparato */}
                {paso === 0 && (
                    <div className="space-y-2">
                        {APARATOS.map((a) => (
                            <button
                                key={a}
                                onClick={() => { setAparato(a); setPaso(1); }}
                                className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-left border border-douche dark:border-noche-borde bg-white dark:bg-noche-suave hover:border-deep-ocean/30 dark:hover:border-sky/30 transition-all group"
                            >
                                <span className="text-sm font-medium text-noyer dark:text-mantequilla">
                                    {a}
                                </span>
                                <ArrowRight size={14} strokeWidth={1.5} className="text-gris-piedra/30 group-hover:text-gris-piedra transition-colors" />
                            </button>
                        ))}
                    </div>
                )}

                {/* paso 1 — síntoma */}
                {paso === 1 && (
                    <div>
                        <p className="text-sm text-gris-piedra mb-6">
                            Aparato: <span className="text-noyer dark:text-mantequilla font-medium">{aparato}</span>
                        </p>
                        <div className="space-y-2 mb-8">
                            {SINTOMAS.map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setSintoma(s)}
                                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-left border transition-all ${sintoma === s
                                        ? "border-deep-ocean dark:border-sky bg-white dark:bg-noche-suave"
                                        : "border-douche dark:border-noche-borde bg-white dark:bg-noche-suave hover:border-deep-ocean/30 dark:hover:border-sky/30"
                                        }`}
                                >
                                    <span className="text-sm font-medium text-noyer dark:text-mantequilla">
                                        {s}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={continuar}
                            disabled={!sintoma}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-deep-ocean dark:bg-sky text-ivoire dark:text-noche text-sm font-medium hover:opacity-90 transition disabled:opacity-30"
                        >
                            Iniciar diagnóstico
                            <ArrowRight size={14} strokeWidth={1.5} />
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};