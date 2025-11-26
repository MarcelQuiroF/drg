const express = require('express');
const router = express.Router();
const pisoController = require('../controllers/pisoController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.use(authenticate);


router.get('/', pisoController.listar);

router.post('/', authorize(['ADMIN']), pisoController.crear);
router.put('/:id', authorize(['ADMIN']), pisoController.actualizar);
router.delete('/:id', authorize(['ADMIN']), pisoController.eliminar);

module.exports = router;