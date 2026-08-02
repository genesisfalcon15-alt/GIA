import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const ACCIONES = [
	{ id: "manual", label: "Analizar un manual y construir un mueble nuevo", contexto: "Quiero analizar un manual de montaje" },
	{ id: "instalar", label: "Instalar un electrodoméstico", contexto: "Quiero instalar un producto en casa" },
	{ id: "reparar", label: "Reparar un electrodoméstico", contexto: "Quiero reparar un electrodoméstico" },
	{ id: "foto", label: "Analizar una fotografía para darle una segunda oportunidad a tu objeto", contexto: "Quiero analizar una fotografía de un mueble o pieza de segunda mano" },
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

	const iniciarAccion = (contexto) => {
		sessionStorage.setItem("gia_contexto_inicial", contexto);
		navigate("/chat");
	};

	if (!token) return <Landing />;

	const proyectoActivo = conversaciones.find(c => c.has_manual);

	return (
		<div className="bg-ivoire dark:bg-noche">
			<div className="max-w-2xl mx-auto px-8 pt-10 pb-16">

				{/* cabecera — "Centro de trabajo" lleva al chat */}
				<div className="flex items-baseline justify-between mb-10">
					<div>
						<button
							onClick={() => navigate("/chat")}
							className="text-[9px] font-semibold tracking-[0.16em] uppercase text-deep-ocean dark:text-sky mb-1 hover:opacity-70 transition-opacity block"
						>
							Centro de trabajo
						</button>
						<h1 className="text-xl font-medium tracking-tight text-noyer dark:text-mantequilla">
							¿Qué hacemos hoy?
						</h1>
					</div>
					<p className="text-[9px] tracking-[0.12em] uppercase text-gris-piedra/50">
						{fechaHoy()}
					</p>
				</div>

				<div className="border-t border-douche dark:border-noche-borde mb-8" />

				{/* proyecto activo */}
				{!cargando && proyectoActivo && (
					<>
						<div className="mb-8">
							<p className="text-[9px] font-semibold tracking-[0.16em] uppercase text-deep-ocean dark:text-sky mb-4">
								Proyecto activo
							</p>
							<button
								onClick={() => navigate(`/chat?conversation=${proyectoActivo.id}`)}
								className="w-full text-left group"
							>
								<div className="flex items-start justify-between">
									<div>
										<p className="text-lg font-medium tracking-tight text-noyer dark:text-mantequilla mb-1.5">
											{proyectoActivo.title || "Proyecto sin título"}
										</p>
										<p className="text-sm text-deep-ocean dark:text-sky mb-1">
											{proyectoActivo.has_manual ? "Manual analizado" : "Sin manual"}
											{proyectoActivo.message_count > 0 && ` · ${proyectoActivo.message_count} mensajes`}
										</p>
										<p className="text-xs text-deep-ocean/60 dark:text-sky/60">
											{tiempoRelativo(proyectoActivo.updated_at)}
										</p>
									</div>
									<span className="text-deep-ocean/30 dark:text-sky/30 group-hover:text-deep-ocean dark:group-hover:text-sky transition-colors mt-1">
										→
									</span>
								</div>
								<p className="text-xs text-deep-ocean dark:text-sky mt-4 group-hover:opacity-70 transition-opacity">
									Continuar proyecto →
								</p>
							</button>
						</div>
						<div className="border-t border-douche dark:border-noche-borde mb-8" />
					</>
				)}

				{/* acciones */}
				<div className="mb-10">
					<p className="text-[9px] font-semibold tracking-[0.16em] uppercase text-deep-ocean dark:text-sky mb-4">
						Iniciar proyecto
					</p>
					<div>
						{ACCIONES.map((accion, index) => (
							<button
								key={accion.id}
								onClick={() => iniciarAccion(accion.contexto)}
								className={`w-full flex items-center justify-between py-3 text-left group ${index !== ACCIONES.length - 1
									? "border-b border-douche dark:border-noche-borde"
									: ""
									}`}
							>
								<span className="text-sm text-noyer dark:text-mantequilla group-hover:text-deep-ocean dark:group-hover:text-sky transition-colors">
									{accion.label}
								</span>
								<span className="text-deep-ocean/30 dark:text-sky/30 group-hover:text-deep-ocean dark:group-hover:text-sky transition-colors">
									→
								</span>
							</button>
						))}

						<button
							onClick={() => navigate("/chat")}
							className="w-full flex items-center justify-between py-3 text-left group border-t border-douche dark:border-noche-borde"
						>
							<span className="text-sm text-noyer/60 dark:text-mantequilla/60 group-hover:text-noyer dark:group-hover:text-mantequilla transition-colors">
								Nuevo proyecto libre
							</span>
							<span className="text-deep-ocean/30 dark:text-sky/30 group-hover:text-deep-ocean dark:group-hover:text-sky transition-colors">
								+
							</span>
						</button>
					</div>
				</div>

				<div className="border-t border-douche dark:border-noche-borde mb-6" />

				{/* accesos rápidos */}
				<div className="flex gap-6">
					{[
						{ label: "Mis montajes", ruta: "/montajes" },
						{ label: "Configuración", ruta: "/configuracion" },
						{ label: "Perfil", ruta: "/perfil" },
					].map(({ label, ruta }) => (
						<button
							key={label}
							onClick={() => navigate(ruta)}
							className="text-xs text-deep-ocean dark:text-sky opacity-60 hover:opacity-100 transition-opacity"
						>
							{label}
						</button>
					))}
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