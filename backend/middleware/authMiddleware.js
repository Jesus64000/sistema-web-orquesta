const jwt = require('jsonwebtoken');

// Asegúrate de que JWT_SECRET esté definido en tu .env
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  console.error('Error: JWT_SECRET no está definida en el archivo .env');
  process.exit(1);
}

// Middleware para verificar el JWT y adjuntar los datos del usuario a la solicitud (req.user)
exports.authenticateToken = (req, res, next) => {
  // Obtener el token del encabezado de autorización
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // El token viene como "Bearer TOKEN"

  if (token == null) {
    return res.status(401).json({ message: 'Token de autenticación no proporcionado.' }); // 401 Unauthorized
  }

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      console.error('Error al verificar el token:', err.message);
      return res.status(403).json({ message: 'Token de autenticación inválido o expirado.' }); // 403 Forbidden
    }
    // Si el token es válido, adjuntamos los datos del usuario a la solicitud
    req.user = user;
    next(); // Pasar al siguiente middleware o a la ruta
  });
};

// Middleware para verificar el rol del usuario
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    // Si no hay un usuario en la solicitud (es decir, authenticateToken no se ejecutó primero o falló)
    if (!req.user) {
      return res.status(401).json({ message: 'Acceso denegado. Se requiere autenticación.' });
    }
    // Verificar si el rol del usuario está entre los roles permitidos
    if (!roles.includes(req.user.rol)) { // Usamos req.user.rol porque así lo nombramos en el JWT
      return res.status(403).json({ message: 'Acceso denegado. No tienes el rol permitido para esta acción.' }); // 403 Forbidden
    }
    next(); // El usuario tiene el rol correcto, pasar al siguiente middleware o a la ruta
  };
};