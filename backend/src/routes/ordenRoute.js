const express = require('express');
const router = express.Router();
const ordenController = require('../controllers/ordenController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.use(authenticate);

router.get('/', ordenController.listar);
router.post('/', ordenController.crear); 


router.patch('/:id/finalizar', authorize(['ADMIN', 'CAJERO']), ordenController.finalizar);

router.delete('/:id', authorize(['ADMIN']), ordenController.eliminar);

module.exports = router;