import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

export const Register = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async () => {
        setError("");
        if (!email || !password) {
            setError("rellena el email y la contraseña");
            return;
        }
        if (password.length < 6) {
            setError("la contraseña necesita al menos 6 caracteres");
            return;
        }
        setLoading(true);
        try {
            const response = await fetch(import.meta.env.VITE_BACKEND_URL + "/api/auth/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (!response.ok) {
                setError(data.message || "algo salió mal");
                setLoading(false);
                return;
            }
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify({ email }));
            navigate("/onboarding");
        } catch {
            setError("no pude conectar con el servidor");
            setLoading(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-ivoire dark:bg-noche px-4 py-10">
            <div className="w-full max-w-md">

                <div className="mb-10">
                    <p className="text-[9px] font-semibold tracking-[0.16em] uppercase text-gris-piedra mb-2">
                        GIA · Guía Inteligente de Instalación
                    </p>
                    <h1 className="text-2xl font-medium tracking-tight text-noyer dark:text-mantequilla mb-2">
                        Crea tu cuenta
                    </h1>
                    <p className="text-sm text-gris-piedra">
                        GIA te acompaña en cada montaje.
                    </p>
                </div>

                <div className="border-t border-douche dark:border-noche-borde mb-8" />

                <div className="space-y-4">
                    <div>
                        <label className="text-[9px] font-semibold tracking-[0.16em] uppercase text-gris-piedra block mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="tu@email.com"
                            className="w-full px-4 py-3 rounded-lg border border-douche dark:border-noche-borde bg-white dark:bg-noche-suave text-deep-ocean dark:text-ivoire placeholder:text-gris-piedra/40 text-sm outline-none focus:border-deep-ocean/40 dark:focus:border-sky/40 transition"
                        />
                    </div>

                    <div>
                        <label className="text-[9px] font-semibold tracking-[0.16em] uppercase text-gris-piedra block mb-2">
                            Contraseña
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="mínimo 6 caracteres"
                                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                                className="w-full px-4 py-3 pr-12 rounded-lg border border-douche dark:border-noche-borde bg-white dark:bg-noche-suave text-deep-ocean dark:text-ivoire placeholder:text-gris-piedra/40 text-sm outline-none focus:border-deep-ocean/40 dark:focus:border-sky/40 transition"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire transition"
                            >
                                {showPassword ? (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                        <path d="M1 1l22 22M6.61 6.61A13.5 13.5 0 0 0 2 12s3 8 10 8a9.7 9.7 0 0 0 5.39-1.61" />
                                    </svg>
                                ) : (
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                        <path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {error && (
                        <p className="text-xs text-red-500 px-4 py-3 rounded-lg bg-red-50 dark:bg-red-950/20">
                            {error}
                        </p>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full px-5 py-3 rounded-lg bg-deep-ocean dark:bg-sky text-ivoire dark:text-noche text-sm font-medium hover:opacity-90 transition disabled:opacity-40"
                    >
                        {loading ? "Creando cuenta..." : "Crear cuenta"}
                    </button>
                </div>

                <p className="text-center text-xs text-gris-piedra mt-6">
                    ¿Ya tienes cuenta?{" "}
                    <Link to="/login" className="text-deep-ocean dark:text-sky hover:underline">
                        Entra aquí
                    </Link>
                </p>
            </div>
        </div>
    );
};