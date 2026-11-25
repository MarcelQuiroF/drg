'use strict';

// Datos de apoyo para las pruebas: buscan lo que carga el seed por nombre (no por id) y
// crean lo que cada prueba necesita aparte, para que las pruebas de un archivo no se pisen.
const { Producto, Juego, Mesa, Piso, sequelize } = require('../../src/models');

const producto = (nombre) => Producto.findOne({ where: { nombre }, rejectOnEmpty: true });
const juego = (nombre) => Juego.findOne({ where: { nombre }, rejectOnEmpty: true });

let contadorMesas = 100;

// Una mesa nueva y libre en la planta baja. Cada llamada crea otra.
async function mesaLibre(datos = {}) {
    const piso = await Piso.findOne({ where: { numero: 0 }, rejectOnEmpty: true });
    contadorMesas += 1;
    return Mesa.create({
        nombre: `Mesa de prueba ${contadorMesas}`,
        numero: contadorMesas,
        piso_id: piso.id,
        cantidadMinima: 1,
        cantidadMaxima: 4,
        ...datos
    });
}

// Mueve la fecha de creación (y la de pago) de los registros de una orden a un momento fijo.
// Sirve para probar reportes sin depender del día ni de la hora en que corre la prueba.
async function fecharOrden(ordenId, fecha) {
    const opciones = { replacements: { fecha, ordenId } };
    await sequelize.query('UPDATE orden SET "createdAt" = :fecha WHERE id = :ordenId', opciones);
    await sequelize.query('UPDATE contenedor_producto SET "createdAt" = :fecha WHERE orden_id = :ordenId', opciones);
    await sequelize.query('UPDATE contenedor_juego SET "createdAt" = :fecha WHERE orden_id = :ordenId', opciones);
    await sequelize.query('UPDATE contenedor_transaccion SET fecha = :fecha WHERE orden_id = :ordenId', opciones);
}

module.exports = { producto, juego, mesaLibre, fecharOrden };
