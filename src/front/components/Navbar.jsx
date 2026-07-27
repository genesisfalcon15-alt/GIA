import { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogoGia } from "./LogoGia";
import { ToggleTema } from "./ToggleTema";

export const Navbar = () => {
	const navigate = useNavigate();
	const location = useLocation();
	const [menuAbierto, setMenuAbierto] = useState(false);
	const menuRef = useRef(null);

	// miro si hay token para saber si esta logueado
	const token = localStorage.getItem("token");
	const user = JSON.parse(localStorage.getItem("user") || "null");

	const cerrarSesion = () => {
		localStorage.removeItem("token");
		localStorage.removeItem("user");
		navigate("/login");
	};

	// cierro el menu si el usuario hace click fuera
	useEffect(() => {
		const handleClickFuera = (e) => {
			if (menuRef.current && !menuRef.current.contains(e.target)) {
				setMenuAbierto(false);
			}
		};
		document.addEventListener("mousedown", handleClickFuera);
		return () => document.removeEventListener("mousedown", handleClickFuera);
	}, []);

	// en login, register y chat no muestro la navbar
	if (
		location.pathname === "/login" ||
		location.pathname === "/register" ||
		location.pathname === "/chat"
	) {
		return null;
	}

	return (
		<nav className="sticky top-0 z-50 bg-ivoire/85 dark:bg-noche/85 backdrop-blur-md border-b border-douche dark:border-noche-borde">
			<div className="max-w-6xl mx-auto px-6 h-[72px] flex items-center justify-between">

				<Link to="/" className="hover:opacity-80 transition">
					<LogoGia size={40} />
				</Link>

				<div className="flex items-center gap-2">
					<ToggleTema />

					{token ? (
						// menu de area personal cuando esta logueado
						<div className="relative" ref={menuRef}>
							<button
								onClick={() => setMenuAbierto(!menuAbierto)}
								className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire hover:bg-douche/50 dark:hover:bg-white/10 transition"
							>
								<span className="hidden sm:block">{user?.email}</span>
								{/* icono de chevron que gira cuando esta abierto */}
								<svg
									width="16" height="16" viewBox="0 0 24 24" fill="none"
									stroke="currentColor" strokeWidth="1.8"
									className={`transition-transform duration-200 ${menuAbierto ? "rotate-180" : ""}`}
								>
									<path d="M6 9l6 6 6-6" />
								</svg>
							</button>

							{/* dropdown del area personal */}
							{menuAbierto && (
								<div className="absolute right-0 mt-2 w-56 bg-white dark:bg-noche-suave border border-douche dark:border-noche-borde rounded-2xl shadow-xl overflow-hidden z-50">

									{/* cabecera del menu */}
									<div className="px-4 py-3 border-b border-douche dark:border-noche-borde">
										<p className="text-xs text-gris-piedra">Área personal</p>
										<p className="text-sm font-medium text-deep-ocean dark:text-ivoire truncate">
											{user?.email}
										</p>
									</div>

									{/* opciones del menu */}
									<div className="py-1">
										{/* mi perfil, pagina por crear */}
										<Link
											to="/chat"
											onClick={() => setMenuAbierto(false)}
											className="flex items-center gap-3 px-4 py-2.5 text-sm text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire hover:bg-douche/40 dark:hover:bg-white/5 transition"
										>
											<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
												<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
												<circle cx="12" cy="7" r="4" />
											</svg>
											Mi perfil
										</Link>

										{/* mis montajes, va al chat */}
										<Link
											to="/chat"
											onClick={() => setMenuAbierto(false)}
											className="flex items-center gap-3 px-4 py-2.5 text-sm text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire hover:bg-douche/40 dark:hover:bg-white/5 transition"
										>
											<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
												<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
											</svg>
											Mis montajes
										</Link>

										{/* mis guias, pagina por crear */}
										<Link
											to="/chat"
											onClick={() => setMenuAbierto(false)}
											className="flex items-center gap-3 px-4 py-2.5 text-sm text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire hover:bg-douche/40 dark:hover:bg-white/5 transition"
										>
											<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
												<path d="M4 4h11l5 5v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
												<path d="M9 9h6M9 13h6M9 17h4" />
											</svg>
											Mis guías
										</Link>

										{/* configuracion, pagina por crear */}
										<Link
											to="/chat"
											onClick={() => setMenuAbierto(false)}
											className="flex items-center gap-3 px-4 py-2.5 text-sm text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire hover:bg-douche/40 dark:hover:bg-white/5 transition"
										>
											<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
												<circle cx="12" cy="12" r="3" />
												<path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
											</svg>
											Configuración
										</Link>
									</div>

									{/* cerrar sesion separado del resto */}
									<div className="border-t border-douche dark:border-noche-borde py-1">
										<button
											onClick={cerrarSesion}
											className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition"
										>
											<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
												<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
												<polyline points="16 17 21 12 16 7" />
												<line x1="21" y1="12" x2="9" y2="12" />
											</svg>
											Cerrar sesión
										</button>
									</div>
								</div>
							)}
						</div>
					) : (
						<>
							<Link
								to="/login"
								className="px-4 py-2 rounded-xl text-sm font-medium text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire hover:bg-douche/50 dark:hover:bg-white/10 transition"
							>
								Entrar
							</Link>
							<Link
								to="/register"
								className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-br from-ocean-vivo to-deep-ocean text-ivoire shadow-md shadow-deep-ocean/25 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all dark:from-sky dark:to-clouds dark:text-noche"
							>
								Empezar
							</Link>
						</>
					)}
				</div>
			</div>
		</nav>
	);
};