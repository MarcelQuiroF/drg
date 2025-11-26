'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.bulkInsert('piso', [
      { id: 1, nombre: 'Planta Baja', numero: 0, activo: true, createdAt: new Date(), updatedAt: new Date() },
      { id: 2, nombre: 'Primer Piso', numero: 1, activo: true, createdAt: new Date(), updatedAt: new Date() }
    ]);

    await queryInterface.bulkInsert('mesa', [
      { id: 1, nombre: 'Mesa Ventana', numero: 1, estado: 0, piso_id: 1, createdAt: new Date(), updatedAt: new Date() },
      { id: 2, nombre: 'Mesa Central', numero: 2, estado: 0, piso_id: 1, createdAt: new Date(), updatedAt: new Date() },
      { id: 3, nombre: 'Mesa Privada', numero: 3, estado: 0, piso_id: 2, createdAt: new Date(), updatedAt: new Date() }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('mesa', null, {});
    await queryInterface.bulkDelete('piso', null, {});
  }
};