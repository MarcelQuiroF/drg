const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requierePermiso } = require('../middlewares/permisoMiddleware');

router.use(authenticate);

router.get('/', requierePermiso('catalogo.ver'), productoController.listar);
router.get('/:id', requierePermiso('catalogo.ver'), productoController.obtenerPorId);
router.post('/', requierePermiso('catalogo.gestionar'), productoController.crear);
router.put('/:id', requierePermiso('catalogo.gestionar'), productoController.actualizar);
router.delete('/:id', requierePermiso('catalogo.gestionar'), productoController.eliminar);

module.exports = router;
