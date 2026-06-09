'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.removeConstraint('empleado', 'empleado_correo_key').catch(err => {
      console.log("Aviso: No se pudo eliminar la restricción de correo, posiblemente tenga otro nombre o no exista.", err.message);
    });

    await queryInterface.addConstraint('empleado', {
      fields: ['ci'],
      type: 'unique',
      name: 'empleado_ci_key'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeConstraint('empleado', 'empleado_ci_key').catch(err => {
      console.log("Aviso: No se pudo revertir la restricción de CI.", err.message);
    });

    await queryInterface.addConstraint('empleado', {
      fields: ['correo'],
      type: 'unique',
      name: 'empleado_correo_key'
    });
  }
};