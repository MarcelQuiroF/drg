const express = require('express');
const router = express.Router();
const comandaController = require('../controllers/comandaController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.get('/', comandaController.listar);

router.post('/:id/avanzar', comandaController.avanzar);

module.exports = router;