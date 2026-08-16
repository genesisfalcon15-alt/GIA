import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogoGia } from "./LogoGia";
import { Sun, Moon, X, FolderOpen, BookOpen, PlusSquare, LogOut, User, ChevronDown } from "lucide-react";

export const Navbar = () => {
	const navigate = useNavigate();

	const [darkMode, setDarkMode] = useState(() => {
		const saved = localStorage.getItem("gia_tema") || localStorage.getItem("tema");
		if (saved) return saved === "oscuro";
		return window.matchMedia("(prefers-color-scheme: dark)").matches;
	});

	const [menuAbierto, setMenuAbierto] = useState(false);
	const [perfilAbierto, setPerfilAbierto] = useState(false);
	const menuRef = useRef(null);
	const perfilRef = useRef(null);

	const token = localStorage.getItem("token");
	const user = JSON.parse(localStorage.getItem("user") || "null");
	const email = user?.email || "";
	const nombre = user?.name || email.split("@")[0] || "";
	const inicial = nombre ? nombre[0].toUpperCase() : "G";

	useEffect(() => {
		document.documentElement.classList.toggle("dark", darkMode);
		localStorage.setItem("gia_tema", darkMode ? "oscuro" : "claro");
		localStorage.setItem("tema", darkMode ? "oscuro" : "claro");
	}, [darkMode]);

	useEffect(() => {
		const handler = (e) => {
			if (menuRef.current && !menuRef.current.contains(e.target)) setMenuAbierto(false);
			if (perfilRef.current && !perfilRef.current.contains(e.target)) setPerfilAbierto(false);
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);

	const cerrarSesion = () => {
		const tema = localStorage.getItem("gia_tema") || localStorage.getItem("tema");
		localStorage.removeItem("token");
		localStorage.removeItem("user");
		if (tema) {
			localStorage.setItem("gia_tema", tema);
			localStorage.setItem("tema", tema);
		}
		setMenuAbierto(false);
		navigate("/login");
	};

	const irA = (ruta) => {
		setMenuAbierto(false);
		navigate(ruta);
	};

	return (
		<>
			<nav className="bg-ivoire/90 dark:bg-noche/90 backdrop-blur-md border-b border-douche/60 dark:border-noche-borde/60 px-6 py-3 flex items-center justify-between sticky top-0 z-40">

				{/* izquierda — logo completo */}
				<Link to="/" className="hover:opacity-80 transition-opacity">
					<LogoGia size={32} conTexto={true} />
				</Link>

				{/* derecha */}
				<div className="flex items-center gap-2">

					{/* toggle modo */}
					<button
						onClick={() => setDarkMode(!darkMode)}
						className="w-8 h-8 rounded-lg flex items-center justify-center text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire hover:bg-douche/50 dark:hover:bg-white/5 transition"
					>
						{darkMode ? <Sun size={15} strokeWidth={1.5} /> : <Moon size={15} strokeWidth={1.5} />}
					</button>

					{token && (
						<>
							{/* dropdown email/usuario */}
							<div className="relative" ref={perfilRef}>
								<button
									onClick={() => setPerfilAbierto(!perfilAbierto)}
									className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-douche dark:border-noche-borde hover:bg-douche/40 dark:hover:bg-white/5 transition"
								>
									<span className="max-w-[140px] truncate text-xs text-deep-ocean dark:text-ivoire">{email}</span>
									<ChevronDown size={12} strokeWidth={1.5} className={`text-gris-piedra transition-transform ${perfilAbierto ? "rotate-180" : ""}`} />
								</button>

								{perfilAbierto && (
									<div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-douche dark:border-noche-borde bg-white dark:bg-noche-suave shadow-lg overflow-hidden z-50">
										<button
											onClick={() => { setPerfilAbierto(false); irA("/perfil"); }}
											className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-deep-ocean dark:text-ivoire hover:bg-douche/40 dark:hover:bg-white/5 transition text-left"
										>
											<User size={13} strokeWidth={1.5} className="text-gris-piedra" />
											Mi perfil
										</button>
										<div className="border-t border-douche dark:border-noche-borde" />
										<button
											onClick={cerrarSesion}
											className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition text-left"
										>
											<LogOut size={13} strokeWidth={1.5} />
											Cerrar sesión
										</button>
									</div>
								)}
							</div>

							{/* hamburguesa */}
							<button
								onClick={() => setMenuAbierto(!menuAbierto)}
								className="w-8 h-8 rounded-lg flex items-center justify-center text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire hover:bg-douche/50 dark:hover:bg-white/5 transition"
							>
								<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
									<path d="M3 12h18M3 6h18M3 18h18" />
								</svg>
							</button>
						</>
					)}

					{!token && (
						<div className="flex items-center gap-2">
							<button onClick={() => navigate("/login")} className="px-3 py-1.5 text-xs text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire transition">
								Iniciar sesión
							</button>
							<button onClick={() => navigate("/register")} className="px-3 py-1.5 rounded-lg bg-deep-ocean text-ivoire hover:opacity-90 transition dark:bg-sky dark:text-noche text-xs font-medium">
								Registrarse
							</button>
						</div>
					)}
				</div>
			</nav>

			{/* panel flotante hamburguesa glassmorphism */}
			{token && menuAbierto && (
				<div className="fixed inset-0 z-50 flex justify-end" ref={menuRef}>
					<div
						className="absolute inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-[2px]"
						onClick={() => setMenuAbierto(false)}
					/>
					<div className="relative w-72 h-full bg-white/85 dark:bg-noche-suave/90 backdrop-blur-xl border-l border-white/60 dark:border-noche-borde/60 shadow-2xl flex flex-col">

						{/* cabecera */}
						<div className="flex items-center justify-between px-6 py-5 border-b border-douche/60 dark:border-noche-borde/60">
							<div className="flex items-center gap-3">
								<div className="w-9 h-9 rounded-full bg-noyer dark:bg-mantequilla flex items-center justify-center text-ivoire dark:text-noche text-sm font-semibold">
									{inicial}
								</div>
								<div className="min-w-0">
									{nombre && <p className="text-sm font-medium text-deep-ocean dark:text-ivoire truncate">{nombre}</p>}
									<p className="text-xs text-gris-piedra truncate">{email}</p>
								</div>
							</div>
							<button
								onClick={() => setMenuAbierto(false)}
								className="w-7 h-7 rounded-lg flex items-center justify-center text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire transition"
							>
								<X size={14} strokeWidth={1.8} />
							</button>
						</div>

						{/* opciones */}
						<div className="flex-1 px-3 py-4 space-y-1">
							<button onClick={() => irA("/montajes")} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-deep-ocean dark:text-ivoire hover:bg-douche/40 dark:hover:bg-white/5 transition text-left">
								<FolderOpen size={16} strokeWidth={1.5} className="text-gris-piedra flex-shrink-0" />
								Mis montajes
							</button>
							<button onClick={() => irA("/guias")} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-deep-ocean dark:text-ivoire hover:bg-douche/40 dark:hover:bg-white/5 transition text-left">
								<BookOpen size={16} strokeWidth={1.5} className="text-gris-piedra flex-shrink-0" />
								Mis guías
							</button>
						</div>

						{/* cerrar sesión */}
						<div className="px-3 py-4 border-t border-douche/60 dark:border-noche-borde/60">
							<button onClick={cerrarSesion} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition text-left">
								<LogOut size={16} strokeWidth={1.5} className="flex-shrink-0" />
								Cerrar sesión
							</button>
						</div>
					</div>
				</div>
			)}
		</>
	);
};