const express = require('express');
const router = express.Router();
const juegoController = require('../controllers/juegoController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware'); 


router.use(authenticate);

router.get('/', juegoController.listar);


router.post('/', authorize(['ADMIN']), juegoController.crear);
router.put('/:id', authorize(['ADMIN']), juegoController.actualizar);
router.delete('/:id', authorize(['ADMIN']), juegoController.eliminar);

module.exports = router;