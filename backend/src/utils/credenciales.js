'use strict';

// Comprueba un CI y una contraseña de un empleado ACTIVO, sin abrir una sesión. Lo usan la firma
// del supervisor (aprobar y anular asistencias) y la llegada del propio empleado (RF-43, #30).
// Devuelve el empleado o null: quien llama decide el mensaje y el código (403, ver #26).
const bcrypt = require('bcrypt');
const { Empleado } = require('../models');

async function verificarCredenciales(ci, contrasenia) {
    if (!ci || !contrasenia) return null;
    const empleado = await Empleado.findOne({ where: { ci: String(ci).trim(), activo: true } });
    if (!empleado) return null;
    const correcta = await bcrypt.compare(String(contrasenia), empleado.contrasenia);
    return correcta ? empleado : null;
}

module.exports = { verificarCredenciales };
