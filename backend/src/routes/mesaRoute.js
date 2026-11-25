const express = require('express');
const router = express.Router();
const mesaController = require('../controllers/mesaController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requierePermiso } = require('../middlewares/permisoMiddleware');

router.use(authenticate);

router.get('/', requierePermiso('espacio.ver'), mesaController.listar);

router.post('/', requierePermiso('espacio.gestionar'), mesaController.crear);
router.put('/:id', requierePermiso('espacio.gestionar'), mesaController.actualizar);
router.delete('/:id', requierePermiso('espacio.gestionar'), mesaController.eliminar);

module.exports = router;
