import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import { RouterProvider } from "react-router-dom";
import { router } from "./routes";
import { StoreProvider } from './hooks/useGlobalReducer';
import { BackendURL } from './components/BackendURL';

// aplico el tema guardado antes de que react renderice
// así no hay flash de modo claro al navegar a login/register
const temaGuardado = localStorage.getItem("gia_tema");
if (temaGuardado === "oscuro") {
    document.documentElement.classList.add("dark");
} else if (temaGuardado === "claro") {
    document.documentElement.classList.remove("dark");
} else {
    if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.documentElement.classList.add("dark");
    }
}

const Main = () => {
    if (!import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_BACKEND_URL == "") return (
        <React.StrictMode>
            <BackendURL />
        </React.StrictMode>
    );
    return (
        <React.StrictMode>
            <StoreProvider>
                <RouterProvider router={router}>
                </RouterProvider>
            </StoreProvider>
        </React.StrictMode>
    );
}

ReactDOM.createRoot(document.getElementById('root')).render(<Main />)