// Fechas del frontend en la zona del negocio (#27). Se corren con la zona del proceso en UTC
// (como el CI) y también en otra zona: las funciones no dependen de la configuración del equipo.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fechaLocalISO, horaLocal, sumarDias } from '../js/utils.js';

const casos = [
    ['21:00 del 25/11 (01:00 UTC del 26)', '2026-11-26T01:00:00Z', '2026-11-25', '21:00'],
    ['20:00 del 25/11 (00:00 UTC del 26)', '2026-11-26T00:00:00Z', '2026-11-25', '20:00'],
    ['23:59 del 25/11', '2026-11-26T03:59:00Z', '2026-11-25', '23:59'],
    ['00:00 del 26/11', '2026-11-26T04:00:00Z', '2026-11-26', '00:00'],
    ['08:15 del 26/11', '2026-11-26T12:15:00Z', '2026-11-26', '08:15']
];

for (const zonaDelEquipo of ['UTC', 'Asia/Tokyo', 'America/La_Paz']) {
    for (const [caso, instante, dia, hora] of casos) {
        test(`con el equipo en ${zonaDelEquipo}, las ${caso} es el ${dia} a las ${hora}`, () => {
            process.env.TZ = zonaDelEquipo;
            const fecha = new Date(instante);
            assert.equal(fechaLocalISO(fecha), dia); // toISOString().split('T')[0] daba el día UTC
            assert.equal(horaLocal(fecha), hora);
        });
    }
}

test('R1 · la fecha por defecto de una reserva a las 21:00 es hoy, no mañana', () => {
    process.env.TZ = 'UTC';
    const a_las_21 = new Date('2026-11-26T01:00:00Z');
    assert.equal(a_las_21.toISOString().split('T')[0], '2026-11-26'); // lo que hacía reservas.js
    assert.equal(fechaLocalISO(a_las_21), '2026-11-25');
});

test('sumarDias cruza meses y años y no depende de la hora', () => {
    assert.equal(sumarDias('2026-11-25', -7), '2026-11-18');
    assert.equal(sumarDias('2026-03-01', -1), '2026-02-28');
    assert.equal(sumarDias('2026-12-31', 1), '2027-01-01');
    assert.equal(sumarDias('2026-11-25', -30), '2026-10-26');
});
