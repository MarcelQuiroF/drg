const express = require('express');
const router = express.Router();
const empleadoController = require('../controllers/empleadoController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requierePermiso } = require('../middlewares/permisoMiddleware');

router.use(authenticate);

router.get('/perfil', empleadoController.obtenerPerfil);
router.get('/', requierePermiso('asistencia.registrar'), empleadoController.listar);

router.post('/', requierePermiso('empleados.gestionar'), empleadoController.crearEmpleado);
router.put('/:id', requierePermiso('empleados.gestionar'), empleadoController.actualizarEmpleado);

module.exports = router;
