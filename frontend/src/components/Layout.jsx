import React from 'react';
import { Link, Outlet } from 'react-router-dom'; // <--- ¡Importa 'Outlet' aquí!

const Layout = () => { // <--- Ya no necesitamos 'children' como prop
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - Barra de navegación lateral */}
      <aside className="w-64 bg-gray-800 text-white p-4 space-y-4 shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-center">Orquesta App</h2>
        <nav>
          <ul>
            <li className="mb-2">
              <Link to="/dashboard" className="block py-2 px-3 rounded hover:bg-gray-700 transition-colors duration-200">
                Dashboard
              </Link>
            </li>
            <li className="mb-2">
              <Link to="/programas" className="block py-2 px-3 rounded hover:bg-gray-700 transition-colors duration-200">
                Programas
              </Link>
            </li>
            <li className="mb-2">
              <Link to="/alumnos" className="block py-2 px-3 rounded hover:bg-gray-700 transition-colors duration-200">
                Alumnos
              </Link>
            </li>
            {/* Agrega más enlaces de navegación aquí según sea necesario */}
          </ul>
        </nav>
      </aside>

      {/* Main Content Area - Área principal de contenido */}
      <main className="flex-1 overflow-auto p-6">
        {/* Aquí es donde se renderizará el contenido de la ruta actual */}
        <Outlet /> {/* <--- ¡USA Outlet AQUÍ en lugar de {children}! */}
      </main>
    </div>
  );
};

export default Layout;