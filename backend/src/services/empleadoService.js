const { Empleado, Horario, sequelize } = require('../models');

// Roles del sistema (ADR-008). Cocina y cafetería no tienen usuario: reciben la comanda impresa.
const ROLES = ['ADMIN', 'CAJERO', 'MESERO'];

function errorConEstado(status, mensaje) {
    const error = new Error(mensaje);
    error.status = status;
    return error;
}

function validarRol(rol) {
    if (!ROLES.includes(rol)) {
        throw errorConEstado(400, `Rol inválido: "${rol ?? ''}". Los roles del sistema son ${ROLES.join(', ')}.`);
    }
}

function sinContrasenia(empleado) {
    const datos = empleado.toJSON();
    delete datos.contrasenia;
    delete datos.deletedAt;
    return datos;
}

async function listar() {
    return await Empleado.findAll({
        attributes: { exclude: ['contrasenia'] },
        include: [{ model: Horario }],
        order: [['nombre', 'ASC']]
    });
}

async function crearEmpleado(datos) {
    const { nombre, ci, telefono, correo, contrasenia, rol, direccion } = datos;

    if (!nombre || !ci || !contrasenia || !rol) {
        throw errorConEstado(400, 'Faltan datos obligatorios (nombre, ci, contraseña, rol).');
    }
    validarRol(rol);

    const nuevoEmpleado = await Empleado.create({
        nombre,
        ci,
        telefono,
        correo,
        contrasenia,
        rol,
        direccion,
        activo: true
    });

    return sinContrasenia(nuevoEmpleado);
}

// El sistema no puede quedarse sin un ADMIN activo: es el único que crea empleados y cambia
// contraseñas (#109). Se bloquean las filas de todos los ADMIN activos (SELECT … FOR UPDATE),
// siempre en el mismo orden (por id) para no provocar un deadlock: si dos administradores se
// quitan el rol al mismo tiempo, el segundo espera al primero y ve el resultado ya guardado.
async function verificarQueQuedaUnAdmin(empleado, cambios, t) {
    const dejaDeSerAdmin = cambios.rol !== undefined && cambios.rol !== 'ADMIN';
    const quedaInactivo = cambios.activo === false;
    if (empleado.rol !== 'ADMIN' || !empleado.activo || (!dejaDeSerAdmin && !quedaInactivo)) return;

    const adminsActivos = await Empleado.findAll({
        where: { rol: 'ADMIN', activo: true },
        attributes: ['id'],
        order: [['id', 'ASC']],
        lock: t.LOCK.UPDATE,
        transaction: t
    });
    const sigueSiendoAdmin = adminsActivos.some((admin) => admin.id === empleado.id);
    const hayOtro = adminsActivos.some((admin) => admin.id !== empleado.id);
    if (sigueSiendoAdmin && !hayOtro) {
        throw errorConEstado(
            409,
            'No se puede quitar el rol ADMIN ni desactivar al último administrador activo. Primero hay que dar el rol ADMIN a otro empleado.'
        );
    }
}

async function actualizarEmpleado(id, datos) {
    const { nombre, ci, telefono, correo, contrasenia, rol, activo, horarios } = datos;

    if (rol !== undefined) validarRol(rol);
    if (activo !== undefined && typeof activo !== 'boolean') {
        throw errorConEstado(400, '"activo" tiene que ser true o false.');
    }

    return await sequelize.transaction(async (t) => {
        const empleado = await Empleado.findByPk(id, { transaction: t });
        if (!empleado) return null;

        await verificarQueQuedaUnAdmin(empleado, { rol, activo }, t);

        // Solo se cambia lo que viene en el cuerpo
        if (nombre !== undefined) empleado.nombre = nombre;
        if (ci !== undefined) empleado.ci = ci;
        if (telefono !== undefined) empleado.telefono = telefono;
        if (correo !== undefined) empleado.correo = correo || null;
        if (rol !== undefined) empleado.rol = rol;
        if (activo !== undefined) empleado.activo = activo;

        // Una contraseña vacía no cambia la actual
        if (contrasenia && contrasenia.trim() !== '') {
            empleado.contrasenia = contrasenia;
        }

        await empleado.save({ transaction: t });

        // Agenda de horarios, si se envió (el borrado de los anteriores se revisa en #61)
        if (horarios && Array.isArray(horarios)) {
            await Horario.destroy({ where: { empleado_id: id }, transaction: t });

            if (horarios.length > 0) {
                const nuevosHorarios = horarios.map((h) => ({
                    dia: h.dia,
                    hora_entrada: h.hora_entrada,
                    empleado_id: id
                }));
                await Horario.bulkCreate(nuevosHorarios, { transaction: t });
            }
        }

        return empleado;
    });
}

module.exports = {
    ROLES,
    listar,
    crearEmpleado,
    actualizarEmpleado
};
