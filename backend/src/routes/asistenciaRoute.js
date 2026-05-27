const express = require('express');
const router = express.Router();
const asistenciaController = require('../controllers/asistenciaController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.use(authenticate);

// Obtener las asistencias registradas hoy
router.get('/hoy', authorize(['ADMIN', 'CAJERO']), asistenciaController.listarHoy);

// Registrar una nueva asistencia
router.post('/', authorize(['ADMIN', 'CAJERO']), asistenciaController.registrarAsistencia);

// Aprobar una asistencia (requiere credenciales en el body)
router.put('/:id/aprobar', authorize(['ADMIN', 'CAJERO']), asistenciaController.aprobarAsistencia);

// Eliminar una asistencia (para devolver al empleado a la lista de turnos)
router.delete('/:id', authorize(['ADMIN', 'CAJERO']), asistenciaController.eliminarAsistencia);

module.exports = router;