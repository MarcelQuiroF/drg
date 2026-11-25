const express = require('express');
const router = express.Router();
const pisoController = require('../controllers/pisoController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requierePermiso } = require('../middlewares/permisoMiddleware');

router.use(authenticate);

router.get('/', requierePermiso('espacio.ver'), pisoController.listar);

router.post('/', requierePermiso('espacio.gestionar'), pisoController.crear);
router.put('/:id', requierePermiso('espacio.gestionar'), pisoController.actualizar);
router.delete('/:id', requierePermiso('espacio.gestionar'), pisoController.eliminar);

module.exports = router;
