'use strict';
module.exports = (sequelize, DataTypes) => {
  const Configuracion = sequelize.define('Configuracion', {
    clave: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: 'Ej: ventana_llegada, minutos_tolerancia, ventana_bloqueo'
    },
    valor: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Valor en minutos u otras unidades enteras'
    },
    descripcion: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: 'Explicación de para qué sirve este ajuste'
    }
  }, {
    tableName: 'configuracion',
    timestamps: true,
    paranoid: false
  });

  return Configuracion;
};