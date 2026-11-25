const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requierePermiso } = require('../middlewares/permisoMiddleware');

router.use(authenticate);

router.get('/dashboard', requierePermiso('reportes.ver'), reportesController.obtenerDatosDashboard);

module.exports = router;
