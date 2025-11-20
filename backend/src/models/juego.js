'use strict';

module.exports = (sequelize, DataTypes) => {
  const Juego = sequelize.define('Juego', {
    nombre: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: { notEmpty: { msg: "El nombre no puede estar vacío" } }
    },
    precio: {
      type: DataTypes.DOUBLE,
      allowNull: false,
      validate: { min: 0 }
    },
    imagen: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    jugadores_min: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 }
    },
    jugadores_max: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 }
    },
    tiempo_partida: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1 }
    }
  }, {
    tableName: 'juego',
    paranoid: true,
    deletedAt: 'deletedAt',
    timestamps: true,
    hooks: {
      beforeCreate: (juego) => {
        console.log(`Creando juego: ${juego.nombre}`);
      },
      beforeUpdate: (juego) => {
        console.log(`Actualizando juego ID ${juego.id}`);
      },
      beforeDestroy: (juego) => {
        console.log(`Soft delete de juego ID ${juego.id}`);
      }
    }
  });

  return Juego;
};
