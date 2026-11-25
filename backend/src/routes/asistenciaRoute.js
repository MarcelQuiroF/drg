const express = require('express');
const router = express.Router();
const asistenciaController = require('../controllers/asistenciaController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requierePermiso } = require('../middlewares/permisoMiddleware');

router.use(authenticate);

// Obtener las asistencias registradas hoy
router.get('/hoy', requierePermiso('asistencia.registrar'), asistenciaController.listarHoy);

// Registrar una nueva asistencia
router.post('/', requierePermiso('asistencia.registrar'), asistenciaController.registrarAsistencia);

// Aprobar una asistencia (requiere credenciales en el body)
router.put('/:id/aprobar', requierePermiso('asistencia.aprobar'), asistenciaController.aprobarAsistencia);

// Eliminar una asistencia (para devolver al empleado a la lista de turnos)
router.delete('/:id', requierePermiso('asistencia.aprobar'), asistenciaController.eliminarAsistencia);

module.exports = router;
