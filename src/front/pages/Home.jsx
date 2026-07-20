import { Link } from "react-router-dom";
import { LogoGia } from "../components/LogoGia";

export const Home = () => {
	return (
		<div className="bg-ivoire dark:bg-noche">

			{/* zona principal, lo primero que se ve */}
			<section className="max-w-5xl mx-auto px-6 pt-20 pb-24 text-center">

				<span className="inline-block text-xs font-semibold tracking-[0.14em] uppercase text-noyer dark:text-mantequilla mb-6">
					Tu copiloto de montaje
				</span>

				<h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-deep-ocean dark:text-ivoire leading-[1.08] mb-6">
					Montar ya no tiene<br className="hidden sm:block" /> por qué ser un problema
				</h1>

				<p className="text-lg text-gris-piedra max-w-xl mx-auto leading-relaxed mb-10">
					Sube el manual o hazme una foto de la pieza. Te explico cada paso
					en lenguaje claro, te digo qué herramienta necesitas y te aviso
					antes de que te equivoques.
				</p>

				<div className="flex flex-col sm:flex-row gap-3 justify-center">
					<Link
						to="/register"
						className="px-7 py-3.5 rounded-xl font-semibold bg-gradient-to-br from-ocean-vivo to-deep-ocean text-ivoire shadow-lg shadow-deep-ocean/30 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all dark:from-sky dark:to-clouds dark:text-noche"
					>
						Empezar gratis
					</Link>
					<Link
						to="/login"
						className="px-7 py-3.5 rounded-xl font-semibold border border-douche dark:border-noche-borde text-deep-ocean dark:text-ivoire hover:bg-douche/40 dark:hover:bg-white/5 transition"
					>
						Ya tengo cuenta
					</Link>
				</div>
			</section>

			{/* las tres cosas que hace gia */}
			<section className="max-w-5xl mx-auto px-6 pb-24">
				<div className="grid md:grid-cols-3 gap-5">

					<div className="p-7 rounded-2xl bg-white dark:bg-noche-suave border border-douche dark:border-noche-borde">
						<div className="w-11 h-11 rounded-xl bg-douche/60 dark:bg-white/5 flex items-center justify-center mb-4">
							<svg width="21" height="21" viewBox="0 0 24 24" fill="none" className="stroke-deep-ocean dark:stroke-sky" strokeWidth="1.6">
								<path d="M4 4h11l5 5v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z" />
								<path d="M12 11v6M9 14h6" />
							</svg>
						</div>
						<h3 className="text-lg font-semibold text-deep-ocean dark:text-ivoire mb-2">
							Entiende tu manual
						</h3>
						<p className="text-sm text-gris-piedra leading-relaxed">
							Sube el PDF y lo traduzco a instrucciones claras, paso a paso,
							sin dibujos imposibles de interpretar.
						</p>
					</div>

					<div className="p-7 rounded-2xl bg-white dark:bg-noche-suave border border-douche dark:border-noche-borde">
						<div className="w-11 h-11 rounded-xl bg-douche/60 dark:bg-white/5 flex items-center justify-center mb-4">
							<svg width="21" height="21" viewBox="0 0 24 24" fill="none" className="stroke-deep-ocean dark:stroke-sky" strokeWidth="1.6">
								<path d="M14.7 6.3a4 4 0 0 0-5.6 5.6l-6.4 6.4 2 2 6.4-6.4a4 4 0 0 0 5.6-5.6l-2.5 2.5-1.5-1.5z" />
							</svg>
						</div>
						<h3 className="text-lg font-semibold text-deep-ocean dark:text-ivoire mb-2">
							Te dice qué necesitas
						</h3>
						<p className="text-sm text-gris-piedra leading-relaxed">
							Herramientas, tiempo estimado y cuántas manos hacen falta.
							Y si te falta una llave, te doy una alternativa segura.
						</p>
					</div>

					<div className="p-7 rounded-2xl bg-white dark:bg-noche-suave border border-douche dark:border-noche-borde">
						<div className="w-11 h-11 rounded-xl bg-douche/60 dark:bg-white/5 flex items-center justify-center mb-4">
							<svg width="21" height="21" viewBox="0 0 24 24" fill="none" className="stroke-deep-ocean dark:stroke-sky" strokeWidth="1.6">
								<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
							</svg>
						</div>
						<h3 className="text-lg font-semibold text-deep-ocean dark:text-ivoire mb-2">
							Resuelve tus dudas
						</h3>
						<p className="text-sm text-gris-piedra leading-relaxed">
							Pregúntame lo que sea durante el montaje. Estoy contigo
							desde el primer tornillo hasta el último.
						</p>
					</div>
				</div>
			</section>

			{/* cierre con el logo */}
			<section className="max-w-3xl mx-auto px-6 pb-24 text-center">
				<div className="flex justify-center mb-6">
					<LogoGia size={56} conTexto={false} />
				</div>
				<h2 className="text-2xl font-semibold text-deep-ocean dark:text-ivoire mb-3">
					¿Empezamos?
				</h2>
				<p className="text-gris-piedra mb-8">
					Crea tu cuenta y sube tu primer manual. Es gratis.
				</p>
				<Link
					to="/register"
					className="inline-block px-7 py-3.5 rounded-xl font-semibold bg-gradient-to-br from-ocean-vivo to-deep-ocean text-ivoire shadow-lg shadow-deep-ocean/30 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all dark:from-sky dark:to-clouds dark:text-noche"
				>
					Crear cuenta
				</Link>
			</section>
		</div>
	);
};