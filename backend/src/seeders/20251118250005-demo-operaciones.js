'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('reserva', [{
      id: 1,
      cliente_id: 1, 
      mesa_id: 1, 
      hora: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
      createdAt: new Date(),
      updatedAt: new Date()
    }]);

    await queryInterface.bulkInsert('orden', [{
      id: 1,
      total: 105.00,
      finalizado: false,
      mesa_id: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    }]);

    await queryInterface.bulkInsert('contenedor_producto', [
      {
        orden_id: 1,
        producto_id: 1,
        cantidad: 2,
        cantidad_recibido: 2,
        cantidad_preparando: 0,
        cantidad_terminado: 2,
        cantidad_enviado: 1,
        comentario: 'Sin cebolla una',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        orden_id: 1,
        producto_id: 2, // Coca Cola
        cantidad: 1,
        cantidad_recibido: 1,
        cantidad_preparando: 0,
        cantidad_terminado: 1,
        cantidad_enviado: 1,
        comentario: 'Con hielo',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // 4. Contenedor Juegos (Detalle de la orden 1)
    await queryInterface.bulkInsert('contenedor_juego', [
      {
        orden_id: 1,
        juego_id: 1, // Catan
        hora_inicio: '18:00:00',
        hora_fin: '19:30:00',
        cantidad: 1,
        comentario: 'Mesa solicitó extensión de tiempo',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('contenedor_juego', null, {});
    await queryInterface.bulkDelete('contenedor_producto', null, {});
    await queryInterface.bulkDelete('orden', null, {});
    await queryInterface.bulkDelete('reserva', null, {});
  }
};