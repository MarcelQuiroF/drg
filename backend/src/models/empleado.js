'use strict';
const { largoMaximo } = require('../utils/largoMaximo');

const bcrypt = require('bcrypt');

module.exports = (sequelize, DataTypes) => {
    const Empleado = sequelize.define(
        'Empleado',
        {
            nombre: {
                type: DataTypes.STRING(100),
                allowNull: false,
                validate: { notEmpty: { msg: 'El nombre es obligatorio' }, ...largoMaximo(100, 'El nombre') }
            },
            ci: {
                type: DataTypes.STRING(20),
                allowNull: false,
                unique: { msg: 'Esta Cédula de Identidad (CI) ya está registrada' },
                validate: { ...largoMaximo(20, 'El CI') }
            },
            telefono: { type: DataTypes.STRING(20), validate: { ...largoMaximo(20, 'El teléfono') } },
            correo: {
                type: DataTypes.STRING(100),
                allowNull: true,
                validate: { isEmail: { msg: 'Debe ser un correo válido' }, ...largoMaximo(100, 'El correo') }
            },
            // Existía en la base desde la migración create-empleado, pero no en el modelo: la
            // dirección que llegaba se descartaba sin aviso (C3, #28)
            direccion: {
                type: DataTypes.STRING(255),
                allowNull: true,
                validate: { ...largoMaximo(255, 'La dirección') }
            },
            contrasenia: {
                type: DataTypes.STRING,
                allowNull: false
            },
            rol: {
                type: DataTypes.STRING(50),
                allowNull: false
            },
            activo: { type: DataTypes.BOOLEAN, defaultValue: true }
        },
        {
            tableName: 'empleado',
            paranoid: true,
            hooks: {
                beforeCreate: async (empleado) => {
                    if (empleado.contrasenia) {
                        const salt = await bcrypt.genSalt(10);
                        empleado.contrasenia = await bcrypt.hash(empleado.contrasenia, salt);
                    }
                },
                beforeUpdate: async (empleado) => {
                    if (empleado.changed('contrasenia')) {
                        const salt = await bcrypt.genSalt(10);
                        empleado.contrasenia = await bcrypt.hash(empleado.contrasenia, salt);
                    }
                }
            }
        }
    );
    return Empleado;
};
