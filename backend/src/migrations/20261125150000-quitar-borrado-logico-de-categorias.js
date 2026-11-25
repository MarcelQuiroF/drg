'use strict';

/**
 * #78: producto_categoria y juego_categoria dejan de usar borrado lógico.
 *
 * Las dos tablas tienen clave primaria compuesta (producto_id o juego_id, categoria_id) y
 * además una columna deletedAt (paranoid). Al editar las categorías, la relación vieja quedaba
 * "borrada" pero seguía ocupando su clave, y volver a guardar la misma categoría chocaba con
 * ella (SequelizeUniqueConstraintError). Sin transacción, el producto se quedaba sin categorías.
 *
 * Una relación producto-categoría no tiene historia que valga la pena guardar: se borra de
 * verdad. Esta migración elimina las filas que estaban marcadas como borradas (las que
 * bloqueaban la clave) y la columna deletedAt.
 *
 * El `down` vuelve a agregar la columna (vacía). Las filas borradas no se recuperan: eran
 * relaciones que ya no estaban vigentes.
 */

const TABLAS = ['producto_categoria', 'juego_categoria'];

module.exports = {
    async up(queryInterface) {
        await queryInterface.sequelize.transaction(async (transaction) => {
            for (const tabla of TABLAS) {
                await queryInterface.sequelize.query(`DELETE FROM "${tabla}" WHERE "deletedAt" IS NOT NULL`, {
                    transaction
                });
                await queryInterface.removeColumn(tabla, 'deletedAt', { transaction });
            }
        });
    },

    async down(queryInterface, Sequelize) {
        await queryInterface.sequelize.transaction(async (transaction) => {
            for (const tabla of TABLAS) {
                await queryInterface.addColumn(
                    tabla,
                    'deletedAt',
                    { type: Sequelize.DATE, allowNull: true },
                    { transaction }
                );
            }
        });
    }
};
