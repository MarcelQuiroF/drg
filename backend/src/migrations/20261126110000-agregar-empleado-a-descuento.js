'use strict';

/**
 * #39 (RF-49, RF-11, RN-06): cada descuento guarda el empleado que lo aplicó, para la sección de
 * control del administrador (los descuentos no tienen tope ni autorización: el control es después).
 *
 * `descuento.empleado_id`: FK a `empleado`, RESTRICT (es historial, #28). Admite nulos porque los
 * descuentos aplicados antes de esta migración no guardaron quién los aplicó: en el listado
 * aparecen como "sin registro". La app lo llena siempre desde ahora.
 *
 * No cambia `descuento.comentario` en la base: los descuentos viejos pueden tenerlo vacío. El motivo
 * obligatorio lo exige el servicio (400) para los nuevos.
 *
 * `down`: quita la columna (se pierde quién aplicó cada descuento).
 */

module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.addColumn('descuento', 'empleado_id', {
            type: Sequelize.INTEGER,
            allowNull: true,
            references: { model: 'empleado', key: 'id' },
            onUpdate: 'CASCADE',
            onDelete: 'RESTRICT'
        });
        await queryInterface.addIndex('descuento', ['empleado_id'], { name: 'descuento_empleado_id' });
    },

    async down(queryInterface) {
        await queryInterface.removeIndex('descuento', 'descuento_empleado_id');
        await queryInterface.removeColumn('descuento', 'empleado_id');
    }
};
