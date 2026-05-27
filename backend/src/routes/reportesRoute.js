const express = require('express');
const router = express.Router();
const reportesController = require('../controllers/reportesController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.use(authenticate);

router.get('/dashboard', authorize(['ADMIN']), reportesController.obtenerDatosDashboard);

module.exports = router;