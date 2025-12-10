const productoService = require('../services/productoService');
const httpCodes = require('../utils/httpCodes');

async function crear(req, res, next) {
    try {
        if (req.empleado.rol !== 'ADMIN') {
            return res.status(httpCodes.FORBIDDEN.code).json({ message: "Requiere permisos de administrador." });
        }

        const { categorias, ...datosProducto } = req.body; 

        if (!datosProducto.nombre || !datosProducto.precio) {
            return res.status(httpCodes.BAD_REQUEST.code).json({ message: "Nombre y precio son obligatorios." });
        }

        const nuevo = await productoService.crearProducto(datosProducto, categorias);
        res.status(httpCodes.CREATED.code).json(nuevo);
    } catch (error) {
        next(error);
    }
}
async function obtenerPorId(req, res, next) {
    try {
        const producto = await productoService.obtenerProductoPorId(req.params.id);
        if (!producto) return res.status(httpCodes.NOT_FOUND.code).json({ message: "Producto no encontrado" });
        res.status(httpCodes.OK.code).json(producto);
    } catch (error) { next(error); }
}



async function listar(req, res, next) {
    try {

        const { categoria_id } = req.query;

        const productos = await productoService.listarProductos(categoria_id);
        
        res.status(httpCodes.OK.code).json(productos);
    } catch (error) {
        next(error);
    }
}

async function actualizar(req, res, next) {
    try {
        if (req.empleado.rol !== 'ADMIN') {
            return res.status(httpCodes.FORBIDDEN.code).json({ message: "Acceso denegado." });
        }
        
        const { categorias, ...datos } = req.body;
        const actualizado = await productoService.actualizarProducto(req.params.id, datos, categorias);
        
        if (!actualizado) {
            return res.status(httpCodes.NOT_FOUND.code).json({ message: "Producto no encontrado." });
        }
        res.status(httpCodes.OK.code).json(actualizado);
    } catch (error) {
        next(error);
    }
}

async function eliminar(req, res, next) {
    try {
        if (req.empleado.rol !== 'ADMIN') {
            return res.status(httpCodes.FORBIDDEN.code).json({ message: "Acceso denegado." });
        }
        const exito = await productoService.eliminarProducto(req.params.id);
        if (!exito) return res.status(httpCodes.NOT_FOUND.code).json({ message: "Producto no encontrado." });
        
        res.status(httpCodes.OK.code).json({ message: "Producto eliminado." });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    crear,
    listar,
    actualizar,
    eliminar,
    obtenerPorId
};