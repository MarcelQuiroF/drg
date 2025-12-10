const express = require('express');
const router = express.Router();
const asistenciaController = require('../controllers/asistenciaController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

router.post('/marcar', asistenciaController.marcarLlegada);

router.use(authenticate); 

router.get('/horario-hoy', asistenciaController.verHorarioHoy);
router.get('/', authorize(['ADMIN']), asistenciaController.listar);
router.patch('/:id/aprobar', authorize(['ADMIN']), asistenciaController.aprobar);

module.exports = router;