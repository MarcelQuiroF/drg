'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('empleado', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      nombre: { type: Sequelize.STRING(100) },
      ci: { type: Sequelize.BIGINT },
      telefono: { type: Sequelize.BIGINT },
      contrasenia: { type: Sequelize.STRING(255) },
      rol: { type: Sequelize.STRING(50) },
      activo: { type: Sequelize.BOOLEAN },
      direccion: { type: Sequelize.STRING(255) },
      correo: { type: Sequelize.STRING(100) },
      deletedAt: { type: Sequelize.DATE }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('empleado');
  }
};
