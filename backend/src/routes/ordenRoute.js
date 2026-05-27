const express = require('express');
const router = express.Router();
const ordenController = require('../controllers/ordenController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.use(authenticate);

router.get('/', ordenController.listar);
router.get('/:id', ordenController.obtenerPorId);
router.post('/', ordenController.crear); 

router.post('/:id/finalizar', authorize(['ADMIN', 'CAJERO', 'MESERO']), ordenController.finalizar);




router.delete('/:id', authorize(['ADMIN', 'CAJERO', 'MESERO']), ordenController.eliminar);

router.post('/:id/descuento', authorize(['ADMIN', 'CAJERO', 'MESERO']), ordenController.aplicarDescuento);

router.get('/:id/descuentos', authorize(['ADMIN', 'CAJERO', 'MESERO']), ordenController.listarDescuentos);
router.delete('/:ordenId/descuento/:descuentoId', authorize(['ADMIN', 'CAJERO', 'MESERO']), ordenController.quitarDescuento);



router.put('/:id', authorize(['ADMIN', 'CAJERO', 'MESERO']), ordenController.actualizarNotas);


module.exports = router;