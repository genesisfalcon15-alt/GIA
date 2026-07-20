import { Link, useNavigate, useLocation } from "react-router-dom";
import { LogoGia } from "./LogoGia";
import { ToggleTema } from "./ToggleTema";

export const Navbar = () => {
	const navigate = useNavigate();
	const location = useLocation();

	// miro si hay token para saber si esta logueada
	const token = localStorage.getItem("token");
	const user = JSON.parse(localStorage.getItem("user") || "null");

	const cerrarSesion = () => {
		localStorage.removeItem("token");
		localStorage.removeItem("user");
		navigate("/login");
	};

	// en login y register no muestro la navbar, me molesta
	if (location.pathname === "/login" || location.pathname === "/register") {
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
						<>
							<span className="hidden sm:block text-sm text-gris-piedra mr-2">
								{user?.email}
							</span>
							<button
								onClick={cerrarSesion}
								className="px-4 py-2 rounded-xl text-sm font-medium text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire hover:bg-douche/50 dark:hover:bg-white/10 transition"
							>
								Salir
							</button>
						</>
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