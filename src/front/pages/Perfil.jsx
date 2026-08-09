import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, User, Mail, Shield, Edit3 } from "lucide-react";

export const Perfil = () => {
    const navigate = useNavigate();
    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const perfil = JSON.parse(localStorage.getItem("gia_perfil") || "null");

    if (!token) { navigate("/login"); return null; }

    return (
        <div className="bg-ivoire dark:bg-noche min-h-screen">
            <div className="max-w-2xl mx-auto px-8 pt-10 pb-16">

                {/* volver */}
                <button
                    onClick={() => navigate("/")}
                    className="flex items-center gap-1.5 text-xs text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire transition-colors mb-8"
                >
                    <ArrowLeft size={13} strokeWidth={1.5} />
                    Inicio
                </button>

                {/* cabecera */}
                <div className="mb-8">
                    <p className="text-[9px] font-semibold tracking-[0.16em] uppercase text-gris-piedra mb-1">
                        Área personal
                    </p>
                    <h1 className="text-xl font-medium tracking-tight text-noyer dark:text-mantequilla">
                        Mi perfil
                    </h1>
                </div>

                <div className="border-t border-douche dark:border-noche-borde mb-8" />

                {/* info cuenta */}
                <div className="mb-6">
                    <p className="text-[9px] font-semibold tracking-[0.16em] uppercase text-gris-piedra mb-3">
                        Cuenta
                    </p>
                    <div className="rounded-xl border border-douche dark:border-noche-borde overflow-hidden">
                        <div className="flex items-center gap-3 px-4 py-3.5 bg-white dark:bg-noche-suave border-b border-douche dark:border-noche-borde">
                            <Mail size={14} strokeWidth={1.5} className="text-gris-piedra flex-shrink-0" />
                            <div>
                                <p className="text-[9px] uppercase tracking-wide text-gris-piedra">Email</p>
                                <p className="text-sm text-noyer dark:text-mantequilla">{user?.email || "—"}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 px-4 py-3.5 bg-white dark:bg-noche-suave">
                            <Shield size={14} strokeWidth={1.5} className="text-gris-piedra flex-shrink-0" />
                            <div>
                                <p className="text-[9px] uppercase tracking-wide text-gris-piedra">Plan</p>
                                <p className="text-sm text-noyer dark:text-mantequilla">Gratuito</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* perfil GIA */}
                {perfil && (
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-[9px] font-semibold tracking-[0.16em] uppercase text-gris-piedra">
                                Perfil GIA
                            </p>
                            <button
                                onClick={() => navigate("/onboarding")}
                                className="flex items-center gap-1 text-xs text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire transition"
                            >
                                <Edit3 size={11} strokeWidth={1.5} />
                                Editar
                            </button>
                        </div>
                        <div className="rounded-xl border border-douche dark:border-noche-borde overflow-hidden">
                            {Object.entries(perfil).map(([clave, valor], i, arr) => (
                                <div
                                    key={clave}
                                    className={`flex items-start justify-between px-4 py-3.5 bg-white dark:bg-noche-suave ${i !== arr.length - 1 ? "border-b border-douche dark:border-noche-borde" : ""}`}
                                >
                                    <span className="text-xs text-gris-piedra capitalize">{clave.replace(/_/g, " ")}</span>
                                    <span className="text-xs text-noyer dark:text-mantequilla font-medium text-right max-w-[60%]">
                                        {Array.isArray(valor) ? valor.join(", ") : valor}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {!perfil && (
                    <div className="mb-6 p-4 rounded-xl border border-dashed border-douche dark:border-noche-borde text-center">
                        <p className="text-sm text-gris-piedra mb-3">No has completado tu perfil todavía.</p>
                        <button
                            onClick={() => navigate("/onboarding")}
                            className="px-4 py-2 rounded-lg bg-deep-ocean dark:bg-sky text-ivoire dark:text-noche text-xs font-medium hover:opacity-90 transition"
                        >
                            Completar perfil
                        </button>
                    </div>
                )}

                <div className="border-t border-douche dark:border-noche-borde mb-6" />

                {/* cerrar sesion */}
                <button
                    onClick={() => {
                        localStorage.removeItem("token");
                        localStorage.removeItem("user");
                        navigate("/login");
                    }}
                    className="text-xs text-red-500 hover:opacity-70 transition"
                >
                    Cerrar sesión
                </button>

            </div>
        </div>
    );
};