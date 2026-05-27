const express = require('express');
const router = express.Router();
const empleadoController = require('../controllers/empleadoController'); 
const { authenticate } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware'); 

router.use(authenticate);


router.get('/perfil', empleadoController.obtenerPerfil); 
router.get('/', authorize(['ADMIN', 'CAJERO']), empleadoController.listar);

router.post('/', authorize(['ADMIN']), empleadoController.crearEmpleado);
router.put('/:id', authorize(['ADMIN']), empleadoController.actualizarEmpleado);

module.exports = router;