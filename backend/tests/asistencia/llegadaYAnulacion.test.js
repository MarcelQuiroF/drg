'use strict';

// #30: la llegada la registra el propio empleado (RF-43), una sola por día (RN-10, A1) y anular
// una asistencia no la borra; si estaba aprobada, pide la firma de un supervisor (RN-09, A4).
const { comoRol, USUARIOS } = require('../soporte/api');
const { Asistencia, Empleado, Horario, sequelize } = require('../../src/models');
const { QueryTypes } = require('sequelize');

const DIAS_SEMANA = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
const CONTRASENIA = 'drg-prueba-30';
const FIRMA_CAJERO = { ci: USUARIOS.CAJERO.ci, contrasenia: USUARIOS.CAJERO.contrasenia };

let cajero;
let mesero;

beforeAll(async () => {
    cajero = await comoRol('CAJERO');
    mesero = await comoRol('MESERO');
});

let contador = 0;
async function empleadoConHorarioHoy() {
    contador += 1;
    const empleado = await Empleado.create({
        nombre: `Empleado #30 ${contador}`,
        ci: `30000${contador}LP`,
        contrasenia: CONTRASENIA,
        rol: 'MESERO'
    });
    const ahora = new Date();
    const horario = await Horario.create({
        dia: DIAS_SEMANA[ahora.getDay()],
        hora_entrada: ahora.toTimeString().slice(0, 8),
        empleado_id: empleado.id
    });
    return { empleado, horario };
}

const llegada = (api, empleado, horario, extra = {}) =>
    api.post('/asistencias').send({
        empleado_id: empleado.id,
        horario_id: horario.id,
        ci: empleado.ci,
        contrasenia: CONTRASENIA,
        estado: 'PRESENTE',
        ...extra
    });

async function asistenciaAprobada() {
    const { empleado, horario } = await empleadoConHorarioHoy();
    const res = await llegada(cajero, empleado, horario);
    expect(res.status).toBe(201);
    expect((await cajero.put(`/asistencias/${res.body.data.id}/aprobar`).send(FIRMA_CAJERO)).status).toBe(200);
    return { asistencia: res.body.data, empleado, horario };
}

describe('RF-43 · la llegada se registra con las credenciales del propio empleado', () => {
    test('sin CI o sin contraseña del empleado responde 400 y no registra nada', async () => {
        const { empleado, horario } = await empleadoConHorarioHoy();
        const res = await cajero
            .post('/asistencias')
            .send({ empleado_id: empleado.id, horario_id: horario.id, estado: 'PRESENTE' });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/CI y su contraseña/);
        expect(await Asistencia.count({ where: { empleado_id: empleado.id } })).toBe(0);
    });

    test('con la contraseña incorrecta responde 403 (no 401: la sesión de la caja sigue)', async () => {
        const { empleado, horario } = await empleadoConHorarioHoy();
        const res = await llegada(cajero, empleado, horario, { contrasenia: 'otra' });
        expect(res.status).toBe(403);
        expect(await Asistencia.count({ where: { empleado_id: empleado.id } })).toBe(0);
    });

    test('un empleado inactivo no puede registrar su llegada (403)', async () => {
        const { empleado, horario } = await empleadoConHorarioHoy();
        await empleado.update({ activo: false });
        expect((await llegada(cajero, empleado, horario)).status).toBe(403);
    });

    test('con las credenciales de otro empleado que el elegido responde 400', async () => {
        const elegido = await empleadoConHorarioHoy();
        const otro = await empleadoConHorarioHoy();
        const res = await llegada(cajero, elegido.empleado, elegido.horario, { ci: otro.empleado.ci });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(otro.empleado.nombre);
    });

    test('el empleado registrado es el de las credenciales, aunque el body no traiga empleado_id', async () => {
        const { empleado, horario } = await empleadoConHorarioHoy();
        const res = await llegada(mesero, empleado, horario, { empleado_id: undefined });
        expect(res.status).toBe(201);
        expect(res.body.data.empleado_id).toBe(empleado.id);
    });

    test('la contraseña no queda guardada ni vuelve en la respuesta', async () => {
        const { empleado, horario } = await empleadoConHorarioHoy();
        const res = await llegada(cajero, empleado, horario);
        expect(JSON.stringify(res.body)).not.toContain(CONTRASENIA);
    });
});

describe('RN-10 · una sola llegada por empleado y día (A1)', () => {
    test('la segunda responde 409 con un mensaje claro y queda una sola', async () => {
        const { empleado, horario } = await empleadoConHorarioHoy();
        expect((await llegada(cajero, empleado, horario)).status).toBe(201);
        const res = await llegada(mesero, empleado, horario);
        expect(res.status).toBe(409);
        expect(res.body.message).toBe('El empleado ya registró su llegada hoy.');
        expect(await Asistencia.count({ where: { empleado_id: empleado.id } })).toBe(1);
    });

    test('con 6 pedidos a la vez se registra una sola llegada; el resto, 409', async () => {
        const { empleado, horario } = await empleadoConHorarioHoy();
        const respuestas = await Promise.all(Array.from({ length: 6 }, () => llegada(cajero, empleado, horario)));
        const codigos = respuestas.map((r) => r.status).sort();
        expect(codigos).toEqual([201, 409, 409, 409, 409, 409]);
        expect(await Asistencia.count({ where: { empleado_id: empleado.id } })).toBe(1);
    });

    test('la base lo garantiza aunque el INSERT no pase por la API', async () => {
        const { empleado, horario } = await empleadoConHorarioHoy();
        await Asistencia.create({ empleado_id: empleado.id, horario_id: horario.id, estado: 'PRESENTE' });
        await expect(
            Asistencia.create({ empleado_id: empleado.id, horario_id: horario.id, estado: 'PRESENTE' })
        ).rejects.toMatchObject({ name: 'SequelizeUniqueConstraintError' });
    });

    test('el día es el de Bolivia: 23:30 del 24 y 00:30 del 25 son dos días distintos', async () => {
        const { empleado, horario } = await empleadoConHorarioHoy();
        const base = { empleado_id: empleado.id, horario_id: horario.id, estado: 'PRESENTE' };
        // En UTC las dos caen el 25 (03:30 y 04:30): si el índice usara UTC, la segunda chocaría
        await Asistencia.create({ ...base, fecha_hora_llegada: new Date('2026-11-24T23:30:00-04:00') });
        await expect(
            Asistencia.create({ ...base, fecha_hora_llegada: new Date('2026-11-25T00:30:00-04:00') })
        ).resolves.toBeTruthy();
        // y dos del mismo día de Bolivia que en UTC son de días distintos, sí chocan
        const otro = await empleadoConHorarioHoy();
        const base2 = { empleado_id: otro.empleado.id, horario_id: otro.horario.id, estado: 'PRESENTE' };
        await Asistencia.create({ ...base2, fecha_hora_llegada: new Date('2026-11-24T19:00:00-04:00') });
        await expect(
            Asistencia.create({ ...base2, fecha_hora_llegada: new Date('2026-11-24T21:00:00-04:00') })
        ).rejects.toMatchObject({ name: 'SequelizeUniqueConstraintError' });
    });

    test('después de anular la llegada, el empleado puede registrarla otra vez', async () => {
        const { empleado, horario } = await empleadoConHorarioHoy();
        const primera = await llegada(cajero, empleado, horario);
        expect((await cajero.delete(`/asistencias/${primera.body.data.id}`)).status).toBe(200);
        expect((await llegada(cajero, empleado, horario)).status).toBe(201);
        expect(await Asistencia.count({ where: { empleado_id: empleado.id }, paranoid: false })).toBe(2);
    });
});

describe('RN-09 · anular una asistencia no la borra (A4)', () => {
    test('sin aprobar: se anula sin firma y queda marcada con quién la anuló', async () => {
        const { empleado, horario } = await empleadoConHorarioHoy();
        const { body } = await llegada(cajero, empleado, horario);
        const res = await cajero.delete(`/asistencias/${body.data.id}`);
        expect(res.status).toBe(200);
        const fila = await Asistencia.findByPk(body.data.id, { paranoid: false });
        expect(fila.deletedAt).not.toBeNull();
        const cajeroBD = await Empleado.findOne({ where: { ci: USUARIOS.CAJERO.ci } });
        expect(fila.anulada_por).toBe(cajeroBD.id);
        // ya no aparece en las asistencias de hoy
        const hoy = (await cajero.get('/asistencias/hoy')).body;
        expect(hoy.map((a) => a.id)).not.toContain(body.data.id);
    });

    test('aprobada y sin firma: 400 y sigue aprobada y sin anular', async () => {
        const { asistencia } = await asistenciaAprobada();
        const res = await cajero.delete(`/asistencias/${asistencia.id}`);
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/firma/);
        await expect(Asistencia.findByPk(asistencia.id)).resolves.toMatchObject({ aprobado: true });
    });

    test.each([
        ['contraseña incorrecta', { ci: USUARIOS.CAJERO.ci, contrasenia: 'incorrecta' }],
        ['firma de un MESERO (sin asistencia.aprobar)', { ci: USUARIOS.MESERO.ci, contrasenia: 'drg-desarrollo' }]
    ])('aprobada con %s: 403 y no se anula', async (_caso, firma) => {
        const { asistencia } = await asistenciaAprobada();
        expect((await cajero.delete(`/asistencias/${asistencia.id}`).send(firma)).status).toBe(403);
        expect(await Asistencia.findByPk(asistencia.id)).not.toBeNull();
    });

    test('aprobada con la firma del ADMIN: se anula y queda marcada con el ADMIN', async () => {
        const { asistencia } = await asistenciaAprobada();
        const firma = { ci: USUARIOS.ADMIN.ci, contrasenia: USUARIOS.ADMIN.contrasenia };
        expect((await cajero.delete(`/asistencias/${asistencia.id}`).send(firma)).status).toBe(200);
        const fila = await Asistencia.findByPk(asistencia.id, { paranoid: false });
        const adminBD = await Empleado.findOne({ where: { ci: USUARIOS.ADMIN.ci } });
        expect(fila).toMatchObject({ aprobado: true, anulada_por: adminBD.id });
        expect(fila.deletedAt).not.toBeNull();
    });

    test('una asistencia que no existe (o ya anulada) responde 404', async () => {
        expect((await cajero.delete('/asistencias/999999')).status).toBe(404);
        const { empleado, horario } = await empleadoConHorarioHoy();
        const { body } = await llegada(cajero, empleado, horario);
        expect((await cajero.delete(`/asistencias/${body.data.id}`)).status).toBe(200);
        expect((await cajero.delete(`/asistencias/${body.data.id}`)).status).toBe(404);
    });

    test('el MESERO no puede anular (403 por permiso, sin tocar la fila)', async () => {
        const { empleado, horario } = await empleadoConHorarioHoy();
        const { body } = await llegada(cajero, empleado, horario);
        expect((await mesero.delete(`/asistencias/${body.data.id}`)).status).toBe(403);
        expect(await Asistencia.findByPk(body.data.id)).not.toBeNull();
    });

    test('el índice único está en la base, en hora de Bolivia y sin contar las anuladas', async () => {
        const [indice] = await sequelize.query(
            `SELECT indexdef FROM pg_indexes WHERE indexname = 'asistencia_una_llegada_por_dia'`,
            { type: QueryTypes.SELECT }
        );
        expect(indice.indexdef).toMatch(/UNIQUE/);
        expect(indice.indexdef).toMatch(/America\/La_Paz/);
        expect(indice.indexdef).toMatch(/"deletedAt" IS NULL/);
    });
});
