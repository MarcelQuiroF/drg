'use strict';

// Atraso y descuento de una llegada (RN-01, #29). Lo calcula SIEMPRE el servidor: el navegador
// no manda ni el atraso ni el descuento, y si los manda se ignoran (A6).
//
// Funciones puras (sin base de datos ni reloj) para poder probar los bordes exactos de la tabla.
// Las fechas se leen en la hora del negocio: config/env.js fija TZ=America/La_Paz al arrancar (#27).
const { fechaLocal } = require('./fechas');

// Como se guardan en horario.dia (seed y frontend): en mayúsculas y sin tildes
const DIAS_SEMANA = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];

// 'MIÉRCOLES', 'miercoles ' → 'MIERCOLES'
const normalizarDia = (dia) =>
    String(dia ?? '')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .trim()
        .toUpperCase();

// Día de la semana de una fecha, en la hora de Bolivia
function diaDeLaSemana(fecha) {
    return DIAS_SEMANA[new Date(fecha).getDay()];
}

function esDelDia(horario, fecha) {
    return normalizarDia(horario.dia) === diaDeLaSemana(fecha);
}

// 'HH:MM:SS' → segundos desde las 00:00
function segundosDelDia(hora) {
    const [h = 0, m = 0, s = 0] = String(hora).split(':').map(Number);
    return h * 3600 + m * 60 + s;
}

// Segundos COMPLETOS de atraso de una llegada frente a la hora de entrada de ese día ('HH:MM:SS').
// Llegar antes de la hora (o justo a la hora) es 0. Se trunca: 9 min 59.9 s son 599 s, no 600.
function segundosDeAtraso(llegada, horaEntrada) {
    const llegadaFecha = new Date(llegada);
    const entrada = new Date(`${fechaLocal(llegadaFecha)}T00:00:00`);
    entrada.setSeconds(segundosDelDia(horaEntrada));
    return Math.max(0, Math.floor((llegadaFecha - entrada) / 1000));
}

// Descuento que corresponde a un atraso según la tabla descuento_atraso. Cada fila dice desde qué
// atraso (cantidad_tiempo, INCLUSIVE) se aplica; gana la de mayor umbral alcanzado. Con la tabla
// del seed: desde 00:10:00 → 10 %, desde 00:20:00 → 20 %, desde 00:25:01 (más de 25 min) → 100 %.
// Sin ningún umbral alcanzado, null (sin descuento).
function descuentoQueCorresponde(segundos, tabla) {
    let elegido = null;
    for (const fila of tabla) {
        if (fila.cantidad_tiempo == null) continue;
        const umbral = segundosDelDia(fila.cantidad_tiempo);
        if (segundos >= umbral && (!elegido || umbral > segundosDelDia(elegido.cantidad_tiempo))) {
            elegido = fila;
        }
    }
    return elegido;
}

module.exports = {
    DIAS_SEMANA,
    normalizarDia,
    diaDeLaSemana,
    esDelDia,
    segundosDelDia,
    segundosDeAtraso,
    descuentoQueCorresponde
};
