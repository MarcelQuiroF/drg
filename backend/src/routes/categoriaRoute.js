const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');



router.get('/', categoriaController.listar);

router.use(authenticate);

router.post('/', authorize(['ADMIN']), categoriaController.crear);
router.delete('/:id', authorize(['ADMIN']), categoriaController.eliminar);

module.exports = router;