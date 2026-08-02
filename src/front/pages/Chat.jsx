import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { LogoGia } from "../components/LogoGia";

export const Chat = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const bottomRef = useRef(null);
    const fileInputRef = useRef(null);

    const [sidebarAbierto, setSidebarAbierto] = useState(false);
    const [conversaciones, setConversaciones] = useState([]);
    const [conversacionActiva, setConversacionActiva] = useState(null);
    const [mensajes, setMensajes] = useState([]);
    const [input, setInput] = useState("");
    const [cargando, setCargando] = useState(false);
    const [cargandoHistorial, setCargandoHistorial] = useState(true);
    const [borrandoId, setBorrandoId] = useState(null);
    const [subiendoPDF, setSubiendoPDF] = useState(false);

    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }
        cargarConversaciones();

        // si viene de la home con una conversacion especifica, la abre
        const convId = searchParams.get("conversation");
        if (convId) {
            abrirConversacion(parseInt(convId));
            return;
        }

        // si viene de la home con un contexto inicial, lo usa como primer mensaje
        const contextoInicial = sessionStorage.getItem("gia_contexto_inicial");
        if (contextoInicial) {
            sessionStorage.removeItem("gia_contexto_inicial");
            // pequeño delay para que el chat esté listo
            setTimeout(() => {
                setInput(contextoInicial);
            }, 100);
        }
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [mensajes]);

    const cargarConversaciones = async () => {
        try {
            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/conversations`,
                { headers: { "Authorization": `Bearer ${token}` } }
            );
            const data = await response.json();
            setConversaciones(data.items || []);
        } catch (err) {
            console.error("error cargando conversaciones:", err);
        } finally {
            setCargandoHistorial(false);
        }
    };

    const abrirConversacion = async (id) => {
        setSidebarAbierto(false);
        setConversacionActiva(id);
        setCargando(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/conversations/${id}`,
                { headers: { "Authorization": `Bearer ${token}` } }
            );
            const data = await response.json();
            setMensajes(data.messages || []);
        } catch (err) {
            console.error("error cargando conversacion:", err);
        } finally {
            setCargando(false);
        }
    };

    const borrarConversacion = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("¿Seguro que quieres borrar esta conversación? No se puede deshacer.")) return;
        setBorrandoId(id);
        try {
            await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/conversations/${id}`,
                {
                    method: "DELETE",
                    headers: { "Authorization": `Bearer ${token}` }
                }
            );
            if (conversacionActiva === id) {
                setConversacionActiva(null);
                setMensajes([]);
            }
            cargarConversaciones();
        } catch (err) {
            console.error("error borrando conversacion:", err);
        } finally {
            setBorrandoId(null);
        }
    };

    const nuevaConversacion = () => {
        setConversacionActiva(null);
        setMensajes([]);
        setInput("");
        setSidebarAbierto(false);
    };

    const enviarMensaje = async () => {
        if (!input.trim() || cargando) return;
        const texto = input.trim();
        setInput("");

        setMensajes(prev => [...prev, {
            role: "user",
            content: texto,
            created_at: new Date().toISOString()
        }]);
        setCargando(true);

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
                        conversation_id: conversacionActiva,
                        message: texto
                    })
                }
            );
            const data = await response.json();

            if (data.message && data.message.role) {
                setMensajes(prev => [...prev, data.message]);
            }
            if (!conversacionActiva && data.conversation_id) {
                setConversacionActiva(data.conversation_id);
            }
            cargarConversaciones();
        } catch (err) {
            console.error("error enviando mensaje:", err);
        } finally {
            setCargando(false);
        }
    };

    const subirPDF = async (e) => {
        const archivo = e.target.files[0];
        if (!archivo) return;

        let projectId = conversacionActiva;

        if (!projectId) {
            setMensajes(prev => [...prev, {
                role: "user",
                content: `He subido el manual: ${archivo.name}`,
                created_at: new Date().toISOString()
            }]);
            setCargando(true);
            try {
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/chat`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        conversation_id: null,
                        message: `He subido el manual: ${archivo.name}`
                    })
                });
                const data = await res.json();
                projectId = data.conversation_id;
                setConversacionActiva(projectId);
                if (data.message && data.message.role) {
                    setMensajes(prev => [...prev, data.message]);
                }
            } catch (err) {
                console.error("error creando conversacion:", err);
                setCargando(false);
                return;
            } finally {
                setCargando(false);
            }
        }

        console.log("subiendo pdf a project:", projectId);
        setSubiendoPDF(true);
        setMensajes(prev => [...prev, {
            role: "assistant",
            content: `Recibido. Estoy analizando el manual. Dame un momento.`,
            created_at: new Date().toISOString()
        }]);

        try {
            const formData = new FormData();
            formData.append("file", archivo);

            console.log("llamando a:", `${import.meta.env.VITE_BACKEND_URL}/api/manuals/${projectId}/upload`);

            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/manuals/${projectId}/upload`,
                {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` },
                    body: formData
                }
            );

            console.log("respuesta del backend:", response.status);

            if (response.ok) {
                setMensajes(prev => [...prev, {
                    role: "assistant",
                    content: `Manual listo. Ya conozco su contenido. ¿Por dónde empezamos?`,
                    created_at: new Date().toISOString()
                }]);
            } else {
                const errorData = await response.json();
                console.error("error del backend:", errorData);
                setMensajes(prev => [...prev, {
                    role: "assistant",
                    content: `No pude procesar el manual. Inténtalo de nuevo.`,
                    created_at: new Date().toISOString()
                }]);
            }
            cargarConversaciones();
        } catch (err) {
            console.error("error subiendo pdf:", err);
            setMensajes(prev => [...prev, {
                role: "assistant",
                content: `No pude conectar con el servidor. Comprueba tu conexión.`,
                created_at: new Date().toISOString()
            }]);
        } finally {
            setSubiendoPDF(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            enviarMensaje();
        }
    };

    const cerrarSesion = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        navigate("/login");
    };

    // formato de hora para mensajes
    const formatHora = (fechaStr) => {
        if (!fechaStr) return "";
        return new Date(fechaStr).toLocaleTimeString("es-ES", {
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    return (
        <div className="flex h-screen w-full overflow-hidden bg-ivoire dark:bg-noche">

            {/* overlay movil */}
            {sidebarAbierto && (
                <div
                    className="fixed inset-0 bg-black/40 z-20 md:hidden"
                    onClick={() => setSidebarAbierto(false)}
                />
            )}

            {/* SIDEBAR */}
            <aside className={`
                fixed md:relative z-30 md:z-auto
                h-full w-64 flex-shrink-0
                bg-white dark:bg-noche-suave
                border-r border-douche dark:border-noche-borde
                flex flex-col
                transition-transform duration-300
                ${sidebarAbierto ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
            `}>
                {/* cabecera del sidebar */}
                <div className="p-4 flex items-center justify-between">
                    <Link to="/" className="hover:opacity-70 transition">
                        <LogoGia size={28} />
                    </Link>
                    <button
                        onClick={nuevaConversacion}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire hover:bg-douche/50 dark:hover:bg-white/5 transition"
                        title="Nueva conversación"
                    >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                    </button>
                </div>

                {/* lista de conversaciones */}
                <div className="flex-1 overflow-y-auto px-2 pb-2">
                    {cargandoHistorial ? (
                        <div className="px-3 py-8 text-center">
                            <div className="w-4 h-4 border-2 border-douche border-t-gris-piedra rounded-full animate-spin mx-auto" />
                        </div>
                    ) : conversaciones.length === 0 ? (
                        <p className="text-xs text-gris-piedra px-3 py-8 text-center leading-relaxed">
                            Aún no tienes proyectos
                        </p>
                    ) : (
                        conversaciones.map((conv) => (
                            <div
                                key={conv.id}
                                className={`
                                    group relative flex items-center rounded-lg mb-0.5 transition
                                    ${conversacionActiva === conv.id
                                        ? "bg-douche dark:bg-noche-borde"
                                        : "hover:bg-douche/40 dark:hover:bg-white/5"
                                    }
                                `}
                            >
                                <button
                                    onClick={() => abrirConversacion(conv.id)}
                                    className="flex-1 text-left px-3 py-2.5 min-w-0"
                                >
                                    <p className="text-sm font-medium truncate text-deep-ocean dark:text-ivoire leading-tight">
                                        {conv.title || "Sin título"}
                                    </p>
                                    {conv.has_manual && (
                                        <p className="text-xs text-noyer dark:text-mantequilla mt-0.5">
                                            Manual
                                        </p>
                                    )}
                                </button>
                                <button
                                    onClick={(e) => borrarConversacion(e, conv.id)}
                                    disabled={borrandoId === conv.id}
                                    className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-2 mr-1 rounded text-gris-piedra hover:text-red-500 transition"
                                    title="Borrar"
                                >
                                    {borrandoId === conv.id ? (
                                        <div className="w-3 h-3 border border-gris-piedra border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                                            <path d="M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* pie del sidebar */}
                <div className="p-4 border-t border-douche dark:border-noche-borde">
                    <button
                        onClick={cerrarSesion}
                        className="flex items-center gap-2 text-xs text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire transition"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            {/* ÁREA PRINCIPAL */}
            <main className="flex-1 flex flex-col min-w-0 h-full">

                {/* barra superior móvil */}
                <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-douche dark:border-noche-borde bg-white dark:bg-noche-suave">
                    <button
                        onClick={() => setSidebarAbierto(true)}
                        className="text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire transition"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M3 12h18M3 6h18M3 18h18" />
                        </svg>
                    </button>
                    <LogoGia size={24} />
                </div>

                {/* área de mensajes */}
                <div className="flex-1 overflow-y-auto">
                    {mensajes.length === 0 ? (
                        // estado vacío — invitación a empezar
                        <div className="h-full flex flex-col items-center justify-center px-6 text-center">
                            <LogoGia size={36} conTexto={false} />
                            <p className="text-sm text-gris-piedra mt-4 max-w-xs leading-relaxed">
                                Cuéntame qué quieres montar, instalar, reparar o restaurar.
                            </p>
                        </div>
                    ) : (
                        <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
                            {mensajes.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                                >
                                    <div className={`
                                        max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed
                                        ${msg.role === "user"
                                            ? "bg-deep-ocean text-ivoire dark:bg-sky dark:text-noche rounded-br-sm"
                                            : "bg-white dark:bg-noche-suave text-deep-ocean dark:text-ivoire border border-douche dark:border-noche-borde rounded-bl-sm"
                                        }
                                    `}>
                                        {msg.content}
                                    </div>
                                    <span className="text-[10px] text-gris-piedra/60 mt-1 px-1">
                                        {formatHora(msg.created_at)}
                                    </span>
                                </div>
                            ))}

                            {/* indicador de escritura */}
                            {cargando && (
                                <div className="flex items-start">
                                    <div className="bg-white dark:bg-noche-suave border border-douche dark:border-noche-borde px-4 py-3 rounded-2xl rounded-bl-sm">
                                        <div className="flex gap-1 items-center">
                                            <div className="w-1.5 h-1.5 bg-gris-piedra rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                            <div className="w-1.5 h-1.5 bg-gris-piedra rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                            <div className="w-1.5 h-1.5 bg-gris-piedra rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={bottomRef} />
                        </div>
                    )}
                </div>

                {/* input */}
                <div className="border-t border-douche dark:border-noche-borde bg-white dark:bg-noche-suave px-4 py-3">
                    <div className="max-w-2xl mx-auto">
                        <div className="flex gap-2 items-end">

                            {/* input oculto para archivo */}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf"
                                onChange={subirPDF}
                                className="hidden"
                            />

                            {/* boton pdf */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={subiendoPDF || cargando}
                                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-douche dark:border-noche-borde text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire hover:border-deep-ocean/30 transition disabled:opacity-40 text-xs font-medium whitespace-nowrap"
                                title="Subir manual PDF"
                            >
                                {subiendoPDF ? (
                                    <div className="w-3.5 h-3.5 border border-gris-piedra border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <line x1="12" y1="18" x2="12" y2="12" />
                                        <line x1="9" y1="15" x2="15" y2="15" />
                                    </svg>
                                )}
                                <span className="hidden sm:block">
                                    {subiendoPDF ? "Procesando..." : "PDF"}
                                </span>
                            </button>

                            {/* campo de texto */}
                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder="Escribe o describe tu proyecto..."
                                rows={1}
                                className="flex-1 resize-none px-3.5 py-2.5 rounded-lg border border-douche dark:border-noche-borde bg-ivoire dark:bg-noche text-deep-ocean dark:text-ivoire placeholder:text-gris-piedra text-sm outline-none focus:border-deep-ocean/40 dark:focus:border-sky/40 transition max-h-32 overflow-y-auto"
                            />

                            {/* boton enviar */}
                            <button
                                onClick={enviarMensaje}
                                disabled={!input.trim() || cargando}
                                className="flex-shrink-0 w-9 h-9 rounded-lg bg-deep-ocean text-ivoire hover:bg-ocean-vivo transition disabled:opacity-30 dark:bg-sky dark:text-noche flex items-center justify-center"
                            >
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                            </button>
                        </div>

                        <p className="text-center text-[10px] text-gris-piedra/50 mt-2">
                            Enter para enviar · Shift+Enter para saltar línea
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};