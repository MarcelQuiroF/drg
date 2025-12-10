const clienteService = require('../services/clienteService');
const httpCodes = require('../utils/httpCodes');

async function crear(req, res, next) {
    try {
        const { nombre, ci } = req.body;
        if (!nombre) return res.status(httpCodes.BAD_REQUEST.code).json({ message: "Nombre es obligatorio." });

        const nuevo = await clienteService.crearCliente(req.body);
        res.status(httpCodes.CREATED.code).json(nuevo);
    } catch (error) {
        next(error);
    }
}

async function listar(req, res, next) {
    try {
        // ?busqueda=juan
        const { busqueda } = req.query;
        const clientes = await clienteService.listarClientes(busqueda);
        res.status(httpCodes.OK.code).json(clientes);
    } catch (error) {
        next(error);
    }
}

async function actualizar(req, res, next) {
    try {
        const actualizado = await clienteService.actualizarCliente(req.params.id, req.body);
        if (!actualizado) return res.status(httpCodes.NOT_FOUND.code).json({ message: "Cliente no encontrado." });
        res.status(httpCodes.OK.code).json(actualizado);
    } catch (error) {
        next(error);
    }
}

async function eliminar(req, res, next) {
    try {
        const exito = await clienteService.eliminarCliente(req.params.id);
        if (!exito) return res.status(httpCodes.NOT_FOUND.code).json({ message: "Cliente no encontrado." });
        res.status(httpCodes.OK.code).json({ message: "Cliente eliminado." });
    } catch (error) {
        next(error);
    }
}

module.exports = { crear, listar, actualizar, eliminar };