const express = require('express');
const router = express.Router();
const ordenController = require('../controllers/ordenController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.use(authenticate);

router.get('/', ordenController.listar);
router.get('/:id', ordenController.obtenerPorId);
router.post('/', ordenController.crear); 

router.patch('/:id/finalizar', authorize(['ADMIN', 'CAJERO']), ordenController.finalizar);



router.delete('/:id', authorize(['ADMIN']), ordenController.eliminar);

router.post('/:id/descuento', authorize(['ADMIN', 'CAJERO']), ordenController.aplicarDescuento);

router.get('/:id/descuentos', authorize(['ADMIN', 'CAJERO', 'MESERO']), ordenController.listarDescuentos);
router.delete('/:ordenId/descuento/:descuentoId', authorize(['ADMIN', 'CAJERO']), ordenController.quitarDescuento);

module.exports = router;