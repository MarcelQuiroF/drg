'use strict';

// Jornada de trabajo (#34, RF-22): el día abierto y cerrado en el servidor. Las reglas "un solo
// día abierto a la vez" y "una jornada por fecha" están en la base (migración 20261126100000).
module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'Jornada',
        {
            // Día de Bolivia en que se abrió ('YYYY-MM-DD', #27)
            fecha: { type: DataTypes.DATEONLY, allowNull: false },
            abierta_por: { type: DataTypes.INTEGER, allowNull: false },
            abierta_en: { type: DataTypes.DATE, allowNull: false },
            cerrada_por: { type: DataTypes.INTEGER, allowNull: true },
            cerrada_en: { type: DataTypes.DATE, allowNull: true },
            // Totales congelados al cerrar (valor de prueba de P-09)
            resumen: { type: DataTypes.JSONB, allowNull: true }
        },
        {
            tableName: 'jornada'
        }
    );
};
