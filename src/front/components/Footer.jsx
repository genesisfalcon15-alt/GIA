import { Link } from "react-router-dom";
import { LogoGia } from "./LogoGia";

export const Footer = () => (
	<footer className="mt-auto relative overflow-hidden bg-gradient-to-b from-white to-douche/25 dark:from-noche-suave dark:to-noche border-t border-douche dark:border-noche-borde">

		{/* una linea de acento arriba, como el filo de una madera */}
		<div className="h-[3px] w-full bg-gradient-to-r from-noyer via-mantequilla to-noyer opacity-60" />

		<div className="max-w-5xl mx-auto px-6 py-14">

			{/* bloque de arriba: logo + frase + enlaces */}
			<div className="flex flex-col md:flex-row md:justify-between gap-10 mb-12">

				<div className="max-w-sm">
					<LogoGia size={46} />
					<p className="text-sm text-gris-piedra mt-4 leading-relaxed">
						Tu copiloto de montaje. Sube el manual, hazme una foto de la pieza,
						y te acompaño paso a paso hasta el último tornillo.
					</p>
				</div>

				<div className="flex gap-14">
					<div>
						<h4 className="text-xs font-bold tracking-[0.12em] uppercase text-noyer dark:text-mantequilla mb-4">
							Producto
						</h4>
						<ul className="space-y-2.5 text-sm">
							<li>
								<Link to="/" className="text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire transition-colors">
									Inicio
								</Link>
							</li>
							<li>
								<Link to="/register" className="text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire transition-colors">
									Crear cuenta
								</Link>
							</li>
							<li>
								<Link to="/login" className="text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire transition-colors">
									Entrar
								</Link>
							</li>
						</ul>
					</div>

					<div>
						<h4 className="text-xs font-bold tracking-[0.12em] uppercase text-noyer dark:text-mantequilla mb-4">
							Legal
						</h4>
						<ul className="space-y-2.5 text-sm">
							<li>
								<a href="#" className="text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire transition-colors">
									Privacidad
								</a>
							</li>
							<li>
								<a href="#" className="text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire transition-colors">
									Términos
								</a>
							</li>
						</ul>
					</div>
				</div>
			</div>

			{/* linea separadora y creditos */}
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-8 border-t border-douche dark:border-noche-borde">
				<p className="text-xs text-gris-piedra">
					© {new Date().getFullYear()} GIA · Todos los derechos reservados
				</p>
				<p className="text-xs text-gris-piedra flex items-center gap-1.5">
					Hecho con
					<svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="stroke-noyer dark:stroke-mantequilla" strokeWidth="2">
						<path d="M14.7 6.3a4 4 0 0 0-5.6 5.6l-6.4 6.4 2 2 6.4-6.4a4 4 0 0 0 5.6-5.6l-2.5 2.5-1.5-1.5z" />
					</svg>
					por <span className="font-semibold text-deep-ocean dark:text-ivoire">Génesis Falcón</span>
				</p>
			</div>
		</div>
	</footer>
);