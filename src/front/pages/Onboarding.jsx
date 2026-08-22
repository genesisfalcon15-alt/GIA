import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

const PASOS_PARTICULAR = [
    {
        id: "experiencia",
        titulo: "¿Cuál es tu experiencia con el bricolaje?",
        tipo: "multi",
        opciones: ["Nunca he montado nada", "Principiante", "Intermedio", "Muy manitas"]
    },
    {
        id: "vivienda",
        titulo: "¿Dónde realizas tus proyectos?",
        tipo: "multi",
        opciones: ["Piso", "Casa", "Chalet", "Otro"],
        subtitulo: "¿Qué tipos de paredes tienes? Puedes elegir varias.",
        opciones2: ["Pladur", "Ladrillo", "Hormigón", "Piedra", "No lo sé"],
        tipo2: "multi"
    },
    {
        id: "herramientas",
        titulo: "¿Qué herramientas tienes disponibles?",
        subtitulo: "Elige todas las que tengas.",
        tipo: "multi",
        opciones: ["Taladro", "Destornilladores", "Llaves Allen", "Nivel", "Metro", "Martillo", "Sierra", "Detector de cables", "Escalera", "Ninguna"]
    },
    {
        id: "intereses",
        titulo: "¿Para qué quieres usar GIA?",
        subtitulo: "Puedes elegir varias opciones.",
        tipo: "multi",
        opciones: ["Montar muebles", "Instalar productos", "Reparar electrodomésticos", "Restaurar muebles", "Decoración", "Bricolaje", "Todo un poco"]
    }
];

const PASOS_EMPRESA = [
    {
        id: "sector",
        titulo: "¿A qué se dedica tu empresa?",
        subtitulo: "Puedes elegir varias si aplican.",
        tipo: "multi",
        opciones: ["Montaje", "Carpintería", "Electricidad", "Fontanería", "Reformas", "Mantenimiento", "Multiservicios", "Otro"]
    },
    {
        id: "equipo",
        titulo: "¿Cuántas personas forman el equipo?",
        tipo: "multi",
        opciones: ["Solo yo", "2-5", "6-20", "Más de 20"]
    },
    {
        id: "gestion",
        titulo: "¿Qué quieres gestionar con GIA?",
        subtitulo: "Elige todo lo que necesites.",
        tipo: "multi",
        opciones: ["Manuales", "Instalaciones", "Clientes", "Incidencias", "Fotografías", "Documentación", "Todo"]
    },
    {
        id: "proyectos",
        titulo: "¿Qué tipo de proyectos realizáis?",
        subtitulo: "Puedes elegir varios.",
        tipo: "multi",
        opciones: ["Viviendas", "Oficinas", "Comercios", "Hoteles", "Industria"]
    },
    {
        id: "modo",
        titulo: "¿Cómo quieres que GIA trabaje con vosotros?",
        tipo: "multi",
        opciones: ["Paso a paso", "Muy técnico", "Muy rápido", "Como apoyo al equipo"]
    }
];

export const Onboarding = () => {
    const navigate = useNavigate();
    const [modo, setModo] = useState(null);
    const [pasoActual, setPasoActual] = useState(0);
    const [respuestas, setRespuestas] = useState({});
    const [guardando, setGuardando] = useState(false);

    const pasos = modo === "empresa" ? PASOS_EMPRESA : PASOS_PARTICULAR;
    const paso = pasos[pasoActual];

    const seleccionar = (campo, valor) => {
        setRespuestas(prev => ({ ...prev, [campo]: valor }));
    };

    const toggleMulti = (campo, valor) => {
        setRespuestas(prev => {
            const actual = prev[campo] || [];
            const existe = actual.includes(valor);
            return {
                ...prev,
                [campo]: existe ? actual.filter(v => v !== valor) : [...actual, valor]
            };
        });
    };

    const puedeAvanzar = () => {
        if (!paso) return false;
        const val = respuestas[paso.id];
        if (paso.tipo === "multi") return val && val.length > 0;
        return !!val;
    };

    const finalizar = async () => {
        setGuardando(true);
        const perfil = { modo, ...respuestas };
        localStorage.setItem("gia_perfil", JSON.stringify(perfil));

        const token = localStorage.getItem("token");
        if (token) {
            try {
                await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users/profile`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        experience_level: respuestas.experiencia,
                        home_type: respuestas.vivienda,
                        wall_types: respuestas.vivienda_2 || [],
                        tools_available: respuestas.herramientas || [],
                        interests: respuestas.intereses || [],
                        help_style: respuestas.estilo, // conservado — aunque estilo ya no se recoge en el onboarding, el campo sigue existiendo en BD
                        sector: respuestas.sector,
                        team_size: respuestas.equipo
                    })
                });
            } catch (err) {
                console.error("error guardando perfil:", err);
            }
        }

        setGuardando(false);
        navigate("/");
    };

    const renderStepper = (total, actual) => (
        <div className="flex items-center gap-1.5 mb-10">
            {Array.from({ length: total }).map((_, i) => (
                <div
                    key={i}
                    className={`h-0.5 flex-1 rounded-full transition-all duration-300 ${i < actual
                        ? "bg-deep-ocean dark:bg-sky"
                        : i === actual
                            ? "bg-noyer dark:bg-mantequilla"
                            : "bg-douche dark:bg-noche-borde"
                        }`}
                />
            ))}
        </div>
    );

    const renderOpciones = (ids, opciones, tipo) => (
        <div className="space-y-2 mb-6">
            {opciones.map(op => {
                const seleccionado = tipo === "multi"
                    ? (respuestas[ids] || []).includes(op)
                    : respuestas[ids] === op;
                return (
                    <button
                        key={op}
                        onClick={() => tipo === "multi" ? toggleMulti(ids, op) : seleccionar(ids, op)}
                        className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl text-left border transition-all ${seleccionado
                            ? "border-deep-ocean dark:border-sky bg-white dark:bg-noche-suave"
                            : "border-douche dark:border-noche-borde bg-white dark:bg-noche-suave hover:border-deep-ocean/30 dark:hover:border-sky/30"
                            }`}
                    >
                        <span className="text-sm text-noyer dark:text-mantequilla">{op}</span>
                        {seleccionado && (
                            <Check size={14} strokeWidth={1.5} className="text-deep-ocean dark:text-sky flex-shrink-0" />
                        )}
                    </button>
                );
            })}
        </div>
    );

    if (!modo) {
        return (
            <div className="bg-ivoire dark:bg-noche min-h-screen">
                <div className="max-w-lg mx-auto px-8 pt-16 pb-16">
                    <div className="mb-10">
                        <p className="text-[9px] font-semibold tracking-[0.16em] uppercase text-gris-piedra mb-2">
                            Bienvenida a GIA
                        </p>
                        <h1 className="text-2xl font-medium tracking-tight text-noyer dark:text-mantequilla mb-2">
                            ¿Cómo utilizarás GIA?
                        </h1>
                        <p className="text-sm text-gris-piedra">
                            Solo unas preguntas rápidas para que GIA te conozca mejor.
                        </p>
                    </div>

                    <div className="border-t border-douche dark:border-noche-borde mb-8" />

                    <div className="space-y-2">
                        <button
                            onClick={() => setModo("particular")}
                            className="w-full text-left px-5 py-4 rounded-xl bg-white dark:bg-noche-suave border border-douche dark:border-noche-borde hover:border-deep-ocean/20 dark:hover:border-sky/20 hover:bg-douche/10 transition-all"
                        >
                            <p className="text-sm font-medium text-noyer dark:text-mantequilla mb-1">Para mi hogar</p>
                            <p className="text-xs text-gris-piedra leading-relaxed">
                                Quiero ayuda con muebles, instalaciones, reparaciones y proyectos en casa.
                            </p>
                        </button>

                        <button
                            onClick={() => setModo("empresa")}
                            className="w-full text-left px-5 py-4 rounded-xl bg-white dark:bg-noche-suave border border-douche dark:border-noche-borde hover:border-deep-ocean/20 dark:hover:border-sky/20 hover:bg-douche/10 transition-all"
                        >
                            <p className="text-sm font-medium text-noyer dark:text-mantequilla mb-1">Para mi empresa</p>
                            <p className="text-xs text-gris-piedra leading-relaxed">
                                Gestiono instalaciones, proyectos y equipos de forma profesional.
                            </p>
                        </button>
                    </div>

                    <button
                        onClick={() => navigate("/")}
                        className="mt-6 text-xs text-gris-piedra/50 hover:text-gris-piedra transition-colors block"
                    >
                        Omitir por ahora
                    </button>
                </div>
            </div>
        );
    }

    if (pasoActual >= pasos.length) {
        return (
            <div className="bg-ivoire dark:bg-noche min-h-screen">
                <div className="max-w-lg mx-auto px-8 pt-16 pb-16">
                    <div className="mb-10">
                        <p className="text-[9px] font-semibold tracking-[0.16em] uppercase text-gris-piedra mb-2">
                            Todo listo
                        </p>
                        <h1 className="text-2xl font-medium tracking-tight text-noyer dark:text-mantequilla mb-2">
                            Ya te conozco un poco mejor
                        </h1>
                        <p className="text-sm text-gris-piedra">
                            GIA tiene todo lo que necesita para ayudarte bien.
                        </p>
                    </div>

                    <div className="border-t border-douche dark:border-noche-borde mb-8" />

                    <div className="space-y-1 mb-8">
                        {Object.entries(respuestas).map(([clave, valor]) => (
                            <div key={clave} className="flex items-start justify-between px-4 py-3 rounded-xl bg-white dark:bg-noche-suave border border-douche dark:border-noche-borde">
                                <span className="text-xs text-gris-piedra capitalize">{clave.replace(/_/g, " ")}</span>
                                <span className="text-xs text-noyer dark:text-mantequilla font-medium text-right max-w-[60%]">
                                    {Array.isArray(valor) ? valor.join(", ") : valor}
                                </span>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={finalizar}
                        disabled={guardando}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-deep-ocean dark:bg-sky text-ivoire dark:text-noche text-sm font-medium hover:opacity-90 transition disabled:opacity-40"
                    >
                        {guardando ? "Guardando..." : "Empezar con GIA"}
                        <ArrowRight size={14} strokeWidth={1.5} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-ivoire dark:bg-noche min-h-screen">
            <div className="max-w-lg mx-auto px-8 pt-10 pb-16">

                <button
                    onClick={() => pasoActual === 0 ? setModo(null) : setPasoActual(p => p - 1)}
                    className="flex items-center gap-1.5 text-xs text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire transition-colors mb-8"
                >
                    <ArrowLeft size={13} strokeWidth={1.5} />
                    Atrás
                </button>

                {renderStepper(pasos.length, pasoActual)}

                <div className="mb-8">
                    <p className="text-[9px] font-semibold tracking-[0.16em] uppercase text-gris-piedra mb-2">
                        Paso {pasoActual + 1} de {pasos.length}
                    </p>
                    <h1 className="text-xl font-medium tracking-tight text-noyer dark:text-mantequilla">
                        {paso.titulo}
                    </h1>
                    {paso.subtitulo && !respuestas[paso.id] && paso.tipo === "multi" && (
                        <p className="text-xs text-gris-piedra mt-1">{paso.subtitulo}</p>
                    )}
                </div>

                <div className="border-t border-douche dark:border-noche-borde mb-6" />

                {renderOpciones(paso.id, paso.opciones, paso.tipo)}

                {paso.subtitulo && (paso.tipo !== "multi" ? respuestas[paso.id] : true) && paso.opciones2 && (
                    <div>
                        <p className="text-sm font-medium text-noyer dark:text-mantequilla mb-4 mt-2">
                            {paso.subtitulo}
                        </p>
                        {renderOpciones(`${paso.id}_2`, paso.opciones2, paso.tipo2 || "radio")}
                    </div>
                )}

                <button
                    onClick={() => setPasoActual(p => p + 1)}
                    disabled={!puedeAvanzar()}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-deep-ocean dark:bg-sky text-ivoire dark:text-noche text-sm font-medium hover:opacity-90 transition disabled:opacity-30"
                >
                    {pasoActual === pasos.length - 1 ? "Ver mi perfil" : "Continuar"}
                    <ArrowRight size={14} strokeWidth={1.5} />
                </button>
            </div>
        </div>
    );
};