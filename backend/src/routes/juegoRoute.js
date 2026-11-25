const express = require('express');
const router = express.Router();
const juegoController = require('../controllers/juegoController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requierePermiso } = require('../middlewares/permisoMiddleware');

router.get('/', juegoController.listar);

router.get('/:id', juegoController.obtenerPorId);
router.use(authenticate);

router.post('/', requierePermiso('catalogo.gestionar'), juegoController.crear);
router.put('/:id', requierePermiso('catalogo.gestionar'), juegoController.actualizar);
router.delete('/:id', requierePermiso('catalogo.gestionar'), juegoController.eliminar);

module.exports = router;
