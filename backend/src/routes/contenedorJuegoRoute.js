const express = require('express');
const router = express.Router();
const contenedorJuegoController = require('../controllers/contenedorJuegoController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.get('/', contenedorJuegoController.listar);
router.post('/', contenedorJuegoController.agregar);
router.patch('/:id/terminar', contenedorJuegoController.finalizarJuego);
router.delete('/:id', contenedorJuegoController.eliminar);

module.exports = router;