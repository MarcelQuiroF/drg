'use strict';
module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'Asistencia',
        {
            fecha_hora_llegada: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },

            // La base tenía DEFAULT true hasta la migración 20261125160000 (#28)
            aprobado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },

            estado: {
                type: DataTypes.STRING,
                allowNull: false,
                defaultValue: 'PRESENTE',
                validate: {
                    isIn: [['PRESENTE', 'FALTA', 'PERMISO']]
                }
            },

            empleado_id: { type: DataTypes.INTEGER, allowNull: false },
            // NOT NULL en la base: una llegada siempre corresponde a un horario (T11, #28)
            horario_id: { type: DataTypes.INTEGER, allowNull: false },

            descuento_id: {
                type: DataTypes.INTEGER,
                allowNull: true
            }
        },
        {
            tableName: 'asistencia',
            paranoid: true
        }
    );
};
