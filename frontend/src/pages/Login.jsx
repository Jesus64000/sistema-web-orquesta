import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // <--- Importa useNavigate
import authService from '../services/authService'; // <--- Importa el servicio de autenticación

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(''); // <--- Nuevo estado para mensajes de error
  const navigate = useNavigate(); // <--- Hook para navegación programática

  const handleSubmit = async (e) => { // <--- La función ahora es asíncrona
    e.preventDefault();
    setError(''); // Limpia cualquier error previo

    try {
      const response = await authService.login(email, password);
      console.log('Login exitoso:', response);
      // Redirige al usuario al dashboard o a la página principal después del login
      navigate('/dashboard');
    } catch (err) {
      // Si hay un error (ej. credenciales inválidas), lo mostramos
      setError(err.response?.data?.message || 'Error al iniciar sesión. Por favor, verifica tus credenciales.');
      console.error('Error durante el login:', err);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gray-200">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">Iniciar Sesión</h2>
        <form onSubmit={handleSubmit}>
          {error && ( // <--- Muestra el mensaje de error si existe
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
              <span className="block sm:inline">{error}</span>
            </div>
          )}
          <div className="mb-6">
            <label htmlFor="email" className="block text-gray-700 text-sm font-semibold mb-2">
              Correo electrónico:
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Introduce tu correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm font-semibold mb-2">
              Contraseña:
            </label>
            <input
              type="password"
              id="password"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Introduce tu contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;