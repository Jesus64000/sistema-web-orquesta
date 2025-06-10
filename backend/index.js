// --- Nota: La conexión a la DB se maneja en config/db.js ---

// Carga las variables de entorno desde .env
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const db = require('./config/db'); // Importa la conexión a la base de datos

// Importa los modelos de programas y alumnos
const programaModel = require('./models/programaModel'); // <-- Importa el modelo de programas
const alumnoModel = require('./models/alumnoModel'); // <-- Importa el modelo de alumnos
const instrumentoModel = require('./models/instrumentoModel'); // <-- Importa el modelo de instrumentos
const asignacionInstrumentoModel = require('./models/asignacionInstrumentoModel'); // <-- Asignar Instrumentos
const movimientoInventarioModel = require('./models/movimientoInventarioModel'); // <-- Registrar movimientos de los instrumentos
const userModel = require('./models/userModel'); // <-- Importa el modelo de usuarios

const { authenticateToken, authorizeRoles } = require('./middleware/authMiddleware');

const app = express();
const port = 3000;

// --- Middleware para parsear JSON ---
app.use(cors());
app.use(express.json()); 

// Clave secreta para JWT (asegúrate de que esté en tu .env)
const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
  console.error('Error: JWT_SECRET no está definida en el archivo .env');
  process.exit(1);
}

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


// --- Rutas de Autenticación ---

// Ruta para el registro de usuarios
app.post('/api/auth/register', (req, res) => {
  const { nombre, email, password, rol } = req.body; // Cambiado: nombre, email, rol

  if (!nombre || !email || !password) { // Cambiado: nombre, email
    return res.status(400).json({ message: 'Nombre, email y contraseña son requeridos.' });
  }

  // Validar el rol para que coincida con tu ENUM
  const allowedRoles = ['Admin', 'Consultor']; // <-- ¡Importante! Usa tus roles exactos
  const userRole = rol && allowedRoles.includes(rol) ? rol : 'Consultor'; // Por defecto 'Consultor'

  userModel.register(nombre, email, password, userRole, (err, result) => { // Cambiado: nombre, email, rol
    if (err) {
      if (err.message === 'El email ya está registrado.') { // Cambiado: mensaje de error
        return res.status(409).json({ message: err.message });
      }
      console.error('Error al registrar usuario:', err);
      return res.status(500).json({ message: 'Error interno del servidor al registrar el usuario.' });
    }
    res.status(201).json({ message: 'Usuario registrado con éxito', userId: result.insertId });
  });
});

// Ruta para el inicio de sesión de usuarios
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body; // Cambiado: email para login

  if (!email || !password) { // Cambiado: email
    return res.status(400).json({ message: 'Email y contraseña son requeridos.' });
  }

  userModel.login(email, password, (err, user) => { // Cambiado: email
    if (err) {
      console.error('Error al intentar login:', err);
      return res.status(500).json({ message: 'Error interno del servidor al intentar iniciar sesión.' });
    }
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas.' });
    }

    // Si las credenciales son correctas, generar un JWT
    const token = jwt.sign(
      { id_usuario: user.id_usuario, nombre: user.nombre, email: user.email, rol: user.rol }, // Cambiado: nombre, email, rol en el token
      jwtSecret,
      { expiresIn: '1h' }
    );

    res.json({ message: 'Inicio de sesión exitoso', token: token, user: { id_usuario: user.id_usuario, nombre: user.nombre, email: user.email, rol: user.rol } }); // Cambiado: nombre, email, rol en la respuesta
  });
});


// --- Rutas para la Gestión de Programas! ---

// GET /api/programas - Obtener todos los programas
app.get('/api/programas', authenticateToken, (req, res) => {
  programaModel.getAll((err, programas) => {
    if (err) {
      console.error('Error al obtener programas:', err);
      res.status(500).json({ error: 'Error interno del servidor al obtener programas.' });
      return;
    }
    res.json(programas);
  });
});

// GET /api/programas/:id - Obtener un programa por ID
app.get('/api/programas/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  programaModel.getById(id, (err, programa) => {
    if (err) {
      console.error('Error al obtener programa por ID:', err);
      res.status(500).json({ error: 'Error interno del servidor al obtener el programa.' });
      return;
    }
    if (!programa) {
      res.status(404).json({ message: 'Programa no encontrado.' });
      return;
    }
    res.json(programa);
  });
});

// POST /api/programas - Crear un nuevo programa
app.post('/api/programas', authenticateToken, authorizeRoles('Admin'), (req, res) => { // <-- Protegida y con rol
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
app.put('/api/programas/:id', authenticateToken, authorizeRoles('Admin'), (req, res) => { // <-- Protegida y con rol
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
app.delete('/api/programas/:id', authenticateToken, authorizeRoles('Admin'), (req, res) => { // <-- Protegida y con rol
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
app.get('/api/alumnos', authenticateToken, (req, res) => {
    alumnoModel.getAll((err, alumnos) => {
        if (err) {
            console.error('Error al obtener alumnos:', err);
            res.status(500).json({ error: 'Error interno del servidor.' });
            return;
        }
        res.json(alumnos);
    });
});

// GET /api/alumnos/:id - Obtener un alumno por ID
app.get('/api/alumnos/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    alumnoModel.getById(id, (err, alumno) => {
        if (err) {
            console.error('Error al obtener alumno por ID:', err);
            res.status(500).json({ error: 'Error interno del servidor.' });
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
app.post('/api/alumnos', authenticateToken, authorizeRoles('Admin'), (req, res) => {
    const { id_programa, nombre_completo, fecha_nacimiento, genero, direccion, telefono, email, fecha_inscripcion } = req.body;
    if (!id_programa || !nombre_completo || !fecha_nacimiento || !genero) {
        return res.status(400).json({ error: 'Campos requeridos faltantes: id_programa, nombre_completo, fecha_nacimiento, genero.' });
    }
    alumnoModel.create(id_programa, nombre_completo, fecha_nacimiento, genero, direccion, telefono, email, fecha_inscripcion, (err, result) => {
        if (err) {
            console.error('Error al crear alumno:', err);
            res.status(500).json({ error: 'Error interno del servidor al crear el alumno.' });
            return;
        }
        res.status(201).json({ message: 'Alumno creado con éxito', id: result.insertId });
    });
});

// PUT /api/alumnos/:id - Actualizar un alumno
app.put('/api/alumnos/:id', authenticateToken, authorizeRoles('Admin'), (req, res) => {
    const { id } = req.params;
    const { id_programa, nombre_completo, fecha_nacimiento, genero, direccion, telefono, email, fecha_inscripcion } = req.body;
    if (!id_programa || !nombre_completo || !fecha_nacimiento || !genero) {
        return res.status(400).json({ error: 'Campos requeridos faltantes: id_programa, nombre_completo, fecha_nacimiento, genero.' });
    }
    alumnoModel.update(id, id_programa, nombre_completo, fecha_nacimiento, genero, direccion, telefono, email, fecha_inscripcion, (err, result) => {
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
app.delete('/api/alumnos/:id', authenticateToken, authorizeRoles('Admin'), (req, res) => {
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

// --- Rutas de Instrumentos ---
// GET /api/instrumentos - Todos los autenticados pueden ver
app.get('/api/instrumentos', authenticateToken, (req, res) => {
    instrumentoModel.getAll((err, instrumentos) => {
        if (err) {
            console.error('Error al obtener instrumentos:', err);
            res.status(500).json({ error: 'Error interno del servidor.' });
            return;
        }
        res.json(instrumentos);
    });
});

// GET /api/instrumentos/:id - Todos los autenticados pueden ver
app.get('/api/instrumentos/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    instrumentoModel.getById(id, (err, instrumento) => {
        if (err) {
            console.error('Error al obtener instrumento por ID:', err);
            res.status(500).json({ error: 'Error interno del servidor.' });
            return;
        }
        if (!instrumento) {
            res.status(404).json({ message: 'Instrumento no encontrado.' });
            return;
        }
        res.json(instrumento);
    });
});

// POST /api/instrumentos - Solo Admin puede crear
app.post('/api/instrumentos', authenticateToken, authorizeRoles('Admin'), (req, res) => {
    const { nombre, tipo, numero_serie, estado, fecha_adquisicion, descripcion } = req.body;
    if (!nombre || !tipo || !numero_serie || !estado) {
        return res.status(400).json({ error: 'Campos requeridos faltantes: nombre, tipo, numero_serie, estado.' });
    }
    instrumentoModel.create(nombre, tipo, numero_serie, estado, fecha_adquisicion, descripcion, (err, result) => {
        if (err) {
            console.error('Error al crear instrumento:', err);
            res.status(500).json({ error: 'Error interno del servidor al crear el instrumento.' });
            return;
        }
        res.status(201).json({ message: 'Instrumento creado con éxito', id: result.insertId });
    });
});

// PUT /api/instrumentos/:id - Solo Admin puede actualizar (el cambio de estado por lógica de negocio lo hace la API)
app.put('/api/instrumentos/:id', authenticateToken, authorizeRoles('Admin'), (req, res) => {
    const { id } = req.params;
    const { nombre, tipo, numero_serie, estado, fecha_adquisicion, descripcion } = req.body;
    if (!nombre || !tipo || !numero_serie || !estado) {
        return res.status(400).json({ error: 'Campos requeridos faltantes: nombre, tipo, numero_serie, estado.' });
    }
    instrumentoModel.update(id, nombre, tipo, numero_serie, estado, fecha_adquisicion, descripcion, (err, result) => {
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

// DELETE /api/instrumentos/:id - Solo Admin puede eliminar
app.delete('/api/instrumentos/:id', authenticateToken, authorizeRoles('Admin'), (req, res) => {
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

// --- Rutas de Asignación de Instrumentos ---
// GET /api/asignaciones - Todos los autenticados pueden ver
app.get('/api/asignaciones', authenticateToken, (req, res) => {
    asignacionInstrumentoModel.getAll((err, asignaciones) => {
        if (err) {
            console.error('Error al obtener asignaciones:', err);
            res.status(500).json({ error: 'Error interno del servidor.' });
            return;
        }
        res.json(asignaciones);
    });
});

// GET /api/asignaciones/:id - Todos los autenticados pueden ver
app.get('/api/asignaciones/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    asignacionInstrumentoModel.getById(id, (err, asignacion) => {
        if (err) {
            console.error('Error al obtener asignación por ID:', err);
            res.status(500).json({ error: 'Error interno del servidor.' });
            return;
        }
        if (!asignacion) {
            res.status(404).json({ message: 'Asignación no encontrada.' });
            return;
        }
        res.json(asignacion);
    });
});

// POST /api/asignaciones - Solo Admin puede crear (asignar)
app.post('/api/asignaciones', authenticateToken, authorizeRoles('Admin'), (req, res) => {
    const { id_alumno, id_instrumento, fecha_asignacion, fecha_devolucion_prevista } = req.body;

    if (!id_alumno || !id_instrumento || !fecha_asignacion) {
        return res.status(400).json({ error: 'Campos requeridos faltantes: id_alumno, id_instrumento, fecha_asignacion.' });
    }

    asignacionInstrumentoModel.create(id_alumno, id_instrumento, fecha_asignacion, fecha_devolucion_prevista, (err, result) => {
        if (err) {
            console.error('Error al crear asignación:', err);
            // Manejo de errores específicos (ej. instrumento no disponible)
            if (err.message.includes('El instrumento no está disponible')) {
                return res.status(409).json({ error: err.message });
            }
            res.status(500).json({ error: 'Error interno del servidor al crear la asignación.' });
            return;
        }
        res.status(201).json({ message: 'Asignación creada con éxito', id: result.insertId });
    });
});

// PUT /api/asignaciones/:id/devolver - Solo Admin puede devolver (actualizar estado)
app.put('/api/asignaciones/:id/devolver', authenticateToken, authorizeRoles('Admin'), (req, res) => {
    const { id } = req.params;
    const { fecha_devolucion } = req.body;

    if (!fecha_devolucion) {
        return res.status(400).json({ error: 'La fecha de devolución es requerida.' });
    }

    asignacionInstrumentoModel.devolver(id, fecha_devolucion, (err, result) => {
        if (err) {
            console.error('Error al devolver instrumento:', err);
            res.status(500).json({ error: 'Error interno del servidor al procesar la devolución.' });
            return;
        }
        if (result.affectedRows === 0) {
            res.status(404).json({ message: 'Asignación no encontrada o ya devuelta.' });
            return;
        }
        res.json({ message: 'Instrumento devuelto con éxito.' });
    });
});

// DELETE /api/asignaciones/:id - Solo Admin puede eliminar
app.delete('/api/asignaciones/:id', authenticateToken, authorizeRoles('Admin'), (req, res) => {
    const { id } = req.params;
    asignacionInstrumentoModel.delete(id, (err, result) => {
        if (err) {
            console.error('Error al eliminar asignación:', err);
            res.status(500).json({ error: 'Error interno del servidor al eliminar la asignación.' });
            return;
        }
        if (result.affectedRows === 0) {
            res.status(404).json({ message: 'Asignación no encontrada.' });
            return;
        }
        res.json({ message: 'Asignación eliminada con éxito.' });
    });
});


// --- Rutas de Movimientos de Inventario ---
// GET /api/movimientos - Todos los autenticados pueden ver
app.get('/api/movimientos', authenticateToken, (req, res) => {
    movimientoInventarioModel.getAll((err, movimientos) => {
        if (err) {
            console.error('Error al obtener movimientos:', err);
            res.status(500).json({ error: 'Error interno del servidor.' });
            return;
        }
        res.json(movimientos);
    });
});

// GET /api/movimientos/:id - Todos los autenticados pueden ver
app.get('/api/movimientos/:id', authenticateToken, (req, res) => {
    const { id } = req.params;
    movimientoInventarioModel.getById(id, (err, movimiento) => {
        if (err) {
            console.error('Error al obtener movimiento por ID:', err);
            res.status(500).json({ error: 'Error interno del servidor.' });
            return;
        }
        if (!movimiento) {
            res.status(404).json({ message: 'Movimiento no encontrado.' });
            return;
        }
        res.json(movimiento);
    });
});

// POST /api/movimientos - Solo Admin puede crear (registrar movimientos)
app.post('/api/movimientos', authenticateToken, authorizeRoles('Admin'), (req, res) => {
    const { id_instrumento, tipo_movimiento, fecha_movimiento, descripcion, responsable } = req.body;
    if (!id_instrumento || !tipo_movimiento || !fecha_movimiento || !responsable) {
        return res.status(400).json({ error: 'Campos requeridos faltantes: id_instrumento, tipo_movimiento, fecha_movimiento, responsable.' });
    }
    movimientoInventarioModel.create(id_instrumento, tipo_movimiento, fecha_movimiento, descripcion, responsable, (err, result) => {
        if (err) {
            console.error('Error al crear movimiento:', err);
            // Manejo de errores específicos (ej. instrumento no encontrado, estado no válido para movimiento)
            if (err.message.includes('Instrumento no encontrado') || err.message.includes('Estado de instrumento no válido')) {
                return res.status(400).json({ error: err.message });
            }
            res.status(500).json({ error: 'Error interno del servidor al crear el movimiento.' });
            return;
        }
        res.status(201).json({ message: 'Movimiento creado con éxito', id: result.insertId });
    });
});

// PUT /api/movimientos/:id - Solo Admin puede actualizar
app.put('/api/movimientos/:id', authenticateToken, authorizeRoles('Admin'), (req, res) => {
    const { id } = req.params;
    const { id_instrumento, tipo_movimiento, fecha_movimiento, descripcion, responsable } = req.body;
    if (!id_instrumento || !tipo_movimiento || !fecha_movimiento || !responsable) {
        return res.status(400).json({ error: 'Campos requeridos faltantes: id_instrumento, tipo_movimiento, fecha_movimiento, responsable.' });
    }
    movimientoInventarioModel.update(id, id_instrumento, tipo_movimiento, fecha_movimiento, descripcion, responsable, (err, result) => {
        if (err) {
            console.error('Error al actualizar movimiento:', err);
            res.status(500).json({ error: 'Error interno del servidor al actualizar el movimiento.' });
            return;
        }
        if (result.affectedRows === 0) {
            res.status(404).json({ message: 'Movimiento no encontrado para actualizar.' });
            return;
        }
        res.json({ message: 'Movimiento actualizado con éxito.' });
    });
});

// DELETE /api/movimientos/:id - Solo Admin puede eliminar
app.delete('/api/movimientos/:id', authenticateToken, authorizeRoles('Admin'), (req, res) => {
    const { id } = req.params;
    movimientoInventarioModel.delete(id, (err, result) => {
        if (err) {
            console.error('Error al eliminar movimiento:', err);
            res.status(500).json({ error: 'Error interno del servidor al eliminar el movimiento.' });
            return;
        }
        if (result.affectedRows === 0) {
            res.status(404).json({ message: 'Movimiento no encontrado para eliminar.' });
            return;
        }
        res.json({ message: 'Movimiento eliminado con éxito.' });
    });
});

// --- Fin de las Rutas de la API ---

// Inicia el servidor
app.listen(port, () => {
  console.log(`Servidor backend escuchando en http://localhost:${port}`);
});





