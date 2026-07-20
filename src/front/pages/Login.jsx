import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ToggleTema } from "../components/ToggleTema";

export const Login = () => {
    // aqui guardo lo que el usuario escribe
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    // para el ojito de ver la contraseña
    const [showPassword, setShowPassword] = useState(false);
    // para mostrar errores del backend
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async () => {
        setError("");

        if (!email || !password) {
            setError("rellena el email y la contraseña");
            return;
        }

        setLoading(true);

        try {
            const backendUrl = import.meta.env.VITE_BACKEND_URL;
            const response = await fetch(backendUrl + "/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                // si el backend devuelve error, lo muestro
                setError(data.message || "algo salio mal");
                setLoading(false);
                return;
            }

            // guardo el token para las siguientes peticiones
            localStorage.setItem("token", data.token);
            localStorage.setItem("user", JSON.stringify(data.user));

            navigate("/");

        } catch (err) {
            setError("no pude conectar con el servidor");
        }

        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-ivoire dark:bg-noche px-4">
            <div className="w-full max-w-md">

                <div className="flex justify-end mb-4">
                    <ToggleTema />
                </div>

                <h1 className="text-3xl font-semibold text-deep-ocean dark:text-ivoire mb-2">
                    Bienvenida de vuelta
                </h1>
                <p className="text-gris-piedra mb-8">
                    Entra para seguir con tus montajes
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-deep-ocean dark:text-ivoire mb-1.5">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="tu@email.com"
                            className="w-full px-4 py-3 rounded-xl border border-douche bg-white text-deep-ocean placeholder:text-gris-piedra dark:bg-noche-suave dark:border-noche-borde dark:text-ivoire outline-none focus:border-ocean-vivo transition"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-deep-ocean dark:text-ivoire mb-1.5">
                            Contraseña
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="tu contraseña"
                                className="w-full px-4 py-3 pr-12 rounded-xl border border-douche bg-white text-deep-ocean placeholder:text-gris-piedra dark:bg-noche-suave dark:border-noche-borde dark:text-ivoire outline-none focus:border-ocean-vivo transition"
                            />
                            {/* el ojito para ver la contraseña */}
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire transition"
                            >
                                {showPassword ? (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                                        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 10 8 10 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                                        <path d="M1 1l22 22M6.61 6.61A13.5 13.5 0 0 0 2 12s3 8 10 8a9.7 9.7 0 0 0 5.39-1.61" />
                                    </svg>
                                ) : (
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
                                        <path d="M2 12s3-8 10-8 10 8 10 8-3 8-10 8-10-8-10-8z" />
                                        <circle cx="12" cy="12" r="3" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* aqui sale el error si algo falla */}
                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 dark:bg-red-950/30 dark:text-red-400 px-4 py-3 rounded-xl">
                            {error}
                        </p>
                    )}

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        className="w-full bg-gradient-to-br from-ocean-vivo to-deep-ocean text-ivoire py-3.5 rounded-xl font-semibold shadow-lg shadow-deep-ocean/30 hover:shadow-xl hover:shadow-deep-ocean/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50 dark:from-sky dark:to-clouds dark:text-noche dark:shadow-sky/20"
                    >
                        {loading ? "Entrando…" : "Entrar"}
                    </button>
                </div>

                <p className="text-center text-sm text-gris-piedra mt-6">
                    ¿Todavía no tienes cuenta?{" "}
                    <Link to="/register" className="text-deep-ocean dark:text-sky font-semibold hover:underline">
                        Regístrate
                    </Link>
                </p>
            </div>
        </div>
    );
};