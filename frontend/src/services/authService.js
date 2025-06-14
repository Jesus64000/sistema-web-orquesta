import axios from 'axios';

// URL base de tu API de autenticación en el backend
// Asegúrate de que esta URL coincida con la que definiste en tu backend
const API_URL = 'http://localhost:3000/api/auth/login'; // Reemplaza 3000 si tu backend usa otro puerto

const login = async (email, password) => {
  try {
    const response = await axios.post(API_URL, {
      email,
      password,
    });

    // Si el login es exitoso, el backend debería devolver un token JWT
    // Lo almacenaremos en el localStorage del navegador
    if (response.data.token) {
      localStorage.setItem('userToken', response.data.token);
      // Opcional: localStorage.setItem('userRole', response.data.role); si el rol viene en la respuesta
    }
    return response.data; // Devuelve los datos de la respuesta (ej. token, mensaje)
  } catch (error) {
    // Manejo de errores (ej. credenciales inválidas)
    console.error('Error al iniciar sesión:', error.response ? error.response.data : error.message);
    throw error; // Relanza el error para que el componente que llama lo pueda manejar
  }
};

const logout = () => {
  // Elimina el token del localStorage al cerrar sesión
  localStorage.removeItem('userToken');
  // Opcional: localStorage.removeItem('userRole');
};

const authService = {
  login,
  logout,
};

export default authService;