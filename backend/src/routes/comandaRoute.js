const express = require('express');
const router = express.Router();
const comandaController = require('../controllers/comandaController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requierePermiso } = require('../middlewares/permisoMiddleware');

router.use(authenticate);

router.get('/', requierePermiso('comandas.gestionar'), comandaController.listar);

router.post('/:id/avanzar', requierePermiso('comandas.gestionar'), comandaController.avanzar);

module.exports = router;
