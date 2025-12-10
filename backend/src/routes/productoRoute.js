const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.use(authenticate);

router.get('/', productoController.listar);
router.get('/:id', productoController.obtenerPorId);
router.post('/', authorize(['ADMIN']), productoController.crear);
router.put('/:id', authorize(['ADMIN']), productoController.actualizar); 
router.delete('/:id', authorize(['ADMIN']), productoController.eliminar);

module.exports = router;