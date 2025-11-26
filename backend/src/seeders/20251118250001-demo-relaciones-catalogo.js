'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('juego_categoria', [{
      juego_id: 1,
      categoria_id: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    }]);

    await queryInterface.bulkInsert('juego_categoria', [{
      juego_id: 2,
      categoria_id: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    }]);

    await queryInterface.bulkInsert('producto_categoria', [{
      producto_id: 1,
      categoria_id: 3,
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('juego_categoria', null, {});
    await queryInterface.bulkDelete('producto_categoria', null, {});
  }
};