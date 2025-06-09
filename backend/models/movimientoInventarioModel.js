const db = require('../config/db'); // Importa la conexión a la base de datos

const movimientoInventarioModel = {
  // Obtener todos los movimientos, incluyendo el nombre del instrumento
  getAll: (callback) => {
    const query = `
      SELECT
        mi.id_movimiento,
        mi.id_instrumento,
        i.nombre AS instrumento_nombre,
        i.numero_serie AS instrumento_numero_serie,
        mi.tipo_movimiento,
        mi.fecha_movimiento,
        mi.descripcion,
        mi.responsable
      FROM Movimiento_Inventario mi
      JOIN Instrumento i ON mi.id_instrumento = i.id_instrumento
      ORDER BY mi.fecha_movimiento DESC
    `;
    db.query(query, (err, results) => {
      callback(err, results);
    });
  },

  // Obtener un movimiento por su ID
  getById: (id, callback) => {
    const query = `
      SELECT
        mi.id_movimiento,
        mi.id_instrumento,
        i.nombre AS instrumento_nombre,
        i.numero_serie AS instrumento_numero_serie,
        mi.tipo_movimiento,
        mi.fecha_movimiento,
        mi.descripcion,
        mi.responsable
      FROM Movimiento_Inventario mi
      JOIN Instrumento i ON mi.id_instrumento = i.id_instrumento
      WHERE mi.id_movimiento = ?
    `;
    db.query(query, [id], (err, result) => {
      callback(err, result[0]); // Se espera un solo resultado
    });
  },

  // Crear un nuevo movimiento de inventario
  create: (id_instrumento, tipo_movimiento, fecha_movimiento, descripcion, responsable, callback) => {
    const query = `
      INSERT INTO Movimiento_Inventario (id_instrumento, tipo_movimiento, fecha_movimiento, descripcion, responsable)
      VALUES (?, ?, ?, ?, ?)
    `;
    db.query(query, [id_instrumento, tipo_movimiento, fecha_movimiento, descripcion, responsable], (err, result) => {
      if (err) return callback(err);

      // Lógica para actualizar el estado del instrumento basado en el tipo de movimiento
      let nuevoEstadoInstrumento;
      switch (tipo_movimiento) {
        case 'Entrada':
          nuevoEstadoInstrumento = 'Disponible'; // Cuando entra, se asume disponible
          break;
        case 'Mantenimiento':
          nuevoEstadoInstrumento = 'Mantenimiento';
          break;
        case 'Baja':
          nuevoEstadoInstrumento = 'De Baja';
          break;
        case 'Reingreso': // Por ejemplo, de mantenimiento a disponible
          nuevoEstadoInstrumento = 'Disponible';
          break;
        // No manejamos "Asignado" aquí, eso lo hace el módulo de asignaciones
        default:
          nuevoEstadoInstrumento = null; // No cambia el estado si el tipo no es reconocido
      }

      if (nuevoEstadoInstrumento) {
        db.query('UPDATE Instrumento SET estado = ? WHERE id_instrumento = ?', [nuevoEstadoInstrumento, id_instrumento], (errUpdate, resultUpdate) => {
          if (errUpdate) console.error('Error al actualizar estado del instrumento por movimiento:', errUpdate);
          callback(null, result); // Devolver el resultado de la creación del movimiento
        });
      } else {
        callback(null, result); // No se actualiza el estado, solo se crea el movimiento
      }
    });
  },

  // Actualizar un movimiento existente (no afecta el estado del instrumento directamente aquí)
  update: (id, id_instrumento, tipo_movimiento, fecha_movimiento, descripcion, responsable, callback) => {
    const query = `
      UPDATE Movimiento_Inventario
      SET id_instrumento = ?, tipo_movimiento = ?, fecha_movimiento = ?, descripcion = ?, responsable = ?
      WHERE id_movimiento = ?
    `;
    db.query(query, [id_instrumento, tipo_movimiento, fecha_movimiento, descripcion, responsable, id], (err, result) => {
      callback(err, result);
    });
  },

  // Eliminar un movimiento (no revierte el estado del instrumento automáticamente)
  delete: (id, callback) => {
    db.query('DELETE FROM Movimiento_Inventario WHERE id_movimiento = ?', [id], (err, result) => {
      callback(err, result);
    });
  }
};

module.exports = movimientoInventarioModel;