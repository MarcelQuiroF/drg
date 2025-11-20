'use strict';

module.exports = (sequelize, DataTypes) => {
  const OrdenContenedorJuego = sequelize.define('OrdenContenedorJuego', {
    orden_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: { model: 'orden', key: 'id' }
    },
    contenedor_juego_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: { model: 'contenedor_juego', key: 'id' }
    }
  }, {
    tableName: 'orden_contenedor_juego',
    paranoid: true,
    deletedAt: 'deletedAt',
    timestamps: true,
    hooks: {
      beforeCreate: (registro) => {
        console.log(`Creando relación orden ${registro.orden_id} - contenedor_juego ${registro.contenedor_juego_id}`);
      },
      beforeDestroy: (registro) => {
        console.log(`Soft delete relación orden ${registro.orden_id} - contenedor_juego ${registro.contenedor_juego_id}`);
      }
    }
  });

  return OrdenContenedorJuego;
};
