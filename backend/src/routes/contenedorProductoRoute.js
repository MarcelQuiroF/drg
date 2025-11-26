const express = require('express');
const router = express.Router();
const contenedorProductoController = require('../controllers/contenedorProductoController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.get('/', contenedorProductoController.listar);

router.post('/', contenedorProductoController.agregar);

router.put('/:id', contenedorProductoController.actualizar);

router.delete('/:id', contenedorProductoController.eliminar);

module.exports = router;