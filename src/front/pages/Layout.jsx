import { Outlet } from "react-router-dom";
import ScrollToTop from "../components/ScrollToTop";
import { Navbar } from "../components/Navbar";

// sin footer — gia es una herramienta, no una web corporativa
// la info legal vive en configuracion
export const Layout = () => {
    return (
        <ScrollToTop>
            <div className="min-h-screen flex flex-col bg-ivoire dark:bg-noche">
                <Navbar />
                <main className="flex-1">
                    <Outlet />
                </main>
            </div>
        </ScrollToTop>
    );
};