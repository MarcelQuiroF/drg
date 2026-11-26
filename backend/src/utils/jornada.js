'use strict';

// Candado del día abierto (#34). Toda operación que no se puede hacer con el día cerrado (abrir una
// orden, agregar productos o juegos, cobrar) llama a bloquearDiaAbierto(t) AL EMPEZAR su
// transacción, antes de cualquier otro bloqueo. Lee la jornada abierta con SELECT … FOR SHARE:
// - Las operaciones normales no se esperan entre sí (FOR SHARE es compatible con FOR SHARE).
// - El cierre del día lee la misma fila con FOR UPDATE: espera a que terminen las operaciones en
//   curso (y su resumen las incluye), y las que llegan mientras cierra esperan al cierre y después
//   ya no encuentran el día abierto → 409.
// Un middleware que consultara el estado antes de llamar al servicio no alcanza: corre en otra
// transacción, y entre su consulta y la escritura del servicio se puede colar un cierre.
//
// Orden de los bloqueos en todo el backend: jornada → orden → mesa (sin un orden fijo, dos
// operaciones se pueden quedar esperando una a la otra).
const { Jornada } = require('../models');
const { errorConEstado } = require('./orderUtils');

const MENSAJE_DIA_CERRADO = 'El día está cerrado: hay que abrir el día para tomar órdenes y cobrar.';

async function bloquearDiaAbierto(transaction) {
    const jornada = await Jornada.findOne({
        where: { cerrada_en: null },
        transaction,
        lock: transaction.LOCK.SHARE
    });
    if (!jornada) {
        const error = errorConEstado(409, MENSAJE_DIA_CERRADO);
        error.datos = { codigo: 'DIA_CERRADO' };
        throw error;
    }
    return jornada;
}

module.exports = { bloquearDiaAbierto, MENSAJE_DIA_CERRADO };
