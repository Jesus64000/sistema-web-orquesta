const db = require('../config/db'); // Importa la conexión a la base de datos

const instrumentoModel = {
  // Obtener todos los instrumentos
  getAll: (callback) => {
    db.query('SELECT * FROM Instrumento', (err, results) => {
      callback(err, results);
    });
  },

  // Obtener un instrumento por su ID
  getById: (id, callback) => {
    db.query('SELECT * FROM Instrumento WHERE id_instrumento = ?', [id], (err, result) => {
      callback(err, result[0]); // [0] porque esperamos un solo resultado
    });
  },

  // Agregar un nuevo instrumento
  create: (nombre, categoria, numero_serie, estado, fecha_adquisicion, foto_url, ubicacion, callback) => {
    const query = `
      INSERT INTO Instrumento (nombre, categoria, numero_serie, estado, fecha_adquisicion, foto_url, ubicacion)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(query, [nombre, categoria, numero_serie, estado, fecha_adquisicion, foto_url, ubicacion], (err, result) => {
      callback(err, result);
    });
  },

  // Actualizar un instrumento existente
  update: (id, nombre, categoria, numero_serie, estado, fecha_adquisicion, foto_url, ubicacion, callback) => {
    const query = `
      UPDATE Instrumento
      SET nombre = ?, categoria = ?, numero_serie = ?, estado = ?, fecha_adquisicion = ?, foto_url = ?, ubicacion = ?
      WHERE id_instrumento = ?
    `;
    db.query(query, [nombre, categoria, numero_serie, estado, fecha_adquisicion, foto_url, ubicacion, id], (err, result) => {
      callback(err, result);
    });
  },

  // Eliminar un instrumento
  delete: (id, callback) => {
    db.query('DELETE FROM Instrumento WHERE id_instrumento = ?', [id], (err, result) => {
      callback(err, result);
    });
  }
};

module.exports = instrumentoModel;