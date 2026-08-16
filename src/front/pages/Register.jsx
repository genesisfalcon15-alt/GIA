import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export const Register = () => {
    const navigate = useNavigate();
    const [nombre, setNombre] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [cargando, setCargando] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
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

    return (
        <div className="min-h-screen bg-ivoire dark:bg-noche flex items-center justify-center px-6">
            <div className="w-full max-w-sm">

                <div className="mb-8">
                    <p className="text-[9px] font-semibold tracking-[0.16em] uppercase text-gris-piedra mb-2">
                        GIA
                    </p>
                    <h1 className="text-2xl font-medium tracking-tight text-noyer dark:text-mantequilla mb-1">
                        Crea tu cuenta
                    </h1>
                    <p className="text-sm text-gris-piedra">
                        Empieza a trabajar con GIA en segundos.
                    </p>
                </div>

                <div className="border-t border-douche dark:border-noche-borde mb-8" />

                <form onSubmit={handleSubmit} className="space-y-3">
                    <input
                        type="text"
                        placeholder="¿Cómo te llamas?"
                        value={nombre}
                        onChange={e => setNombre(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-douche dark:border-noche-borde bg-white dark:bg-noche-suave text-deep-ocean dark:text-ivoire placeholder:text-gris-piedra/40 text-sm outline-none focus:border-deep-ocean/40 dark:focus:border-sky/40 transition"
                    />
                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-douche dark:border-noche-borde bg-white dark:bg-noche-suave text-deep-ocean dark:text-ivoire placeholder:text-gris-piedra/40 text-sm outline-none focus:border-deep-ocean/40 dark:focus:border-sky/40 transition"
                    />
                    <input
                        type="password"
                        placeholder="Contraseña"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-xl border border-douche dark:border-noche-borde bg-white dark:bg-noche-suave text-deep-ocean dark:text-ivoire placeholder:text-gris-piedra/40 text-sm outline-none focus:border-deep-ocean/40 dark:focus:border-sky/40 transition"
                    />

                    {error && (
                        <p className="text-xs text-red-500">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={!email.trim() || !password.trim() || cargando}
                        className="w-full px-4 py-3 rounded-xl bg-deep-ocean dark:bg-sky text-ivoire dark:text-noche text-sm font-medium hover:opacity-90 transition disabled:opacity-40"
                    >
                        {cargando ? "Creando cuenta..." : "Crear cuenta"}
                    </button>
                </form>

                <p className="text-center text-xs text-gris-piedra mt-6">
                    ¿Ya tienes cuenta?{" "}
                    <Link to="/login" className="text-deep-ocean dark:text-sky hover:opacity-70 transition">
                        Inicia sesión
                    </Link>
                </p>

            </div>
        </div>
    );
};