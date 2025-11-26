const categoriaService = require('../services/categoriaService');
const httpCodes = require('../utils/httpCodes');

async function crear(req, res, next) {
    try {

        const { nombre } = req.body;
        if (!nombre) {
            return res.status(httpCodes.BAD_REQUEST.code).json({ message: "El nombre es obligatorio." });
        }

        const nuevaCategoria = await categoriaService.crearCategoria({ nombre });
        res.status(httpCodes.CREATED.code).json(nuevaCategoria);
    } catch (error) {
        next(error);
    }
}

async function listar(req, res, next) {
    try {
        const categorias = await categoriaService.listarCategorias();
        res.status(httpCodes.OK.code).json(categorias);
    } catch (error) {
        next(error);
    }
}

async function eliminar(req, res, next) {
    try {
        
        const resultado = await categoriaService.eliminarCategoria(req.params.id);
        if (!resultado) {
            return res.status(httpCodes.NOT_FOUND.code).json({ message: "Categoría no encontrada." });
        }
        res.status(httpCodes.OK.code).json({ message: "Categoría eliminada." });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    crear,
    listar,
    eliminar
};