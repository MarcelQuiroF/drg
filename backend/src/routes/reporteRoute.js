const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.use(authenticate);


router.get('/cierre-dia', authorize(['ADMIN', 'CAJERO']), reporteController.cierreDia);

module.exports = router;