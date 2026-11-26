const express = require('express');
const router = express.Router();
const jornadaController = require('../controllers/jornadaController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requierePermiso } = require('../middlewares/permisoMiddleware');

// Apertura y cierre del día (#34). Abrir y cerrar piden además el CI y la contraseña de quien lo hace.
router.use(authenticate);

router.get('/actual', requierePermiso('dia.abrir_cerrar'), jornadaController.actual);
router.post('/', requierePermiso('dia.abrir_cerrar'), jornadaController.abrir);
router.post('/actual/cerrar', requierePermiso('dia.abrir_cerrar'), jornadaController.cerrar);

module.exports = router;
