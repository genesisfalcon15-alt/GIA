import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LogoGia } from "../components/LogoGia";

export const Chat = () => {
    const navigate = useNavigate();
    const bottomRef = useRef(null);

    const [sidebarAbierto, setSidebarAbierto] = useState(false);
    const [conversaciones, setConversaciones] = useState([]);
    const [conversacionActiva, setConversacionActiva] = useState(null);
    const [mensajes, setMensajes] = useState([]);
    const [input, setInput] = useState("");
    const [cargando, setCargando] = useState(false);
    const [cargandoHistorial, setCargandoHistorial] = useState(true);
    // id de la conversacion que se esta borrando (para mostrar estado)
    const [borrandoId, setBorrandoId] = useState(null);

    const token = localStorage.getItem("token");

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }
        cargarConversaciones();
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
        // evito que se abra la conversacion al pulsar borrar
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

            // si borro la conversacion activa, limpio el chat
            if (conversacionActiva === id) {
                setConversacionActiva(null);
                setMensajes([]);
            }

            // actualizo la lista del sidebar
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

            if (!conversacionActiva) {
                setConversacionActiva(data.conversation_id);
            }

            cargarConversaciones();

        } catch (err) {
            console.error("error enviando mensaje:", err);
        } finally {
            setCargando(false);
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

    return (
        <div className="flex h-screen w-full overflow-hidden">

            {sidebarAbierto && (
                <div
                    className="fixed inset-0 bg-black/40 z-20 md:hidden"
                    onClick={() => setSidebarAbierto(false)}
                />
            )}

            {/* SIDEBAR */}
            <aside className={`
                fixed md:relative z-30 md:z-auto
                h-full w-72 flex-shrink-0
                bg-white dark:bg-noche-suave
                border-r border-douche dark:border-noche-borde
                flex flex-col
                transition-transform duration-300
                ${sidebarAbierto ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
            `}>
                <div className="p-4 border-b border-douche dark:border-noche-borde flex items-center justify-between">
                    <Link to="/" className="hover:opacity-80 transition">
                        <LogoGia size={32} />
                    </Link>
                    <button
                        onClick={nuevaConversacion}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-ocean-vivo text-ivoire hover:bg-deep-ocean transition dark:bg-sky dark:text-noche"
                    >
                        + Nueva
                    </button>
                </div>

                {/* lista de conversaciones */}
                <div className="flex-1 overflow-y-auto p-2">
                    {cargandoHistorial ? (
                        <p className="text-xs text-gris-piedra px-2 py-4 text-center">Cargando...</p>
                    ) : conversaciones.length === 0 ? (
                        <p className="text-xs text-gris-piedra px-2 py-4 text-center">
                            Aún no tienes conversaciones
                        </p>
                    ) : (
                        conversaciones.map((conv) => (
                            <div
                                key={conv.id}
                                className={`
                                    group relative flex items-center rounded-lg mb-1 transition
                                    ${conversacionActiva === conv.id
                                        ? "bg-douche dark:bg-noche-borde"
                                        : "hover:bg-douche/50 dark:hover:bg-white/5"
                                    }
                                `}
                            >
                                {/* boton principal de la conversacion */}
                                <button
                                    onClick={() => abrirConversacion(conv.id)}
                                    className="flex-1 text-left px-3 py-2.5 text-sm min-w-0"
                                >
                                    <p className="font-medium truncate text-deep-ocean dark:text-ivoire">
                                        {conv.title || "Nueva conversación"}
                                    </p>
                                    {conv.last_message && (
                                        <p className="text-xs text-gris-piedra truncate mt-0.5">
                                            {conv.last_message}
                                        </p>
                                    )}
                                </button>

                                {/* boton de borrar, solo visible en hover */}
                                <button
                                    onClick={(e) => borrarConversacion(e, conv.id)}
                                    disabled={borrandoId === conv.id}
                                    className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-2 mr-1 rounded-lg text-gris-piedra hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition"
                                    title="Borrar conversación"
                                >
                                    {borrandoId === conv.id ? (
                                        // spinner mientras borra
                                        <div className="w-4 h-4 border-2 border-gris-piedra border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                                            <polyline points="3 6 5 6 21 6" />
                                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                                            <path d="M10 11v6M14 11v6" />
                                            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-douche dark:border-noche-borde">
                    <button
                        onClick={cerrarSesion}
                        className="w-full text-left text-xs text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire transition"
                    >
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            {/* CHAT CENTRAL */}
            <main className="flex-1 flex flex-col min-w-0 h-full">

                <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-douche dark:border-noche-borde bg-white dark:bg-noche-suave">
                    <button
                        onClick={() => setSidebarAbierto(true)}
                        className="text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire transition"
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M3 12h18M3 6h18M3 18h18" />
                        </svg>
                    </button>
                    <LogoGia size={28} />
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-6">
                    {mensajes.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto">
                            <LogoGia size={52} conTexto={false} />
                            <h2 className="text-2xl font-semibold text-deep-ocean dark:text-ivoire mt-6 mb-3">
                                Hola, soy GIA
                            </h2>
                            <p className="text-gris-piedra leading-relaxed">
                                Tu asistente de montaje e instalación. Escríbeme qué quieres montar
                                o sube el manual y empezamos.
                            </p>
                        </div>
                    ) : (
                        <div className="max-w-2xl mx-auto space-y-6">
                            {mensajes.map((msg, index) => (
                                <div
                                    key={index}
                                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div className={`
                                        max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed
                                        ${msg.role === "user"
                                            ? "bg-ocean-vivo text-ivoire dark:bg-sky dark:text-noche rounded-br-sm"
                                            : "bg-white dark:bg-noche-suave text-deep-ocean dark:text-ivoire border border-douche dark:border-noche-borde rounded-bl-sm"
                                        }
                                    `}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}

                            {cargando && (
                                <div className="flex justify-start">
                                    <div className="bg-white dark:bg-noche-suave border border-douche dark:border-noche-borde px-4 py-3 rounded-2xl rounded-bl-sm">
                                        <div className="flex gap-1.5 items-center">
                                            <div className="w-2 h-2 bg-gris-piedra rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                            <div className="w-2 h-2 bg-gris-piedra rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                            <div className="w-2 h-2 bg-gris-piedra rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div ref={bottomRef} />
                        </div>
                    )}
                </div>

                <div className="px-4 py-4 border-t border-douche dark:border-noche-borde bg-white dark:bg-noche-suave">
                    <div className="max-w-2xl mx-auto flex gap-2 items-end">
                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Escribe un mensaje..."
                            rows={1}
                            className="flex-1 resize-none px-4 py-3 rounded-xl border border-douche dark:border-noche-borde bg-ivoire dark:bg-noche text-deep-ocean dark:text-ivoire placeholder:text-gris-piedra text-sm outline-none focus:border-ocean-vivo transition max-h-32 overflow-y-auto"
                        />
                        <button
                            onClick={enviarMensaje}
                            disabled={!input.trim() || cargando}
                            className="px-4 py-3 rounded-xl bg-ocean-vivo text-ivoire font-medium text-sm hover:bg-deep-ocean transition disabled:opacity-40 dark:bg-sky dark:text-noche flex-shrink-0"
                        >
                            Enviar
                        </button>
                    </div>
                    <p className="text-center text-xs text-gris-piedra mt-2">
                        Enter para enviar · Shift+Enter para saltar línea
                    </p>
                </div>
            </main>
        </div>
    );
};