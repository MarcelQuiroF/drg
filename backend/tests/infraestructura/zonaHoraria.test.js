'use strict';

// Zona horaria del negocio (#27). Las pruebas arrancan en UTC (tests/soporte/entorno.js), como el
// CI: si la aplicación no pusiera sola la zona America/La_Paz, estas pruebas fallarían. Se usan
// horas cercanas a las 20:00 (cuando en UTC ya es el día siguiente) y a la medianoche.
const { comoRol, cobrarEnEfectivo } = require('../soporte/api');
const { producto, juego, mesaLibre, fecharOrden } = require('../soporte/datos');
const { fechaLocal, inicioDelDia, finDelDia } = require('../../src/utils/fechas');
const { Asistencia, Empleado, Horario, ContenedorJuego, Reserva, Cliente, sequelize } = require('../../src/models');

const ZONA = 'America/La_Paz';

// Hora del reloj en Bolivia, con Intl (no depende de la zona del proceso)
const relojBolivia = (fecha = new Date()) =>
    new Intl.DateTimeFormat('en-GB', { timeZone: ZONA, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(
        fecha
    );
const diaBolivia = (fecha = new Date()) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
        fecha
    );
const minutosDelDia = (hhmm) => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
// Diferencia en minutos entre dos horas del reloj, teniendo en cuenta la medianoche
const distancia = (a, b) => {
    const d = Math.abs(minutosDelDia(a) - minutosDelDia(b));
    return Math.min(d, 24 * 60 - d);
};

describe('El servidor trabaja en la hora de Bolivia', () => {
    test('config/env.js fija TZ=America/La_Paz aunque el proceso arranque en UTC', () => {
        expect(process.env.TZ).toBe(ZONA);
        // 25/11 a las 21:00 en Bolivia = 26/11 a la 01:00 UTC
        expect(new Date('2026-11-26T01:00:00Z').getHours()).toBe(21);
    });

    test('la conexión de Sequelize usa la misma zona', async () => {
        const [fila] = await sequelize.query("SELECT current_setting('TimeZone') AS zona", {
            type: sequelize.QueryTypes.SELECT
        });
        expect(fila.zona).toBe(ZONA);
    });

    test.each([
        ['21:00 del 25/11 (01:00 UTC del 26)', '2026-11-26T01:00:00Z', '2026-11-25'],
        ['20:00 del 25/11 (00:00 UTC del 26)', '2026-11-26T00:00:00Z', '2026-11-25'],
        ['19:59 del 25/11', '2026-11-25T23:59:00Z', '2026-11-25'],
        ['23:59 del 25/11', '2026-11-26T03:59:00Z', '2026-11-25'],
        ['00:00 del 26/11', '2026-11-26T04:00:00Z', '2026-11-26'],
        ['00:30 del 26/11 (04:30 UTC)', '2026-11-26T04:30:00Z', '2026-11-26']
    ])('fechaLocal: las %s es el día %s', (_caso, instante, dia) => {
        expect(fechaLocal(new Date(instante))).toBe(dia); // con toISOString daba el día UTC
    });

    test('inicioDelDia y finDelDia: el día 25 va de 04:00 UTC del 25 a 03:59:59.999 UTC del 26', () => {
        expect(inicioDelDia('2026-11-25').toISOString()).toBe('2026-11-25T04:00:00.000Z');
        expect(finDelDia('2026-11-25').toISOString()).toBe('2026-11-26T03:59:59.999Z');
    });

    test('una fecha que no es AAAA-MM-DD responde 400 en el dashboard', async () => {
        const admin = await comoRol('ADMIN');
        const res = await admin.get('/reportes/dashboard').query({ inicio: '25/11/2026', fin: '2026-11-25' });
        expect(res.status).toBe(400);
    });
});

describe('Dashboard: una venta a las 21:00 cae en el día de hoy', () => {
    test('se cuenta en el 25/11 y no en el 26/11; la gráfica la pone en el 25', async () => {
        const mesero = await comoRol('MESERO');
        const admin = await comoRol('ADMIN');
        const mesa = await mesaLibre();
        const orden = (await mesero.post('/ordenes').send({ mesa_id: mesa.id })).body.orden;
        const cappuccino = await producto('Cappuccino');
        await mesero.post('/ordenes-productos').send({ orden_id: orden.id, producto_id: cappuccino.id, cantidad: 1 });
        expect((await cobrarEnEfectivo(mesero, orden.id)).status).toBe(200);
        // La venta se hizo el 25/11 a las 21:00 en Bolivia (= 26/11 01:00 UTC)
        await fecharOrden(orden.id, '2026-11-25T21:00:00-04:00');

        const dia25 = (await admin.get('/reportes/dashboard').query({ inicio: '2026-11-25', fin: '2026-11-25' })).body;
        expect(dia25.totales.ingresos).toBe(18); // antes 0: caía en el 26
        expect(dia25.graficas.etiquetas).toEqual(['2026-11-25']); // antes '2026-11-26'

        const dia26 = (await admin.get('/reportes/dashboard').query({ inicio: '2026-11-26', fin: '2026-11-26' })).body;
        expect(dia26.totales.ingresos).toBe(0); // antes 18
    });
});

describe('Asistencias de hoy', () => {
    test('incluye las llegadas de hoy a las 00:30 y a las 21:30, y no la de ayer a las 22:00', async () => {
        const nuevo = await Empleado.create({
            nombre: 'Empleado zona horaria',
            ci: '9100001LP',
            contrasenia: 'no-se-usa',
            rol: 'MESERO'
        });
        const horario = await Horario.create({ dia: 'LUNES', hora_entrada: '08:00:00', empleado_id: nuevo.id });
        const hoy = diaBolivia();
        const ayer = diaBolivia(new Date(new Date(`${hoy}T12:00:00-04:00`).getTime() - 24 * 60 * 60 * 1000));
        const llegada = (instante, e = nuevo, h = horario) =>
            Asistencia.create({
                empleado_id: e.id,
                horario_id: h.id,
                estado: 'PRESENTE',
                fecha_hora_llegada: new Date(instante)
            });
        // Desde #30 hay una sola llegada por empleado y día: la de la noche es de otro empleado
        const otro = await Empleado.create({
            nombre: 'Otro',
            ci: '9100002LP',
            contrasenia: 'no-se-usa',
            rol: 'MESERO'
        });
        const horarioOtro = await Horario.create({ dia: 'LUNES', hora_entrada: '08:00:00', empleado_id: otro.id });
        const temprano = await llegada(`${hoy}T00:30:00-04:00`);
        const noche = await llegada(`${hoy}T21:30:00-04:00`, otro, horarioOtro);
        const deAyer = await llegada(`${ayer}T22:00:00-04:00`);

        const cajero = await comoRol('CAJERO');
        const ids = (await cajero.get('/asistencias/hoy')).body.map((a) => a.id);
        // En UTC el "hoy" del servidor iba de 20:00 de ayer a 19:59 de hoy (hora de Bolivia)
        expect(ids).toContain(temprano.id);
        expect(ids).toContain(noche.id);
        expect(ids).not.toContain(deAyer.id);
    });
});

describe('Juegos en la orden: hora de inicio y de fin', () => {
    test('hora_inicio y hora_fin se guardan en la hora de Bolivia', async () => {
        const mesero = await comoRol('MESERO');
        const mesa = await mesaLibre();
        const orden = (await mesero.post('/ordenes').send({ mesa_id: mesa.id })).body.orden;
        const catan = await juego('Catan');
        const res = await mesero.post('/ordenes-juegos').send({ orden_id: orden.id, juego_id: catan.id, cantidad: 1 });
        expect(res.status).toBe(201);
        // antes: la hora UTC del proceso (4 horas adelantada)
        expect(distancia(res.body.hora_inicio.slice(0, 5), relojBolivia())).toBeLessThanOrEqual(1);

        const fin = await mesero.patch(`/ordenes-juegos/${res.body.id}/terminar`);
        expect(fin.status).toBe(200);
        const guardado = await ContenedorJuego.findByPk(res.body.id);
        // antes: un Date completo convertido en UTC
        expect(guardado.hora_fin).toMatch(/^\d{2}:\d{2}:\d{2}$/);
        expect(distancia(guardado.hora_fin.slice(0, 5), relojBolivia())).toBeLessThanOrEqual(1);
    });
});

describe('Reservas: la hora que se elige en la pantalla es hora de Bolivia', () => {
    test('una reserva para mañana a las 19:00 se guarda como 23:00 UTC', async () => {
        const mesero = await comoRol('MESERO');
        const mesa = await mesaLibre();
        const cliente = await Cliente.create({ nombre: 'Cliente zona horaria', ci: '9100002', telefono: '60000099' });
        const hoy = diaBolivia();
        const manana = diaBolivia(new Date(new Date(`${hoy}T12:00:00-04:00`).getTime() + 24 * 60 * 60 * 1000));
        // Lo que manda reservas.js: fecha y hora del formulario, sin zona
        const res = await mesero
            .post('/reservas')
            .send({ cliente_id: cliente.id, mesa_id: mesa.id, hora: `${manana}T19:00:00` });
        expect(res.status).toBe(201);
        const reserva = await Reserva.findOne({ where: { cliente_id: cliente.id } });
        expect(reserva.hora.toISOString()).toBe(`${manana}T23:00:00.000Z`); // antes 19:00 UTC (15:00 en Bolivia)
    });
});
