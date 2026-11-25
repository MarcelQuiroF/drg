const express = require('express');
const router = express.Router();
const configController = require('../controllers/configuracionController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requierePermiso } = require('../middlewares/permisoMiddleware');

router.use(authenticate);

router.get('/descuentos-atraso', requierePermiso('asistencia.registrar'), configController.listarDescuentosAtraso);

router.get('/', configController.listar);
router.put('/', requierePermiso('configuracion.editar'), configController.actualizarMasivo);

module.exports = router;
