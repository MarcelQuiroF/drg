// Pantalla de asistencia (#29): el navegador ya no calcula el atraso ni el descuento, solo
// muestra lo que devuelve el servidor en POST /asistencias.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { textoAtraso } from '../js/modules/asistencia.js';

test('una llegada sin atraso se informa a tiempo', () => {
    assert.equal(textoAtraso({ minutos: 0, segundos: 0, descuento_porcentual: 0 }), 'Llegada registrada a tiempo.');
});

test('un atraso sin descuento muestra los minutos', () => {
    assert.equal(
        textoAtraso({ minutos: 9, segundos: 599, descuento_porcentual: 0 }),
        'Llegada registrada con 9 min de atraso, sin descuento.'
    );
});

test('un atraso con descuento muestra el porcentaje que calculó el servidor', () => {
    assert.equal(
        textoAtraso({ minutos: 25, segundos: 1501, descuento_porcentual: 100 }),
        'Llegada registrada con 25 min de atraso: descuento de 100 % del pago del día.'
    );
});

test('sin datos del servidor no inventa un atraso', () => {
    assert.equal(textoAtraso(undefined), 'Llegada registrada a tiempo.');
});
