const express = require('express');
const router = express.Router();
const transaccionController = require('../controllers/transaccionController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requierePermiso } = require('../middlewares/permisoMiddleware');

router.use(authenticate);

router.get('/', requierePermiso('ordenes.cobrar'), transaccionController.listar);

router.post('/', requierePermiso('ordenes.cobrar'), transaccionController.crear);

router.delete('/:id', requierePermiso('pagos.anular'), transaccionController.anular);

module.exports = router;
