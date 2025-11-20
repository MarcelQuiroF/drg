'use strict';

module.exports = (sequelize, DataTypes) => {
  const Horario = sequelize.define('Horario', {
    dia: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: { notEmpty: { msg: "El día no puede estar vacío" } }
    },
    hora_entrada: {
      type: DataTypes.DATE,
      allowNull: false
    },
    hora_salida: {
      type: DataTypes.DATE,
      allowNull: false
    },
    registro: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'horario',
    paranoid: true,
    deletedAt: 'deletedAt',
    timestamps: true,
    hooks: {
      beforeCreate: (horario) => {
        console.log(`Creando horario para el día ${horario.dia}`);
      },
      beforeUpdate: (horario) => {
        console.log(`Actualizando horario ID ${horario.id}`);
      },
      beforeDestroy: (horario) => {
        console.log(`Soft delete de horario ID ${horario.id}`);
      }
    }
  });

  return Horario;
};
