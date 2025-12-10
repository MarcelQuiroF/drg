const express = require('express');
const router = express.Router();
const reservaController = require('../controllers/reservaController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.get('/', reservaController.listar);
router.post('/', reservaController.crear);
router.delete('/:id', reservaController.eliminar);
router.get('/:id', reservaController.obtenerPorId); 
router.put('/:id', reservaController.actualizar); 

module.exports = router;