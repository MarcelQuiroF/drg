module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('reserva', 'estado', {
      type: Sequelize.ENUM('PENDIENTE', 'LLEGO', 'CANCELADA', 'EXPIRADA'),
      defaultValue: 'PENDIENTE',
      allowNull: false
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('reserva', 'estado');
  }
};