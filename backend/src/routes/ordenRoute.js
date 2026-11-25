const express = require('express');
const router = express.Router();
const ordenController = require('../controllers/ordenController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requierePermiso } = require('../middlewares/permisoMiddleware');

router.use(authenticate);

router.get('/', requierePermiso('ordenes.ver'), ordenController.listar);
router.get('/:id', requierePermiso('ordenes.ver'), ordenController.obtenerPorId);
router.post('/', requierePermiso('ordenes.tomar'), ordenController.crear);

router.post('/:id/finalizar', requierePermiso('ordenes.cobrar'), ordenController.finalizar);

router.delete('/:id', requierePermiso('ordenes.eliminar'), ordenController.eliminar);

router.post('/:id/descuento', requierePermiso('ordenes.descontar'), ordenController.aplicarDescuento);

router.get('/:id/descuentos', requierePermiso('ordenes.ver'), ordenController.listarDescuentos);
router.delete(
    '/:ordenId/descuento/:descuentoId',
    requierePermiso('ordenes.descontar'),
    ordenController.quitarDescuento
);

router.put('/:id', requierePermiso('ordenes.tomar'), ordenController.actualizarNotas);

module.exports = router;
