const express = require('express');
const router = express.Router();
const mesaController = require('../controllers/mesaController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.use(authenticate);

router.get('/', mesaController.listar);

router.post('/', authorize(['ADMIN']), mesaController.crear);
router.put('/:id', authorize(['ADMIN']), mesaController.actualizar);
router.delete('/:id', authorize(['ADMIN']), mesaController.eliminar);

module.exports = router;