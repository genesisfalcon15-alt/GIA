export const LogoGia = ({ size = 44, conTexto = true }) => {
    return (
        <div className="flex items-center gap-3">
            <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className="shrink-0">

                {/* el tornillo gira despacito sobre su eje */}
                <g className="animate-apretar-tornillo origin-[32px_20px]">
                    {/* cabeza del tornillo */}
                    <circle cx="32" cy="14" r="9"
                        className="fill-none stroke-deep-ocean dark:stroke-sky" strokeWidth="2" />
                    {/* la ranura de la cabeza */}
                    <path d="M24 14 H40"
                        className="stroke-deep-ocean dark:stroke-sky" strokeWidth="2" strokeLinecap="round" />
                </g>

                {/* la rosca del tornillo */}
                <path d="M27 23 H37 M27 27 H37 M27 31 H37 M27 35 H37 M27 39 H37"
                    className="stroke-deep-ocean dark:stroke-sky" strokeWidth="1.8" strokeLinecap="round" />
                <path d="M27 23 V44 M37 23 V44"
                    className="stroke-deep-ocean dark:stroke-sky" strokeWidth="2" />

                {/* la tuerca hexagonal sube y aprieta */}
                <g className="animate-subir-tuerca">
                    <path d="M32 40 L44 46 L44 54 L32 60 L20 54 L20 46 Z"
                        className="fill-ivoire dark:fill-noche stroke-deep-ocean dark:stroke-sky"
                        strokeWidth="2" strokeLinejoin="round" />
                    {/* el hueco de la tuerca */}
                    <path d="M32 45 L38 48.5 L38 53 L32 56 L26 53 L26 48.5 Z"
                        className="fill-none stroke-noyer dark:stroke-mantequilla" strokeWidth="1.5" strokeLinejoin="round" />
                </g>
            </svg>

            {conTexto && (
                <div className="leading-tight">
                    <span className="block text-2xl font-semibold tracking-[0.18em] text-deep-ocean dark:text-ivoire">
                        GIA
                    </span>
                    <span className="block text-[8px] tracking-[0.15em] uppercase text-noyer dark:text-mantequilla">
                        Guía Inteligente de Instalación
                    </span>
                </div>
            )}
        </div>
    );
};