const express = require('express');
const router = express.Router();
const empleadoController = require('../controllers/empleadoController'); 
const { authenticate } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware'); 

router.use(authenticate);


router.get('/perfil', empleadoController.obtenerPerfil); 
router.get('/', authenticate, authorize(['ADMIN']), empleadoController.listar);

router.post('/', authorize(['ADMIN']), empleadoController.crearEmpleado);

module.exports = router;