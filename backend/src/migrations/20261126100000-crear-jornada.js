'use strict';

/**
 * #34 (RF-22): tabla `jornada`, el día de trabajo abierto y cerrado en el servidor. Antes el cierre
 * se guardaba solo en el localStorage de un navegador (§4.7 del análisis).
 *
 * - `fecha`: el día de Bolivia en que se abrió la jornada (#27). Una jornada que pasa la
 *   medianoche sigue siendo la del día en que se abrió.
 * - `abierta_por` / `abierta_en` y `cerrada_por` / `cerrada_en`: quién y cuándo (RN-16: no tiene
 *   que ser la misma persona). Mientras la jornada está abierta, las dos últimas son NULL.
 * - `resumen` (JSONB): totales del día, calculados y congelados al cerrar (valor de prueba de P-09).
 *
 * Dos reglas "no puede haber dos" van como restricciones únicas en la base (como #30): la base las
 * cumple también con pedidos simultáneos o un INSERT a mano.
 * - `jornada_una_abierta`: índice único parcial sobre una constante, solo para las filas abiertas
 *   (`cerrada_en IS NULL`). Como todas las filas abiertas tendrían el mismo valor (true), puede
 *   haber como máximo una. Si se reabre un día (#35, la misma fila), también lo protege.
 * - `jornada_un_dia_por_fecha`: un día de calendario tiene una sola jornada; un día ya cerrado no se
 *   vuelve a abrir creando otra, se reabre (#35).
 * - `jornada_cierre_completo`: CHECK para que `cerrada_en` y `cerrada_por` estén los dos o ninguno.
 *
 * Las FK a `empleado` van con RESTRICT: la jornada es historial (#28).
 *
 * `down` borra la tabla y con ella el historial de jornadas (no hay otro lugar donde guardarlo). Las
 * demás tablas no cambian.
 */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.sequelize.transaction(async (transaction) => {
            const empleado = {
                type: Sequelize.INTEGER,
                references: { model: 'empleado', key: 'id' },
                onUpdate: 'CASCADE',
                onDelete: 'RESTRICT'
            };
            await queryInterface.createTable(
                'jornada',
                {
                    id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
                    fecha: { type: Sequelize.DATEONLY, allowNull: false },
                    abierta_por: { ...empleado, allowNull: false },
                    abierta_en: { type: Sequelize.DATE, allowNull: false },
                    cerrada_por: { ...empleado, allowNull: true },
                    cerrada_en: { type: Sequelize.DATE, allowNull: true },
                    resumen: { type: Sequelize.JSONB, allowNull: true },
                    createdAt: { allowNull: false, type: Sequelize.DATE },
                    updatedAt: { allowNull: false, type: Sequelize.DATE }
                },
                { transaction }
            );
            await queryInterface.sequelize.query(
                `ALTER TABLE jornada ADD CONSTRAINT jornada_un_dia_por_fecha UNIQUE (fecha);
                 ALTER TABLE jornada ADD CONSTRAINT jornada_cierre_completo
                     CHECK ((cerrada_en IS NULL) = (cerrada_por IS NULL));
                 CREATE UNIQUE INDEX jornada_una_abierta ON jornada ((true)) WHERE cerrada_en IS NULL;`,
                { transaction }
            );
        });
    },

    async down(queryInterface) {
        await queryInterface.dropTable('jornada');
    }
};
