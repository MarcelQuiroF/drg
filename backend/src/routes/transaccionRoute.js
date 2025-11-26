const express = require('express');
const router = express.Router();
const transaccionController = require('../controllers/transaccionController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.get('/', transaccionController.listar);

router.post('/', transaccionController.crear);

router.delete('/:id', transaccionController.anular);

module.exports = router;