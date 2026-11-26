'use strict';

// Descuentos con motivo obligatorio, quién los aplicó y la sección de control del administrador
// (#39, RF-49, RF-11, RN-06). Los descuentos no tienen tope ni autorización: el control es después.
const { comoRol, USUARIOS } = require('../soporte/api');
const { producto, juego, mesaLibre } = require('../soporte/datos');
const { Descuento, Empleado, OrdenDescuento, Orden, sequelize } = require('../../src/models');

let mesero;
let cajero;
let admin;
let idMesero;
let idCajero;

beforeAll(async () => {
    mesero = await comoRol('MESERO');
    cajero = await comoRol('CAJERO');
    admin = await comoRol('ADMIN');
    idMesero = (await Empleado.findOne({ where: { ci: USUARIOS.MESERO.ci } })).id;
    idCajero = (await Empleado.findOne({ where: { ci: USUARIOS.CAJERO.ci } })).id;
});

// 2 Cappuccino (2 × 18) + 1 Catan (25) = 61
async function ordenDe61(nombreMesa) {
    const mesa = await mesaLibre(nombreMesa ? { nombre: nombreMesa } : {});
    const orden = (await mesero.post('/ordenes').send({ mesa_id: mesa.id })).body.orden;
    const cappuccino = await producto('Cappuccino');
    const catan = await juego('Catan');
    await mesero.post('/ordenes-productos').send({ orden_id: orden.id, producto_id: cappuccino.id, cantidad: 2 });
    await mesero.post('/ordenes-juegos').send({ orden_id: orden.id, juego_id: catan.id, cantidad: 1 });
    return orden;
}

const descontar = (api, ordenId, datos) => api.post(`/ordenes/${ordenId}/descuento`).send(datos);
const totalDe = async (ordenId) => Number((await Orden.findByPk(ordenId)).total);

describe('DC1 · el motivo es obligatorio (RN-06)', () => {
    test.each([
        ['sin comentario', { monto: 5 }],
        ['vacío', { monto: 5, comentario: '' }],
        ['solo espacios', { porcentaje: 10, comentario: '   ' }],
        ['más de 255 caracteres', { monto: 5, comentario: 'x'.repeat(256) }]
    ])('%s: 400 y no se aplica nada', async (_caso, datos) => {
        const orden = await ordenDe61();
        const antes = await Descuento.count();
        const res = await descontar(mesero, orden.id, datos);
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/motivo/);
        expect(await Descuento.count()).toBe(antes);
        expect(await totalDe(orden.id)).toBe(61);
    });

    test('el motivo se guarda sin los espacios de los bordes', async () => {
        const orden = await ordenDe61();
        const res = await descontar(mesero, orden.id, { monto: 5, comentario: '  Cumpleaños  ' });
        expect(res.status).toBe(200);
        expect(res.body.descuento.comentario).toBe('Cumpleaños');
    });
});

describe('DC2 · cada descuento guarda quién lo aplicó', () => {
    test('el empleado es el de la sesión (mesero o cajero), no uno que mande el navegador', async () => {
        const orden = await ordenDe61();
        const r1 = await descontar(mesero, orden.id, { monto: 5, comentario: 'Cumpleaños', empleado_id: idCajero });
        const r2 = await descontar(cajero, orden.id, { porcentaje: 10, comentario: 'Cliente frecuente' });
        expect((await Descuento.findByPk(r1.body.descuento.id)).empleado_id).toBe(idMesero);
        expect((await Descuento.findByPk(r2.body.descuento.id)).empleado_id).toBe(idCajero);
    });
});

describe('DC3 · aviso si el descuento supera lo que queda por pagar', () => {
    test('un monto mayor al total: 409 DESCUENTO_SUPERA_TOTAL con los dos montos, y no cambia nada', async () => {
        const orden = await ordenDe61();
        const antes = await Descuento.count();
        const res = await descontar(mesero, orden.id, { monto: 70, comentario: 'Comida entregada por error' });
        expect(res.status).toBe(409);
        expect(res.body).toEqual(
            expect.objectContaining({ codigo: 'DESCUENTO_SUPERA_TOTAL', descuento_bs: 70, por_pagar: 61 })
        );
        expect(await Descuento.count()).toBe(antes);
        expect(await totalDe(orden.id)).toBe(61);
    });

    test('confirmado (confirmar: true), se aplica sin tope y la orden queda en 0.00 (RN-06)', async () => {
        const orden = await ordenDe61();
        const res = await descontar(mesero, orden.id, { monto: 70, comentario: 'Error', confirmar: true });
        expect(res.status).toBe(200);
        expect(await totalDe(orden.id)).toBe(0);
    });

    test('un descuento igual a lo que queda (100 %) no es "mayor": se aplica sin aviso', async () => {
        const orden = await ordenDe61();
        expect((await descontar(mesero, orden.id, { porcentaje: 100, comentario: 'Cortesía' })).status).toBe(200);
        expect(await totalDe(orden.id)).toBe(0);
    });

    test('se compara con lo que queda por pagar, no con el subtotal: 50 % y después 40 Bs sobre 61', async () => {
        const orden = await ordenDe61();
        expect((await descontar(mesero, orden.id, { porcentaje: 50, comentario: 'Promo' })).status).toBe(200);
        const res = await descontar(mesero, orden.id, { monto: 40, comentario: 'Otro' });
        expect(res.status).toBe(409);
        expect(res.body.por_pagar).toBe(30.5);
        expect((await descontar(mesero, orden.id, { porcentaje: 50, comentario: 'Otro' })).status).toBe(200);
    });
});

describe('DC4 · listado de control del administrador (GET /descuentos)', () => {
    let orden1;
    let orden2;
    let quitado;

    beforeAll(async () => {
        // Base limpia de descuentos para este bloque
        await sequelize.query('DELETE FROM orden_descuento; DELETE FROM descuento;');
        orden1 = await ordenDe61('Mesa del control 1');
        orden2 = await ordenDe61('Mesa del control 2');
        // Orden 1: 50 Bs (mesero) y 20 Bs confirmado (cajero) → descontó 50 y 11 (no puede bajar de 0)
        await descontar(mesero, orden1.id, { monto: 50, comentario: 'Cumpleaños' });
        await descontar(cajero, orden1.id, { monto: 20, comentario: 'Comida entregada por error', confirmar: true });
        // Orden 2: 10 % (cajero) → 6.10; otro descuento que se quita después
        await descontar(cajero, orden2.id, { porcentaje: 10, comentario: 'Cliente frecuente' });
        quitado = (await descontar(mesero, orden2.id, { monto: 3, comentario: 'Me equivoqué' })).body.descuento;
        await mesero.delete(`/ordenes/${orden2.id}/descuento/${quitado.id}`);
    });

    test('cada fila trae fecha, orden, mesa, tipo y valor, Bs realmente descontados, motivo y empleado', async () => {
        const res = await admin.get('/descuentos');
        expect(res.status).toBe(200);
        const { descuentos, totales } = res.body;
        expect(descuentos.map((d) => d.motivo)).toEqual([
            'Cliente frecuente',
            'Comida entregada por error',
            'Cumpleaños'
        ]);
        const porMotivo = Object.fromEntries(descuentos.map((d) => [d.motivo, d]));
        expect(porMotivo['Cumpleaños']).toEqual(
            expect.objectContaining({
                orden: { id: orden1.id, cobrada: false, total: 0 },
                mesa: expect.objectContaining({ nombre: 'Mesa del control 1' }),
                tipo: 'MONTO',
                valor: 50,
                descontado: 50,
                empleado: expect.objectContaining({ id: idMesero })
            })
        );
        expect(porMotivo['Comida entregada por error'].descontado).toBe(11);
        expect(porMotivo['Comida entregada por error'].empleado.id).toBe(idCajero);
        expect(porMotivo['Cliente frecuente']).toEqual(
            expect.objectContaining({ tipo: 'PORCENTAJE', valor: 10, descontado: 6.1 })
        );
        expect(new Date(porMotivo['Cumpleaños'].fecha).toString()).not.toBe('Invalid Date');
        // El descuento quitado no aparece; la suma es lo que las órdenes dejaron de cobrar
        expect(descuentos.find((d) => d.id === quitado.id)).toBeUndefined();
        expect(totales).toEqual({ cantidad: 3, descontado: 67.1 });
    });

    test('filtra por empleado', async () => {
        const res = await admin.get(`/descuentos?empleado_id=${idCajero}`);
        expect(res.body.descuentos.map((d) => d.motivo).sort()).toEqual([
            'Cliente frecuente',
            'Comida entregada por error'
        ]);
        expect(res.body.totales.descontado).toBe(17.1);
    });

    test('filtra por rango de fechas (días de Bolivia, los dos extremos incluidos)', async () => {
        // "Cumpleaños" pasa al 24/11 a las 22:00 de Bolivia (25/11 02:00 UTC): es del 24 en Bolivia
        const cumple = await Descuento.findOne({ where: { comentario: 'Cumpleaños' } });
        await sequelize.query(`UPDATE descuento SET "createdAt" = '2026-11-25T02:00:00Z' WHERE id = :id`, {
            replacements: { id: cumple.id }
        });
        const del24 = await admin.get('/descuentos?desde=2026-11-24&hasta=2026-11-24');
        expect(del24.body.descuentos.map((d) => d.motivo)).toEqual(['Cumpleaños']);
        // El Bs descontado sigue saliendo de la orden completa (aunque el otro descuento sea de otro día)
        expect(del24.body.descuentos[0].descontado).toBe(50);
        const del23al24 = await admin.get('/descuentos?desde=2026-11-23&hasta=2026-11-24');
        expect(del23al24.body.totales.cantidad).toBe(1);
        const del25 = await admin.get('/descuentos?desde=2026-11-25&hasta=2026-11-25');
        expect(del25.body.descuentos.map((d) => d.motivo)).not.toContain('Cumpleaños');
    });

    test('los descuentos de una orden borrada no aparecen', async () => {
        const orden = await ordenDe61('Mesa borrada');
        await descontar(mesero, orden.id, { monto: 1, comentario: 'De una orden que se borra' });
        await mesero.delete(`/ordenes/${orden.id}`);
        const res = await admin.get('/descuentos');
        expect(res.body.descuentos.map((d) => d.motivo)).not.toContain('De una orden que se borra');
    });

    test('un descuento de antes de #39 (sin empleado ni motivo) aparece con empleado null', async () => {
        const orden = await ordenDe61('Mesa vieja');
        const [[{ id }]] = await sequelize.query(
            `INSERT INTO descuento (porcentaje, monto, comentario, "createdAt", "updatedAt")
             VALUES (0, 2, '', now(), now()) RETURNING id`
        );
        await OrdenDescuento.create({ orden_id: orden.id, descuento_id: id });
        const fila = (await admin.get('/descuentos')).body.descuentos.find((d) => d.id === id);
        expect(fila).toEqual(expect.objectContaining({ empleado: null, motivo: '', descontado: 2 }));
    });

    test.each([
        ['solo una fecha', '?desde=2026-11-24'],
        ['una fecha mal escrita', '?desde=24/11/2026&hasta=2026-11-25'],
        ['el rango al revés', '?desde=2026-11-25&hasta=2026-11-24'],
        ['un empleado que no es un número', '?empleado_id=abc']
    ])('%s: 400', async (_caso, consulta) => {
        expect((await admin.get(`/descuentos${consulta}`)).status).toBe(400);
    });

    test('solo el ADMIN ve la sección: cajero y mesero reciben 403 (descuentos.controlar)', async () => {
        for (const api of [cajero, mesero]) {
            const res = await api.get('/descuentos');
            expect(res.status).toBe(403);
            expect(res.body.permiso).toBe('descuentos.controlar');
        }
    });
});

describe('DC5 · orden_descuento: clave primaria compuesta con borrado lógico (hallazgo de la 4.1)', () => {
    test('aplicar, quitar y volver a aplicar el mismo descuento a la misma orden funciona (cada vez es un descuento nuevo)', async () => {
        const orden = await ordenDe61();
        const primero = (await descontar(mesero, orden.id, { monto: 5, comentario: 'Cumpleaños' })).body.descuento;
        expect((await mesero.delete(`/ordenes/${orden.id}/descuento/${primero.id}`)).status).toBe(200);
        const segundo = await descontar(mesero, orden.id, { monto: 5, comentario: 'Cumpleaños' });
        expect(segundo.status).toBe(200);
        expect(segundo.body.descuento.id).not.toBe(primero.id);
        expect(await totalDe(orden.id)).toBe(56);

        // La fila vieja de la relación queda marcada (borrado lógico) y la nueva usa otra clave:
        // el par (orden, descuento) nunca se repite, así que la clave compuesta no choca (#78 sí chocaba
        // porque volvía a insertar el mismo par)
        const filas = await OrdenDescuento.findAll({ where: { orden_id: orden.id }, paranoid: false });
        expect(filas).toHaveLength(2);
        expect(filas.filter((f) => f.deletedAt !== null)).toHaveLength(1);
        expect((await mesero.get(`/ordenes/${orden.id}/descuentos`)).body).toHaveLength(1);
    });
});
