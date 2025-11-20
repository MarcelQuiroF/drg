'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('empleado', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
      nombre: { type: Sequelize.STRING(100), allowNull: false },
      ci: { type: Sequelize.BIGINT, allowNull: true },
      telefono: { type: Sequelize.BIGINT, allowNull: true },
      contrasenia: { type: Sequelize.STRING(255), allowNull: false },
      rol: { type: Sequelize.STRING(50), allowNull: false },
      activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      direccion: { type: Sequelize.STRING(255), allowNull: true },
      correo: { type: Sequelize.STRING(100), allowNull: true },

      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('NOW()')
      },
      deletedAt: { type: Sequelize.DATE, allowNull: true }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('empleado');
  }
};
