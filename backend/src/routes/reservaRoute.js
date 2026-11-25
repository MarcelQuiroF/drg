const express = require('express');
const router = express.Router();
const reservaController = require('../controllers/reservaController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requierePermiso } = require('../middlewares/permisoMiddleware');

router.use(authenticate);

router.get('/', requierePermiso('reservas.gestionar'), reservaController.listar);
router.post('/', requierePermiso('reservas.gestionar'), reservaController.crear);
router.delete('/:id', requierePermiso('reservas.gestionar'), reservaController.eliminar);
router.get('/:id', requierePermiso('reservas.gestionar'), reservaController.obtenerPorId);
router.put('/:id', requierePermiso('reservas.gestionar'), reservaController.actualizar);

module.exports = router;
