import { Link } from "react-router-dom";
import { LogoGia } from "../components/LogoGia";

export const About = () => {
    return (
        <div className="bg-ivoire dark:bg-noche">

            {/* entrada principal de la página */}
            <section className="max-w-4xl mx-auto px-6 pt-24 pb-20 text-center">
                <div className="flex justify-center mb-8">
                    <LogoGia size={64} conTexto={false} />
                </div>
                <h1 className="text-5xl sm:text-6xl font-semibold tracking-tight text-deep-ocean dark:text-ivoire leading-tight mb-6">
                    GIA
                </h1>
                <p className="text-xl text-gris-piedra max-w-2xl mx-auto leading-relaxed mb-10">
                    Tu asistente inteligente para montar, instalar, reparar y comprender
                    cualquier proyecto paso a paso.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Link
                        to="/register"
                        className="px-7 py-3.5 rounded-xl font-semibold bg-gradient-to-br from-ocean-vivo to-deep-ocean text-ivoire shadow-lg shadow-deep-ocean/30 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all dark:from-sky dark:to-clouds dark:text-noche"
                    >
                        Comenzar
                    </Link>
                    <a
                        href="#historia"
                        className="px-7 py-3.5 rounded-xl font-semibold border border-douche dark:border-noche-borde text-deep-ocean dark:text-ivoire hover:bg-douche/40 dark:hover:bg-white/5 transition"
                    >
                        Conocer más
                    </a>
                </div>
            </section>

            {/* de dónde viene la idea */}
            <section id="historia" className="max-w-3xl mx-auto px-6 py-20">
                <span className="inline-block text-xs font-semibold tracking-[0.14em] uppercase text-noyer dark:text-mantequilla mb-4">
                    Origen
                </span>
                <h2 className="text-3xl font-semibold text-deep-ocean dark:text-ivoire mb-8">
                    Cómo nació GIA
                </h2>
                <div className="space-y-5 text-gris-piedra leading-relaxed">
                    <p>
                        GIA nació durante una mudanza real. Mientras montaba muebles e instalaba
                        distintos elementos del hogar, me encontré con manuales difíciles de entender
                        y, en muchos casos, con muebles que había trasladado de otra vivienda y de
                        los que ya no conservaba las instrucciones originales.
                    </p>
                    <p>
                        Tener que buscar información en distintos lugares, intentar interpretar
                        manuales poco claros o montar algunos muebles sin disponer del manual me hizo
                        darme cuenta de que faltaba una herramienta capaz de acompañar al usuario
                        durante todo el proceso.
                    </p>
                    <p>
                        De esa experiencia surgió la idea de crear GIA: un asistente inteligente
                        capaz de interpretar manuales, responder preguntas, guiar paso a paso y,
                        en el futuro, ayudar también en reparaciones, restauraciones y mantenimiento
                        del hogar.
                    </p>
                </div>
            </section>

            {/* el problema que resuelve */}
            <section className="bg-white dark:bg-noche-suave border-y border-douche dark:border-noche-borde">
                <div className="max-w-4xl mx-auto px-6 py-20">
                    <span className="inline-block text-xs font-semibold tracking-[0.14em] uppercase text-noyer dark:text-mantequilla mb-4">
                        El problema
                    </span>
                    <h2 className="text-3xl font-semibold text-deep-ocean dark:text-ivoire mb-10">
                        Montar no debería ser tan difícil
                    </h2>
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {[
                            "Manuales difíciles de entender",
                            "Instrucciones perdidas o incompletas",
                            "Dibujos imposibles de interpretar",
                            "Falta de ayuda durante el montaje",
                            "Información dispersa en múltiples sitios",
                            "Miedo a cometer errores irreversibles",
                        ].map((problema) => (
                            <div
                                key={problema}
                                className="flex items-start gap-3 p-4 rounded-xl border border-douche dark:border-noche-borde"
                            >
                                <div className="w-1.5 h-1.5 rounded-full bg-noyer dark:bg-mantequilla mt-2 flex-shrink-0" />
                                <p className="text-sm text-gris-piedra leading-relaxed">{problema}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* qué hace gia exactamente */}
            <section className="max-w-3xl mx-auto px-6 py-20">
                <span className="inline-block text-xs font-semibold tracking-[0.14em] uppercase text-noyer dark:text-mantequilla mb-4">
                    La solución
                </span>
                <h2 className="text-3xl font-semibold text-deep-ocean dark:text-ivoire mb-8">
                    Un copiloto para cada montaje
                </h2>
                <div className="space-y-4">
                    {[
                        "Interpreta manuales técnicos y los convierte en instrucciones claras.",
                        "Responde preguntas concretas durante el montaje.",
                        "Explica cada paso de forma sencilla y adaptada al usuario.",
                        "Mantiene el contexto de la conversación durante todo el proceso.",
                        "Ayuda incluso cuando el usuario no dispone del manual.",
                        "Evolucionará para ayudar también en reparaciones e instalaciones.",
                    ].map((item, i) => (
                        <div key={i} className="flex items-start gap-4 p-5 rounded-xl bg-white dark:bg-noche-suave border border-douche dark:border-noche-borde">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-ocean-vivo to-deep-ocean dark:from-sky dark:to-clouds flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                                    <polyline points="20 6 9 17 4 12" />
                                </svg>
                            </div>
                            <p className="text-sm text-gris-piedra leading-relaxed">{item}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* pasos del flujo principal */}
            <section className="bg-white dark:bg-noche-suave border-y border-douche dark:border-noche-borde">
                <div className="max-w-3xl mx-auto px-6 py-20">
                    <span className="inline-block text-xs font-semibold tracking-[0.14em] uppercase text-noyer dark:text-mantequilla mb-4">
                        Proceso
                    </span>
                    <h2 className="text-3xl font-semibold text-deep-ocean dark:text-ivoire mb-12">
                        Cómo funciona GIA
                    </h2>
                    <div className="space-y-6">
                        {[
                            { paso: "01", titulo: "Inicia una conversación", desc: "El usuario abre GIA y describe qué quiere montar o instalar." },
                            { paso: "02", titulo: "Sube el manual o una foto", desc: "GIA acepta PDFs y fotografías. Si no tienes manual, puede trabajar con imágenes o descripciones." },
                            { paso: "03", titulo: "GIA analiza la información", desc: "El sistema extrae el texto, lo divide en fragmentos y genera vectores semánticos para cada uno." },
                            { paso: "04", titulo: "Recuperación de contexto (RAG)", desc: "Cuando el usuario hace una pregunta, GIA busca los fragmentos más relevantes del manual." },
                            { paso: "05", titulo: "Respuesta adaptada al proyecto", desc: "La IA genera una respuesta basada únicamente en el contenido real del manual del usuario." },
                            { paso: "06", titulo: "Acompañamiento continuo", desc: "GIA mantiene el contexto de toda la conversación y puede retomarse en cualquier momento." },
                        ].map((item) => (
                            <div key={item.paso} className="flex gap-6 items-start">
                                <span className="text-2xl font-semibold text-douche dark:text-noche-borde flex-shrink-0 w-10">
                                    {item.paso}
                                </span>
                                <div>
                                    <h3 className="text-base font-semibold text-deep-ocean dark:text-ivoire mb-1">
                                        {item.titulo}
                                    </h3>
                                    <p className="text-sm text-gris-piedra leading-relaxed">
                                        {item.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* stack tecnológico */}
            <section className="max-w-4xl mx-auto px-6 py-20">
                <span className="inline-block text-xs font-semibold tracking-[0.14em] uppercase text-noyer dark:text-mantequilla mb-4">
                    Stack
                </span>
                <h2 className="text-3xl font-semibold text-deep-ocean dark:text-ivoire mb-10">
                    Tecnologías
                </h2>
                <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
                    {[
                        { categoria: "Frontend", items: ["React", "Vite", "Tailwind CSS"] },
                        { categoria: "Backend", items: ["Flask", "PostgreSQL", "SQLAlchemy"] },
                        { categoria: "Inteligencia Artificial", items: ["RAG", "Groq", "Sentence Transformers", "PyPDF2"] },
                        { categoria: "Próximamente", items: ["OCR", "Visión Artificial", "Dictado por voz"] },
                    ].map((bloque) => (
                        <div key={bloque.categoria} className="p-5 rounded-2xl border border-douche dark:border-noche-borde bg-white dark:bg-noche-suave">
                            <h3 className="text-xs font-semibold text-gris-piedra uppercase tracking-wider mb-3">
                                {bloque.categoria}
                            </h3>
                            <ul className="space-y-1.5">
                                {bloque.items.map((item) => (
                                    <li key={item} className="text-sm text-deep-ocean dark:text-ivoire">
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </section>

            {/* por qué gia es diferente */}
            <section className="bg-white dark:bg-noche-suave border-y border-douche dark:border-noche-borde">
                <div className="max-w-3xl mx-auto px-6 py-20">
                    <span className="inline-block text-xs font-semibold tracking-[0.14em] uppercase text-noyer dark:text-mantequilla mb-4">
                        Diferenciadores
                    </span>
                    <h2 className="text-3xl font-semibold text-deep-ocean dark:text-ivoire mb-10">
                        ¿Qué hace diferente a GIA?
                    </h2>
                    <div className="space-y-3">
                        {[
                            "No es un chatbot genérico — está especializado en montaje, instalación y bricolaje.",
                            "Comprende manuales técnicos y los convierte en lenguaje claro.",
                            "Mantiene el contexto del proyecto durante toda la conversación.",
                            "Acompaña al usuario desde el primer paso hasta el último.",
                            "Ayuda incluso sin manual, usando fotografías o descripciones.",
                            "Evoluciona junto al proyecto del usuario.",
                        ].map((item, i) => (
                            <div key={i} className="flex items-start gap-3 py-3 border-b border-douche dark:border-noche-borde last:border-0">
                                <div className="w-1.5 h-1.5 rounded-full bg-ocean-vivo dark:bg-sky mt-2 flex-shrink-0" />
                                <p className="text-sm text-gris-piedra leading-relaxed">{item}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* hacia dónde va el producto */}
            <section className="max-w-3xl mx-auto px-6 py-20">
                <span className="inline-block text-xs font-semibold tracking-[0.14em] uppercase text-noyer dark:text-mantequilla mb-4">
                    Evolución
                </span>
                <h2 className="text-3xl font-semibold text-deep-ocean dark:text-ivoire mb-10">
                    Roadmap
                </h2>
                <div className="space-y-3">
                    {[
                        { estado: "done", texto: "Chat inteligente con GIA" },
                        { estado: "done", texto: "Procesamiento de manuales PDF" },
                        { estado: "done", texto: "Recuperación de contexto mediante RAG" },
                        { estado: "next", texto: "Memoria conversacional" },
                        { estado: "next", texto: "Diagnóstico visual mediante imágenes" },
                        { estado: "next", texto: "Asistencia por voz" },
                        { estado: "next", texto: "Reparación y restauración guiada" },
                        { estado: "next", texto: "Soporte multilingüe" },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center gap-4 py-3 border-b border-douche dark:border-noche-borde last:border-0">
                            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.estado === "done" ? "bg-green-500" : "bg-douche dark:bg-noche-borde"}`} />
                            <p className={`text-sm ${item.estado === "done" ? "text-deep-ocean dark:text-ivoire" : "text-gris-piedra"}`}>
                                {item.texto}
                            </p>
                        </div>
                    ))}
                </div>
            </section>

            {/* quién hay detrás */}
            <section className="bg-white dark:bg-noche-suave border-y border-douche dark:border-noche-borde">
                <div className="max-w-3xl mx-auto px-6 py-20">
                    <span className="inline-block text-xs font-semibold tracking-[0.14em] uppercase text-noyer dark:text-mantequilla mb-4">
                        Equipo
                    </span>
                    <h2 className="text-3xl font-semibold text-deep-ocean dark:text-ivoire mb-8">
                        Sobre la creadora
                    </h2>
                    <p className="text-gris-piedra leading-relaxed mb-4">
                        GIA ha sido creado por Genesis Falcon como proyecto de innovación en
                        Inteligencia Artificial y Desarrollo Full Stack.
                    </p>
                    <p className="text-gris-piedra leading-relaxed">
                        Actualmente forma parte de mi Trabajo Fin de Grado, pero desde el inicio
                        ha sido concebido con la visión de evolucionar hacia un producto real capaz
                        de ayudar a miles de personas en sus proyectos de montaje, instalación y
                        reparación.
                    </p>
                </div>
            </section>

            {/* cierre con llamada a la acción */}
            <section className="max-w-3xl mx-auto px-6 py-24 text-center">
                <div className="flex justify-center mb-6">
                    <LogoGia size={48} conTexto={false} />
                </div>
                <h2 className="text-2xl font-semibold text-deep-ocean dark:text-ivoire mb-3">
                    ¿Empezamos?
                </h2>
                <p className="text-gris-piedra mb-8">
                    Sube tu primer manual y deja que GIA te acompañe durante todo el proceso.
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