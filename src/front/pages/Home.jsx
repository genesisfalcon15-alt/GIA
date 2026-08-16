import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogoGia } from "../components/LogoGia";
import { Camera, Hammer, Wrench, Sofa } from "lucide-react";

const FondoMaterial = ({ isDark }) => {
	const c = isDark ? "#A9B5C2" : "#3C5160";

	return (
		<div
			className="absolute inset-0 pointer-events-none select-none"
			style={{ overflow: "clip" }}
			aria-hidden="true"
		>
			{/* cabeza del tornillo — esquina superior derecha */}
			<svg
				style={{
					position: "absolute",
					top: "-120px",
					right: "-120px",
					width: "420px",
					height: "420px",
					opacity: isDark ? 0.07 : 0.04,
					filter: `blur(${isDark ? 16 : 18}px)`,
					pointerEvents: "none"
				}}
				viewBox="0 0 200 200"
				fill="none"
			>
				<circle cx="100" cy="100" r="90" stroke={c} strokeWidth="8" fill="none" />
				<line x1="20" y1="100" x2="180" y2="100" stroke={c} strokeWidth="10" strokeLinecap="round" />
			</svg>

			{/* tuerca hexagonal — esquina inferior izquierda */}
			<svg
				style={{
					position: "absolute",
					bottom: "-140px",
					left: "-100px",
					width: "460px",
					height: "460px",
					opacity: isDark ? 0.06 : 0.03,
					filter: `blur(${isDark ? 18 : 20}px)`,
					pointerEvents: "none"
				}}
				viewBox="0 0 200 200"
				fill="none"
			>
				<path
					d="M100 10 L174 55 L174 145 L100 190 L26 145 L26 55 Z"
					stroke={c}
					strokeWidth="7"
					fill="none"
				/>
				<path
					d="M100 60 L135 80 L135 120 L100 140 L65 120 L65 80 Z"
					stroke={c}
					strokeWidth="5"
					fill="none"
				/>
			</svg>

			{/* rosca del tornillo — lado derecho */}
			<svg
				style={{
					position: "absolute",
					top: "20%",
					right: "-30px",
					width: "140px",
					height: "400px",
					opacity: isDark ? 0.05 : 0.03,
					filter: `blur(${isDark ? 14 : 16}px)`,
					pointerEvents: "none"
				}}
				viewBox="0 0 60 300"
				fill="none"
			>
				<line x1="15" y1="0" x2="15" y2="300" stroke={c} strokeWidth="5" strokeLinecap="round" />
				<line x1="45" y1="0" x2="45" y2="300" stroke={c} strokeWidth="5" strokeLinecap="round" />
				{[20, 50, 80, 110, 140, 170, 200, 230, 260].map((y, i) => (
					<line key={i} x1="15" y1={y} x2="45" y2={y} stroke={c} strokeWidth="4" strokeLinecap="round" />
				))}
			</svg>
		</div>
	);
};

const fechaHoy = () => new Date().toLocaleDateString("es-ES", {
	weekday: "short", day: "numeric", month: "long"
}).toUpperCase();

const tiempoRelativo = (fechaStr) => {
	if (!fechaStr) return "";
	const diff = Date.now() - new Date(fechaStr).getTime();
	const min = Math.floor(diff / 60000);
	const h = Math.floor(diff / 3600000);
	const d = Math.floor(diff / 86400000);
	if (min < 2) return "Ahora mismo";
	if (min < 60) return `Hace ${min} min`;
	if (h < 24) return `Hace ${h}h`;
	if (d === 1) return "Ayer";
	return `Hace ${d} días`;
};

const ACCIONES = [
	{
		id: "foto",
		label: "Subir una imagen",
		descripcion: "Diagnostica mediante imágenes",
		icono: Camera,
		tipo: "imagen"
	},
	{
		id: "instalar",
		label: "Instalar un producto",
		descripcion: "TV, lámparas, ventiladores y más",
		icono: Hammer,
		tipo: "contexto",
		contexto: "Quiero instalar algo en casa y necesito ayuda para hacerlo bien"
	},
	{
		id: "reparar",
		label: "Reparar un electrodoméstico",
		descripcion: "Diagnóstico y guía de reparación",
		icono: Wrench,
		tipo: "contexto",
		contexto: "Tengo un electrodoméstico que no funciona bien, quiero ver si tiene solución antes de tirarlo"
	},
	{
		id: "restaurar",
		label: "Restaurar un mueble",
		descripcion: "Recupera muebles dañados o antiguos",
		icono: Sofa,
		tipo: "contexto",
		contexto: "Tengo un mueble que quiero restaurar y darle una segunda vida"
	}
];

const getCardStyle = (isDark) => ({
	background: isDark
		? "rgba(44,50,60,0.50)"
		: "rgba(255,255,255,0.55)",
	backdropFilter: "blur(20px)",
	WebkitBackdropFilter: "blur(20px)",
	border: isDark
		? "1px solid rgba(255,255,255,0.07)"
		: "1px solid rgba(169,137,92,0.18)",
	boxShadow: isDark
		? "0 4px 16px rgba(0,0,0,0.30)"
		: "0 2px 12px rgba(169,137,92,0.10)"
});

export const Home = () => {
	const navigate = useNavigate();
	const token = localStorage.getItem("token");
	const [conversaciones, setConversaciones] = useState([]);
	const [cargando, setCargando] = useState(true);
	const [isDark, setIsDark] = useState(
		document.documentElement.classList.contains("dark")
	);

	useEffect(() => {
		if (!token) return;
		fetch(`${import.meta.env.VITE_BACKEND_URL}/api/conversations`, {
			headers: { Authorization: `Bearer ${token}` }
		})
			.then(r => r.json())
			.then(data => setConversaciones(data.items || []))
			.catch(() => { })
			.finally(() => setCargando(false));
	}, []);

	useEffect(() => {
		const observer = new MutationObserver(() => {
			setIsDark(document.documentElement.classList.contains("dark"));
		});
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class"]
		});
		return () => observer.disconnect();
	}, []);

	const iniciarAccion = (accion) => {
		if (accion.tipo === "ruta") {
			navigate(accion.ruta);
			return;
		}
		if (accion.tipo === "imagen") {
			navigate("/chat?modo=imagen");
			return;
		}
		if (accion.contexto) {
			sessionStorage.setItem("gia_contexto_inicial", accion.contexto);
			navigate("/chat");
		}
	};

	if (!token) return <Landing />;

	const proyectoActivo = conversaciones.find(c => c.status === "en_progreso");
	const cardStyle = getCardStyle(isDark);

	return (
		<div
			className="relative min-h-screen"
			style={{
				background: isDark ? "#232830" : "#FAF8F6",
				overflow: "clip"
			}}
		>
			<FondoMaterial isDark={isDark} />

			<div
				className="absolute inset-0 pointer-events-none"
				style={{
					background: isDark
						? "rgba(35,40,48,0.20)"
						: "rgba(250,248,246,0.15)"
				}}
				aria-hidden="true"
			/>

			<div className="relative z-10 max-w-lg mx-auto px-6 pt-8 pb-12">

				<p className="text-center text-[9px] font-semibold tracking-[0.20em] uppercase mb-4"
					style={{ color: "#BAB3AE" }}>
					{fechaHoy()}
				</p>

				<h1 className="text-center text-3xl font-medium tracking-tight mb-1"
					style={{ color: isDark ? "#F0DFA8" : "#A9895C" }}>
					¿Qué hacemos hoy?
				</h1>
				<p className="text-center text-sm mb-6" style={{ color: "#BAB3AE" }}>
					Empieza un nuevo proyecto o continúa uno existente.
				</p>

				<div style={{
					borderTop: isDark ? "1px solid #3A4150" : "1px solid rgba(169,137,92,0.18)",
					marginBottom: "1.5rem"
				}} />

				{!cargando && proyectoActivo && (
					<div className="mb-6">
						<button
							onClick={() => navigate(`/chat?conversation=${proyectoActivo.id}`)}
							className="w-full text-left flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-200 hover:-translate-y-0.5 group"
							style={cardStyle}
						>
							<div>
								<p className="text-[9px] font-semibold tracking-[0.14em] uppercase mb-1"
									style={{ color: "#BAB3AE" }}>
									Proyecto activo
								</p>
								<p className="text-sm font-medium"
									style={{ color: isDark ? "#F0DFA8" : "#A9895C" }}>
									{proyectoActivo.title || "Proyecto sin título"}
								</p>
								<p className="text-xs mt-0.5" style={{ color: "#BAB3AE" }}>
									{tiempoRelativo(proyectoActivo.updated_at)}
									{proyectoActivo.has_manual && " · Manual analizado"}
								</p>
							</div>
							<span className="text-xs font-medium group-hover:underline flex-shrink-0 ml-4"
								style={{ color: isDark ? "#A9B5C2" : "#3C5160" }}>
								Continuar →
							</span>
						</button>
						<div style={{
							borderTop: isDark ? "1px solid #3A4150" : "1px solid rgba(169,137,92,0.18)",
							marginTop: "1.5rem",
							marginBottom: "1.5rem"
						}} />
					</div>
				)}

				<button
					onClick={() => navigate("/nuevo-proyecto")}
					className="w-full flex flex-col items-center justify-center gap-3 py-6 rounded-2xl mb-6 transition-all duration-200 hover:-translate-y-0.5 group"
					style={cardStyle}
				>
					<div className="w-10 h-10 rounded-xl flex items-center justify-center"
						style={{
							border: isDark
								? "1px solid rgba(255,255,255,0.10)"
								: "1px solid rgba(169,137,92,0.20)"
						}}>
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none"
							stroke="currentColor" strokeWidth="1.4"
							style={{ color: isDark ? "#F0DFA8" : "#A9895C" }}>
							<rect x="3" y="3" width="18" height="18" rx="2" />
							<path d="M12 8v8M8 12h8" />
						</svg>
					</div>
					<div className="text-center">
						<p className="text-sm font-medium"
							style={{ color: isDark ? "#F0DFA8" : "#A9895C" }}>
							Nuevo proyecto
						</p>
						<p className="text-xs mt-0.5" style={{ color: "#BAB3AE" }}>
							Empieza desde cero
						</p>
					</div>
				</button>

				<p className="text-[9px] font-semibold tracking-[0.16em] uppercase mb-3"
					style={{ color: "#BAB3AE" }}>
					Acciones rápidas
				</p>
				<div className="grid grid-cols-2 gap-2">
					{ACCIONES.map((accion) => {
						const Icono = accion.icono;
						return (
							<button
								key={accion.id}
								onClick={() => iniciarAccion(accion)}
								className="flex items-start gap-3 p-4 rounded-2xl text-left transition-all duration-200 hover:-translate-y-0.5 group"
								style={cardStyle}
							>
								<Icono
									size={18}
									strokeWidth={1.4}
									style={{
										color: isDark ? "#F0DFA8" : "#A9895C",
										flexShrink: 0,
										marginTop: 2
									}}
								/>
								<div style={{ minWidth: 0 }}>
									<p className="text-sm font-medium leading-tight mb-0.5"
										style={{ color: isDark ? "#FAF8F6" : "#3C5160" }}>
										{accion.label}
									</p>
									<p className="text-[11px] leading-snug"
										style={{ color: "#BAB3AE" }}>
										{accion.descripcion}
									</p>
								</div>
							</button>
						);
					})}
				</div>

			</div>
		</div>
	);
};

const Landing = () => {
	const navigate = useNavigate();
	const [isDark, setIsDark] = useState(
		document.documentElement.classList.contains("dark")
	);

	useEffect(() => {
		const observer = new MutationObserver(() => {
			setIsDark(document.documentElement.classList.contains("dark"));
		});
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ["class"]
		});
		return () => observer.disconnect();
	}, []);

	const cardStyle = getCardStyle(isDark);

	return (
		<div
			className="relative min-h-screen"
			style={{
				background: isDark ? "#232830" : "#FAF8F6",
				overflow: "clip"
			}}
		>
			<FondoMaterial isDark={isDark} />
			<div
				className="absolute inset-0 pointer-events-none"
				style={{
					background: isDark
						? "rgba(35,40,48,0.20)"
						: "rgba(250,248,246,0.15)"
				}}
				aria-hidden="true"
			/>
			<div className="relative z-10 max-w-lg mx-auto px-6 pt-20 pb-16">
				<p className="text-[9px] font-semibold tracking-[0.16em] uppercase mb-8"
					style={{ color: "#BAB3AE" }}>
					GIA · Guía Inteligente de Instalación
				</p>
				<h1 className="text-4xl font-medium tracking-tight leading-[1.08] mb-6"
					style={{ color: isDark ? "#F0DFA8" : "#A9895C" }}>
					Monta, instala,<br />repara y restaura.
				</h1>
				<p className="text-base leading-relaxed mb-10 max-w-sm"
					style={{ color: "#BAB3AE" }}>
					Sube el manual, describe el problema o envía una foto. GIA te guía desde el primer paso hasta el último.
				</p>
				<div className="flex gap-3">
					<button
						onClick={() => navigate("/register")}
						className="px-5 py-2.5 rounded-lg text-sm font-medium transition hover:opacity-90"
						style={{
							background: isDark ? "#A9B5C2" : "#3C5160",
							color: isDark ? "#232830" : "#FAF8F6"
						}}
					>
						Empezar gratis
					</button>
					<button
						onClick={() => navigate("/login")}
						className="px-5 py-2.5 rounded-lg text-sm transition hover:opacity-70"
						style={{
							border: isDark ? "1px solid #3A4150" : "1px solid rgba(169,137,92,0.25)",
							color: "#BAB3AE"
						}}
					>
						Ya tengo cuenta
					</button>
				</div>
			</div>
		</div>
	);
};