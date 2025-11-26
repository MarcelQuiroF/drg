'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('horario', [
      {
        id: 1,
        dia: 'Lunes',
        hora_entrada: '08:00:00',
        hora_salida: '16:00:00',
        registro: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    await queryInterface.bulkInsert('descuento_atraso', [
      {
        id: 1,
        cantidad_tiempo: '00:15:00',
        descuento: 10, 
        descuento_porcentual: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        cantidad_tiempo: '01:00:00', 
        descuento: 0,
        descuento_porcentual: 50, 
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    await queryInterface.bulkInsert('descuento', [
      {
        id: 1,
        porcentaje: 10,
        monto: 0,
        comentario: 'Descuento Cumpleañero',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('descuento', null, {});
    await queryInterface.bulkDelete('descuento_atraso', null, {});
    await queryInterface.bulkDelete('horario', null, {});
  }
};