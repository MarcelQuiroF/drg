'use strict';

/**
 * #28: la base y los modelos vuelven a decir lo mismo (lo que se arregla en la base; el resto
 * se arregló en los modelos).
 *
 * 1. Valores por defecto: `orden.finalizado` y `asistencia.aprobado` tenían DEFAULT true en la
 *    base y false en los modelos. Un INSERT directo (un script, una importación, un arreglo a
 *    mano) creaba órdenes ya cerradas o asistencias ya aprobadas. Pasan a DEFAULT false.
 *
 * 2. Claves foráneas que borraban historial en cascada. Con ON DELETE CASCADE, un borrado
 *    físico (no el lógico de Sequelize) de la fila de arriba se llevaba todo lo que colgaba de
 *    ella: las asistencias de un empleado, horario o descuento de atraso, las ventas de un
 *    producto o juego, las reservas de un cliente o mesa. Hoy no pasa porque todo usa borrado
 *    lógico, pero un DELETE a mano o un `force: true` lo haría sin aviso. Pasan a RESTRICT: la
 *    base rechaza el borrado mientras haya filas que dependan (decisión de Marcelo, sesión 4.3).
 *    No cambian las que son parte de la misma cosa: borrar una orden sí borra sus ítems, y
 *    borrar un producto o una categoría sí borra su relación en producto_categoria.
 *
 * Solo cambian reglas: no se tocan datos. El `down` vuelve a DEFAULT true y a CASCADE.
 * Los nombres de las restricciones se buscan en el catálogo de PostgreSQL (los generó cada
 * migración original) y se conservan, igual que su regla ON UPDATE.
 */

const DEFAULTS = [
    { tabla: 'orden', columna: 'finalizado' },
    { tabla: 'asistencia', columna: 'aprobado' }
];

const CLAVES_FORANEAS = [
    { tabla: 'asistencia', columna: 'empleado_id' },
    { tabla: 'asistencia', columna: 'horario_id' },
    { tabla: 'asistencia', columna: 'descuento_id' },
    { tabla: 'contenedor_producto', columna: 'producto_id' },
    { tabla: 'contenedor_juego', columna: 'juego_id' },
    { tabla: 'reserva', columna: 'cliente_id' },
    { tabla: 'reserva', columna: 'mesa_id' }
];

const REGLA_SQL = { a: 'NO ACTION', r: 'RESTRICT', c: 'CASCADE', n: 'SET NULL', d: 'SET DEFAULT' };

// La restricción FOREIGN KEY de una sola columna: nombre, tabla referida y regla ON UPDATE
async function buscarClaveForanea(queryInterface, { tabla, columna }, transaction) {
    const [filas] = await queryInterface.sequelize.query(
        `SELECT c.conname AS nombre, c.confrelid::regclass::text AS referida, c.confupdtype AS al_actualizar
           FROM pg_constraint c
           JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
          WHERE c.contype = 'f' AND c.conrelid = :tabla::regclass AND a.attname = :columna
            AND array_length(c.conkey, 1) = 1`,
        { replacements: { tabla, columna }, transaction }
    );
    if (filas.length !== 1) {
        throw new Error(`Se esperaba una clave foránea en ${tabla}.${columna} y hay ${filas.length}.`);
    }
    return filas[0];
}

async function cambiarAlBorrar(queryInterface, regla, transaction) {
    for (const fk of CLAVES_FORANEAS) {
        const {
            nombre,
            referida,
            al_actualizar: alActualizar
        } = await buscarClaveForanea(queryInterface, fk, transaction);
        await queryInterface.sequelize.query(
            `ALTER TABLE "${fk.tabla}" DROP CONSTRAINT "${nombre}",
               ADD CONSTRAINT "${nombre}" FOREIGN KEY ("${fk.columna}") REFERENCES ${referida} (id)
               ON UPDATE ${REGLA_SQL[alActualizar]} ON DELETE ${regla}`,
            { transaction }
        );
    }
}

async function cambiarDefaults(queryInterface, valor, transaction) {
    for (const { tabla, columna } of DEFAULTS) {
        await queryInterface.sequelize.query(`ALTER TABLE "${tabla}" ALTER COLUMN "${columna}" SET DEFAULT ${valor}`, {
            transaction
        });
    }
}

module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.transaction(async (transaction) => {
            await cambiarDefaults(queryInterface, false, transaction);
            await cambiarAlBorrar(queryInterface, 'RESTRICT', transaction);
        });
    },

    async down(queryInterface) {
        await queryInterface.sequelize.transaction(async (transaction) => {
            await cambiarDefaults(queryInterface, true, transaction);
            await cambiarAlBorrar(queryInterface, 'CASCADE', transaction);
        });
    }
};
