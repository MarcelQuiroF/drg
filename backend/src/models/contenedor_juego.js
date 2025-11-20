'use strict';

module.exports = (sequelize, DataTypes) => {
  const ContenedorJuego = sequelize.define('ContenedorJuego', {
    juego_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    hora_inicio: {
      type: DataTypes.DATE,
      allowNull: false
    },
    hora_fin: {
      type: DataTypes.DATE,
      allowNull: false
    },
    cantidad: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 0
      }
    },
    comentario: {
      type: DataTypes.STRING(255),
      allowNull: true
    }
  }, {
    tableName: 'contenedor_juego',
    paranoid: true,
    deletedAt: 'deletedAt',
    timestamps: true,
    hooks: {
      beforeCreate: (cj) => {
        console.log(`Se va a crear un ContenedorJuego para juego ${cj.juego_id}`);
      },
      beforeUpdate: (cj) => {
        console.log(`Se va a actualizar el ContenedorJuego ID ${cj.id}`);
      },
      beforeDestroy: (cj) => {
        console.log(`Soft delete de ContenedorJuego ID ${cj.id}`);
      }
    }
  });

  ContenedorJuego.associate = (models) => {
    ContenedorJuego.belongsTo(models.Juego, { foreignKey: 'juego_id' });
  };

  return ContenedorJuego;
};
