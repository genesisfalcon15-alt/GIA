import { Outlet } from "react-router-dom";
import ScrollToTop from "../components/ScrollToTop";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";

// min-h-screen + flex-col hace que el footer se pegue abajo del todo
export const Layout = () => {
    return (
        <ScrollToTop>
            <div className="min-h-screen flex flex-col bg-ivoire dark:bg-noche">
                <Navbar />
                <main className="flex-1">
                    <Outlet />
                </main>
                <Footer />
            </div>
        </ScrollToTop>
    );
};