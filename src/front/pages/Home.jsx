import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
	Camera, Hammer, Wrench, Sofa,
	ChevronRight
} from "lucide-react";

const ACCIONES = [
	{
		id: "foto",
		label: "Subir una imagen",
		descripcion: "Diagnostica mediante imágenes",
		icono: Camera,
		tipo: "contexto",
		contexto: "Quiero subir una foto para que la analices"
	},
	{
		id: "instalar",
		label: "Instalar un producto",
		descripcion: "TV, lámparas, ventiladores y más",
		icono: Hammer,
		tipo: "ruta",
		ruta: "/instalar"
	},
	{
		id: "reparar",
		label: "Reparar un electrodoméstico",
		descripcion: "Diagnóstico y guía de reparación",
		icono: Wrench,
		tipo: "ruta",
		ruta: "/reparar"
	},
	{
		id: "restaurar",
		label: "Restaurar un mueble de segunda mano",
		descripcion: "Recupera muebles dañados o antiguos",
		icono: Sofa,
		tipo: "contexto",
		contexto: "Tengo un mueble de segunda mano que quiero restaurar"
	},
];

const fechaHoy = () => new Date().toLocaleDateString("es-ES", {
	weekday: "short", day: "numeric", month: "long"
}).toUpperCase();

const tiempoRelativo = (fechaStr) => {
	if (!fechaStr) return "";
	const diff = Date.now() - new Date(fechaStr).getTime();
	const min = Math.floor(diff / 60000);
	const h = Math.floor(diff / 3600000);
	const d = Math.floor(diff / 86400000);
	if (min < 60) return `Hace ${min} min`;
	if (h < 24) return `Hace ${h}h`;
	if (d === 1) return "Ayer";
	return `Hace ${d} días`;
};

export const Home = () => {
	const navigate = useNavigate();
	const token = localStorage.getItem("token");

	const [conversaciones, setConversaciones] = useState([]);
	const [cargando, setCargando] = useState(true);

	useEffect(() => {
		if (!token) return;
		fetch(`${import.meta.env.VITE_BACKEND_URL}/api/conversations`, {
			headers: { Authorization: `Bearer ${token}` },
		})
			.then(r => r.json())
			.then(data => setConversaciones(data.items || []))
			.catch(() => { })
			.finally(() => setCargando(false));
	}, []);

	const iniciarAccion = (accion) => {
		if (accion.tipo === "ruta") {
			navigate(accion.ruta);
			return;
		}
		sessionStorage.setItem("gia_contexto_inicial", accion.contexto);
		navigate("/chat");
	};

	if (!token) return <Landing />;

	const proyectoActivo = conversaciones.find(c => c.has_manual);

	return (
		<div className="bg-ivoire dark:bg-noche">
			<div className="max-w-2xl mx-auto px-8 pt-10 pb-16">

				<div className="mb-8 text-center">
					<p className="text-[9px] font-semibold tracking-[0.20em] uppercase text-gris-piedra mb-3">
						{fechaHoy()}
					</p>
					<h1 className="text-3xl sm:text-4xl font-medium tracking-tight text-noyer dark:text-mantequilla mb-2">
						¿Qué hacemos hoy?
					</h1>
					<p className="text-sm text-gris-piedra">
						Empieza un nuevo proyecto o continúa uno existente.
					</p>
				</div>

				<div className="border-t border-douche dark:border-noche-borde mb-6" />

				{!cargando && proyectoActivo && (
					<>
						<div className="mb-6">
							<p className="text-[9px] font-semibold tracking-[0.16em] uppercase text-deep-ocean dark:text-sky mb-3">
								Proyecto activo
							</p>
							<button
								onClick={() => navigate(`/chat?conversation=${proyectoActivo.id}`)}
								className="w-full text-left group flex items-start justify-between"
							>
								<div>
									<p className="text-base font-medium tracking-tight text-noyer dark:text-mantequilla mb-1">
										{proyectoActivo.title || "Proyecto sin título"}
									</p>
									<p className="text-sm text-deep-ocean dark:text-sky">
										{proyectoActivo.has_manual ? "Manual analizado" : "Sin manual"}
										{proyectoActivo.message_count > 0 && ` · ${proyectoActivo.message_count} mensajes`}
									</p>
									<p className="text-xs text-deep-ocean/50 dark:text-sky/50 mt-0.5">
										{tiempoRelativo(proyectoActivo.updated_at)}
									</p>
								</div>
								<ChevronRight size={16} strokeWidth={1.5} className="text-gris-piedra/30 group-hover:text-gris-piedra transition-colors mt-0.5 flex-shrink-0" />
							</button>
							<button
								onClick={() => navigate(`/chat?conversation=${proyectoActivo.id}`)}
								className="mt-3 text-xs text-deep-ocean dark:text-sky hover:opacity-70 transition-opacity"
							>
								Continuar proyecto →
							</button>
						</div>
						<div className="border-t border-douche dark:border-noche-borde mb-6" />
					</>
				)}

				<div className="flex justify-center mb-2">
					<button
						onClick={() => navigate("/nuevo-proyecto")}
						style={{ width: "calc(50% - 4px)", minHeight: "140px" }}
						className="flex flex-col items-center justify-center p-7 rounded-xl bg-white dark:bg-noche-suave border border-douche dark:border-noche-borde hover:border-deep-ocean/20 dark:hover:border-sky/20 hover:bg-douche/10 dark:hover:bg-noche-borde transition-all group text-center"
					>
						<svg
							width="28" height="28" viewBox="0 0 24 24" fill="none"
							stroke="currentColor" strokeWidth="1"
							className="text-noyer dark:text-mantequilla group-hover:text-deep-ocean dark:group-hover:text-sky transition-colors mb-3"
						>
							<rect x="3" y="3" width="18" height="18" rx="2" />
							<path d="M12 8v8M8 12h8" />
						</svg>
						<p className="text-lg font-medium text-noyer dark:text-mantequilla mb-1">
							Nuevo proyecto
						</p>
						<p className="text-[11px] text-gris-piedra">
							Empieza desde cero
						</p>
					</button>
				</div>

				<div className="mb-8">
					<p className="text-[9px] font-semibold tracking-[0.16em] uppercase text-gris-piedra mb-3 mt-6">
						Acciones rápidas
					</p>

					<div className="grid grid-cols-2 gap-2 mb-2">
						{ACCIONES.slice(0, 2).map((accion) => {
							const Icono = accion.icono;
							return (
								<button
									key={accion.id}
									onClick={() => iniciarAccion(accion)}
									className="flex flex-col items-start p-5 rounded-xl bg-white dark:bg-noche-suave border border-douche dark:border-noche-borde hover:border-deep-ocean/20 dark:hover:border-sky/20 hover:bg-douche/10 dark:hover:bg-noche-borde transition-all group text-left"
								>
									<Icono size={32} strokeWidth={1} className="text-noyer dark:text-mantequilla group-hover:text-deep-ocean dark:group-hover:text-sky transition-colors mb-4" />
									<p className="text-sm font-medium text-noyer dark:text-mantequilla leading-tight mb-1">
										{accion.label}
									</p>
									<p className="text-[11px] text-gris-piedra leading-snug">
										{accion.descripcion}
									</p>
								</button>
							);
						})}
					</div>

					<div className="grid grid-cols-2 gap-2">
						{ACCIONES.slice(2, 4).map((accion) => {
							const Icono = accion.icono;
							return (
								<button
									key={accion.id}
									onClick={() => iniciarAccion(accion)}
									className="flex flex-col items-start p-5 rounded-xl bg-white dark:bg-noche-suave border border-douche dark:border-noche-borde hover:border-deep-ocean/20 dark:hover:border-sky/20 hover:bg-douche/10 dark:hover:bg-noche-borde transition-all group text-left"
								>
									<Icono size={32} strokeWidth={1} className="text-noyer dark:text-mantequilla group-hover:text-deep-ocean dark:group-hover:text-sky transition-colors mb-4" />
									<p className="text-sm font-medium text-noyer dark:text-mantequilla leading-tight mb-1">
										{accion.label}
									</p>
									<p className="text-[11px] text-gris-piedra leading-snug">
										{accion.descripcion}
									</p>
								</button>
							);
						})}
					</div>
				</div>

			</div>
		</div>
	);
};

const Landing = () => {
	const navigate = useNavigate();
	return (
		<div className="bg-ivoire dark:bg-noche min-h-screen">
			<div className="max-w-2xl mx-auto px-8 pt-20 pb-16">
				<p className="text-[9px] font-semibold tracking-[0.16em] uppercase text-gris-piedra mb-8">
					GIA · Guía Inteligente de Instalación
				</p>
				<h1 className="text-4xl sm:text-5xl font-medium tracking-tight text-noyer dark:text-mantequilla leading-[1.08] mb-6">
					Monta, instala,<br />repara y restaura.
				</h1>
				<p className="text-base text-gris-piedra leading-relaxed mb-10 max-w-sm">
					Sube el manual, describe el problema o envía una foto. GIA te guía desde el primer paso hasta el último.
				</p>
				<div className="flex gap-3">
					<button
						onClick={() => navigate("/register")}
						className="px-5 py-2.5 rounded-lg bg-deep-ocean text-ivoire hover:bg-ocean-vivo transition dark:bg-sky dark:text-noche text-sm font-medium"
					>
						Empezar gratis
					</button>
					<button
						onClick={() => navigate("/login")}
						className="px-5 py-2.5 rounded-lg border border-douche dark:border-noche-borde text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire hover:border-deep-ocean/30 transition text-sm"
					>
						Ya tengo cuenta
					</button>
				</div>
			</div>
		</div>
	);
};