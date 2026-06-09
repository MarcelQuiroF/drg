const express = require('express');
const router = express.Router();
const multer = require('multer');
const importacionController = require('../controllers/importacionController');
const { authenticate } = require('../middlewares/authMiddleware');
const { authorize } = require('../middlewares/roleMiddleware');

// Configurar multer para almacenar en memoria el buffer del archivo
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

router.post('/productos', authorize(['ADMIN']), upload.single('archivoExcel'), importacionController.importarProductos);
router.post('/juegos', authorize(['ADMIN']), upload.single('archivoExcel'), importacionController.importarJuegos);
router.get('/plantillas/productos', importacionController.descargarPlantillaProductos);
router.get('/plantillas/juegos', importacionController.descargarPlantillaJuegos);

module.exports = router;