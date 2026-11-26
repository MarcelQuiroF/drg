'use strict';

/**
 * #30: una sola llegada por empleado y día, y anular sin borrar.
 *
 * 1. `asistencia.anulada_por` (FK a empleado, RESTRICT, nula): quién anuló la asistencia. Anular
 *    ya no es un borrado físico: es el borrado lógico de Sequelize (`deletedAt`) más esta columna
 *    (RN-09, decisión de Marcelo en la sesión 4.4: "marcar siempre").
 *
 * 2. Índice único parcial `asistencia_una_llegada_por_dia` sobre (empleado_id, día de la llegada
 *    en hora de Bolivia), solo para las filas NO anuladas (`deletedAt IS NULL`). Así:
 *    - dos llegadas del mismo empleado el mismo día son imposibles, aunque lleguen dos pedidos a la
 *      vez, vengan de un script o de un INSERT a mano (A1);
 *    - una asistencia anulada no cuenta, y el empleado puede volver a registrar su llegada.
 *    El día se calcula con `AT TIME ZONE 'America/La_Paz'` (la zona del negocio, #27): una llegada
 *    a las 21:00 de Bolivia es de ese día aunque en UTC ya sea el siguiente. La expresión es
 *    IMMUTABLE (zona fija), por eso PostgreSQL la acepta en un índice.
 *
 * Datos existentes: si ya hay dos o más llegadas del mismo empleado el mismo día, el índice no se
 * podría crear. Se conserva la PRIMERA de cada día (la llegada real) y las demás se marcan como
 * anuladas (deletedAt = ahora, sin anulada_por). La migración avisa cuántas marcó.
 *
 * `down`: quita el índice y la columna. Las filas que el `up` marcó como anuladas siguen marcadas
 * (no hay forma de saber cuáles eran duplicadas y cuáles se anularon después a mano).
 */

const INDICE = 'asistencia_una_llegada_por_dia';
const DIA_LOCAL = `(("fecha_hora_llegada" AT TIME ZONE 'America/La_Paz')::date)`;

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.sequelize.transaction(async (transaction) => {
            await queryInterface.addColumn(
                'asistencia',
                'anulada_por',
                {
                    type: Sequelize.INTEGER,
                    allowNull: true,
                    references: { model: 'empleado', key: 'id' },
                    onUpdate: 'CASCADE',
                    onDelete: 'RESTRICT'
                },
                { transaction }
            );

            const [duplicadas] = await queryInterface.sequelize.query(
                `UPDATE asistencia SET "deletedAt" = now()
                 WHERE id IN (
                     SELECT id FROM (
                         SELECT id, row_number() OVER (
                             PARTITION BY empleado_id, ${DIA_LOCAL}
                             ORDER BY fecha_hora_llegada, id
                         ) AS orden
                         FROM asistencia WHERE "deletedAt" IS NULL
                     ) llegadas
                     WHERE orden > 1
                 )
                 RETURNING id, empleado_id`,
                { transaction }
            );
            if (duplicadas.length > 0) {
                console.warn(
                    `[#30] ${duplicadas.length} llegada(s) repetida(s) del mismo empleado el mismo día ` +
                        `quedaron anuladas (se conservó la primera de cada día): ids ${duplicadas.map((d) => d.id).join(', ')}.`
                );
            }

            await queryInterface.sequelize.query(
                `CREATE UNIQUE INDEX "${INDICE}" ON asistencia (empleado_id, ${DIA_LOCAL}) WHERE "deletedAt" IS NULL`,
                { transaction }
            );
        });
    },

    async down(queryInterface) {
        await queryInterface.sequelize.transaction(async (transaction) => {
            await queryInterface.sequelize.query(`DROP INDEX IF EXISTS "${INDICE}"`, { transaction });
            await queryInterface.removeColumn('asistencia', 'anulada_por', { transaction });
        });
    }
};
