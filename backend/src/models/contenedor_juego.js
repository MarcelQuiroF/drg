'use strict';
module.exports = (sequelize, DataTypes) => {
  const ContenedorJuego = sequelize.define('ContenedorJuego', {
    juego_id: DataTypes.INTEGER,
    hora_inicio: DataTypes.DATE,
    hora_fin: DataTypes.DATE,
    cantidad: DataTypes.INTEGER,
    comentario: DataTypes.STRING
  }, {
    tableName: 'contenedor_juego',
    paranoid: true
  });
  return ContenedorJuego;
};
