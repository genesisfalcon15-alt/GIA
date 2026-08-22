import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
	Hammer, Wrench, Plus, ArrowRight, Package,
	Lightbulb, Tv, Armchair, Wind, Drill, Thermometer,
	WashingMachine, Refrigerator, Layers
} from "lucide-react";

const IMAGENES_MUEBLES = [
	"https://res.cloudinary.com/dvemnadzq/image/upload/v1787250929/IMG_1234.jpg",
	"https://res.cloudinary.com/dvemnadzq/image/upload/v1787250929/IMG_1231.jpg",
	"https://res.cloudinary.com/dvemnadzq/image/upload/v1787250929/IMG_1232.jpg",
	"https://res.cloudinary.com/dvemnadzq/image/upload/v1787250929/IMG_1216.jpg",
	"https://res.cloudinary.com/dvemnadzq/image/upload/v1787250929/IMG_1230.jpg",
	"https://res.cloudinary.com/dvemnadzq/image/upload/v1787250929/IMG_1229.jpg",
	"https://res.cloudinary.com/dvemnadzq/image/upload/v1787250928/IMG_1219.jpg",
	"https://res.cloudinary.com/dvemnadzq/image/upload/v1787250928/IMG_1225.jpg",
	"https://res.cloudinary.com/dvemnadzq/image/upload/v1787250928/IMG_1215.jpg",
	"https://res.cloudinary.com/dvemnadzq/image/upload/v1787250928/IMG_1222.jpg",
	"https://res.cloudinary.com/dvemnadzq/image/upload/v1787250928/IMG_1221.jpg",
	"https://res.cloudinary.com/dvemnadzq/image/upload/v1787250927/IMG_1214.jpg",
	"https://res.cloudinary.com/dvemnadzq/image/upload/v1787250928/IMG_1218.jpg",
	"https://res.cloudinary.com/dvemnadzq/image/upload/v1787250928/IMG_1223.jpg",
	"https://res.cloudinary.com/dvemnadzq/image/upload/v1787250928/IMG_1217.jpg",
	"https://res.cloudinary.com/dvemnadzq/image/upload/v1787250928/IMG_1220.jpg",
];

const imagenAleatoria = (lista) => lista[Math.floor(Math.random() * lista.length)];

const detectarImagenProyecto = (titulo) => {
	if (!titulo) return imagenAleatoria(IMAGENES_MUEBLES);
	return imagenAleatoria(IMAGENES_MUEBLES);
};

const fechaHoy = () => new Date().toLocaleDateString("es-ES", {
	weekday: "long", day: "numeric", month: "long"
});

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

const detectarIcono = (titulo) => {
	if (!titulo) return Hammer;
	const t = titulo.toLowerCase();
	if (t.includes("lámpara") || t.includes("luz") || t.includes("iluminación")) return Lightbulb;
	if (t.includes("tv") || t.includes("televisor") || t.includes("pantalla")) return Tv;
	if (t.includes("silla") || t.includes("sillón") || t.includes("sofá")) return Armchair;
	if (t.includes("aire") || t.includes("ventilador") || t.includes("climatización")) return Wind;
	if (t.includes("calefacción") || t.includes("radiador") || t.includes("termostato")) return Thermometer;
	if (t.includes("nevera") || t.includes("frigorífico")) return Refrigerator;
	if (t.includes("lavadora") || t.includes("secadora") || t.includes("lavavajillas")) return WashingMachine;
	if (t.includes("taladro") || t.includes("colgar") || t.includes("pared")) return Drill;
	if (t.includes("mueble") || t.includes("armario") || t.includes("cómoda") || t.includes("mesa") || t.includes("estantería")) return Layers;
	if (t.includes("reparar") || t.includes("arreglar") || t.includes("restaurar")) return Wrench;
	if (t.includes("instalar")) return Package;
	return Hammer;
};

const CardAccionSimple = ({ accion, onClick, isDark }) => {
	const Icono = accion.icono;
	const [hover, setHover] = useState(false);
	return (
		<button
			onClick={onClick}
			onMouseEnter={() => setHover(true)}
			onMouseLeave={() => setHover(false)}
			style={{
				background: isDark ? "rgba(44,50,60,0.50)" : "#ffffff",
				border: `1px solid ${hover ? "#A9895C" : isDark ? "#3A4150" : "#DDD6CE"}`,
				borderRadius: "12px",
				padding: "20px 16px",
				display: "flex",
				flexDirection: "column",
				alignItems: "flex-start",
				gap: "12px",
				cursor: "pointer",
				textAlign: "left",
				transform: hover ? "translateY(-2px)" : "translateY(0)",
				transition: "all 0.2s ease",
				boxShadow: hover ? (isDark ? "0 8px 24px rgba(0,0,0,0.3)" : "0 8px 24px rgba(169,137,92,0.12)") : "none"
			}}
		>
			<div style={{
				width: "36px", height: "36px", borderRadius: "8px",
				background: isDark ? "#3A4150" : "#F0EDE8",
				display: "flex", alignItems: "center", justifyContent: "center"
			}}>
				<Icono size={18} strokeWidth={1.4} style={{ color: "#A9895C" }} />
			</div>
			<div>
				<p style={{ fontSize: "13px", fontWeight: "500", color: isDark ? "#FAF8F6" : "#3C5160", marginBottom: "4px" }}>
					{accion.label}
				</p>
				<p style={{ fontSize: "11px", color: "#BAB3AE", lineHeight: "1.5" }}>
					{accion.descripcion}
				</p>
			</div>
		</button>
	);
};

const CardAccionConImagen = ({ accion, imgUrl, onClick, isDark }) => {
	const Icono = accion.icono;
	const [hover, setHover] = useState(false);
	return (
		<button
			onClick={onClick}
			onMouseEnter={() => setHover(true)}
			onMouseLeave={() => setHover(false)}
			style={{
				background: isDark ? "rgba(44,50,60,0.50)" : "#ffffff",
				border: `1px solid ${hover ? "#A9895C" : isDark ? "#3A4150" : "#DDD6CE"}`,
				borderRadius: "12px",
				padding: 0,
				display: "flex",
				flexDirection: "row",
				cursor: "pointer",
				textAlign: "left",
				overflow: "hidden",
				transform: hover ? "translateY(-2px)" : "translateY(0)",
				transition: "all 0.2s ease",
				boxShadow: hover ? (isDark ? "0 8px 24px rgba(0,0,0,0.3)" : "0 8px 24px rgba(169,137,92,0.12)") : "none"
			}}
		>
			<div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: "12px", flex: 1, minWidth: 0 }}>
				<div style={{
					width: "36px", height: "36px", borderRadius: "8px",
					background: isDark ? "#3A4150" : "#F0EDE8",
					display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
				}}>
					<Icono size={18} strokeWidth={1.4} style={{ color: "#A9895C" }} />
				</div>
				<div>
					<p style={{ fontSize: "13px", fontWeight: "500", color: isDark ? "#FAF8F6" : "#3C5160", marginBottom: "4px" }}>
						{accion.label}
					</p>
					<p style={{ fontSize: "11px", color: "#BAB3AE", lineHeight: "1.5" }}>
						{accion.descripcion}
					</p>
				</div>
			</div>
			<div style={{ width: "100px", flexShrink: 0, position: "relative", overflow: "hidden" }}>
				<img
					src={imgUrl}
					alt={accion.label}
					style={{
						width: "100%", height: "100%",
						objectFit: "cover", objectPosition: "center",
						transform: hover ? "scale(1.08)" : "scale(1)",
						transition: "transform 0.4s ease",
						filter: isDark ? "brightness(0.65) saturate(0.8)" : "brightness(0.88) saturate(0.85)"
					}}
				/>
				<div style={{
					position: "absolute", top: 0, left: 0, bottom: 0, width: "50px",
					background: isDark
						? "linear-gradient(to right, rgba(44,50,60,0.98), transparent)"
						: "linear-gradient(to right, rgba(255,255,255,0.98), transparent)"
				}} />
			</div>
		</button>
	);
};

const ACCIONES = [
	{
		id: "instalar",
		label: "Instalar un producto",
		descripcion: "TV, lámparas, ventiladores, aires y más",
		icono: Package,
		tipo: "contexto",
		contexto: "Quiero instalar algo en casa y necesito ayuda para hacerlo bien",
		conImagen: false
	},
	{
		id: "reparar",
		label: "Reparar un producto",
		descripcion: "Electrodomésticos, radiadores, calefacción, lavadoras, neveras y más",
		icono: Wrench,
		tipo: "contexto_imagen_pdf",
		contexto: "Tengo un producto que no funciona bien y quiero ver si tiene solución",
		conImagen: false
	},
	{
		id: "restaurar",
		label: "Reparar / Restaurar mueble",
		descripcion: "Dañados o antiguos, dales una segunda vida",
		icono: Armchair,
		tipo: "contexto_imagen_pdf",
		contexto: "Tengo un mueble dañado o antiguo que quiero reparar o restaurar",
		conImagen: true
	},
	{
		id: "montaje",
		label: "Montaje de mueble",
		descripcion: "Nuevo o antiguo, te guío paso a paso",
		icono: Layers,
		tipo: "contexto_imagen_pdf",
		contexto: "Quiero montar un mueble y necesito que me guíes paso a paso",
		conImagen: true
	}
];

export const Home = () => {
	const navigate = useNavigate();
	const token = localStorage.getItem("token");
	const user = JSON.parse(localStorage.getItem("user") || "null");
	const nombre = user?.name || user?.email?.split("@")[0] || "";

	const [conversaciones, setConversaciones] = useState([]);
	const [cargando, setCargando] = useState(true);
	const [isDark, setIsDark] = useState(
		document.documentElement.classList.contains("dark")
	);

	const [imagenesAccion] = useState(() =>
		ACCIONES.map(a => a.conImagen ? imagenAleatoria(IMAGENES_MUEBLES) : null)
	);

	const [imgProyectoActivo] = useState(() => imagenAleatoria(IMAGENES_MUEBLES));

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
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
		return () => observer.disconnect();
	}, []);

	const iniciarAccion = (accion) => {
		if (accion.tipo === "contexto_imagen_pdf") {
			sessionStorage.setItem("gia_contexto_inicial", accion.contexto);
			navigate("/chat?con_archivos=true");
			return;
		}
		if (accion.contexto) {
			sessionStorage.setItem("gia_contexto_inicial", accion.contexto);
			navigate("/chat");
		}
	};

	if (!token) return <Landing />;

	const proyectoActivo = conversaciones.find(c => c.status === "en_progreso");
	const proyectosRecientes = conversaciones.slice(0, 5);

	const cardStyle = {
		background: isDark ? "rgba(44,50,60,0.50)" : "#ffffff",
		border: `1px solid ${isDark ? "#3A4150" : "#DDD6CE"}`,
		borderRadius: "12px"
	};

	return (
		<div className="w-full" style={{ background: isDark ? "#232830" : "#FAF8F6", minHeight: "100%" }}>
			<div style={{ padding: "40px 48px", maxWidth: "1200px", width: "100%" }}>

				{/* cabecera sin emoji */}
				<div style={{ marginBottom: "32px" }}>
					<p style={{ fontSize: "13px", color: "#BAB3AE", marginBottom: "6px" }}>{fechaHoy()}</p>
					<h1 style={{ fontSize: "28px", fontWeight: "500", color: isDark ? "#F0DFA8" : "#A9895C", marginBottom: "4px", letterSpacing: "-0.02em" }}>
						{nombre ? `Hola, ${nombre}` : "Hola"}
					</h1>
					<p style={{ fontSize: "14px", color: "#BAB3AE" }}>¿Qué vamos a construir hoy?</p>
				</div>

				{/* botones principales */}
				<div style={{ display: "flex", gap: "12px", marginBottom: "40px" }}>
					<button
						onClick={() => navigate("/nuevo-proyecto")}
						className="hover:opacity-90 transition"
						style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "10px", background: "#3C5160", color: "#FAF8F6", fontSize: "14px", fontWeight: "500", border: "none", cursor: "pointer" }}
					>
						<Plus size={16} strokeWidth={2} />
						Nuevo proyecto
					</button>
					<button
						onClick={() => navigate("/chat")}
						className="hover:opacity-80 transition"
						style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", borderRadius: "10px", background: "transparent", color: isDark ? "#A9B5C2" : "#3C5160", fontSize: "14px", border: `1px solid ${isDark ? "#3A4150" : "#DDD6CE"}`, cursor: "pointer" }}
					>
						Pregúntale a GIA
					</button>
				</div>

				{/* proyecto activo + recientes */}
				{!cargando && (proyectoActivo || proyectosRecientes.length > 0) && (
					<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "40px" }}>

						{/* proyecto activo con imagen */}
						{proyectoActivo && (
							<div style={{ ...cardStyle, padding: 0, overflow: "hidden", display: "flex", flexDirection: "row" }}>
								<div style={{ padding: "24px", flex: 1, minWidth: 0 }}>
									<div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
										<div style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#A9895C" }} />
										<span style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "#BAB3AE" }}>Proyecto activo</span>
									</div>
									<p style={{ fontSize: "16px", fontWeight: "500", color: isDark ? "#FAF8F6" : "#3C5160", marginBottom: "6px" }}>
										{proyectoActivo.title || "Proyecto sin título"}
									</p>
									<p style={{ fontSize: "12px", color: "#BAB3AE", marginBottom: "16px" }}>
										{tiempoRelativo(proyectoActivo.updated_at)}{proyectoActivo.has_manual && " · Manual analizado"}
									</p>
									<div style={{ marginBottom: "16px" }}>
										<div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
											<span style={{ fontSize: "11px", color: "#BAB3AE" }}>Progreso</span>
											<span style={{ fontSize: "11px", color: "#A9895C" }}>{proyectoActivo.progress || 0}%</span>
										</div>
										<div style={{ height: "3px", background: isDark ? "#3A4150" : "#DDD6CE", borderRadius: "2px" }}>
											<div style={{ height: "100%", width: `${proyectoActivo.progress || 0}%`, background: "#A9895C", borderRadius: "2px", transition: "width 0.5s ease" }} />
										</div>
									</div>
									<button
										onClick={() => navigate(`/chat?conversation=${proyectoActivo.id}`)}
										style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: isDark ? "#A9B5C2" : "#3C5160", background: "transparent", border: "none", cursor: "pointer", padding: 0, fontWeight: "500" }}
									>
										Continuar <ArrowRight size={14} strokeWidth={1.5} />
									</button>
								</div>
								{/* imagen derecha */}
								<div style={{ width: "130px", flexShrink: 0, position: "relative", overflow: "hidden" }}>
									<img
										src={imgProyectoActivo}
										alt="proyecto"
										style={{
											width: "100%", height: "100%",
											objectFit: "cover", objectPosition: "center",
											filter: isDark ? "brightness(0.60) saturate(0.7)" : "brightness(0.85) saturate(0.75)"
										}}
									/>
									<div style={{
										position: "absolute", top: 0, left: 0, bottom: 0, width: "60px",
										background: isDark
											? "linear-gradient(to right, rgba(44,50,60,0.98), transparent)"
											: "linear-gradient(to right, rgba(255,255,255,0.98), transparent)"
									}} />
								</div>
							</div>
						)}

						{/* proyectos recientes */}
						{proyectosRecientes.length > 0 && (
							<div style={{ ...cardStyle, padding: "24px" }}>
								<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
									<span style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "#BAB3AE" }}>Proyectos recientes</span>
									<button onClick={() => navigate("/montajes")} style={{ fontSize: "12px", color: isDark ? "#A9B5C2" : "#3C5160", background: "none", border: "none", cursor: "pointer" }}>
										Ver todos
									</button>
								</div>
								<div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
									{proyectosRecientes.map(conv => {
										const IconoProyecto = detectarIcono(conv.title);
										return (
											<button
												key={conv.id}
												onClick={() => navigate(`/chat?conversation=${conv.id}`)}
												className="hover:bg-douche/40 dark:hover:bg-white/5"
												style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: "8px", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", transition: "background 0.15s" }}
											>
												<div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
													<div style={{ width: "32px", height: "32px", borderRadius: "8px", background: isDark ? "#3A4150" : "#F0EDE8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
														<IconoProyecto size={14} strokeWidth={1.4} style={{ color: "#A9895C" }} />
													</div>
													<span style={{ fontSize: "13px", color: isDark ? "#FAF8F6" : "#3C5160" }} className="truncate">
														{conv.title || "Sin título"}
													</span>
												</div>
												<span style={{ fontSize: "11px", color: "#BAB3AE", flexShrink: 0, marginLeft: "8px" }}>
													{tiempoRelativo(conv.updated_at)}
												</span>
											</button>
										);
									})}
								</div>
							</div>
						)}
					</div>
				)}

				{/* acciones rápidas */}
				<div>
					<p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.1em", textTransform: "uppercase", color: "#BAB3AE", marginBottom: "16px" }}>
						Acciones rápidas
					</p>
					<div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
						{ACCIONES.map((accion, index) => (
							accion.conImagen ? (
								<CardAccionConImagen
									key={accion.id}
									accion={accion}
									imgUrl={imagenesAccion[index]}
									onClick={() => iniciarAccion(accion)}
									isDark={isDark}
								/>
							) : (
								<CardAccionSimple
									key={accion.id}
									accion={accion}
									onClick={() => iniciarAccion(accion)}
									isDark={isDark}
								/>
							)
						))}
					</div>
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
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
		return () => observer.disconnect();
	}, []);

	return (
		<div style={{ width: "100%", minHeight: "100%", background: isDark ? "#232830" : "#FAF8F6", padding: "80px 48px" }}>
			<p style={{ fontSize: "11px", fontWeight: "600", letterSpacing: "0.14em", textTransform: "uppercase", color: "#BAB3AE", marginBottom: "24px" }}>
				GIA · Guía Inteligente de Instalación
			</p>
			<h1 style={{ fontSize: "40px", fontWeight: "500", color: isDark ? "#F0DFA8" : "#A9895C", lineHeight: "1.1", letterSpacing: "-0.02em", marginBottom: "20px" }}>
				Monta, instala,<br />repara y restaura.
			</h1>
			<p style={{ fontSize: "15px", color: "#BAB3AE", lineHeight: "1.7", marginBottom: "36px", maxWidth: "420px" }}>
				Sube el manual, describe el problema o envía una foto. GIA te guía desde el primer paso hasta el último.
			</p>
			<div style={{ display: "flex", gap: "12px" }}>
				<button onClick={() => navigate("/register")} style={{ padding: "10px 20px", borderRadius: "10px", background: "#3C5160", color: "#FAF8F6", fontSize: "14px", fontWeight: "500", border: "none", cursor: "pointer" }}>
					Empezar gratis
				</button>
				<button onClick={() => navigate("/login")} style={{ padding: "10px 20px", borderRadius: "10px", background: "transparent", color: "#BAB3AE", fontSize: "14px", border: `1px solid ${isDark ? "#3A4150" : "#DDD6CE"}`, cursor: "pointer" }}>
					Ya tengo cuenta
				</button>
			</div>
		</div>
	);
};