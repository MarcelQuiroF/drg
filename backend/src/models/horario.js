'use strict';
module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'Horario',
        {
            dia: { type: DataTypes.STRING(20), allowNull: false },
            hora_entrada: { type: DataTypes.TIME, allowNull: false },
            hora_salida: DataTypes.TIME,

            empleado_id: {
                type: DataTypes.INTEGER,
                allowNull: false
            }
        },
        {
            tableName: 'horario',
            paranoid: true
        }
    );
};
