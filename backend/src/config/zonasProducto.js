'use strict';

// Zonas de un producto (RF-14, #32): a qué comanda va (cocina o cafetería) y en qué pestaña del
// POS aparece (comida o bebida). Es una lista CERRADA y esta constante es su única fuente en el
// backend; la base la repite en la restricción CHECK producto_zona_valida (migración
// 20261125180000-cerrar-zonas-de-producto). ⚠ Valor de prueba hasta el 10/12 (P-12): si el dueño
// pide otra zona, se agrega aquí y en una migración nueva que cambie el CHECK.
const ZONAS_PRODUCTO = Object.freeze(['COCINA', 'CAFETERIA']);

// 'cocina ', 'Cafetería' → 'COCINA', 'CAFETERIA'. Solo mayúsculas, espacios y tildes: no adivina
// sinónimos ('Barra' sigue sin ser válida y responde 400).
function normalizarZona(zona) {
    if (zona == null) return zona;
    return String(zona).normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toUpperCase();
}

module.exports = { ZONAS_PRODUCTO, normalizarZona };
