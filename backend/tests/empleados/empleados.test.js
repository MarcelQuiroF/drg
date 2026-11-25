'use strict';

// Empleados: rol válido y el último administrador activo (#109).
// El seed deja un solo ADMIN (1234567LP), un CAJERO y un MESERO.
const { comoRol, anonimo, USUARIOS } = require('../soporte/api');
const { Empleado } = require('../../src/models');

let admin;

beforeAll(async () => {
    admin = await comoRol('ADMIN');
});

const empleadoPorCi = (ci) => Empleado.findOne({ where: { ci } });
const adminDelSeed = () => empleadoPorCi(USUARIOS.ADMIN.ci);

let siguienteCi = 7000000;
async function crear(rol, datos = {}) {
    siguienteCi += 1;
    const res = await admin.post('/empleados').send({
        nombre: `Empleado ${rol} ${siguienteCi}`,
        ci: `${siguienteCi}LP`,
        contrasenia: 'una-contrasenia',
        rol,
        ...datos
    });
    expect(res.status).toBe(201);
    return Empleado.findByPk(res.body.data.id);
}

// Lo que manda el formulario de empleados al guardar (adminEmpleados.js)
const cuerpoDelFormulario = (emp, cambios = {}) => ({
    nombre: emp.nombre,
    ci: emp.ci,
    telefono: emp.telefono,
    rol: emp.rol,
    activo: emp.activo,
    horarios: [],
    correo: emp.correo,
    ...cambios
});

describe('Rol del empleado', () => {
    test('editar al ADMIN cambiando solo la contraseña conserva el rol y la contraseña nueva funciona (#109)', async () => {
        const emp = await adminDelSeed();
        const res = await admin
            .put(`/empleados/${emp.id}`)
            .send(cuerpoDelFormulario(emp, { contrasenia: 'nueva-del-admin' }));
        expect(res.status).toBe(200);
        expect((await adminDelSeed()).rol).toBe('ADMIN');

        const login = await anonimo.post('/auth/login').send({ ci: emp.ci, contrasenia: 'nueva-del-admin' });
        expect(login.status).toBe(200);
        expect(login.body.empleado.rol).toBe('ADMIN');

        // Deja la contraseña del seed para el resto del archivo
        await admin.put(`/empleados/${emp.id}`).send({ contrasenia: USUARIOS.ADMIN.contrasenia });
    });

    test.each([
        ['vacío (lo que mandaba el formulario sin la opción ADMIN)', ''],
        ['COCINERO, que no es un rol del sistema', 'COCINERO'],
        ['en minúsculas', 'admin'],
        ['nulo', null]
    ])('PUT con un rol %s responde 400 y no cambia el rol (#109)', async (_caso, rol) => {
        const emp = await adminDelSeed();
        const res = await admin.put(`/empleados/${emp.id}`).send(cuerpoDelFormulario(emp, { rol }));
        expect(res.status).toBe(400);
        expect((await adminDelSeed()).rol).toBe('ADMIN');
    });

    test.each(['', 'COCINERO', 'cajero'])(
        'POST con el rol "%s" responde 400 y no crea el empleado (#109)',
        async (rol) => {
            const res = await admin.post('/empleados').send({
                nombre: 'Rol inválido',
                ci: `rol-${rol || 'vacio'}`,
                contrasenia: 'una-contrasenia',
                rol
            });
            expect(res.status).toBe(400);
            expect(await empleadoPorCi(`rol-${rol || 'vacio'}`)).toBeNull();
        }
    );

    test.each(['ADMIN', 'CAJERO', 'MESERO'])('POST con el rol %s crea el empleado', async (rol) => {
        const emp = await crear(rol);
        expect(emp.rol).toBe(rol);
        if (rol === 'ADMIN') await emp.update({ activo: false }); // no cuenta para las pruebas de abajo
    });

    test('"activo" que no es booleano responde 400 (#109)', async () => {
        const emp = await adminDelSeed();
        const res = await admin.put(`/empleados/${emp.id}`).send({ activo: 'false' });
        expect(res.status).toBe(400);
        expect((await adminDelSeed()).activo).toBe(true);
    });
});

describe('Último administrador activo (#109)', () => {
    test('con un solo ADMIN activo no se le puede quitar el rol: 409', async () => {
        const emp = await adminDelSeed();
        const res = await admin.put(`/empleados/${emp.id}`).send(cuerpoDelFormulario(emp, { rol: 'CAJERO' }));
        expect(res.status).toBe(409);
        expect((await adminDelSeed()).rol).toBe('ADMIN');
    });

    test('con un solo ADMIN activo no se lo puede desactivar: 409 (botón de anular y formulario)', async () => {
        const emp = await adminDelSeed();
        expect((await admin.put(`/empleados/${emp.id}`).send({ activo: false })).status).toBe(409);
        expect((await admin.put(`/empleados/${emp.id}`).send(cuerpoDelFormulario(emp, { activo: false }))).status).toBe(
            409
        );
        expect((await adminDelSeed()).activo).toBe(true);
    });

    test('un ADMIN inactivo no cuenta: sigue siendo el último activo', async () => {
        const inactivo = await crear('ADMIN');
        await inactivo.update({ activo: false });
        const emp = await adminDelSeed();
        expect((await admin.put(`/empleados/${emp.id}`).send({ rol: 'MESERO' })).status).toBe(409);
    });

    test('con dos ADMIN activos se le puede quitar el rol a uno, pero no al que queda', async () => {
        const segundo = await crear('ADMIN');
        expect((await admin.put(`/empleados/${segundo.id}`).send({ rol: 'CAJERO' })).status).toBe(200);
        expect((await Empleado.findByPk(segundo.id)).rol).toBe('CAJERO');

        const emp = await adminDelSeed();
        expect((await admin.put(`/empleados/${emp.id}`).send({ rol: 'CAJERO' })).status).toBe(409);
    });

    test('con dos ADMIN activos se puede desactivar a uno', async () => {
        const segundo = await crear('ADMIN');
        expect((await admin.put(`/empleados/${segundo.id}`).send({ activo: false })).status).toBe(200);
        expect((await Empleado.findByPk(segundo.id)).activo).toBe(false);
    });

    test('dos ADMIN que se quitan el rol al mismo tiempo: uno queda como ADMIN (200 y 409, sin deadlock)', async () => {
        const segundo = await crear('ADMIN');
        const primero = await adminDelSeed();
        const respuestas = await Promise.all([
            admin.put(`/empleados/${primero.id}`).send({ rol: 'CAJERO' }),
            admin.put(`/empleados/${segundo.id}`).send({ rol: 'CAJERO' })
        ]);
        expect(respuestas.map((r) => r.status).sort()).toEqual([200, 409]);
        expect(await Empleado.count({ where: { rol: 'ADMIN', activo: true } })).toBe(1);

        // Deja al ADMIN del seed como único administrador activo
        await Empleado.update({ rol: 'ADMIN' }, { where: { id: primero.id } });
        await Empleado.update({ rol: 'CAJERO' }, { where: { id: segundo.id } });
    });

    test('cambiar el rol de un empleado que no es ADMIN no necesita otro administrador', async () => {
        const cajero = await empleadoPorCi(USUARIOS.CAJERO.ci);
        expect((await admin.put(`/empleados/${cajero.id}`).send({ rol: 'MESERO' })).status).toBe(200);
        expect((await admin.put(`/empleados/${cajero.id}`).send({ rol: 'CAJERO' })).status).toBe(200);
    });
});
