const db = require('../config/db'); // Importa la conexión a la base de datos

const asignacionInstrumentoModel = {
  // Obtener todas las asignaciones, incluyendo nombres de alumno e instrumento
  getAll: (callback) => {
    const query = `
      SELECT
        ai.id_asignacion,
        ai.id_instrumento,
        i.nombre AS instrumento_nombre,
        i.numero_serie AS instrumento_numero_serie,
        ai.id_alumno,
        a.nombre AS alumno_nombre,
        ai.fecha_asignacion,
        ai.fecha_devolucion
      FROM Asignacion_Instrumento ai
      JOIN Instrumento i ON ai.id_instrumento = i.id_instrumento
      LEFT JOIN Alumno a ON ai.id_alumno = a.id_alumno
    `;
    db.query(query, (err, results) => {
      callback(err, results);
    });
  },

  // Obtener una asignación por su ID
  getById: (id, callback) => {
    const query = `
      SELECT
        ai.id_asignacion,
        ai.id_instrumento,
        i.nombre AS instrumento_nombre,
        i.numero_serie AS instrumento_numero_serie,
        ai.id_alumno,
        a.nombre AS alumno_nombre,
        ai.fecha_asignacion,
        ai.fecha_devolucion
      FROM Asignacion_Instrumento ai
      JOIN Instrumento i ON ai.id_instrumento = i.id_instrumento
      LEFT JOIN Alumno a ON ai.id_alumno = a.id_alumno
      WHERE ai.id_asignacion = ?
    `;
    db.query(query, [id], (err, result) => {
      callback(err, result[0]); // Se espera un solo resultado
    });
  },

  // Crear una nueva asignación
  create: (id_instrumento, id_alumno, fecha_asignacion, fecha_devolucion, callback) => {
    // Primero, verificar que el instrumento esté 'Disponible' antes de asignarlo
    db.query('SELECT estado FROM Instrumento WHERE id_instrumento = ?', [id_instrumento], (err, results) => {
      if (err) return callback(err);
      if (results.length === 0 || results[0].estado !== 'Disponible') {
        return callback(new Error('El instrumento no está disponible para asignación.'));
      }

      // Si está disponible, asignarlo
      const query = `
        INSERT INTO Asignacion_Instrumento (id_instrumento, id_alumno, fecha_asignacion, fecha_devolucion)
        VALUES (?, ?, ?, ?)
      `;
      db.query(query, [id_instrumento, id_alumno, fecha_asignacion, fecha_devolucion], (err, result) => {
        if (err) return callback(err);

        // Actualizar el estado del instrumento a 'Asignado'
        db.query('UPDATE Instrumento SET estado = "Asignado" WHERE id_instrumento = ?', [id_instrumento], (errUpdate, resultUpdate) => {
          if (errUpdate) console.error('Error al actualizar estado del instrumento:', errUpdate); // Log, pero no bloquea la asignación
          callback(null, result); // Devuelve el resultado de la asignación
        });
      });
    });
  },

  // Actualizar una asignación existente
  update: (id, id_instrumento, id_alumno, fecha_asignacion, fecha_devolucion, callback) => {
    // Nota: La lógica de actualización de estado del instrumento es más compleja aquí
    // ya que un instrumento podría ser desasignado y luego reasignado.
    // Por simplicidad, esta actualización solo cambia los detalles de la asignación.
    // Para la lógica de devolución, es mejor usar una ruta POST separada o un campo específico.
    const query = `
      UPDATE Asignacion_Instrumento
      SET id_instrumento = ?, id_alumno = ?, fecha_asignacion = ?, fecha_devolucion = ?
      WHERE id_asignacion = ?
    `;
    db.query(query, [id_instrumento, id_alumno, fecha_asignacion, fecha_devolucion, id], (err, result) => {
      callback(err, result);
    });
  },

  // Eliminar una asignación
  delete: (id, callback) => {
    // Primero, obtener el id_instrumento de la asignación para poder actualizar su estado
    db.query('SELECT id_instrumento FROM Asignacion_Instrumento WHERE id_asignacion = ?', [id], (err, results) => {
      if (err) return callback(err);
      if (results.length === 0) return callback(null, { affectedRows: 0 }); // Asignación no encontrada

      const id_instrumento = results[0].id_instrumento;

      // Eliminar la asignación
      db.query('DELETE FROM Asignacion_Instrumento WHERE id_asignacion = ?', [id], (errDelete, resultDelete) => {
        if (errDelete) return callback(errDelete);

        // Si la asignación se eliminó y no hay otras asignaciones activas para este instrumento,
        // actualizar el estado del instrumento a 'Disponible'
        db.query('SELECT COUNT(*) AS count FROM Asignacion_Instrumento WHERE id_instrumento = ? AND fecha_devolucion IS NULL', [id_instrumento], (errCheck, checkResults) => {
          if (errCheck) console.error('Error al verificar asignaciones activas:', errCheck);
          
          if (checkResults[0].count === 0) {
            db.query('UPDATE Instrumento SET estado = "Disponible" WHERE id_instrumento = ?', [id_instrumento], (errUpdate, resultUpdate) => {
              if (errUpdate) console.error('Error al actualizar estado del instrumento a Disponible:', errUpdate);
            });
          }
          callback(null, resultDelete); // Devuelve el resultado de la eliminación de la asignación
        });
      });
    });
  },

  // Función para registrar la devolución de un instrumento
  // Esto es mejor que una simple actualización PUT para cambiar el estado del instrumento
  returnInstrument: (id_asignacion, fecha_devolucion, callback) => {
    db.query('UPDATE Asignacion_Instrumento SET fecha_devolucion = ? WHERE id_asignacion = ?', [fecha_devolucion, id_asignacion], (err, result) => {
      if (err) return callback(err);

      if (result.affectedRows === 0) {
        return callback(null, { affectedRows: 0 }); // Asignación no encontrada
      }

      // Obtener el ID del instrumento asociado a esta asignación
      db.query('SELECT id_instrumento FROM Asignacion_Instrumento WHERE id_asignacion = ?', [id_asignacion], (errSelect, selectResult) => {
        if (errSelect) return callback(errSelect);
        if (selectResult.length === 0) {
          return callback(new Error('Instrumento asociado a la asignación no encontrado.'));
        }
        const id_instrumento = selectResult[0].id_instrumento;

        // Actualizar el estado del instrumento a 'Disponible'
        db.query('UPDATE Instrumento SET estado = "Disponible" WHERE id_instrumento = ?', [id_instrumento], (errUpdate, updateResult) => {
          if (errUpdate) return callback(errUpdate);
          callback(null, result); // Devuelve el resultado de la actualización de la asignación
        });
      });
    });
  }
};

module.exports = asignacionInstrumentoModel;