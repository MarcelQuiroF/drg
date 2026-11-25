'use strict';

/**
 * #22 (ADR-007): cada ítem de una orden guarda el precio unitario que se le cobra.
 *
 * Antes el total se recalculaba con el precio actual del producto o del juego. Como los
 * dos tienen borrado lógico, al borrar uno del catálogo su ítem pasaba a valer 0, y
 * cambiar un precio cambiaba el total de las órdenes abiertas y los reportes.
 *
 * Los ítems que ya existen reciben el precio actual de su producto o juego (incluidos
 * los borrados): es el mejor dato disponible y es el mismo que usaba el cálculo viejo.
 * Después del llenado la columna pasa a NOT NULL. El `down` quita las dos columnas.
 */

const TABLAS = [
    { tabla: 'contenedor_producto', catalogo: 'producto', fk: 'producto_id' },
    { tabla: 'contenedor_juego', catalogo: 'juego', fk: 'juego_id' }
];

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.sequelize.transaction(async (transaction) => {
            for (const { tabla, catalogo, fk } of TABLAS) {
                await queryInterface.addColumn(
                    tabla,
                    'precio_unitario',
                    { type: Sequelize.DECIMAL(10, 2), allowNull: true },
                    { transaction }
                );
                await queryInterface.sequelize.query(
                    `UPDATE "${tabla}" AS c SET precio_unitario = x.precio FROM "${catalogo}" AS x WHERE x.id = c.${fk}`,
                    { transaction }
                );
                await queryInterface.changeColumn(
                    tabla,
                    'precio_unitario',
                    { type: Sequelize.DECIMAL(10, 2), allowNull: false },
                    { transaction }
                );
            }
        });
    },

    async down(queryInterface) {
        await queryInterface.sequelize.transaction(async (transaction) => {
            for (const { tabla } of TABLAS) {
                await queryInterface.removeColumn(tabla, 'precio_unitario', { transaction });
            }
        });
    }
};
