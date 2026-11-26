'use strict';

// Apertura y cierre del día en el servidor (#34, RF-22, RN-16). Antes el cierre se guardaba solo
// en el localStorage de un navegador: otro navegador no lo veía y el servidor seguía aceptando
// órdenes (§4.7, T15).
const { comoRol, USUARIOS, cobrarEnEfectivo } = require('../soporte/api');
const { producto, juego, mesaLibre } = require('../soporte/datos');
const { abrirDiaDePrueba } = require('../soporte/baseDePruebas');
const { Jornada, Orden, Empleado, sequelize } = require('../../src/models');
const reloj = require('../../src/utils/reloj');
const { fechaLocal } = require('../../src/utils/fechas');

let mesero;
let cajero;
let admin;
let idCajero;
let idMesero;

beforeAll(async () => {
    mesero = await comoRol('MESERO');
    cajero = await comoRol('CAJERO');
    admin = await comoRol('ADMIN');
    idCajero = (await Empleado.findOne({ where: { ci: USUARIOS.CAJERO.ci } })).id;
    idMesero = (await Empleado.findOne({ where: { ci: USUARIOS.MESERO.ci } })).id;
});

// Cada prueba empieza como el local por la mañana: sin órdenes abiertas y con el día de hoy
// abierto por el cajero (lo mismo que deja tests/soporte para los demás archivos).
beforeEach(async () => {
    jest.restoreAllMocks();
    await sequelize.query(`UPDATE orden SET "deletedAt" = now() WHERE finalizado = false AND "deletedAt" IS NULL`);
    await sequelize.query('UPDATE mesa SET estado = 0');
    await sequelize.query('DELETE FROM jornada');
    await abrirDiaDePrueba(sequelize);
});

const credenciales = (rol) => ({ ...USUARIOS[rol] });
const cerrar = (api, rol = 'CAJERO') => api.post('/jornadas/actual/cerrar').send(credenciales(rol));
const abrir = (api, rol = 'CAJERO') => api.post('/jornadas').send(credenciales(rol));

async function ordenCon(api, { productos = [], juegos = [] } = {}) {
    const mesa = await mesaLibre();
    const res = await api.post('/ordenes').send({ mesa_id: mesa.id });
    expect(res.status).toBe(201);
    const orden = res.body.orden;
    for (const [nombre, cantidad] of productos) {
        const p = await producto(nombre);
        const r = await api.post('/ordenes-productos').send({ orden_id: orden.id, producto_id: p.id, cantidad });
        expect(r.status).toBe(201);
    }
    for (const [nombre, cantidad] of juegos) {
        const j = await juego(nombre);
        const r = await api.post('/ordenes-juegos').send({ orden_id: orden.id, juego_id: j.id, cantidad });
        expect(r.status).toBe(201);
    }
    return orden;
}

// Cierra la jornada abierta directamente en la base, sin las validaciones del servicio. Simula
// lo que hoy no se puede hacer por la API (una orden abierta con el día cerrado: datos de antes
// de #34 o un cierre a mano).
async function cerrarEnLaBase() {
    await sequelize.query(`UPDATE jornada SET cerrada_en = now(), cerrada_por = abierta_por WHERE cerrada_en IS NULL`);
}

describe('D1 · estado del día', () => {
    test('GET /jornadas/actual dice que el día está abierto, de qué fecha y quién lo abrió', async () => {
        const res = await mesero.get('/jornadas/actual');
        expect(res.status).toBe(200);
        expect(res.body.abierta).toBe(true);
        expect(res.body.jornada.fecha).toBe(fechaLocal());
        expect(res.body.jornada.abridor.id).toBe(idCajero);
        expect(res.body.jornada.cerrada_en).toBeNull();
    });

    test('T15 (API) · después de cerrar, cualquier otro usuario (otro navegador) ve el día cerrado', async () => {
        expect((await cerrar(mesero)).status).toBe(200);
        for (const api of [mesero, cajero, admin]) {
            const res = await api.get('/jornadas/actual');
            expect(res.body.abierta).toBe(false);
            expect(res.body.jornada.cerrador.id).toBe(idCajero);
            expect(res.body.jornada.resumen).toEqual(expect.objectContaining({ ordenes: 0, ingresos: 0 }));
        }
    });

    test('sin ninguna jornada en la base, el día figura cerrado y sin datos', async () => {
        await sequelize.query('DELETE FROM jornada');
        const res = await mesero.get('/jornadas/actual');
        expect(res.body).toEqual({ abierta: false, jornada: null });
    });
});

describe('D2 · credenciales de quien abre o cierra (RF-22, RN-16)', () => {
    test('sin CI o sin contraseña: 400 y el día sigue abierto', async () => {
        const res = await mesero.post('/jornadas/actual/cerrar').send({ ci: USUARIOS.MESERO.ci });
        expect(res.status).toBe(400);
        expect((await mesero.get('/jornadas/actual')).body.abierta).toBe(true);
    });

    test('con la contraseña incorrecta: 403 (no 401: la sesión de quien presta la pantalla sigue)', async () => {
        const res = await mesero.post('/jornadas/actual/cerrar').send({ ci: USUARIOS.MESERO.ci, contrasenia: 'mal' });
        expect(res.status).toBe(403);
        expect((await mesero.get('/jornadas/actual')).body.abierta).toBe(true);
    });

    test('un empleado con un rol sin el permiso (rol viejo) no puede cerrar: 403', async () => {
        await sequelize.query(`UPDATE empleado SET rol = 'COCINERO' WHERE id = :id`, {
            replacements: { id: idMesero }
        });
        try {
            const res = await cajero.post('/jornadas/actual/cerrar').send(credenciales('MESERO'));
            expect(res.status).toBe(403);
            expect(res.body.message).toMatch(/dia\.abrir_cerrar/);
        } finally {
            await sequelize.query(`UPDATE empleado SET rol = 'MESERO' WHERE id = :id`, {
                replacements: { id: idMesero }
            });
        }
    });

    test('abre uno y cierra otro: queda registrado quién y cuándo (no el dueño de la sesión)', async () => {
        await sequelize.query('DELETE FROM jornada');
        const apertura = await cajero.post('/jornadas').send(credenciales('MESERO'));
        expect(apertura.status).toBe(201);
        expect(apertura.body.jornada.abierta_por).toBe(idMesero);

        const cierre = await mesero.post('/jornadas/actual/cerrar').send(credenciales('CAJERO'));
        expect(cierre.status).toBe(200);
        expect(cierre.body.jornada.cerrada_por).toBe(idCajero);
        expect(cierre.body.jornada.cerrador.nombre).toBeTruthy();
        expect(new Date(cierre.body.jornada.cerrada_en).getTime()).toBeGreaterThanOrEqual(
            new Date(apertura.body.jornada.abierta_en).getTime()
        );
    });
});

describe('D3 · resumen del día al cerrar (P-09, valor de prueba)', () => {
    test('totales por método de pago, número de órdenes y descuentos de las órdenes cobradas', async () => {
        // Orden 1: 2 Cappuccino (2 × 18) + 1 Catan (25) = 61, con 11 Bs de descuento → 50 en QR 30 + EFECTIVO 20
        const o1 = await ordenCon(mesero, { productos: [['Cappuccino', 2]], juegos: [['Catan', 1]] });
        const d = await mesero.post(`/ordenes/${o1.id}/descuento`).send({ monto: 11, comentario: 'Cumpleaños' });
        expect(d.status).toBe(200);
        const pago = await cajero.post(`/ordenes/${o1.id}/finalizar`).send({
            pagos: [
                { tipo: 'QR', monto: 30 },
                { tipo: 'EFECTIVO', monto: 20 }
            ]
        });
        expect(pago.status).toBe(200);
        // Orden 2: 1 Cappuccino (18) en efectivo
        const o2 = await ordenCon(mesero, { productos: [['Cappuccino', 1]] });
        expect((await cobrarEnEfectivo(cajero, o2.id)).status).toBe(200);

        const res = await cerrar(mesero);
        expect(res.status).toBe(200);
        expect(res.body.jornada.resumen).toEqual({
            ordenes: 2,
            ingresos: 68,
            efectivo: 38,
            qr: 30,
            descuentos: { cantidad: 1, monto: 11 }
        });
        // Queda guardado: GET /jornadas/actual devuelve el mismo resumen
        expect((await admin.get('/jornadas/actual')).body.jornada.resumen).toEqual(res.body.jornada.resumen);
    });

    test('la misma fuente que el dashboard (#31): el resumen coincide con el dashboard del día', async () => {
        // Sin los cobros de las otras pruebas de este archivo (el dashboard cuenta todo el día)
        await sequelize.query('UPDATE orden SET "deletedAt" = now() WHERE "deletedAt" IS NULL');
        const o1 = await ordenCon(mesero, { productos: [['Cappuccino', 3]] });
        await mesero.post(`/ordenes/${o1.id}/descuento`).send({ porcentaje: 10, comentario: 'Cliente frecuente' });
        expect((await cobrarEnEfectivo(cajero, o1.id)).status).toBe(200);
        const o2 = await ordenCon(mesero, { juegos: [['Catan', 1]] });
        const total2 = Number((await mesero.get(`/ordenes/${o2.id}`)).body.total);
        await cajero.post(`/ordenes/${o2.id}/finalizar`).send({ pagos: [{ tipo: 'QR', monto: total2 }] });

        const { resumen } = (await cerrar(mesero)).body.jornada;
        const hoy = fechaLocal();
        const dashboard = (await admin.get(`/reportes/dashboard?inicio=${hoy}&fin=${hoy}`)).body.totales;
        expect(resumen).toEqual(
            expect.objectContaining({
                ordenes: dashboard.ordenes,
                ingresos: dashboard.ingresos,
                efectivo: dashboard.efectivo,
                qr: dashboard.qr
            })
        );
    });

    test('cuenta lo cobrado entre la apertura y el cierre, no lo de antes de abrir ni lo de otra jornada', async () => {
        const antes = await ordenCon(mesero, { productos: [['Cappuccino', 1]] });
        expect((await cobrarEnEfectivo(cajero, antes.id)).status).toBe(200);
        // Ese cobro fue "antes de abrir": se mueve la apertura de la jornada a después del pago
        await sequelize.query(`UPDATE jornada SET abierta_en = now() WHERE cerrada_en IS NULL`);
        const durante = await ordenCon(mesero, { productos: [['Cappuccino', 2]] });
        expect((await cobrarEnEfectivo(cajero, durante.id)).status).toBe(200);

        const { resumen } = (await cerrar(mesero)).body.jornada;
        expect(resumen.ordenes).toBe(1);
        expect(resumen.ingresos).toBe(36);
    });
});

describe('D4 · con el día cerrado no se toman órdenes ni se cobra (409)', () => {
    test('abrir una orden: 409 con codigo DIA_CERRADO y no se crea nada', async () => {
        expect((await cerrar(mesero)).status).toBe(200);
        const mesa = await mesaLibre();
        const antes = await Orden.count();
        const res = await mesero.post('/ordenes').send({ mesa_id: mesa.id });
        expect(res.status).toBe(409);
        expect(res.body.codigo).toBe('DIA_CERRADO');
        expect(res.body.message).toMatch(/día está cerrado/);
        expect(await Orden.count()).toBe(antes);
        await mesa.reload();
        expect(mesa.estado).toBe(0);
    });

    test('agregar productos o juegos, cobrar y registrar un pago a una orden que quedó abierta: 409', async () => {
        const orden = await ordenCon(mesero, { productos: [['Cappuccino', 1]] });
        await cerrarEnLaBase();
        const cappuccino = await producto('Cappuccino');
        const catan = await juego('Catan');

        const respuestas = await Promise.all([
            mesero.post('/ordenes-productos').send({ orden_id: orden.id, producto_id: cappuccino.id, cantidad: 1 }),
            mesero.post('/ordenes-juegos').send({ orden_id: orden.id, juego_id: catan.id, cantidad: 1 }),
            cajero.post(`/ordenes/${orden.id}/finalizar`).send({ pagos: [{ tipo: 'EFECTIVO', monto: 18 }] }),
            cajero.post('/pagos').send({ orden_id: orden.id, tipo: 'EFECTIVO', cantidad: 18 })
        ]);
        expect(respuestas.map((r) => r.status)).toEqual([409, 409, 409, 409]);
        await sequelize.query('SELECT 1');
        const guardada = await Orden.findByPk(orden.id);
        expect(guardada.finalizado).toBe(false);
        expect(Number(guardada.total)).toBe(18);
    });

    test('ver órdenes, mesas y el estado del día sigue funcionando con el día cerrado', async () => {
        expect((await cerrar(mesero)).status).toBe(200);
        expect((await mesero.get('/mesas')).status).toBe(200);
        expect((await mesero.get('/ordenes')).status).toBe(200);
        expect((await mesero.get('/jornadas/actual')).status).toBe(200);
    });
});

describe('D5 · cerrar con órdenes abiertas se bloquea (decisión de Marcelo, ⚠ confirmar con el dueño)', () => {
    test('409 con la lista de órdenes y mesas; el día sigue abierto y la orden intacta', async () => {
        const orden = await ordenCon(mesero, { productos: [['Cappuccino', 1]] });
        const res = await cerrar(mesero);
        expect(res.status).toBe(409);
        expect(res.body.codigo).toBe('ORDENES_ABIERTAS');
        expect(res.body.ordenesAbiertas).toEqual([
            expect.objectContaining({ id: orden.id, total: 18, mesa: expect.objectContaining({ id: orden.mesa_id }) })
        ]);
        expect((await mesero.get('/jornadas/actual')).body.abierta).toBe(true);

        // Cobrada la orden, ya se puede cerrar
        expect((await cobrarEnEfectivo(cajero, orden.id)).status).toBe(200);
        expect((await cerrar(mesero)).status).toBe(200);
    });

    test('una orden borrada no impide cerrar', async () => {
        const orden = await ordenCon(mesero, { productos: [['Cappuccino', 1]] });
        expect((await mesero.delete(`/ordenes/${orden.id}`)).status).toBe(200);
        expect((await cerrar(mesero)).status).toBe(200);
    });
});

describe('D6 · abrir el día: uno a la vez y una jornada por fecha', () => {
    test('con un día abierto, abrir otro: 409 "sigue abierto"', async () => {
        const res = await abrir(mesero);
        expect(res.status).toBe(409);
        expect(res.body.message).toMatch(/sigue abierto/);
        expect(await Jornada.count()).toBe(1);
    });

    test('después de cerrar hoy, abrir otra vez hoy: 409 (se reabre, no se abre otra jornada; #35)', async () => {
        expect((await cerrar(mesero)).status).toBe(200);
        const res = await abrir(mesero);
        expect(res.status).toBe(409);
        expect(res.body.message).toMatch(/ya se cerró/);
        expect(await Jornada.count()).toBe(1);
    });

    test('el día siguiente se abre una jornada nueva con su fecha', async () => {
        expect((await cerrar(mesero)).status).toBe(200);
        const manana = new Date(Date.now() + 24 * 60 * 60 * 1000);
        jest.spyOn(reloj, 'ahora').mockReturnValue(manana);
        const res = await abrir(mesero, 'MESERO');
        expect(res.status).toBe(201);
        expect(res.body.jornada.fecha).toBe(fechaLocal(manana));
        expect(await Jornada.count()).toBe(2);
    });

    test('la fecha es el día de Bolivia: abrir a las 21:00 de Bolivia (01:00 UTC del día siguiente)', async () => {
        await sequelize.query('DELETE FROM jornada');
        // 25/11/2026 21:00 en Bolivia (UTC−4) = 26/11/2026 01:00 UTC. Las pruebas corren en UTC (#27).
        jest.spyOn(reloj, 'ahora').mockReturnValue(new Date('2026-11-26T01:00:00Z'));
        const res = await abrir(mesero);
        expect(res.status).toBe(201);
        expect(res.body.jornada.fecha).toBe('2026-11-25');
    });

    test('dos aperturas a la vez: una abre (201) y la otra recibe 409; queda una sola jornada', async () => {
        await sequelize.query('DELETE FROM jornada');
        const respuestas = await Promise.all([
            abrir(mesero, 'MESERO'),
            abrir(cajero, 'CAJERO'),
            abrir(admin, 'CAJERO')
        ]);
        const estados = respuestas.map((r) => r.status).sort();
        expect(estados).toEqual([201, 409, 409]);
        expect(await Jornada.count()).toBe(1);
    });

    test('la base no deja dos jornadas abiertas ni dos con la misma fecha (aunque sea un INSERT a mano)', async () => {
        const insertar = (fecha, cerrada) =>
            sequelize.query(
                `INSERT INTO jornada (fecha, abierta_por, abierta_en, cerrada_por, cerrada_en, "createdAt", "updatedAt")
                 VALUES (:fecha, :id, now(), ${cerrada ? ':id, now()' : 'NULL, NULL'}, now(), now())`,
                { replacements: { fecha, id: idCajero } }
            );
        await expect(insertar('2030-01-01', false)).rejects.toMatchObject({
            parent: expect.objectContaining({ constraint: 'jornada_una_abierta' })
        });
        await expect(insertar(fechaLocal(), true)).rejects.toMatchObject({
            parent: expect.objectContaining({ constraint: 'jornada_un_dia_por_fecha' })
        });
    });
});

describe('D7 · cerrar mientras se abren órdenes (carrera)', () => {
    test('un cierre y 8 aperturas a la vez: nunca queda una orden abierta con el día cerrado', async () => {
        const mesas = await Promise.all(Array.from({ length: 8 }, () => mesaLibre()));
        const [cierre, ...aperturas] = await Promise.all([
            cerrar(cajero),
            ...mesas.map((m, i) => (i % 2 ? cajero : mesero).post('/ordenes').send({ mesa_id: m.id }))
        ]);

        const abiertas = await Orden.count({ where: { finalizado: false } });
        const creadas = aperturas.filter((r) => r.status === 201).length;
        expect(aperturas.every((r) => [201, 409].includes(r.status))).toBe(true);
        expect(abiertas).toBe(creadas);
        if (cierre.status === 200) {
            // El cierre ganó: ninguna apertura pasó
            expect(creadas).toBe(0);
        } else {
            // Alguna apertura llegó antes: el cierre la vio y no cerró
            expect(cierre.status).toBe(409);
            expect(cierre.body.codigo).toBe('ORDENES_ABIERTAS');
            expect((await mesero.get('/jornadas/actual')).body.abierta).toBe(true);
        }
    });

    test('con un cierre en curso, las aperturas esperan al cierre y después reciben 409 (candado FOR SHARE)', async () => {
        // Un cierre "lento": la prueba bloquea la fila de la jornada y la marca cerrada, sin confirmar
        // todavía. Sin el candado, las aperturas leerían el día abierto y crearían órdenes que
        // quedan abiertas con el día ya cerrado.
        const mesas = await Promise.all(Array.from({ length: 4 }, () => mesaLibre()));
        const t = await sequelize.transaction();
        await sequelize.query('SELECT id FROM jornada WHERE cerrada_en IS NULL FOR UPDATE', { transaction: t });
        await sequelize.query(
            'UPDATE jornada SET cerrada_en = now(), cerrada_por = abierta_por WHERE cerrada_en IS NULL',
            { transaction: t }
        );
        const pedidos = Promise.all(mesas.map((m) => mesero.post('/ordenes').send({ mesa_id: m.id })));
        await new Promise((r) => setTimeout(r, 500));
        await t.commit();

        const respuestas = await pedidos;
        expect(respuestas.map((r) => r.status)).toEqual([409, 409, 409, 409]);
        expect(await Orden.count({ where: { finalizado: false } })).toBe(0);
    });

    test('dos cierres a la vez: uno cierra y el otro recibe 409 "no hay un día abierto"', async () => {
        const [a, b] = await Promise.all([cerrar(mesero, 'MESERO'), cerrar(cajero, 'CAJERO')]);
        expect([a.status, b.status].sort()).toEqual([200, 409]);
        expect([a, b].find((r) => r.status === 409).body.message).toMatch(/No hay un día abierto/);
    });
});
