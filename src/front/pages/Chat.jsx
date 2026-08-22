import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import { Paperclip, Camera, Mic, Send, Plus } from "lucide-react";

export const Chat = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const bottomRef = useRef(null);
    const fileInputRef = useRef(null);
    const imgInputRef = useRef(null);

    const [mensajes, setMensajes] = useState([]);
    const [input, setInput] = useState("");
    const [cargando, setCargando] = useState(false);
    const [subiendoPDF, setSubiendoPDF] = useState(false);
    const [subiendoImagen, setSubiendoImagen] = useState(false);
    const [escuchando, setEscuchando] = useState(false);
    const [conversacionActiva, setConversacionActiva] = useState(null);
    const [tituloProyecto, setTituloProyecto] = useState("");
    const [isDark, setIsDark] = useState(
        document.documentElement.classList.contains("dark")
    );

    const token = localStorage.getItem("token");

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains("dark"));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!token) { navigate("/login"); return; }

        const convId = searchParams.get("conversation");
        const modoImagen = searchParams.get("modo") === "imagen";
        const conArchivos = searchParams.get("con_archivos") === "true";

        if (convId) {
            abrirConversacion(parseInt(convId));
            return;
        }

        if (modoImagen) {
            setTimeout(() => imgInputRef.current?.click(), 400);
            return;
        }

        if (conArchivos) {
            // abre selector de imagen o pdf según contexto
            setTimeout(() => imgInputRef.current?.click(), 400);
        }

        const contextoInicial = sessionStorage.getItem("gia_contexto_inicial");
        if (contextoInicial) {
            sessionStorage.removeItem("gia_contexto_inicial");
            setTimeout(async () => {
                setMensajes([{ role: "user", content: contextoInicial, created_at: new Date().toISOString() }]);
                setCargando(true);
                try {
                    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/chat`, {
                        method: "POST",
                        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                        body: JSON.stringify({
                            conversation_id: null,
                            message: contextoInicial,
                            current_time: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
                        })
                    });
                    const data = await response.json();
                    if (data.message?.role) setMensajes(prev => [...prev, data.message]);
                    if (data.conversation_id) setConversacionActiva(data.conversation_id);
                    if (data.title) setTituloProyecto(data.title);
                } catch (err) {
                    console.error("error enviando contexto inicial:", err);
                } finally {
                    setCargando(false);
                }
            }, 300);
        }
    }, []);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [mensajes]);

    const abrirConversacion = async (id) => {
        setConversacionActiva(id);
        setCargando(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/conversations/${id}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            const data = await response.json();
            setMensajes(data.messages || []);
            setTituloProyecto(data.title || "");
        } catch (err) {
            console.error("error cargando conversacion:", err);
        } finally {
            setCargando(false);
        }
    };

    const enviarMensaje = async () => {
        if (!input.trim() || cargando) return;
        const texto = input.trim();
        setInput("");
        setMensajes(prev => [...prev, { role: "user", content: texto, created_at: new Date().toISOString() }]);
        setCargando(true);
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/chat`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    conversation_id: conversacionActiva,
                    message: texto,
                    current_time: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })
                })
            });
            const data = await response.json();
            if (data.message?.role) setMensajes(prev => [...prev, data.message]);
            if (!conversacionActiva && data.conversation_id) setConversacionActiva(data.conversation_id);
            if (data.title) setTituloProyecto(data.title);
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
            setCargando(true);
            try {
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/chat`, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                    body: JSON.stringify({ conversation_id: null, message: `He subido el manual: ${archivo.name}`, current_time: new Date().toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }) })
                });
                const data = await res.json();
                projectId = data.conversation_id;
                setConversacionActiva(projectId);
                if (data.title) setTituloProyecto(data.title);
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
            content: "Recibido. Estoy analizando el manual, dame un momento...",
            created_at: new Date().toISOString()
        }]);

        try {
            const formData = new FormData();
            formData.append("file", archivo);
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/manuals/${projectId}/upload`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                body: formData
            });
            if (response.ok) {
                const data = await response.json();
                setMensajes(prev => [...prev, {
                    role: "assistant",
                    content: data.gia_response || "Manual listo. ¿Empezamos?",
                    created_at: new Date().toISOString()
                }]);
            } else {
                setMensajes(prev => [...prev, { role: "assistant", content: "No pude procesar el manual. Inténtalo de nuevo.", created_at: new Date().toISOString() }]);
            }
        } catch {
            setMensajes(prev => [...prev, { role: "assistant", content: "No pude conectar con el servidor.", created_at: new Date().toISOString() }]);
        } finally {
            setSubiendoPDF(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const subirImagen = async (e) => {
        const archivos = Array.from(e.target.files);
        if (!archivos.length) return;

        for (const archivo of archivos) {
            setSubiendoImagen(true);
            setCargando(true);
            const urlLocal = URL.createObjectURL(archivo);
            setMensajes(prev => [...prev, { role: "user", content: `[imagen:${urlLocal}]`, created_at: new Date().toISOString() }]);

            try {
                const formData = new FormData();
                formData.append("image", archivo);
                if (conversacionActiva) formData.append("conversation_id", conversacionActiva);
                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/chat/image`, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${token}` },
                    body: formData
                });
                const data = await response.json();
                if (data.message?.role) setMensajes(prev => [...prev, data.message]);
                if (!conversacionActiva && data.conversation_id) setConversacionActiva(data.conversation_id);
                if (data.title) setTituloProyecto(data.title);
            } catch (err) {
                setMensajes(prev => [...prev, { role: "assistant", content: "No pude analizar la imagen.", created_at: new Date().toISOString() }]);
            } finally {
                setCargando(false);
                setSubiendoImagen(false);
            }
        }
        if (imgInputRef.current) imgInputRef.current.value = "";
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
        setEscuchando(true);
        recognition.start();
        recognition.onresult = (e) => { setInput(prev => prev + e.results[0][0].transcript); setEscuchando(false); };
        recognition.onerror = () => setEscuchando(false);
        recognition.onend = () => setEscuchando(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviarMensaje(); }
    };

    const formatHora = (fechaStr) => {
        if (!fechaStr) return "";
        return new Date(fechaStr).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    };

    const bg = isDark ? "#232830" : "#FAF8F6";
    const bgMsg = isDark ? "#2C323C" : "#ffffff";
    const borderColor = isDark ? "#3A4150" : "#DDD6CE";

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100%", background: bg }}>

            {/* topbar sutil */}
            <div style={{
                flexShrink: 0,
                padding: "14px 24px",
                borderBottom: `1px solid ${borderColor}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                background: bg
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    {tituloProyecto && (
                        <span style={{ fontSize: "14px", fontWeight: "500", color: isDark ? "#FAF8F6" : "#3C5160" }}>
                            {tituloProyecto}
                        </span>
                    )}
                    {!tituloProyecto && (
                        <span style={{ fontSize: "14px", color: "#BAB3AE" }}>Nueva conversación</span>
                    )}
                </div>
                <button
                    onClick={() => { setMensajes([]); setConversacionActiva(null); setTituloProyecto(""); navigate("/chat"); }}
                    style={{
                        display: "flex", alignItems: "center", gap: "6px",
                        padding: "6px 12px", borderRadius: "8px",
                        background: "transparent",
                        border: `1px solid ${borderColor}`,
                        fontSize: "12px", color: "#BAB3AE",
                        cursor: "pointer"
                    }}
                >
                    <Plus size={13} strokeWidth={1.5} />
                    Nueva
                </button>
            </div>

            {/* área de mensajes */}
            <div style={{ flex: 1, overflowY: "auto", padding: "32px 0" }}>
                {mensajes.length === 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: "12px" }}>
                        <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: isDark ? "#2C323C" : "#F0EDE8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <span style={{ fontSize: "22px" }}>✦</span>
                        </div>
                        <p style={{ fontSize: "15px", color: isDark ? "#FAF8F6" : "#3C5160", fontWeight: "500" }}>
                            Cuéntame en qué puedo ayudarte
                        </p>
                        <p style={{ fontSize: "13px", color: "#BAB3AE", textAlign: "center", maxWidth: "320px", lineHeight: "1.6" }}>
                            Monta, instala, repara o restaura. Sube un manual, una foto o escríbeme directamente.
                        </p>
                    </div>
                ) : (
                    <div style={{ maxWidth: "720px", margin: "0 auto", padding: "0 24px", display: "flex", flexDirection: "column", gap: "24px" }}>
                        {mensajes.map((msg, index) => (
                            <div key={index} style={{ display: "flex", flexDirection: "column", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
                                <div style={{
                                    maxWidth: "80%",
                                    padding: msg.role === "user" ? "10px 16px" : "14px 18px",
                                    borderRadius: msg.role === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                                    background: msg.role === "user"
                                        ? "#3C5160"
                                        : bgMsg,
                                    border: msg.role === "user" ? "none" : `1px solid ${borderColor}`,
                                    fontSize: "14px",
                                    lineHeight: "1.6",
                                    color: msg.role === "user" ? "#FAF8F6" : (isDark ? "#FAF8F6" : "#3C5160")
                                }}>
                                    {msg.content.startsWith("[imagen:") ? (
                                        <img
                                            src={msg.content.replace("[imagen:", "").replace("]", "")}
                                            alt="imagen enviada"
                                            style={{ maxWidth: "100%", borderRadius: "10px", maxHeight: "280px", objectFit: "cover" }}
                                        />
                                    ) : (
                                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                                    )}
                                </div>
                                <span style={{ fontSize: "11px", color: "#BAB3AE", marginTop: "4px", paddingLeft: "4px", paddingRight: "4px" }}>
                                    {formatHora(msg.created_at)}
                                </span>
                            </div>
                        ))}
                        {cargando && (
                            <div style={{ display: "flex", alignItems: "flex-start" }}>
                                <div style={{
                                    padding: "14px 18px",
                                    borderRadius: "18px 18px 18px 4px",
                                    background: bgMsg,
                                    border: `1px solid ${borderColor}`,
                                    display: "flex", gap: "5px", alignItems: "center"
                                }}>
                                    {[0, 150, 300].map(delay => (
                                        <div key={delay} style={{
                                            width: "6px", height: "6px", borderRadius: "50%",
                                            background: "#BAB3AE",
                                            animation: "bounce 1.2s infinite",
                                            animationDelay: `${delay}ms`
                                        }} />
                                    ))}
                                </div>
                            </div>
                        )}
                        <div ref={bottomRef} />
                    </div>
                )}
            </div>

            {/* input */}
            <div style={{
                flexShrink: 0,
                padding: "16px 24px 20px",
                borderTop: `1px solid ${borderColor}`,
                background: bg
            }}>
                <div style={{
                    maxWidth: "720px",
                    margin: "0 auto",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px"
                }}>
                    <div style={{
                        display: "flex",
                        alignItems: "flex-end",
                        gap: "8px",
                        padding: "10px 14px",
                        borderRadius: "14px",
                        border: `1px solid ${borderColor}`,
                        background: isDark ? "#2C323C" : "#ffffff"
                    }}>
                        {/* inputs ocultos */}
                        <input ref={fileInputRef} type="file" accept=".pdf" onChange={subirPDF} style={{ display: "none" }} />
                        <input ref={imgInputRef} type="file" accept="image/*" multiple onChange={subirImagen} style={{ display: "none" }} />

                        {/* botones adjuntar */}
                        <div style={{ display: "flex", gap: "4px", flexShrink: 0 }}>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={subiendoPDF || cargando}
                                title="Subir manual PDF"
                                style={{
                                    width: "32px", height: "32px", borderRadius: "8px",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    background: "transparent", border: "none", cursor: "pointer",
                                    color: subiendoPDF ? "#A9895C" : "#BAB3AE",
                                    opacity: cargando && !subiendoPDF ? 0.4 : 1
                                }}
                            >
                                {subiendoPDF
                                    ? <div style={{ width: "14px", height: "14px", border: "2px solid #A9895C", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                                    : <Paperclip size={16} strokeWidth={1.5} />
                                }
                            </button>
                            <button
                                onClick={() => imgInputRef.current?.click()}
                                disabled={subiendoImagen || cargando}
                                title="Subir fotografía"
                                style={{
                                    width: "32px", height: "32px", borderRadius: "8px",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    background: "transparent", border: "none", cursor: "pointer",
                                    color: subiendoImagen ? "#A9895C" : "#BAB3AE",
                                    opacity: cargando && !subiendoImagen ? 0.4 : 1
                                }}
                            >
                                {subiendoImagen
                                    ? <div style={{ width: "14px", height: "14px", border: "2px solid #A9895C", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                                    : <Camera size={16} strokeWidth={1.5} />
                                }
                            </button>
                            <button
                                onClick={iniciarVoz}
                                disabled={cargando}
                                title="Dictado de voz"
                                style={{
                                    width: "32px", height: "32px", borderRadius: "8px",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    background: escuchando ? "rgba(169,137,92,0.15)" : "transparent",
                                    border: "none", cursor: "pointer",
                                    color: escuchando ? "#A9895C" : "#BAB3AE"
                                }}
                            >
                                <Mic size={16} strokeWidth={1.5} />
                            </button>
                        </div>

                        {/* divisor */}
                        <div style={{ width: "1px", height: "20px", background: borderColor, flexShrink: 0 }} />

                        {/* textarea */}
                        <textarea
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={escuchando ? "Escuchando..." : "Escríbeme o envía una imagen..."}
                            rows={1}
                            style={{
                                flex: 1,
                                resize: "none",
                                border: "none",
                                outline: "none",
                                background: "transparent",
                                fontSize: "14px",
                                color: isDark ? "#FAF8F6" : "#3C5160",
                                lineHeight: "1.5",
                                maxHeight: "120px",
                                overflowY: "auto",
                                padding: "4px 0"
                            }}
                        />

                        {/* botón enviar */}
                        <button
                            onClick={enviarMensaje}
                            disabled={!input.trim() || cargando}
                            style={{
                                width: "34px", height: "34px", borderRadius: "9px",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                background: input.trim() && !cargando ? "#3C5160" : (isDark ? "#3A4150" : "#DDD6CE"),
                                border: "none", cursor: input.trim() && !cargando ? "pointer" : "default",
                                transition: "background 0.2s",
                                flexShrink: 0
                            }}
                        >
                            <Send size={15} strokeWidth={1.8} style={{ color: input.trim() && !cargando ? "#FAF8F6" : "#BAB3AE" }} />
                        </button>
                    </div>

                    <p style={{ fontSize: "11px", color: "#BAB3AE", textAlign: "center" }}>
                        Enter para enviar · Shift+Enter para saltar línea
                    </p>
                </div>
            </div>

            <style>{`
                @keyframes bounce {
                    0%, 60%, 100% { transform: translateY(0); }
                    30% { transform: translateY(-6px); }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};