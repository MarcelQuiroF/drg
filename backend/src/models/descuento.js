'use strict';
module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'Descuento',
        {
            porcentaje: { type: DataTypes.INTEGER, validate: { min: 0, max: 100 } },
            monto: { type: DataTypes.DECIMAL(10, 2), validate: { min: 0 } },
            // Motivo: obligatorio para los descuentos nuevos (RN-06, #39; lo exige ordenService)
            comentario: DataTypes.STRING,
            // Quién lo aplicó (#39). Nulo solo en los descuentos de antes de la migración 20261126110000
            empleado_id: { type: DataTypes.INTEGER, allowNull: true }
        },
        {
            tableName: 'descuento',
            paranoid: true
        }
    );
};
