const express = require('express');
const router = express.Router();
const configController = require('../controllers/configuracionController');
const { authenticate } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.get('/', configController.listar);
router.put('/', configController.actualizarMasivo);

module.exports = router;