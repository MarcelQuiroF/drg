'use strict';

// Atraso y descuento calculados en el servidor (RN-01, #29). La tabla es la del seed:
// desde 00:10:00 → −10 %, desde 00:20:00 → −20 %, desde 00:25:01 (más de 25 min) → −100 %.
// cantidad_tiempo es el atraso MÍNIMO desde el que se aplica (inclusive).
const { comoRol } = require('../soporte/api');
const { Empleado, Horario, DescuentoAtraso } = require('../../src/models');
const { fechaLocal } = require('../../src/utils/fechas');
const { segundosDeAtraso, descuentoQueCorresponde, diaDeLaSemana } = require('../../src/utils/atraso');
const reloj = require('../../src/utils/reloj');

const CONTRASENIA = 'drg-prueba-29';
const HORA_ENTRADA = '10:00:00';

let cajero;
let tabla;
let porPorcentaje;

beforeAll(async () => {
    cajero = await comoRol('CAJERO');
    tabla = await DescuentoAtraso.findAll();
    porPorcentaje = Object.fromEntries(tabla.map((d) => [d.descuento_porcentual, d]));
});

afterEach(() => jest.restoreAllMocks());

// Hoy (en Bolivia) a la hora indicada. Sin "Z": se lee en la zona del negocio (#27).
const hoyALas = (hora) => new Date(`${fechaLocal()}T${hora}`);

const porcentajeDe = (segundos) => descuentoQueCorresponde(segundos, tabla)?.descuento_porcentual ?? 0;

describe('Cálculo (funciones puras) en los bordes de RN-01', () => {
    test.each([
        ['09:55:00', 'llega 5 min antes', 0, 0],
        ['10:00:00', 'llega a la hora exacta', 0, 0],
        ['10:09:59', '9:59 de atraso', 599, 0],
        ['10:10:00', '10:00 de atraso', 600, 10],
        ['10:19:59', '19:59 de atraso', 1199, 10],
        ['10:20:00', '20:00 de atraso', 1200, 20],
        ['10:25:00', '25:00 de atraso', 1500, 20],
        ['10:25:01', '25:01 de atraso', 1501, 100],
        ['13:00:00', '3 horas de atraso', 10800, 100]
    ])('llegada a las %s (%s) → %i s, −%i %%', (hora, _caso, segundos, porcentaje) => {
        expect(segundosDeAtraso(hoyALas(hora), HORA_ENTRADA)).toBe(segundos);
        expect(porcentajeDe(segundos)).toBe(porcentaje);
    });

    test('los milisegundos no redondean hacia arriba: 9:59.999 sigue sin descuento', () => {
        const llegada = new Date(hoyALas('10:09:59').getTime() + 999);
        expect(segundosDeAtraso(llegada, HORA_ENTRADA)).toBe(599);
    });

    test('el orden de las filas de la tabla no cambia el resultado', () => {
        const invertida = [...tabla].reverse();
        expect(descuentoQueCorresponde(1501, invertida).descuento_porcentual).toBe(100);
        expect(descuentoQueCorresponde(1200, invertida).descuento_porcentual).toBe(20);
    });

    test('sin tabla cargada no hay descuento', () => {
        expect(descuentoQueCorresponde(5000, [])).toBeNull();
    });
});

describe('POST /asistencias calcula el descuento con la hora del servidor', () => {
    let contador = 0;

    // Empleado nuevo con un horario de hoy a las 10:00. Manda también su CI y contraseña: hoy el
    // servidor las ignora, y así la prueba sigue sirviendo cuando la llegada las exija (RF-43, #30).
    async function empleadoConEntradaALas10() {
        contador += 1;
        const empleado = await Empleado.create({
            nombre: `Empleado atraso ${contador}`,
            ci: `29000${contador}LP`,
            contrasenia: CONTRASENIA,
            rol: 'MESERO'
        });
        const horario = await Horario.create({
            dia: diaDeLaSemana(new Date()),
            hora_entrada: HORA_ENTRADA,
            empleado_id: empleado.id
        });
        return { empleado, horario };
    }

    async function llegarALas(hora, extra = {}) {
        const { empleado, horario } = await empleadoConEntradaALas10();
        jest.spyOn(reloj, 'ahora').mockReturnValue(hoyALas(hora));
        const res = await cajero.post('/asistencias').send({
            empleado_id: empleado.id,
            horario_id: horario.id,
            ci: empleado.ci,
            contrasenia: CONTRASENIA,
            estado: 'PRESENTE',
            ...extra
        });
        return { res, empleado };
    }

    test.each([
        ['09:55:00', 0, null],
        ['10:09:59', 9, null],
        ['10:10:00', 10, 10],
        ['10:25:00', 25, 20],
        ['10:25:01', 25, 100]
    ])('llegada a las %s → %i min y descuento %p', async (hora, minutos, porcentaje) => {
        const { res } = await llegarALas(hora);
        expect(res.status).toBe(201);
        expect(res.body.atraso).toMatchObject({ minutos, descuento_porcentual: porcentaje ?? 0 });
        expect(res.body.data.descuento_id).toBe(porcentaje ? porPorcentaje[porcentaje].id : null);
        // La hora de llegada guardada es la del servidor
        expect(new Date(res.body.data.fecha_hora_llegada).getTime()).toBe(hoyALas(hora).getTime());
    });

    test('A6 · llega antes de la hora y manda el −100 %: queda sin descuento', async () => {
        const { res } = await llegarALas('09:58:00', { descuento_id: porPorcentaje[100].id });
        expect(res.status).toBe(201);
        expect(res.body.data.descuento_id).toBeNull();
    });

    test('llega 30 min tarde y manda "sin descuento": se le aplica el −100 %', async () => {
        const { res } = await llegarALas('10:30:00', { descuento_id: null });
        expect(res.status).toBe(201);
        expect(res.body.data.descuento_id).toBe(porPorcentaje[100].id);
    });

    test('las asistencias de hoy traen el descuento que calculó el servidor', async () => {
        const { res } = await llegarALas('10:21:00');
        const hoy = (await cajero.get('/asistencias/hoy')).body;
        const registrada = hoy.find((a) => a.id === res.body.data.id);
        expect(registrada.DescuentoAtraso).toMatchObject({ descuento_porcentual: 20 });
    });

    test('FALTA y PERMISO no se calculan como llegada tarde (⚠ P-07)', async () => {
        for (const estado of ['FALTA', 'PERMISO']) {
            const { res } = await llegarALas('11:00:00', { estado });
            expect(res.status).toBe(201);
            expect(res.body.data.descuento_id).toBeNull();
        }
    });

    test('un horario de otro día de la semana responde 400', async () => {
        const { empleado, horario } = await empleadoConEntradaALas10();
        const manana = new Date(Date.now() + 24 * 3600 * 1000);
        await horario.update({ dia: diaDeLaSemana(manana) });
        const res = await cajero.post('/asistencias').send({
            empleado_id: empleado.id,
            horario_id: horario.id,
            ci: empleado.ci,
            contrasenia: CONTRASENIA,
            estado: 'PRESENTE'
        });
        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/no de hoy/);
    });
});
