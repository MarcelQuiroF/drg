const express = require('express');
const router = express.Router();
const contenedorJuegoController = require('../controllers/contenedorJuegoController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requierePermiso } = require('../middlewares/permisoMiddleware');

router.use(authenticate);

router.get('/', requierePermiso('ordenes.ver'), contenedorJuegoController.listar);
router.post('/', requierePermiso('ordenes.tomar'), contenedorJuegoController.agregar);
router.patch('/:id/terminar', requierePermiso('ordenes.tomar'), contenedorJuegoController.finalizarJuego);
router.delete('/:id', requierePermiso('ordenes.tomar'), contenedorJuegoController.eliminar);

module.exports = router;
