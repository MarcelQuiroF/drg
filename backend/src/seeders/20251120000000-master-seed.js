'use strict';

/**
 * Datos iniciales de desarrollo para DRG – Mesa Dragón.
 *
 * - Todo se inserta dentro de una transacción: si algo falla, la base queda
 *   como estaba (antes quedaba cargada a medias).
 * - No se pasan IDs fijos: PostgreSQL los asigna con sus secuencias, así que
 *   después del seed se pueden crear registros nuevos sin "id must be unique".
 * - Los datos son ficticios. Las credenciales son SOLO para desarrollo: en el
 *   local hay que cambiar las contraseñas al instalar.
 */

const bcrypt = require('bcrypt');

// Contraseña inicial de desarrollo de los tres usuarios (ver README, "Primer ingreso").
const CONTRASENIA_DESARROLLO = 'drg-desarrollo';

const PISOS = [
    { nombre: 'Planta Baja', numero: 0 },
    { nombre: 'Primer Piso', numero: 1 }
];

const MESAS = [
    { nombre: 'Mesa 1 (Ventana)', numero: 1, piso: 0, cantidadMinima: 2, cantidadMaxima: 4 },
    { nombre: 'Mesa 2 (Barra)', numero: 2, piso: 0, cantidadMinima: 1, cantidadMaxima: 2 },
    { nombre: 'Mesa 3 (Sillones)', numero: 3, piso: 1, cantidadMinima: 4, cantidadMaxima: 6 }
];

const CATEGORIAS = ['Estrategia', 'Party Games', 'Cafetería', 'Comida'];

const JUEGOS = [
    { nombre: 'Catan', precio: 25.0, jugadores_min: 3, jugadores_max: 4, tiempo_partida: 90, categoria: 'Estrategia' },
    {
        nombre: 'Exploding Kittens',
        precio: 10.0,
        jugadores_min: 2,
        jugadores_max: 5,
        tiempo_partida: 15,
        categoria: 'Party Games'
    }
];

// Solo las zonas COCINA y CAFETERIA: son las que muestra el POS (#32).
const PRODUCTOS = [
    { nombre: 'Cappuccino', zona: 'CAFETERIA', precio: 18.0, categoria: 'Cafetería' },
    { nombre: 'Sandwich de Pollo', zona: 'COCINA', precio: 35.0, categoria: 'Comida' }
];

const EMPLEADOS = [
    {
        nombre: 'Admin Mesa Dragon',
        ci: '1234567LP',
        telefono: '70000001',
        correo: 'admin@mesadragon.test',
        rol: 'ADMIN'
    },
    {
        nombre: 'Cajero de Prueba',
        ci: '2345678LP',
        telefono: '70000002',
        correo: 'cajero@mesadragon.test',
        rol: 'CAJERO'
    },
    {
        nombre: 'Mesero de Prueba',
        ci: '3456789LP',
        telefono: '70000003',
        correo: 'mesero@mesadragon.test',
        rol: 'MESERO'
    }
];

// Los días se guardan como los usa el frontend (asistencia.js, admin-empleados.html).
const DIAS_LABORALES = ['MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO', 'DOMINGO'];
const HORARIOS = [
    { ci: '2345678LP', hora_entrada: '14:00:00', hora_salida: '22:00:00' },
    { ci: '3456789LP', hora_entrada: '15:00:00', hora_salida: '23:00:00' }
];

// RN-01: descuento sobre el pago diario desde que se cruza cada umbral.
// cantidad_tiempo es el atraso mínimo desde el que se aplica (inclusive):
// desde 10 min −10 %, desde 20 min −20 % y más de 25 min no se paga el día.
const DESCUENTOS_ATRASO = [
    { cantidad_tiempo: '00:10:00', descuento_porcentual: 10 },
    { cantidad_tiempo: '00:20:00', descuento_porcentual: 20 },
    { cantidad_tiempo: '00:25:01', descuento_porcentual: 100 }
];

const CONFIGURACION = [
    {
        clave: 'minutos_tolerancia',
        valor: 30,
        descripcion: 'Minutos de espera antes de liberar una mesa reservada (RN-02)'
    },
    {
        clave: 'ventana_llegada',
        valor: 30,
        descripcion: 'Minutos antes de la reserva en que la mesa pasa a reservada (RN-12)'
    },
    {
        clave: 'ventana_bloqueo',
        valor: 120,
        descripcion: 'Separación mínima en minutos entre dos reservas de la misma mesa (RN-12, valor de prueba)'
    }
];

const CLIENTES = [{ nombre: 'Cliente de Prueba', ci: '9988776', telefono: '60000001' }];

const fechas = () => {
    const ahora = new Date();
    return { createdAt: ahora, updatedAt: ahora };
};

// Inserta filas y devuelve las filas creadas (con su id).
async function insertar(queryInterface, tabla, filas, transaction) {
    return queryInterface.bulkInsert(
        tabla,
        filas.map((f) => ({ ...f, ...fechas() })),
        { transaction, returning: true }
    );
}

const porNombre = (filas) => Object.fromEntries(filas.map((f) => [f.nombre, f.id]));

module.exports = {
    async up(queryInterface) {
        const hash = await bcrypt.hash(CONTRASENIA_DESARROLLO, 10);

        await queryInterface.sequelize.transaction(async (transaction) => {
            const pisos = await insertar(
                queryInterface,
                'piso',
                PISOS.map((p) => ({ ...p, activo: true })),
                transaction
            );
            const pisoPorNumero = Object.fromEntries(pisos.map((p) => [p.numero, p.id]));

            await insertar(
                queryInterface,
                'mesa',
                MESAS.map(({ piso, ...m }) => ({
                    ...m,
                    estado: 0,
                    activo: true,
                    piso_id: pisoPorNumero[piso]
                })),
                transaction
            );

            const categorias = porNombre(
                await insertar(
                    queryInterface,
                    'categoria',
                    CATEGORIAS.map((nombre) => ({ nombre })),
                    transaction
                )
            );

            const juegos = porNombre(
                await insertar(
                    queryInterface,
                    'juego',
                    JUEGOS.map(({ categoria, ...j }) => ({
                        ...j,
                        activado: true
                    })),
                    transaction
                )
            );
            await insertar(
                queryInterface,
                'juego_categoria',
                JUEGOS.map((j) => ({
                    juego_id: juegos[j.nombre],
                    categoria_id: categorias[j.categoria]
                })),
                transaction
            );

            const productos = porNombre(
                await insertar(
                    queryInterface,
                    'producto',
                    PRODUCTOS.map(({ categoria, ...p }) => ({
                        ...p,
                        activado: true,
                        estado: true
                    })),
                    transaction
                )
            );
            await insertar(
                queryInterface,
                'producto_categoria',
                PRODUCTOS.map((p) => ({
                    producto_id: productos[p.nombre],
                    categoria_id: categorias[p.categoria]
                })),
                transaction
            );

            const empleados = await insertar(
                queryInterface,
                'empleado',
                EMPLEADOS.map((e) => ({
                    ...e,
                    contrasenia: hash,
                    activo: true
                })),
                transaction
            );
            const empleadoPorCi = Object.fromEntries(empleados.map((e) => [e.ci, e.id]));

            await insertar(
                queryInterface,
                'horario',
                HORARIOS.flatMap(({ ci, ...h }) =>
                    DIAS_LABORALES.map((dia) => ({
                        ...h,
                        dia,
                        empleado_id: empleadoPorCi[ci]
                    }))
                ),
                transaction
            );

            await insertar(
                queryInterface,
                'descuento_atraso',
                DESCUENTOS_ATRASO.map((d) => ({ ...d, descuento: 0 })),
                transaction
            );
            await insertar(queryInterface, 'configuracion', CONFIGURACION, transaction);
            await insertar(queryInterface, 'cliente', CLIENTES, transaction);
        });
    },

    // Borra solo lo que insertó este seed (no vacía las tablas).
    async down(queryInterface, Sequelize) {
        const { Op } = Sequelize;
        const cis = EMPLEADOS.map((e) => e.ci);

        await queryInterface.sequelize.transaction(async (transaction) => {
            const opciones = { transaction };
            const [empleados] = await queryInterface.sequelize.query('SELECT id FROM empleado WHERE ci IN (:cis)', {
                replacements: { cis },
                transaction
            });
            const idsEmpleados = empleados.map((e) => e.id);
            if (idsEmpleados.length > 0) {
                await queryInterface.bulkDelete('horario', { empleado_id: { [Op.in]: idsEmpleados } }, opciones);
            }
            await queryInterface.bulkDelete('empleado', { ci: { [Op.in]: cis } }, opciones);
            await queryInterface.bulkDelete('cliente', { ci: { [Op.in]: CLIENTES.map((c) => c.ci) } }, opciones);
            await queryInterface.bulkDelete(
                'configuracion',
                { clave: { [Op.in]: CONFIGURACION.map((c) => c.clave) } },
                opciones
            );
            await queryInterface.bulkDelete(
                'descuento_atraso',
                {
                    cantidad_tiempo: { [Op.in]: DESCUENTOS_ATRASO.map((d) => d.cantidad_tiempo) }
                },
                opciones
            );

            const [productos] = await queryInterface.sequelize.query(
                'SELECT id FROM producto WHERE nombre IN (:nombres)',
                { replacements: { nombres: PRODUCTOS.map((p) => p.nombre) }, transaction }
            );
            const [juegos] = await queryInterface.sequelize.query('SELECT id FROM juego WHERE nombre IN (:nombres)', {
                replacements: { nombres: JUEGOS.map((j) => j.nombre) },
                transaction
            });
            if (productos.length > 0) {
                await queryInterface.bulkDelete(
                    'producto_categoria',
                    { producto_id: { [Op.in]: productos.map((p) => p.id) } },
                    opciones
                );
            }
            if (juegos.length > 0) {
                await queryInterface.bulkDelete(
                    'juego_categoria',
                    { juego_id: { [Op.in]: juegos.map((j) => j.id) } },
                    opciones
                );
            }
            await queryInterface.bulkDelete(
                'producto',
                { nombre: { [Op.in]: PRODUCTOS.map((p) => p.nombre) } },
                opciones
            );
            await queryInterface.bulkDelete('juego', { nombre: { [Op.in]: JUEGOS.map((j) => j.nombre) } }, opciones);
            await queryInterface.bulkDelete('categoria', { nombre: { [Op.in]: CATEGORIAS } }, opciones);
            await queryInterface.bulkDelete('mesa', { nombre: { [Op.in]: MESAS.map((m) => m.nombre) } }, opciones);
            await queryInterface.bulkDelete('piso', { nombre: { [Op.in]: PISOS.map((p) => p.nombre) } }, opciones);
        });
    }
};
