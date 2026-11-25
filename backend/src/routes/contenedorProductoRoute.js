const express = require('express');
const router = express.Router();
const contenedorProductoController = require('../controllers/contenedorProductoController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requierePermiso } = require('../middlewares/permisoMiddleware');

router.use(authenticate);

router.get('/', requierePermiso('ordenes.ver'), contenedorProductoController.listar);

router.post('/', requierePermiso('ordenes.tomar'), contenedorProductoController.agregar);

router.put('/:id', requierePermiso('ordenes.tomar'), contenedorProductoController.actualizar);

router.delete('/:id', requierePermiso('ordenes.tomar'), contenedorProductoController.eliminar);

module.exports = router;
