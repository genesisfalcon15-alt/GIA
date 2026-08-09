import {
  createBrowserRouter,
  createRoutesFromElements,
  Route,
} from "react-router-dom";
import { Layout } from "./pages/Layout";
import { Home } from "./pages/Home";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Chat } from "./pages/Chat";
import { About } from "./pages/About";
import { Montajes } from "./pages/Montajes";
import { Instalar } from "./pages/Instalar";
import { Reparar } from "./pages/Reparar";
import { Onboarding } from "./pages/Onboarding";
import { Proyecto } from "./pages/Proyecto";
import { Perfil } from "./pages/Perfil";
import { NuevoProyecto } from "./pages/NuevoProyecto";
import { MisGuias } from "./pages/MisGuias";


export const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      <Route path="/" element={<Layout />} errorElement={<h1>Página no encontrada</h1>}>
        <Route index element={<Home />} />
        <Route path="chat" element={<Chat />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="about" element={<About />} />
        <Route path="montajes" element={<Montajes />} />
        <Route path="proyecto/:id" element={<Proyecto />} />
        <Route path="instalar" element={<Instalar />} />
        <Route path="reparar" element={<Reparar />} />
        <Route path="perfil" element={<Perfil />} />
        <Route path="nuevo-proyecto" element={<NuevoProyecto />} />
        <Route path="guias" element={<MisGuias />} />
      </Route>
      <Route path="onboarding" element={<Onboarding />} />
    </>
  )
);