const db = require('../config/db');
const bcrypt = require('bcrypt'); // Importa bcrypt para encriptar contraseñas

const userModel = {
  // Función para registrar un nuevo usuario
  register: (nombre, email, password, rol, callback) => { // Cambiado: nombre, email, rol
    // Generar un hash de la contraseña
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        console.error('Error al hashear contraseña:', err);
        return callback(err);
      }

      const query = `
        INSERT INTO Usuario (nombre, email, password_hash, rol)
        VALUES (?, ?, ?, ?)
        `;
      db.query(query, [nombre, email, hash, rol], (err, result) => { // Cambiado: nombre, email, rol
        if (err && err.code === 'ER_DUP_ENTRY') {
          // Error específico para email duplicado
          return callback(new Error('El email ya está registrado.'));
        }
        callback(err, result);
      });
    });
  },

  // Función para autenticar un usuario
  login: (email, password, callback) => { // Cambiado: email para login
    const query = `
      SELECT id_usuario, nombre, email, password_hash, rol
      FROM Usuario
      WHERE email = ?
    `;
    db.query(query, [email], (err, results) => { // Cambiado: usar email
      if (err) return callback(err);
      if (results.length === 0) {
        // Usuario no encontrado
        return callback(null, null);
      }

      const user = results[0];

      // Comparar la contraseña proporcionada con el hash almacenado
      bcrypt.compare(password, user.password_hash, (err, isMatch) => {
        if (err) {
          console.error('Error al comparar contraseñas:', err);
          return callback(err);
        }
        if (isMatch) {
          // Contraseña correcta, devolver el usuario (sin el hash de la contraseña)
          delete user.password_hash;
          callback(null, user);
        } else {
          // Contraseña incorrecta
          callback(null, null);
        }
      });
    });
  }
};

module.exports = userModel;