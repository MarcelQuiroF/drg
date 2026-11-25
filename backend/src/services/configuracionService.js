'use strict';

const { Configuracion, sequelize } = require('../models');

function errorDeSolicitud(mensaje) {
    const error = new Error(mensaje);
    error.status = 400;
    return error;
}

// Los valores son minutos (tolerancia, ventanas de reserva): enteros desde 0. Se acepta el número
// como texto porque los <input> del frontend lo mandan así ("30").
function valorValido(valor) {
    if (typeof valor === 'boolean' || valor === null || valor === '' || valor === undefined) return null;
    const numero = Number(valor);
    return Number.isInteger(numero) && numero >= 0 ? numero : null;
}

// Cambia varias claves a la vez (#25). Se valida todo antes de guardar y se guarda en una
// transacción: o cambian todas o ninguna. Solo se pueden cambiar claves que ya existen (las carga
// el seed); antes, una clave mal escrita creaba una fila nueva que nadie leía.
async function actualizarVarias(configuraciones) {
    if (!Array.isArray(configuraciones) || configuraciones.length === 0) {
        throw errorDeSolicitud('"configuraciones" tiene que ser una lista con al menos un valor.');
    }

    return await sequelize.transaction(async (t) => {
        const existentes = new Set((await Configuracion.findAll({ transaction: t })).map((c) => c.clave));

        const cambios = configuraciones.map((item) => {
            const clave = item?.clave;
            if (typeof clave !== 'string' || !existentes.has(clave)) {
                throw errorDeSolicitud(`La clave de configuración "${clave ?? ''}" no existe.`);
            }
            const valor = valorValido(item.valor);
            if (valor === null) {
                throw errorDeSolicitud(`El valor de "${clave}" tiene que ser un número entero mayor o igual a 0.`);
            }
            return { clave, valor };
        });

        for (const { clave, valor } of cambios) {
            await Configuracion.update({ valor }, { where: { clave }, transaction: t });
        }
        return cambios;
    });
}

module.exports = { actualizarVarias };
