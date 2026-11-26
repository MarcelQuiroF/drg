'use strict';

// Asistencia del personal: registro de llegada, aprobación con firma, anulación, horarios y
// descuento por atraso. Casos A1–A6 y T11 del análisis.
const { comoRol, USUARIOS } = require('../soporte/api');
const { Asistencia, Empleado, Horario, DescuentoAtraso } = require('../../src/models');

const DIAS_SEMANA = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];
const CONTRASENIA = 'drg-desarrollo';

let cajero;
let admin;

beforeAll(async () => {
    cajero = await comoRol('CAJERO');
    admin = await comoRol('ADMIN');
});

const empleado = (rol) => Empleado.findOne({ where: { ci: USUARIOS[rol].ci }, rejectOnEmpty: true });

// Un empleado nuevo, con un horario para hoy que empieza a la hora actual (llega puntual).
// Crearlo por prueba evita que una llegada registrada en otra prueba choque con #30.
let contadorEmpleados = 0;
async function empleadoConHorarioHoy() {
    contadorEmpleados += 1;
    const nuevo = await Empleado.create({
        nombre: `Empleado de prueba ${contadorEmpleados}`,
        ci: `90000${contadorEmpleados}LP`,
        contrasenia: 'no-se-usa',
        rol: 'MESERO'
    });
    const ahora = new Date();
    const horario = await Horario.create({
        dia: DIAS_SEMANA[ahora.getDay()],
        hora_entrada: ahora.toTimeString().slice(0, 8),
        hora_salida: '23:59:00',
        empleado_id: nuevo.id
    });
    return { empleado: nuevo, horario };
}

// La llegada la registra el propio empleado con su CI y contraseña (RF-43, #30). Los empleados
// de prueba se crean con 'no-se-usa'; los del seed, con la contraseña de desarrollo.
async function credencialesDe(empleadoId) {
    const e = await Empleado.findByPk(empleadoId, { rejectOnEmpty: true });
    const delSeed = Object.values(USUARIOS).find((u) => u.ci === e.ci);
    return { ci: e.ci, contrasenia: delSeed ? delSeed.contrasenia : 'no-se-usa' };
}

async function registrarLlegada(datos) {
    const credenciales = datos.empleado_id ? await credencialesDe(datos.empleado_id) : {};
    return cajero.post('/asistencias').send({ estado: 'PRESENTE', ...credenciales, ...datos });
}

async function asistenciaNueva() {
    const { empleado: e, horario } = await empleadoConHorarioHoy();
    const res = await registrarLlegada({ empleado_id: e.id, horario_id: horario.id });
    expect(res.status).toBe(201);
    return res.body.data;
}

describe('Registrar la llegada', () => {
    test('con empleado y horario se registra sin aprobar y aparece en las asistencias de hoy', async () => {
        const asistencia = await asistenciaNueva();
        expect(asistencia.aprobado).toBe(false);
        const hoy = (await cajero.get('/asistencias/hoy')).body;
        expect(hoy.map((a) => a.id)).toContain(asistencia.id);
    });

    test('sin empleado_id o sin estado responde 400', async () => {
        expect((await cajero.post('/asistencias').send({ estado: 'PRESENTE' })).status).toBe(400);
        const { empleado: e } = await empleadoConHorarioHoy();
        expect((await registrarLlegada({ empleado_id: e.id, estado: '' })).status).toBe(400);
    });

    test('A1 · registrar dos veces la llegada del mismo empleado el mismo día responde 409 (#30)', async () => {
        const { empleado: e, horario } = await empleadoConHorarioHoy();
        expect((await registrarLlegada({ empleado_id: e.id, horario_id: horario.id })).status).toBe(201);
        const res = await registrarLlegada({ empleado_id: e.id, horario_id: horario.id });
        expect(res.status).toBe(409); // antes de #30, 201
    });

    test('T11 · un empleado sin horario ese día recibe 400 con un mensaje claro (#28)', async () => {
        const sinHorario = await empleado('ADMIN'); // el seed no le asigna horario
        const res = await registrarLlegada({ empleado_id: sinHorario.id });
        expect(res.status).toBe(400); // antes 500: horario_id es NOT NULL en la base
        expect(res.body.message).toMatch(/horario/i);
    });

    test('A6 · el servidor ignora el descuento por atraso que manda el navegador (#29)', async () => {
        const { empleado: e, horario } = await empleadoConHorarioHoy(); // llega a la hora de entrada
        const descuento = await DescuentoAtraso.findOne({ where: { descuento_porcentual: 100 }, rejectOnEmpty: true });
        const res = await registrarLlegada({ empleado_id: e.id, horario_id: horario.id, descuento_id: descuento.id });
        expect(res.status).toBe(201);
        // RN-01: con menos de 10 min de atraso no hay descuento. Antes de #29 guardaba el −100 % enviado.
        expect(res.body.data.descuento_id).toBeNull();
    });
});

describe('Aprobar la llegada (doble verificación)', () => {
    const aprobar = (id, ci, contrasenia) => cajero.put(`/asistencias/${id}/aprobar`).send({ ci, contrasenia });

    // 403 y no 401: quien aprueba tiene sesión; lo que no sirve es la firma del supervisor (#26)
    test('A2 · con contraseña incorrecta responde 403 y no se aprueba', async () => {
        const asistencia = await asistenciaNueva();
        expect((await aprobar(asistencia.id, USUARIOS.CAJERO.ci, 'incorrecta')).status).toBe(403);
        await expect(Asistencia.findByPk(asistencia.id)).resolves.toMatchObject({ aprobado: false });
    });

    test('A2 · con la firma de un MESERO responde 403 y no se aprueba', async () => {
        const asistencia = await asistenciaNueva();
        expect((await aprobar(asistencia.id, USUARIOS.MESERO.ci, CONTRASENIA)).status).toBe(403);
        await expect(Asistencia.findByPk(asistencia.id)).resolves.toMatchObject({ aprobado: false });
    });

    test('sin CI o sin contraseña responde 400', async () => {
        const asistencia = await asistenciaNueva();
        expect((await aprobar(asistencia.id, USUARIOS.CAJERO.ci, '')).status).toBe(400);
    });

    test.each(['ADMIN', 'CAJERO'])('A3 · con la firma del %s responde 200 y queda aprobada', async (rol) => {
        const asistencia = await asistenciaNueva();
        expect((await aprobar(asistencia.id, USUARIOS[rol].ci, CONTRASENIA)).status).toBe(200);
        await expect(Asistencia.findByPk(asistencia.id)).resolves.toMatchObject({ aprobado: true });
    });
});

describe('Anular una asistencia', () => {
    test('una asistencia sin aprobar se puede quitar para devolver al empleado a la lista', async () => {
        const asistencia = await asistenciaNueva();
        expect((await cajero.delete(`/asistencias/${asistencia.id}`)).status).toBe(200);
        expect(await Asistencia.findByPk(asistencia.id)).toBeNull();
        // RN-09: queda anulada, no borrada (#30)
        expect(await Asistencia.findByPk(asistencia.id, { paranoid: false })).not.toBeNull();
    });

    test('A4 · una asistencia aprobada no se puede borrar sin firma (#30)', async () => {
        const asistencia = await asistenciaNueva();
        await cajero
            .put(`/asistencias/${asistencia.id}/aprobar`)
            .send({ ci: USUARIOS.CAJERO.ci, contrasenia: CONTRASENIA });
        const res = await cajero.delete(`/asistencias/${asistencia.id}`);
        expect(res.status).toBeGreaterThanOrEqual(400); // antes de #30, 200
        // RN-09: se anula sin borrar; antes desaparecía por el borrado físico
        expect(await Asistencia.findByPk(asistencia.id, { paranoid: false })).not.toBeNull();
    });
});

describe('Horarios del empleado', () => {
    async function guardarHorarios(e, horarios) {
        const res = await admin.put(`/empleados/${e.id}`).send({ horarios });
        expect(res.status).toBe(200);
    }

    test.failing('A5 · guardar un horario con hora de salida conserva entrada y salida (#61)', async () => {
        const { empleado: e } = await empleadoConHorarioHoy();
        await guardarHorarios(e, [{ dia: 'LUNES', hora_entrada: '05:00:00', hora_salida: '13:00:00' }]);
        const guardado = await Horario.findOne({ where: { empleado_id: e.id, dia: 'LUNES' }, rejectOnEmpty: true });
        expect(guardado.hora_entrada).toBe('05:00:00');
        expect(guardado.hora_salida).toBe('13:00:00'); // hoy null
    });

    test.failing(
        'editar los horarios no deja asistencias anteriores apuntando a un horario borrado (#61)',
        async () => {
            const { empleado: e, horario } = await empleadoConHorarioHoy();
            expect((await registrarLlegada({ empleado_id: e.id, horario_id: horario.id })).status).toBe(201);
            await guardarHorarios(e, [{ dia: horario.dia, hora_entrada: '08:00:00', hora_salida: '16:00:00' }]);
            expect(await Horario.findByPk(horario.id)).not.toBeNull(); // hoy null: destroy + bulkCreate
        }
    );
});
