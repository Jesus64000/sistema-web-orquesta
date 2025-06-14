import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom'; // <--- Importa componentes de React Router DOM
import Layout from './components/Layout'; // <--- Importa el componente Layout
import Dashboard from './pages/Dashboard'; // <--- Importa tus componentes de página
import Programas from './pages/Programas';
import Alumnos from './pages/Alumnos';
import Login from './pages/Login'; // <--- Importa el componente Login

function App() {
  return (
    <BrowserRouter> {/* Envuelve toda la aplicación para habilitar el enrutamiento */}
      <Routes>
        {/* Ruta para el Login - Fuera del Layout */}
        <Route path="/login" element={<Login />} />

        {/* Rutas Protegidas - Dentro del Layout */}
        <Route element={<Layout />}> {/* Agrupamos las rutas que usan el Layout */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/programas" element={<Programas />} />
          <Route path="/alumnos" element={<Alumnos />} />
        </Route>

        {/* Opcional: Ruta para 404 Not Found (dentro o fuera del layout según la UX deseada) */}
        {/* <Route path="*" element={<div>404 Not Found</div>} /> */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;
