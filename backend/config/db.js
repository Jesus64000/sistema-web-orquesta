require('dotenv').config(); // Asegúrate de cargar las variables de entorno aquí también
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Conectar a la base de datos (puedes quitar el db.connect aquí si lo prefieres en index.js o dejarlo)
connection.connect(err => {
  if (err) {
    console.error('Error conectando a la base de datos:', err.stack);
    // Considera salir del proceso o manejar el error de forma robusta en un entorno de producción
    return; 
  }
  console.log('Conexión a la base de datos establecida desde config/db.js con ID:', connection.threadId);
});

module.exports = connection; // Exporta la conexión para que otros archivos la usen