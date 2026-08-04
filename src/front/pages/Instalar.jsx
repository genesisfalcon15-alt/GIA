import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";

const PRODUCTOS = [
    "TV", "Lámpara", "Ventilador de techo",
    "Estantería", "Barra de cortina", "Espejo", "Cuadro", "Otro"
];

const PAREDES = [
    "Pladur", "Hormigón", "Ladrillo", "Desconozco el tipo"
];

export const Instalar = () => {
    const navigate = useNavigate();
    const [paso, setPaso] = useState(0);
    const [producto, setProducto] = useState("");
    const [pared, setPared] = useState("");

    const continuar = () => {
        const contexto = `El usuario quiere instalar ${producto} en una pared de ${pared}. Empieza explicando exactamente qué herramientas necesita, qué tacos son los adecuados para ese tipo de pared, los tornillos recomendados, el peso que puede soportar y las comprobaciones de seguridad previas. Una sola pregunta al final si necesitas algo más.`;
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
                        Instalar un producto
                    </p>
                    <h1 className="text-xl font-medium tracking-tight text-noyer dark:text-mantequilla">
                        {paso === 0 ? "¿Qué quieres instalar?" : "¿Qué tipo de pared tienes?"}
                    </h1>
                </div>

                <div className="border-t border-douche dark:border-noche-borde mb-8" />

                {/* paso 0 — producto */}
                {paso === 0 && (
                    <div className="space-y-2">
                        {PRODUCTOS.map((p) => (
                            <button
                                key={p}
                                onClick={() => { setProducto(p); setPaso(1); }}
                                className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-left border transition-all group ${producto === p
                                    ? "border-deep-ocean dark:border-sky bg-white dark:bg-noche-suave"
                                    : "border-douche dark:border-noche-borde bg-white dark:bg-noche-suave hover:border-deep-ocean/30 dark:hover:border-sky/30"
                                    }`}
                            >
                                <span className="text-sm font-medium text-noyer dark:text-mantequilla">
                                    {p}
                                </span>
                                <ArrowRight size={14} strokeWidth={1.5} className="text-gris-piedra/30 group-hover:text-gris-piedra transition-colors" />
                            </button>
                        ))}
                    </div>
                )}

                {/* paso 1 — pared */}
                {paso === 1 && (
                    <div>
                        <p className="text-sm text-gris-piedra mb-6">
                            Producto seleccionado: <span className="text-noyer dark:text-mantequilla font-medium">{producto}</span>
                        </p>
                        <div className="space-y-2 mb-8">
                            {PAREDES.map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPared(p)}
                                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-left border transition-all ${pared === p
                                        ? "border-deep-ocean dark:border-sky bg-white dark:bg-noche-suave"
                                        : "border-douche dark:border-noche-borde bg-white dark:bg-noche-suave hover:border-deep-ocean/30 dark:hover:border-sky/30"
                                        }`}
                                >
                                    <span className="text-sm font-medium text-noyer dark:text-mantequilla">
                                        {p}
                                    </span>
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={continuar}
                            disabled={!pared}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-deep-ocean dark:bg-sky text-ivoire dark:text-noche text-sm font-medium hover:opacity-90 transition disabled:opacity-30"
                        >
                            Empezar instalación
                            <ArrowRight size={14} strokeWidth={1.5} />
                        </button>
                    </div>
                )}

            </div>
        </div>
    );
};