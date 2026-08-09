import { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { LogoGia } from "../components/LogoGia";
import ReactMarkdown from "react-markdown";

export const Chat = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const bottomRef = useRef(null);
    const fileInputRef = useRef(null);
    const imgInputRef = useRef(null);

    const [sidebarAbierto, setSidebarAbierto] = useState(false);
    const [conversaciones, setConversaciones] = useState([]);
    const [conversacionActiva, setConversacionActiva] = useState(null);
    const [mensajes, setMensajes] = useState([]);
    const [input, setInput] = useState("");
    const [cargando, setCargando] = useState(false);
    const [cargandoHistorial, setCargandoHistorial] = useState(true);
    const [borrandoId, setBorrandoId] = useState(null);
    const [subiendoPDF, setSubiendoPDF] = useState(false);
    const [subiendoImagen, setSubiendoImagen] = useState(false);
    const [escuchando, setEscuchando] = useState(false);
    const [pasoActual, setPasoActual] = useState(0);
    const [totalPasos, setTotalPasos] = useState(0);
    const [confirmacionVisible, setConfirmacionVisible] = useState(false);

    const token = localStorage.getItem("token");

    const detectarProgreso = (contenido) => {
        const match = contenido.match(/paso\s+(\d+)\s+de\s+(\d+)/i) ||
            contenido.match(/paso\s+(\d+)/i);
        if (match) {
            setPasoActual(parseInt(match[1]));
            if (match[2]) setTotalPasos(parseInt(match[2]));
            else if (totalPasos === 0) setTotalPasos(12);
        }
        const terminado = /completado|finalizado|terminado|listo para usar|montaje completo/i.test(contenido);
        if (terminado) setConfirmacionVisible(true);
    };

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
        setPasoActual(0);
        setTotalPasos(0);
        setConfirmacionVisible(false);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/conversations/${id}`,
                { headers: { "Authorization": `Bearer ${token}` } }
            );
            const data = await response.json();
            const msgs = data.messages || [];
            setMensajes(msgs);
            msgs.forEach(m => {
                if (m.role === "assistant") detectarProgreso(m.content);
            });
        } catch (err) {
            console.error("error cargando conversacion:", err);
        } finally {
            setCargando(false);
        }
    };

    const borrarConversacion = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm("¿Seguro que quieres borrar esta conversación?")) return;
        setBorrandoId(id);
        try {
            await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/conversations/${id}`,
                { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } }
            );
            if (conversacionActiva === id) {
                setConversacionActiva(null);
                setMensajes([]);
                setPasoActual(0);
                setTotalPasos(0);
                setConfirmacionVisible(false);
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
        setPasoActual(0);
        setTotalPasos(0);
        setConfirmacionVisible(false);
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
                        message: texto,
                        current_time: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
                    })
                }
            );
            const data = await response.json();
            if (data.message && data.message.role) {
                setMensajes(prev => [...prev, data.message]);
                if (data.message.role === "assistant") detectarProgreso(data.message.content);
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
                    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                    body: JSON.stringify({
                        conversation_id: null,
                        message: `He subido el manual: ${archivo.name}`,
                        current_time: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
                    })
                });
                const data = await res.json();
                projectId = data.conversation_id;
                setConversacionActiva(projectId);
                if (data.message && data.message.role) setMensajes(prev => [...prev, data.message]);
            } catch (err) {
                console.error("error creando conversacion:", err);
                setCargando(false);
                return;
            } finally {
                setCargando(false);
            }
        }
        setSubiendoPDF(true);
        setMensajes(prev => [...prev, {
            role: "assistant",
            content: "Recibido. Estoy analizando el manual. Dame un momento.",
            created_at: new Date().toISOString()
        }]);
        try {
            const formData = new FormData();
            formData.append("file", archivo);
            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/manuals/${projectId}/upload`,
                { method: "POST", headers: { "Authorization": `Bearer ${token}` }, body: formData }
            );
            setMensajes(prev => [...prev, {
                role: "assistant",
                content: response.ok
                    ? "Manual listo. Ya conozco su contenido. ¿Por dónde empezamos?"
                    : "No pude procesar el manual. Inténtalo de nuevo.",
                created_at: new Date().toISOString()
            }]);
            cargarConversaciones();
        } catch {
            setMensajes(prev => [...prev, {
                role: "assistant",
                content: "No pude conectar con el servidor.",
                created_at: new Date().toISOString()
            }]);
        } finally {
            setSubiendoPDF(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const subirImagen = async (e) => {
        const archivo = e.target.files[0];
        if (!archivo) return;
        setSubiendoImagen(true);
        setCargando(true);

        const urlLocal = URL.createObjectURL(archivo);
        setMensajes(prev => [...prev, {
            role: "user",
            content: `[imagen:${urlLocal}]`,
            created_at: new Date().toISOString()
        }]);

        try {
            const formData = new FormData();
            formData.append("image", archivo);
            if (conversacionActiva) {
                formData.append("conversation_id", conversacionActiva);
            }

            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/chat/image`,
                {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` },
                    body: formData
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
            console.error("error enviando imagen:", err);
            setMensajes(prev => [...prev, {
                role: "assistant",
                content: "No pude analizar la imagen. Inténtalo de nuevo.",
                created_at: new Date().toISOString()
            }]);
        } finally {
            setCargando(false);
            setSubiendoImagen(false);
            if (imgInputRef.current) imgInputRef.current.value = "";
        }
    };

    const iniciarVoz = () => {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            alert("Tu navegador no soporta dictado de voz. Usa Chrome.");
            return;
        }
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const recognition = new SpeechRecognition();
        recognition.lang = "es-ES";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        setEscuchando(true);
        recognition.start();
        recognition.onresult = (e) => {
            const texto = e.results[0][0].transcript;
            setInput(prev => prev + texto);
            setEscuchando(false);
        };
        recognition.onerror = () => setEscuchando(false);
        recognition.onend = () => setEscuchando(false);
    };

    const confirmarProyecto = async (completado) => {
        setConfirmacionVisible(false);
        if (!conversacionActiva) return;
        try {
            await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/conversations/${conversacionActiva}`,
                {
                    method: "PATCH",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        status: completado ? "completado" : "pendiente_confirmar"
                    })
                }
            );
            cargarConversaciones();
        } catch (err) {
            console.error("error actualizando estado:", err);
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

    const formatHora = (fechaStr) => {
        if (!fechaStr) return "";
        return new Date(fechaStr).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    };

    useEffect(() => {
        if (!token) { navigate("/login"); return; }
        cargarConversaciones();
        const convId = searchParams.get("conversation");
        if (convId) { abrirConversacion(parseInt(convId)); return; }
        const contextoInicial = sessionStorage.getItem("gia_contexto_inicial");
        if (contextoInicial) {
            sessionStorage.removeItem("gia_contexto_inicial");
            setTimeout(async () => {
                setMensajes([{ role: "user", content: contextoInicial, created_at: new Date().toISOString() }]);
                setCargando(true);
                try {
                    const response = await fetch(
                        `${import.meta.env.VITE_BACKEND_URL}/api/chat`,
                        {
                            method: "POST",
                            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                            body: JSON.stringify({
                                conversation_id: null,
                                message: contextoInicial,
                                current_time: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
                            })
                        }
                    );
                    const data = await response.json();
                    if (data.message && data.message.role) {
                        setMensajes(prev => [...prev, data.message]);
                        detectarProgreso(data.message.content);
                    }
                    if (data.conversation_id) setConversacionActiva(data.conversation_id);
                    const res = await fetch(
                        `${import.meta.env.VITE_BACKEND_URL}/api/conversations`,
                        { headers: { "Authorization": `Bearer ${token}` } }
                    );
                    const d = await res.json();
                    setConversaciones(d.items || []);
                } catch (err) {
                    console.error("error enviando contexto inicial:", err);
                } finally {
                    setCargando(false);
                }
            }, 500);
        }
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [mensajes]);

    const porcentaje = totalPasos > 0 ? Math.round((pasoActual / totalPasos) * 100) : 0;

    return (
        <div className="flex h-screen w-full overflow-hidden bg-ivoire dark:bg-noche">

            {sidebarAbierto && (
                <div className="fixed inset-0 bg-black/40 z-20 md:hidden" onClick={() => setSidebarAbierto(false)} />
            )}

            <aside className={`
                fixed md:relative z-30 md:z-auto h-full w-64 flex-shrink-0
                bg-white dark:bg-noche-suave border-r border-douche dark:border-noche-borde
                flex flex-col transition-transform duration-300
                ${sidebarAbierto ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
            `}>
                <div className="p-4 flex items-center justify-between">
                    <Link to="/" className="hover:opacity-70 transition">
                        <LogoGia size={28} />
                    </Link>
                    <button onClick={nuevaConversacion} className="w-7 h-7 rounded-lg flex items-center justify-center text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire hover:bg-douche/50 dark:hover:bg-white/5 transition">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-2 pb-2">
                    {cargandoHistorial ? (
                        <div className="px-3 py-8 text-center">
                            <div className="w-4 h-4 border-2 border-douche border-t-gris-piedra rounded-full animate-spin mx-auto" />
                        </div>
                    ) : conversaciones.length === 0 ? (
                        <p className="text-xs text-gris-piedra px-3 py-8 text-center">Aún no tienes proyectos</p>
                    ) : (
                        conversaciones.map((conv) => (
                            <div key={conv.id} className={`group relative flex items-center rounded-lg mb-0.5 transition ${conversacionActiva === conv.id ? "bg-douche dark:bg-noche-borde" : "hover:bg-douche/40 dark:hover:bg-white/5"}`}>
                                <button onClick={() => abrirConversacion(conv.id)} className="flex-1 text-left px-3 py-2.5 min-w-0">
                                    <p className="text-sm font-medium truncate text-deep-ocean dark:text-ivoire leading-tight">{conv.title || "Sin título"}</p>
                                    {conv.has_manual && <p className="text-xs text-noyer dark:text-mantequilla mt-0.5">Manual</p>}
                                </button>
                                <button onClick={(e) => borrarConversacion(e, conv.id)} disabled={borrandoId === conv.id} className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-2 mr-1 rounded text-gris-piedra hover:text-red-500 transition">
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

                <div className="p-4 border-t border-douche dark:border-noche-borde">
                    <button onClick={cerrarSesion} className="flex items-center gap-2 text-xs text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire transition">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            <main className="flex-1 flex flex-col min-w-0 h-full">

                <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-douche dark:border-noche-borde bg-white dark:bg-noche-suave">
                    <button onClick={() => setSidebarAbierto(true)} className="text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire transition">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                            <path d="M3 12h18M3 6h18M3 18h18" />
                        </svg>
                    </button>
                    <LogoGia size={24} />
                </div>

                {totalPasos > 0 && (
                    <div className="px-6 py-2.5 border-b border-douche dark:border-noche-borde bg-white dark:bg-noche-suave">
                        <div className="max-w-2xl mx-auto flex items-center gap-4">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-noyer dark:text-mantequilla flex-shrink-0">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                            </svg>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-[10px] font-semibold tracking-[0.12em] uppercase text-gris-piedra">
                                        Paso {pasoActual} de {totalPasos}
                                    </span>
                                    <span className="text-[10px] font-medium text-noyer dark:text-mantequilla">
                                        {porcentaje}%
                                    </span>
                                </div>
                                <div className="h-0.5 w-full bg-douche dark:bg-noche-borde rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-noyer dark:bg-mantequilla rounded-full transition-all duration-500"
                                        style={{ width: `${porcentaje}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {confirmacionVisible && conversacionActiva && (
                    <div className="px-6 py-3 border-b border-douche dark:border-noche-borde bg-white dark:bg-noche-suave">
                        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
                            <p className="text-xs text-noyer dark:text-mantequilla">
                                ¿Has completado este proyecto correctamente?
                            </p>
                            <div className="flex gap-2 flex-shrink-0">
                                <button
                                    onClick={() => confirmarProyecto(true)}
                                    className="px-3 py-1.5 rounded-lg bg-deep-ocean dark:bg-sky text-ivoire dark:text-noche text-xs font-medium hover:opacity-90 transition"
                                >
                                    Sí, completado
                                </button>
                                <button
                                    onClick={() => confirmarProyecto(false)}
                                    className="px-3 py-1.5 rounded-lg border border-douche dark:border-noche-borde text-gris-piedra text-xs hover:text-deep-ocean dark:hover:text-ivoire transition"
                                >
                                    Pendiente
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex-1 overflow-y-auto">
                    {mensajes.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center px-6 text-center">
                            <LogoGia size={36} conTexto={false} />
                            <p className="text-sm text-gris-piedra mt-4 max-w-xs leading-relaxed">
                                Cuéntame qué quieres montar, instalar, reparar o restaurar.
                            </p>
                        </div>
                    ) : (
                        <div className="max-w-2xl mx-auto px-4 py-8 space-y-4">
                            {mensajes.map((msg, index) => (
                                <div key={index} className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
                                    <div className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === "user" ? "bg-deep-ocean text-ivoire dark:bg-sky dark:text-noche rounded-br-sm" : "bg-white dark:bg-noche-suave text-deep-ocean dark:text-ivoire border border-douche dark:border-noche-borde rounded-bl-sm"}`}>
                                        {msg.content.startsWith("[imagen:") ? (
                                            <img
                                                src={msg.content.replace("[imagen:", "").replace("]", "")}
                                                alt="imagen enviada"
                                                className="max-w-full rounded-lg max-h-48 object-cover"
                                            />
                                        ) : (
                                            <ReactMarkdown>{msg.content}</ReactMarkdown>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-gris-piedra/60 mt-1 px-1">{formatHora(msg.created_at)}</span>
                                </div>
                            ))}
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

                <div className="border-t border-douche dark:border-noche-borde bg-white dark:bg-noche-suave px-4 py-3">
                    <div className="max-w-2xl mx-auto">
                        <div className="flex gap-2 items-end">

                            <input ref={fileInputRef} type="file" accept=".pdf" onChange={subirPDF} className="hidden" />
                            <input ref={imgInputRef} type="file" accept="image/*" capture="environment" onChange={subirImagen} className="hidden" />

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={subiendoPDF || cargando}
                                title="Subir manual PDF"
                                className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border border-douche dark:border-noche-borde text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire hover:border-deep-ocean/30 transition disabled:opacity-40"
                            >
                                {subiendoPDF ? (
                                    <div className="w-3.5 h-3.5 border border-gris-piedra border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <line x1="12" y1="18" x2="12" y2="12" />
                                        <line x1="9" y1="15" x2="15" y2="15" />
                                    </svg>
                                )}
                            </button>

                            <button
                                onClick={() => imgInputRef.current?.click()}
                                disabled={subiendoImagen || cargando}
                                title="Subir fotografía"
                                className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border border-douche dark:border-noche-borde text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire hover:border-deep-ocean/30 transition disabled:opacity-40"
                            >
                                {subiendoImagen ? (
                                    <div className="w-3.5 h-3.5 border border-gris-piedra border-t-transparent rounded-full animate-spin" />
                                ) : (
                                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                                        <circle cx="12" cy="13" r="4" />
                                    </svg>
                                )}
                            </button>

                            <button
                                onClick={iniciarVoz}
                                disabled={cargando}
                                title="Dictado de voz"
                                className={`flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border transition ${escuchando
                                    ? "border-deep-ocean dark:border-sky text-deep-ocean dark:text-sky bg-deep-ocean/5"
                                    : "border-douche dark:border-noche-borde text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire hover:border-deep-ocean/30"
                                    } disabled:opacity-40`}
                            >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                                    <path d="M19 10v2a7 7 0 01-14 0v-2" />
                                    <line x1="12" y1="19" x2="12" y2="23" />
                                    <line x1="8" y1="23" x2="16" y2="23" />
                                </svg>
                            </button>

                            <textarea
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={escuchando ? "Escuchando..." : "Escribe o habla..."}
                                rows={1}
                                className="flex-1 resize-none px-3.5 py-2.5 rounded-lg border border-douche dark:border-noche-borde bg-ivoire dark:bg-noche text-deep-ocean dark:text-ivoire placeholder:text-gris-piedra text-sm outline-none focus:border-deep-ocean/40 dark:focus:border-sky/40 transition max-h-32 overflow-y-auto"
                            />

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