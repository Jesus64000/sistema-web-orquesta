// Importa la conexión a la base de datos desde index.js
// Es importante que db sea la exportación principal de index.js para esto.
const db = require('../config/db'); // Asegúrate de que la ruta sea correcta

const programaModel = {
  // Obtener todos los programas
  getAll: (callback) => {
    db.query('SELECT * FROM Programa', (err, results) => {
      callback(err, results);
    });
  },

  // Obtener un programa por su ID
  getById: (id, callback) => {
    db.query('SELECT * FROM Programa WHERE id_programa = ?', [id], (err, result) => {
      callback(err, result[0]); // [0] porque esperamos un solo resultado
    });
  },

  // Agregar un nuevo programa
  create: (nombre, descripcion, callback) => {
    const query = 'INSERT INTO Programa (nombre, descripcion) VALUES (?, ?)';
    db.query(query, [nombre, descripcion], (err, result) => {
      callback(err, result);
    });
  },

  // Actualizar un programa existente
  update: (id, nombre, descripcion, callback) => {
    const query = 'UPDATE Programa SET nombre = ?, descripcion = ? WHERE id_programa = ?';
    db.query(query, [nombre, descripcion, id], (err, result) => {
      callback(err, result);
    });
  },

  // Eliminar un programa
  delete: (id, callback) => {
    db.query('DELETE FROM Programa WHERE id_programa = ?', [id], (err, result) => {
      callback(err, result);
    });
  }
};

module.exports = programaModel;