'use strict';

/**
 * #40 (RF-25): cantidad de personas de la reserva. Se pide siempre, pero puede quedar vacía.
 *
 * `reserva.cantidad_personas`: entero, admite nulos (las reservas que ya existen quedan sin el dato).
 * `CHECK reserva_personas_positiva`: si hay un valor, es mayor que 0. El modelo valida lo mismo
 * con un mensaje claro (400); el CHECK protege también un INSERT a mano.
 *
 * Superar la capacidad de la mesa NO se bloquea (decisión de Marcelo, ⚠ confirmar con el dueño): el
 * servidor solo avisa, porque se pueden juntar sillas. Por eso no hay un CHECK contra la mesa.
 *
 * `down`: quita el CHECK y la columna (se pierde el dato).
 */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.sequelize.transaction(async (transaction) => {
            await queryInterface.addColumn(
                'reserva',
                'cantidad_personas',
                { type: Sequelize.INTEGER, allowNull: true },
                { transaction }
            );
            await queryInterface.sequelize.query(
                'ALTER TABLE reserva ADD CONSTRAINT reserva_personas_positiva CHECK (cantidad_personas > 0)',
                { transaction }
            );
        });
    },

    async down(queryInterface) {
        await queryInterface.sequelize.transaction(async (transaction) => {
            await queryInterface.sequelize.query(
                'ALTER TABLE reserva DROP CONSTRAINT IF EXISTS reserva_personas_positiva',
                { transaction }
            );
            await queryInterface.removeColumn('reserva', 'cantidad_personas', { transaction });
        });
    }
};
