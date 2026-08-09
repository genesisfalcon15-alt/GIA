import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogoGia } from "./LogoGia";
import { Moon, Sun, User, FolderOpen, BookOpen, LogOut, ChevronDown, Zap } from "lucide-react";

export const Navbar = () => {
	const navigate = useNavigate();
	const [darkMode, setDarkMode] = useState(() => {
		const temaGuardado = localStorage.getItem("gia_tema");
		if (temaGuardado) return temaGuardado === "oscuro";
		return window.matchMedia("(prefers-color-scheme: dark)").matches;
	});
	const [menuAbierto, setMenuAbierto] = useState(false);
	const [totalProyectos, setTotalProyectos] = useState(null);
	const menuRef = useRef(null);

	const token = localStorage.getItem("token");
	const user = JSON.parse(localStorage.getItem("user") || "null");
	const email = user?.email || "";

	useEffect(() => {
		if (!token) return;
		fetch(`${import.meta.env.VITE_BACKEND_URL}/api/conversations`, {
			headers: { Authorization: `Bearer ${token}` }
		})
			.then(r => r.json())
			.then(data => setTotalProyectos((data.items || []).length))
			.catch(() => { });
	}, [token]);

	useEffect(() => {
		const handleClickOutside = (e) => {
			if (menuRef.current && !menuRef.current.contains(e.target)) {
				setMenuAbierto(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	useEffect(() => {
		document.documentElement.classList.toggle("dark", darkMode);
		localStorage.setItem("gia_tema", darkMode ? "oscuro" : "claro");
	}, [darkMode]);

	useEffect(() => {
		const temaGuardado = localStorage.getItem("gia_tema") === "oscuro";
		document.documentElement.classList.toggle("dark", temaGuardado);
	}, []);

	const cerrarSesion = () => {
		localStorage.removeItem("token");
		localStorage.removeItem("user");
		navigate("/login");
	};

	const irA = (ruta) => {
		setMenuAbierto(false);
		navigate(ruta);
	};

	return (
		<nav className="bg-ivoire dark:bg-noche border-b border-douche dark:border-noche-borde px-6 py-3 flex items-center justify-between">

			<Link to="/" className="hover:opacity-70 transition-opacity">
				<LogoGia size={32} />
			</Link>

			<div className="flex items-center gap-3">

				<button
					onClick={() => setDarkMode(!darkMode)}
					className="w-8 h-8 rounded-lg flex items-center justify-center text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire hover:bg-douche/50 dark:hover:bg-white/5 transition"
				>
					{darkMode ? <Sun size={16} strokeWidth={1.5} /> : <Moon size={16} strokeWidth={1.5} />}
				</button>

				{token && (
					<div className="relative" ref={menuRef}>
						<button
							onClick={() => setMenuAbierto(!menuAbierto)}
							className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-douche dark:border-noche-borde hover:bg-douche/40 dark:hover:bg-white/5 transition text-sm text-deep-ocean dark:text-ivoire"
						>
							<span className="max-w-[140px] truncate text-xs">{email}</span>
							<ChevronDown size={13} strokeWidth={1.5} className={`transition-transform ${menuAbierto ? "rotate-180" : ""}`} />
						</button>

						{menuAbierto && (
							<div className="absolute right-0 top-full mt-2 w-60 rounded-xl border border-douche dark:border-noche-borde bg-white dark:bg-noche-suave shadow-lg overflow-hidden z-50">

								<div className="px-4 py-3 border-b border-douche dark:border-noche-borde">
									<p className="text-[9px] font-semibold tracking-[0.14em] uppercase text-gris-piedra mb-0.5">
										Área personal
									</p>
									<p className="text-xs text-deep-ocean dark:text-ivoire truncate mb-2">{email}</p>
									<div className="flex items-center justify-between">
										<span className="text-[10px] text-gris-piedra">
											{totalProyectos !== null ? `${totalProyectos} proyecto${totalProyectos !== 1 ? "s" : ""}` : "—"}
										</span>
										<span className="flex items-center gap-1 text-[10px] text-noyer dark:text-mantequilla font-medium">
											<Zap size={10} strokeWidth={1.5} />
											Plan gratuito
										</span>
									</div>
								</div>

								<div className="py-1">
									<button onClick={() => irA("/perfil")} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-deep-ocean dark:text-ivoire hover:bg-douche/40 dark:hover:bg-white/5 transition text-left">
										<User size={14} strokeWidth={1.5} className="text-gris-piedra flex-shrink-0" />
										Mi perfil
									</button>
									<button onClick={() => irA("/montajes")} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-deep-ocean dark:text-ivoire hover:bg-douche/40 dark:hover:bg-white/5 transition text-left">
										<FolderOpen size={14} strokeWidth={1.5} className="text-gris-piedra flex-shrink-0" />
										Mis montajes
									</button>
									<button onClick={() => irA("/guias")} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-deep-ocean dark:text-ivoire hover:bg-douche/40 dark:hover:bg-white/5 transition text-left">
										<BookOpen size={14} strokeWidth={1.5} className="text-gris-piedra flex-shrink-0" />
										Mis guías
									</button>
								</div>

								<div className="border-t border-douche dark:border-noche-borde py-1">
									<button onClick={cerrarSesion} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition text-left">
										<LogOut size={14} strokeWidth={1.5} className="flex-shrink-0" />
										Cerrar sesión
									</button>
								</div>

							</div>
						)}
					</div>
				)}

				{!token && (
					<div className="flex items-center gap-2">
						<button onClick={() => navigate("/login")} className="px-3 py-1.5 text-xs text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire transition">
							Iniciar sesión
						</button>
						<button onClick={() => navigate("/register")} className="px-3 py-1.5 rounded-lg bg-deep-ocean text-ivoire hover:bg-ocean-vivo transition dark:bg-sky dark:text-noche text-xs font-medium">
							Registrarse
						</button>
					</div>
				)}

			</div>
		</nav>
	);
};