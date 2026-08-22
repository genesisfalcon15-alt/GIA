import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { LogoGia } from "../components/LogoGia";
import { Eye, EyeOff } from "lucide-react";

export const Register = () => {
    const navigate = useNavigate();
    const [nombre, setNombre] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(false);
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

    const handleSubmit = async () => {
        if (!email.trim() || !password.trim()) return;
        setCargando(true);
        setError("");
        try {
            const response = await fetch(
                `${import.meta.env.VITE_BACKEND_URL}/api/auth/register`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        name: nombre.trim(),
                        email: email.trim().toLowerCase(),
                        password
                    })
                }
            );
            const data = await response.json();
            if (!response.ok) {
                setError(data.message || "Error al crear la cuenta");
                return;
            }
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));
            navigate("/onboarding");
        } catch (err) {
            setError("Error de conexión. Inténtalo de nuevo.");
        } finally {
            setCargando(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") handleSubmit();
    };

    const borderColor = isDark ? "#3A4150" : "#DDD6CE";
    const bg = isDark ? "#232830" : "#FAF8F6";
    const cardBg = isDark ? "rgba(44,50,60,0.50)" : "#ffffff";

    return (
        <div style={{
            minHeight: "100vh",
            background: bg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px"
        }}>
            <div style={{ width: "100%", maxWidth: "400px" }}>

                {/* logo */}
                <div style={{ display: "flex", justifyContent: "center", marginBottom: "40px" }}>
                    <LogoGia size={32} conTexto={true} />
                </div>

                {/* cabecera */}
                <div style={{ marginBottom: "32px" }}>
                    <h1 style={{
                        fontSize: "24px", fontWeight: "500",
                        color: isDark ? "#F0DFA8" : "#A9895C",
                        letterSpacing: "-0.02em", marginBottom: "6px"
                    }}>
                        Crea tu cuenta
                    </h1>
                    <p style={{ fontSize: "14px", color: "#BAB3AE" }}>
                        Empieza a trabajar con GIA en segundos.
                    </p>
                </div>

                {/* formulario */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>

                    <input
                        type="text"
                        placeholder="¿Cómo te llamas?"
                        value={nombre}
                        onChange={e => setNombre(e.target.value)}
                        onKeyDown={handleKeyDown}
                        style={{
                            width: "100%", padding: "12px 16px",
                            borderRadius: "10px", border: `1px solid ${borderColor}`,
                            background: cardBg, color: isDark ? "#FAF8F6" : "#3C5160",
                            fontSize: "14px", outline: "none", boxSizing: "border-box"
                        }}
                    />

                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        onKeyDown={handleKeyDown}
                        style={{
                            width: "100%", padding: "12px 16px",
                            borderRadius: "10px", border: `1px solid ${borderColor}`,
                            background: cardBg, color: isDark ? "#FAF8F6" : "#3C5160",
                            fontSize: "14px", outline: "none", boxSizing: "border-box"
                        }}
                    />

                    <div style={{ position: "relative" }}>
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Contraseña"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onKeyDown={handleKeyDown}
                            style={{
                                width: "100%", padding: "12px 44px 12px 16px",
                                borderRadius: "10px", border: `1px solid ${borderColor}`,
                                background: cardBg, color: isDark ? "#FAF8F6" : "#3C5160",
                                fontSize: "14px", outline: "none", boxSizing: "border-box"
                            }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: "absolute", right: "12px", top: "50%",
                                transform: "translateY(-50%)",
                                background: "none", border: "none",
                                cursor: "pointer", color: "#BAB3AE",
                                display: "flex", alignItems: "center"
                            }}
                        >
                            {showPassword
                                ? <EyeOff size={16} strokeWidth={1.5} />
                                : <Eye size={16} strokeWidth={1.5} />
                            }
                        </button>
                    </div>

                    {error && (
                        <div style={{
                            padding: "12px 16px", borderRadius: "10px",
                            background: isDark ? "rgba(239,68,68,0.1)" : "rgba(239,68,68,0.06)",
                            border: "1px solid rgba(239,68,68,0.2)",
                            fontSize: "13px", color: "#ef4444"
                        }}>
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={!email.trim() || !password.trim() || cargando}
                        style={{
                            width: "100%", padding: "13px",
                            borderRadius: "10px",
                            background: !email.trim() || !password.trim() || cargando
                                ? (isDark ? "#3A4150" : "#DDD6CE")
                                : "#3C5160",
                            color: !email.trim() || !password.trim() || cargando
                                ? "#BAB3AE" : "#FAF8F6",
                            fontSize: "14px", fontWeight: "500",
                            border: "none",
                            cursor: !email.trim() || !password.trim() || cargando ? "default" : "pointer",
                            transition: "all 0.2s", marginTop: "4px"
                        }}
                    >
                        {cargando ? "Creando cuenta..." : "Crear cuenta"}
                    </button>
                </div>

                <p style={{ textAlign: "center", fontSize: "13px", color: "#BAB3AE", marginTop: "24px" }}>
                    ¿Ya tienes cuenta?{" "}
                    <Link to="/login" style={{ color: isDark ? "#A9B5C2" : "#3C5160", fontWeight: "500", textDecoration: "none" }}>
                        Inicia sesión
                    </Link>
                </p>
            </div>
        </div>
    );
};