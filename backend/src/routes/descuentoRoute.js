const express = require('express');
const router = express.Router();
const descuentoController = require('../controllers/descuentoController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requierePermiso } = require('../middlewares/permisoMiddleware');

// Control de descuentos del administrador (#39, RF-49). Aplicar y quitar descuentos sigue en
// /ordenes/:id/descuento (ordenes.descontar, cajero y mesero).
router.use(authenticate);

router.get('/', requierePermiso('descuentos.controlar'), descuentoController.listar);

module.exports = router;
