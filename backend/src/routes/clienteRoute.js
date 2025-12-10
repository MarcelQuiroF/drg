const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.use(authenticate);

router.get('/', clienteController.listar);
router.post('/', clienteController.crear);
router.put('/:id', clienteController.actualizar);

router.delete('/:id', authorize(['ADMIN']), clienteController.eliminar);

module.exports = router;