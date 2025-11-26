'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('empleado', [
      {
        id: 1,
        nombre: 'Admin Principal',
        ci: '1234567LP',
        telefono: '77712345',
        contrasenia: '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW', 
        rol: 'ADMIN',
        activo: true,
        direccion: 'Av. Siempre Viva 123',
        correo: 'admin@negocio.com',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        nombre: 'Juan Mesero',
        ci: '8765432SC',
        telefono: '60054321',
        contrasenia: '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36WQoeG6Lruj3vjPGga31lW',
        rol: 'MESERO',
        activo: true,
        direccion: 'Calle Falsa 123',
        correo: 'juan@negocio.com',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    await queryInterface.bulkInsert('cliente', [
      {
        id: 1,
        nombre: 'Maria Cliente',
        ci: '11223344',
        telefono: '70000001',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        nombre: 'Pedro Cliente',
        ci: '55667788',
        telefono: '70000002',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('cliente', null, {});
    await queryInterface.bulkDelete('empleado', null, {});
  }
};