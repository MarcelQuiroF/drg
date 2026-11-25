const express = require('express');
const router = express.Router();
const multer = require('multer');
const importacionController = require('../controllers/importacionController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requierePermiso } = require('../middlewares/permisoMiddleware');

// Configurar multer para almacenar en memoria el buffer del archivo
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);

router.post(
    '/productos',
    requierePermiso('importacion.usar'),
    upload.single('archivoExcel'),
    importacionController.importarProductos
);
router.post(
    '/juegos',
    requierePermiso('importacion.usar'),
    upload.single('archivoExcel'),
    importacionController.importarJuegos
);
router.get(
    '/plantillas/productos',
    requierePermiso('importacion.usar'),
    importacionController.descargarPlantillaProductos
);
router.get('/plantillas/juegos', requierePermiso('importacion.usar'), importacionController.descargarPlantillaJuegos);

module.exports = router;
