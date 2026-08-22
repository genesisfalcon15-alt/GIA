import { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import ScrollToTop from "../components/ScrollToTop";
import { LogoGia } from "../components/LogoGia";
import {
    Home, FolderOpen, BookOpen, MessageCircle,
    Library, Plus, Sun, Moon, LogOut, User, ChevronDown, Menu, X
} from "lucide-react";

const NAV_ITEMS = [
    { to: "/", label: "Inicio", icon: Home, exact: true },
    { to: "/montajes", label: "Proyectos", icon: FolderOpen },
    { to: "/guias", label: "Manuales", icon: BookOpen },
    { to: "/biblioteca", label: "Biblioteca", icon: Library },
];

const TAB_ITEMS = [
    { to: "/", label: "Inicio", icon: Home, exact: true },
    { to: "/montajes", label: "Proyectos", icon: FolderOpen },
    { to: "/chat", label: "Chat", icon: MessageCircle },
    { to: "/perfil", label: "Perfil", icon: User },
];

export const Layout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const [isDark, setIsDark] = useState(() => {
        const saved = localStorage.getItem("gia_tema");
        if (saved) return saved === "oscuro";
        return window.matchMedia("(prefers-color-scheme: dark)").matches;
    });

    const [sidebarAbierto, setSidebarAbierto] = useState(false);
    const [perfilAbierto, setPerfilAbierto] = useState(false);

    const token = localStorage.getItem("token");
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const nombre = user?.name || user?.email?.split("@")[0] || "Usuario";
    const email = user?.email || "";
    const inicial = nombre ? nombre[0].toUpperCase() : "G";

    useEffect(() => {
        document.documentElement.classList.toggle("dark", isDark);
        localStorage.setItem("gia_tema", isDark ? "oscuro" : "claro");
        localStorage.setItem("tema", isDark ? "oscuro" : "claro");
    }, [isDark]);

    useEffect(() => {
        setSidebarAbierto(false);
    }, [location.pathname]);

    const cerrarSesion = () => {
        const tema = localStorage.getItem("gia_tema");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (tema) localStorage.setItem("gia_tema", tema);
        navigate("/login");
    };

    const sinSidebar = ["/login", "/register", "/onboarding"].includes(location.pathname);
    if (sinSidebar) {
        return (
            <ScrollToTop>
                <div className="min-h-screen bg-ivoire dark:bg-noche">
                    <Outlet />
                </div>
            </ScrollToTop>
        );
    }

    return (
        <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--color-ivoire)" }} className="bg-ivoire dark:bg-noche">

            {/* overlay móvil */}
            {sidebarAbierto && (
                <div
                    className="fixed inset-0 z-40 bg-black/30 lg:hidden"
                    onClick={() => setSidebarAbierto(false)}
                />
            )}

            {/* SIDEBAR */}
            <aside
                style={{ width: "260px", flexShrink: 0 }}
                className={`
                    fixed top-0 left-0 h-full z-50 flex flex-col
                    border-r border-douche dark:border-noche-borde
                    bg-ivoire dark:bg-noche
                    transition-transform duration-300
                    ${sidebarAbierto ? "translate-x-0" : "-translate-x-full"}
                    lg:translate-x-0 lg:static lg:z-auto lg:h-screen
                `}
            >
                {/* logo + toggle */}
                <div className="px-5 py-5 flex items-center justify-between flex-shrink-0">
                    <NavLink to="/" className="hover:opacity-80 transition-opacity">
                        <LogoGia size={28} conTexto={true} />
                    </NavLink>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setIsDark(!isDark)}
                            className="w-7 h-7 flex items-center justify-center text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire transition rounded-lg hover:bg-douche/50 dark:hover:bg-white/5"
                        >
                            {isDark ? <Sun size={14} strokeWidth={1.5} /> : <Moon size={14} strokeWidth={1.5} />}
                        </button>
                        <button
                            onClick={() => setSidebarAbierto(false)}
                            className="lg:hidden w-7 h-7 flex items-center justify-center text-gris-piedra"
                        >
                            <X size={16} strokeWidth={1.5} />
                        </button>
                    </div>
                </div>

                {/* perfil */}
                {token && (
                    <div className="px-4 mb-4 flex-shrink-0">
                        <div className="relative">
                            <button
                                onClick={() => setPerfilAbierto(!perfilAbierto)}
                                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl hover:bg-douche/50 dark:hover:bg-noche-suave/60 transition"
                            >
                                <div
                                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                                    style={{ background: "#A9895C", color: "#FAF8F6" }}
                                >
                                    {inicial}
                                </div>
                                <div className="min-w-0 flex-1 text-left">
                                    <p className="text-xs font-medium text-deep-ocean dark:text-ivoire truncate">{nombre}</p>
                                    <p className="text-[10px] text-gris-piedra truncate">{email}</p>
                                </div>
                                <ChevronDown
                                    size={12}
                                    strokeWidth={1.5}
                                    className={`text-gris-piedra transition-transform flex-shrink-0 ${perfilAbierto ? "rotate-180" : ""}`}
                                />
                            </button>

                            {perfilAbierto && (
                                <div className="absolute left-0 right-0 top-full mt-1 rounded-xl border border-douche dark:border-noche-borde bg-white dark:bg-noche-suave shadow-lg overflow-hidden z-50">
                                    <button
                                        onClick={() => { setPerfilAbierto(false); navigate("/perfil"); }}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-deep-ocean dark:text-ivoire hover:bg-douche/40 dark:hover:bg-white/5 transition text-left"
                                    >
                                        <User size={13} strokeWidth={1.5} className="text-gris-piedra" />
                                        Mi perfil
                                    </button>
                                    <div className="border-t border-douche dark:border-noche-borde" />
                                    <button
                                        onClick={cerrarSesion}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-xs text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition text-left"
                                    >
                                        <LogOut size={13} strokeWidth={1.5} />
                                        Cerrar sesión
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="px-3 mb-3 flex-shrink-0">
                    <div style={{ borderTop: "1px solid", borderColor: isDark ? "#3A4150" : "#DDD6CE" }} />
                </div>

                {/* nav */}
                <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
                    {NAV_ITEMS.map(({ to, label, icon: Icon, exact }) => (
                        <NavLink
                            key={to}
                            to={to}
                            end={exact}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${isActive
                                    ? "bg-douche dark:bg-noche-suave text-noyer dark:text-mantequilla font-medium"
                                    : "text-gris-piedra hover:text-deep-ocean dark:hover:text-ivoire hover:bg-douche/40 dark:hover:bg-white/5"
                                }`
                            }
                        >
                            <Icon size={16} strokeWidth={1.4} />
                            {label}
                        </NavLink>
                    ))}
                </nav>
            </aside>

            {/* ÁREA PRINCIPAL — ocupa todo el espacio restante */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, height: "100vh", overflow: "hidden" }}>

                {/* topbar móvil */}
                <header className="lg:hidden flex-shrink-0 flex items-center justify-between px-4 py-3 border-b border-douche dark:border-noche-borde bg-ivoire dark:bg-noche">
                    <button
                        onClick={() => setSidebarAbierto(true)}
                        className="w-8 h-8 flex items-center justify-center text-gris-piedra"
                    >
                        <Menu size={18} strokeWidth={1.5} />
                    </button>
                    <LogoGia size={24} conTexto={false} />
                    <button
                        onClick={() => navigate("/nuevo-proyecto")}
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:opacity-90"
                        style={{ background: "#3C5160", color: "#FAF8F6" }}
                    >
                        <Plus size={16} strokeWidth={2} />
                    </button>
                </header>

                {/* contenido — scroll aquí, no en el body */}
                <main style={{ flex: 1, overflowY: "auto" }} className="pb-20 lg:pb-0">
                    <Outlet />
                </main>

                {/* tab bar móvil */}
                <nav className="lg:hidden flex-shrink-0 bg-ivoire dark:bg-noche border-t border-douche dark:border-noche-borde px-2 py-2">
                    <div className="flex items-center justify-around max-w-sm mx-auto">
                        {TAB_ITEMS.map(({ to, label, icon: Icon, exact }) => (
                            <NavLink
                                key={to}
                                to={to}
                                end={exact}
                                className={({ isActive }) =>
                                    `flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-all ${isActive
                                        ? "text-noyer dark:text-mantequilla"
                                        : "text-gris-piedra"
                                    }`
                                }
                            >
                                <Icon size={20} strokeWidth={1.4} />
                                <span className="text-[10px] font-medium">{label}</span>
                            </NavLink>
                        ))}
                    </div>
                </nav>
            </div>
        </div>
    );
};