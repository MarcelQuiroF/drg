const express = require('express');
const router = express.Router();
const asistenciaController = require('../controllers/asistenciaController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requierePermiso } = require('../middlewares/permisoMiddleware');
const { identificarEmpleado } = require('../middlewares/identificarEmpleado');

router.use(authenticate);

// Obtener las asistencias registradas hoy
router.get('/hoy', requierePermiso('asistencia.registrar'), asistenciaController.listarHoy);

// Registrar una nueva asistencia: con el CI y la contraseña del propio empleado (RF-43, #30)
router.post(
    '/',
    requierePermiso('asistencia.registrar'),
    identificarEmpleado,
    asistenciaController.registrarAsistencia
);

// Aprobar una asistencia (requiere credenciales en el body)
router.put('/:id/aprobar', requierePermiso('asistencia.aprobar'), asistenciaController.aprobarAsistencia);

// Anular una asistencia: queda marcada, no se borra (RN-09). Si estaba aprobada, pide la firma (#30)
router.delete('/:id', requierePermiso('asistencia.aprobar'), asistenciaController.eliminarAsistencia);

module.exports = router;
