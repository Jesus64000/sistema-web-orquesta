const db = require('../config/db'); // Importa la conexión a la base de datos

const alumnoModel = {
  // Obtener todos los alumnos (opcionalmente con sus programas)
  getAll: (callback) => {
    const query = `
      SELECT
        a.id_alumno,
        a.nombre,
        a.fecha_nacimiento,
        a.genero,
        a.telefono_contacto,
        a.id_representante,
        a.estado,
        p.nombre AS programa_nombre
      FROM Alumno a
      JOIN Programa p ON a.id_programa = p.id_programa
    `;
    db.query(query, (err, results) => {
      callback(err, results);
    });
  },

  // Obtener un alumno por su ID
  getById: (id, callback) => {
    const query = `
      SELECT
        a.id_alumno,
        a.nombre,
        a.fecha_nacimiento,
        a.genero,
        a.telefono_contacto,
        a.id_representante,
        a.estado,
        p.id_programa,
        p.nombre AS programa_nombre
      FROM Alumno a
      JOIN Programa p ON a.id_programa = p.id_programa
      WHERE a.id_alumno = ?
    `;
    db.query(query, [id], (err, result) => {
      callback(err, result[0]); // Se espera un solo resultado
    });
  },

  // Agregar un nuevo alumno
  create: (nombre, fecha_nacimiento, genero, telefono_contacto, id_representante, id_programa, estado, callback) => {
    const query = `
      INSERT INTO Alumno (nombre, fecha_nacimiento, genero, telefono_contacto, id_representante, id_programa, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    db.query(query, [nombre, fecha_nacimiento, genero, telefono_contacto, id_representante, id_programa, estado], (err, result) => {
      callback(err, result);
    });
  },

  // Actualizar un alumno existente
  update: (id, nombre, fecha_nacimiento, genero, telefono_contacto, id_representante, id_programa, estado, callback) => {
    const query = `
      UPDATE Alumno
      SET nombre = ?, fecha_nacimiento = ?, genero = ?, telefono_contacto = ?, id_representante = ?, id_programa = ?, estado = ?
      WHERE id_alumno = ?
    `;
    db.query(query, [nombre, fecha_nacimiento, genero, telefono_contacto, id_representante, id_programa, estado, id], (err, result) => {
      callback(err, result);
    });
  },

  // Eliminar un alumno
  delete: (id, callback) => {
    db.query('DELETE FROM Alumno WHERE id_alumno = ?', [id], (err, result) => {
      callback(err, result);
    });
  }
};

module.exports = alumnoModel;