// --- Nota: La conexión a la DB se maneja en config/db.js ---

// Carga las variables de entorno desde .env
require('dotenv').config();

const express = require('express');

const db = require('./config/db'); // Importa la conexión a la base de datos

// Importa los modelos de programas y alumnos
const programaModel = require('./models/programaModel'); // <-- Importa el modelo de programas
const alumnoModel = require('./models/alumnoModel'); // <-- Importa el modelo de alumnos
const instrumentoModel = require('./models/instrumentoModel'); // <-- Importa el modelo de instrumentos
const asignacionInstrumentoModel = require('./models/asignacionInstrumentoModel'); // <-- Asignar Instrumentos

const app = express();
const port = 3000;

// --- Middleware para parsear JSON ---
app.use(express.json()); 


// --- Rutas de la API (Existentes) ---

// Ruta de prueba
app.get('/', (req, res) => {
  res.send('¡Hola desde el Backend de Orquesta! El servidor está funcionando.');
});

// Nueva ruta para probar la conexión a la base de datos
app.get('/test-db', (req, res) => {
  db.query('SELECT 1 + 1 AS solution', (err, results) => {
    if (err) {
      console.error('Error ejecutando consulta de prueba:', err);
      res.status(500).send('Error al conectar con la base de datos para la consulta.');
      return;
    }
    res.json({ message: 'Conexión a la base de datos exitosa!', solution: results[0].solution });
  });
});



// --- Rutas para la Gestión de Programas! ---

// GET /api/programas - Obtener todos los programas
app.get('/api/programas', (req, res) => {
  programaModel.getAll((err, programs) => {
    if (err) {
      console.error('Error al obtener programas:', err);
      res.status(500).json({ error: 'Error interno del servidor al obtener programas.' });
      return;
    }
    res.json(programs);
  });
});

// GET /api/programas/:id - Obtener un programa por ID
app.get('/api/programas/:id', (req, res) => {
  const { id } = req.params;
  programaModel.getById(id, (err, program) => {
    if (err) {
      console.error('Error al obtener programa por ID:', err);
      res.status(500).json({ error: 'Error interno del servidor al obtener el programa.' });
      return;
    }
    if (!program) {
      res.status(404).json({ message: 'Programa no encontrado.' });
      return;
    }
    res.json(program);
  });
});

// POST /api/programas - Crear un nuevo programa
app.post('/api/programas', (req, res) => {
  const { nombre, descripcion } = req.body;
  if (!nombre) {
    return res.status(400).json({ error: 'El nombre del programa es requerido.' });
  }
  programaModel.create(nombre, descripcion, (err, result) => {
    if (err) {
      console.error('Error al crear programa:', err);
      res.status(500).json({ error: 'Error interno del servidor al crear el programa.' });
      return;
    }
    res.status(201).json({ message: 'Programa creado con éxito', id: result.insertId });
  });
});

// PUT /api/programas/:id - Actualizar un programa
app.put('/api/programas/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion } = req.body;
  if (!nombre) {
    return res.status(400).json({ error: 'El nombre del programa es requerido para la actualización.' });
  }
  programaModel.update(id, nombre, descripcion, (err, result) => {
    if (err) {
      console.error('Error al actualizar programa:', err);
      res.status(500).json({ error: 'Error interno del servidor al actualizar el programa.' });
      return;
    }
    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Programa no encontrado para actualizar.' });
      return;
    }
    res.json({ message: 'Programa actualizado con éxito.' });
  });
});

// DELETE /api/programas/:id - Eliminar un programa
app.delete('/api/programas/:id', (req, res) => {
  const { id } = req.params;
  programaModel.delete(id, (err, result) => {
    if (err) {
      console.error('Error al eliminar programa:', err);
      res.status(500).json({ error: 'Error interno del servidor al eliminar el programa.' });
      return;
    }
    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Programa no encontrado para eliminar.' });
      return;
    }
    res.json({ message: 'Programa eliminado con éxito.' });
  });
});




// --- Rutas para la Gestión de Alumnos!

// GET /api/alumnos - Obtener todos los alumnos
app.get('/api/alumnos', (req, res) => {
  alumnoModel.getAll((err, alumnos) => {
    if (err) {
      console.error('Error al obtener alumnos:', err);
      res.status(500).json({ error: 'Error interno del servidor al obtener alumnos.' });
      return;
    }
    res.json(alumnos);
  });
});

// GET /api/alumnos/:id - Obtener un alumno por ID
app.get('/api/alumnos/:id', (req, res) => {
  const { id } = req.params;
  alumnoModel.getById(id, (err, alumno) => {
    if (err) {
      console.error('Error al obtener alumno por ID:', err);
      res.status(500).json({ error: 'Error interno del servidor al obtener el alumno.' });
      return;
    }
    if (!alumno) {
      res.status(404).json({ message: 'Alumno no encontrado.' });
      return;
    }
    res.json(alumno);
  });
});

// POST /api/alumnos - Crear un nuevo alumno
app.post('/api/alumnos', (req, res) => {
  // Asegúrate de que todos los campos requeridos estén en el body
  const { nombre, fecha_nacimiento, genero, telefono_contacto, id_representante, id_programa, estado } = req.body;
  if (!nombre || !fecha_nacimiento || !id_programa) { // Puedes ajustar los campos requeridos
    return res.status(400).json({ error: 'Nombre, fecha de nacimiento y programa son requeridos.' });
  }

  // Convertir fecha_nacimiento a formato 'YYYY-MM-DD' si es necesario
  // Por ejemplo, si llega como "DD-MM-YYYY" o un objeto Date, ajustarlo.
  // Aquí asumimos que llega en un formato compatible con MySQL (ej. "YYYY-MM-DD").
  // Si se usa un Date object en JS, puedes usar .toISOString().split('T')[0]

  alumnoModel.create(nombre, fecha_nacimiento, genero, telefono_contacto, id_representante, id_programa, estado, (err, result) => {
    if (err) {
      console.error('Error al crear alumno:', err);
      res.status(500).json({ error: 'Error interno del servidor al crear el alumno.' });
      return;
    }
    res.status(201).json({ message: 'Alumno creado con éxito', id: result.insertId });
  });
});

// PUT /api/alumnos/:id - Actualizar un alumno
app.put('/api/alumnos/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, fecha_nacimiento, genero, telefono_contacto, id_representante, id_programa, estado } = req.body;
  if (!nombre || !fecha_nacimiento || !id_programa) {
    return res.status(400).json({ error: 'Nombre, fecha de nacimiento y programa son requeridos para la actualización.' });
  }

  alumnoModel.update(id, nombre, fecha_nacimiento, genero, telefono_contacto, id_representante, id_programa, estado, (err, result) => {
    if (err) {
      console.error('Error al actualizar alumno:', err);
      res.status(500).json({ error: 'Error interno del servidor al actualizar el alumno.' });
      return;
    }
    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Alumno no encontrado para actualizar.' });
      return;
    }
    res.json({ message: 'Alumno actualizado con éxito.' });
  });
});

// DELETE /api/alumnos/:id - Eliminar un alumno
app.delete('/api/alumnos/:id', (req, res) => {
  const { id } = req.params;
  alumnoModel.delete(id, (err, result) => {
    if (err) {
      console.error('Error al eliminar alumno:', err);
      res.status(500).json({ error: 'Error interno del servidor al eliminar el alumno.' });
      return;
    }
    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Alumno no encontrado para eliminar.' });
      return;
    }
    res.json({ message: 'Alumno eliminado con éxito.' });
  });
});


// --- ¡Rutas para la Gestión de Instrumentos!

// GET /api/instrumentos - Obtener todos los instrumentos
app.get('/api/instrumentos', (req, res) => {
  instrumentoModel.getAll((err, instrumentos) => {
    if (err) {
      console.error('Error al obtener instrumentos:', err);
      res.status(500).json({ error: 'Error interno del servidor al obtener instrumentos.' });
      return;
    }
    res.json(instrumentos);
  });
});

// GET /api/instrumentos/:id - Obtener un instrumento por ID
app.get('/api/instrumentos/:id', (req, res) => {
  const { id } = req.params;
  instrumentoModel.getById(id, (err, instrumento) => {
    if (err) {
      console.error('Error al obtener instrumento por ID:', err);
      res.status(500).json({ error: 'Error interno del servidor al obtener el instrumento.' });
      return;
    }
    if (!instrumento) {
      res.status(404).json({ message: 'Instrumento no encontrado.' });
      return;
    }
    res.json(instrumento);
  });
});

// POST /api/instrumentos - Crear un nuevo instrumento
app.post('/api/instrumentos', (req, res) => {
  const { nombre, categoria, numero_serie, estado, fecha_adquisicion, foto_url, ubicacion } = req.body;
  if (!nombre || !categoria || !numero_serie) { // Campos mínimos requeridos
    return res.status(400).json({ error: 'Nombre, categoría y número de serie del instrumento son requeridos.' });
  }

  instrumentoModel.create(nombre, categoria, numero_serie, estado, fecha_adquisicion, foto_url, ubicacion, (err, result) => {
    if (err) {
      console.error('Error al crear instrumento:', err);
      // Puedes añadir más manejo de errores específicos, ej. si numero_serie es duplicado
      res.status(500).json({ error: 'Error interno del servidor al crear el instrumento.' });
      return;
    }
    res.status(201).json({ message: 'Instrumento creado con éxito', id: result.insertId });
  });
});

// PUT /api/instrumentos/:id - Actualizar un instrumento
app.put('/api/instrumentos/:id', (req, res) => {
  const { id } = req.params;
  const { nombre, categoria, numero_serie, estado, fecha_adquisicion, foto_url, ubicacion } = req.body;
  if (!nombre || !categoria || !numero_serie) {
    return res.status(400).json({ error: 'Nombre, categoría y número de serie son requeridos para la actualización.' });
  }

  instrumentoModel.update(id, nombre, categoria, numero_serie, estado, fecha_adquisicion, foto_url, ubicacion, (err, result) => {
    if (err) {
      console.error('Error al actualizar instrumento:', err);
      res.status(500).json({ error: 'Error interno del servidor al actualizar el instrumento.' });
      return;
    }
    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Instrumento no encontrado para actualizar.' });
      return;
    }
    res.json({ message: 'Instrumento actualizado con éxito.' });
  });
});

// DELETE /api/instrumentos/:id - Eliminar un instrumento
app.delete('/api/instrumentos/:id', (req, res) => {
  const { id } = req.params;
  instrumentoModel.delete(id, (err, result) => {
    if (err) {
      console.error('Error al eliminar instrumento:', err);
      res.status(500).json({ error: 'Error interno del servidor al eliminar el instrumento.' });
      return;
    }
    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Instrumento no encontrado para eliminar.' });
      return;
    }
    res.json({ message: 'Instrumento eliminado con éxito.' });
  });
});


// --- Rutas para la Gestión de Asignaciones de Instrumentos


// GET /api/asignaciones - Obtener todas las asignaciones
app.get('/api/asignaciones', (req, res) => {
  asignacionInstrumentoModel.getAll((err, asignaciones) => {
    if (err) {
      console.error('Error al obtener asignaciones:', err);
      res.status(500).json({ error: 'Error interno del servidor al obtener asignaciones.' });
      return;
    }
    res.json(asignaciones);
  });
});

// GET /api/asignaciones/:id - Obtener una asignación por ID
app.get('/api/asignaciones/:id', (req, res) => {
  const { id } = req.params;
  asignacionInstrumentoModel.getById(id, (err, asignacion) => {
    if (err) {
      console.error('Error al obtener asignación por ID:', err);
      res.status(500).json({ error: 'Error interno del servidor al obtener la asignación.' });
      return;
    }
    if (!asignacion) {
      res.status(404).json({ message: 'Asignación no encontrada.' });
      return;
    }
    res.json(asignacion);
  });
});

// POST /api/asignaciones - Crear una nueva asignación
app.post('/api/asignaciones', (req, res) => {
  const { id_instrumento, id_alumno, fecha_asignacion, fecha_devolucion } = req.body;
  if (!id_instrumento || !id_alumno || !fecha_asignacion) {
    return res.status(400).json({ error: 'ID de instrumento, ID de alumno y fecha de asignación son requeridos.' });
  }

  asignacionInstrumentoModel.create(id_instrumento, id_alumno, fecha_asignacion, fecha_devolucion, (err, result) => {
    if (err) {
      console.error('Error al crear asignación:', err);
      // Envía un error 400 si el instrumento no está disponible
      if (err.message === 'El instrumento no está disponible para asignación.') {
        return res.status(400).json({ error: err.message });
      }
      res.status(500).json({ error: 'Error interno del servidor al crear la asignación.' });
      return;
    }
    res.status(201).json({ message: 'Asignación creada con éxito', id: result.insertId });
  });
});

// PUT /api/asignaciones/:id - Actualizar una asignación
app.put('/api/asignaciones/:id', (req, res) => {
  const { id } = req.params;
  const { id_instrumento, id_alumno, fecha_asignacion, fecha_devolucion } = req.body;
  if (!id_instrumento || !id_alumno || !fecha_asignacion) {
    return res.status(400).json({ error: 'ID de instrumento, ID de alumno y fecha de asignación son requeridos para la actualización.' });
  }

  asignacionInstrumentoModel.update(id, id_instrumento, id_alumno, fecha_asignacion, fecha_devolucion, (err, result) => {
    if (err) {
      console.error('Error al actualizar asignación:', err);
      res.status(500).json({ error: 'Error interno del servidor al actualizar la asignación.' });
      return;
    }
    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Asignación no encontrada para actualizar.' });
      return;
    }
    res.json({ message: 'Asignación actualizada con éxito.' });
  });
});

// POST /api/asignaciones/:id/devolver - Marcar una asignación como devuelta
app.post('/api/asignaciones/:id/devolver', (req, res) => {
  const { id } = req.params;
  const { fecha_devolucion } = req.body; // Se puede enviar o usar la fecha actual del servidor

  if (!fecha_devolucion) { // Si no se envía una fecha, usa la actual
    // Formato 'YYYY-MM-DD'
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    req.body.fecha_devolucion = `${year}-${month}-${day}`;
  }

  asignacionInstrumentoModel.returnInstrument(id, req.body.fecha_devolucion, (err, result) => {
    if (err) {
      console.error('Error al devolver instrumento:', err);
      res.status(500).json({ error: 'Error interno del servidor al devolver el instrumento.' });
      return;
    }
    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Asignación no encontrada para devolver.' });
      return;
    }
    res.json({ message: 'Instrumento devuelto con éxito y estado actualizado.' });
  });
});


// DELETE /api/asignaciones/:id - Eliminar una asignación (con lógica para actualizar estado del instrumento)
app.delete('/api/asignaciones/:id', (req, res) => {
  const { id } = req.params;
  asignacionInstrumentoModel.delete(id, (err, result) => {
    if (err) {
      console.error('Error al eliminar asignación:', err);
      res.status(500).json({ error: 'Error interno del servidor al eliminar la asignación.' });
      return;
    }
    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Asignación no encontrada para eliminar.' });
      return;
    }
    res.json({ message: 'Asignación eliminada con éxito y estado del instrumento revisado.' });
  });
});



// --- Fin de las Rutas de la API ---

// Inicia el servidor
app.listen(port, () => {
  console.log(`Servidor backend escuchando en http://localhost:${port}`);
});





