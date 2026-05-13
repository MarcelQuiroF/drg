module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('juego', 'enlace', {
      type: Sequelize.STRING,
      allowNull: true
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('juego', 'enlace');
  }
};