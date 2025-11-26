'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('categoria', [
      { id: 1, nombre: 'Juegos de Estrategia', createdAt: new Date(), updatedAt: new Date() },
      { id: 2, nombre: 'Juegos Familiares', createdAt: new Date(), updatedAt: new Date() },
      { id: 3, nombre: 'Comida Rápida', createdAt: new Date(), updatedAt: new Date() },
      { id: 4, nombre: 'Bebidas', createdAt: new Date(), updatedAt: new Date() }
    ]);

    await queryInterface.bulkInsert('juego', [
      {
        id: 1,
        nombre: 'Catan',
        precio: 20.00, 
        imagen: 'catan.jpg',
        jugadores_min: 3,
        jugadores_max: 4,
        activado: true,
        tiempo_partida: 90, 
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        nombre: 'Uno',
        precio: 5.50,
        imagen: 'uno.jpg',
        jugadores_min: 2,
        jugadores_max: 10,
        activado: true,
        tiempo_partida: 30,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    await queryInterface.bulkInsert('producto', [
      {
        id: 1,
        nombre: 'Hamburguesa Clásica',
        zona: 'Cocina',
        activado: true,
        precio: 45.00,
        estado: true, 
        imagen: 'burger.png',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        nombre: 'Coca Cola 2L',
        zona: 'Barra',
        activado: true,
        precio: 15.00,
        estado: true,
        imagen: 'coca.png',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('producto', null, {});
    await queryInterface.bulkDelete('juego', null, {});
    await queryInterface.bulkDelete('categoria', null, {});
  }
};