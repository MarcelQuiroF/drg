const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requierePermiso } = require('../middlewares/permisoMiddleware');

router.get('/', categoriaController.listar);

router.use(authenticate);

router.post('/', requierePermiso('catalogo.gestionar'), categoriaController.crear);
router.delete('/:id', requierePermiso('catalogo.gestionar'), categoriaController.eliminar);

module.exports = router;
