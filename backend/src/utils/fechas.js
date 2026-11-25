'use strict';

// Fechas y horas del negocio (America/La_Paz, #27). config/env.js fija process.env.TZ con la
// misma zona al arrancar, así que los métodos "locales" de Date (getDate, setHours, …) ya
// trabajan en la hora de Bolivia aunque el servidor o el CI estén en UTC.
//
// No usar toISOString() para sacar "el día": da la fecha en UTC, y en Bolivia desde las 20:00
// eso ya es mañana.
const { ZONA_HORARIA } = require('../config/env');

const dosDigitos = (n) => String(n).padStart(2, '0');

// 'YYYY-MM-DD' del día local de esa fecha (por defecto, hoy)
function fechaLocal(fecha = new Date()) {
    const d = new Date(fecha);
    return `${d.getFullYear()}-${dosDigitos(d.getMonth() + 1)}-${dosDigitos(d.getDate())}`;
}

function validarDia(dia) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dia))) {
        const error = new Error(`Fecha inválida: "${dia}". Use el formato AAAA-MM-DD.`);
        error.status = 400;
        throw error;
    }
}

// Primer y último instante de un día local ('YYYY-MM-DD'). Sin "Z" al final, JavaScript lee la
// fecha en la zona del proceso (la del negocio).
function inicioDelDia(dia) {
    validarDia(dia);
    return new Date(`${dia}T00:00:00.000`);
}

function finDelDia(dia) {
    validarDia(dia);
    return new Date(`${dia}T23:59:59.999`);
}

module.exports = { ZONA_HORARIA, fechaLocal, inicioDelDia, finDelDia };
