const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requierePermiso } = require('../middlewares/permisoMiddleware');

router.use(authenticate);

router.get('/', requierePermiso('clientes.gestionar'), clienteController.listar);
router.post('/', requierePermiso('clientes.gestionar'), clienteController.crear);
router.put('/:id', requierePermiso('clientes.gestionar'), clienteController.actualizar);

router.delete('/:id', requierePermiso('clientes.eliminar'), clienteController.eliminar);

module.exports = router;
