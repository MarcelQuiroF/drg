'use strict';
const { largoMaximo } = require('../utils/largoMaximo');

module.exports = (sequelize, DataTypes) => {
    const Juego = sequelize.define(
        'Juego',
        {
            nombre: { type: DataTypes.STRING(100), allowNull: false, validate: { ...largoMaximo(100, 'El nombre') } },
            precio: {
                type: DataTypes.DECIMAL(10, 2),
                validate: { min: 0 }
            },
            jugadores_min: {
                type: DataTypes.INTEGER,
                validate: { min: 1 }
            },
            jugadores_max: {
                type: DataTypes.INTEGER,
                validate: {
                    min: 1,
                    checkMax(value) {
                        if (value < this.jugadores_min) {
                            throw new Error('Jugadores max no puede ser menor que min');
                        }
                    }
                }
            },
            imagen: {
                type: DataTypes.STRING,
                allowNull: true
            },
            // NOT NULL en la base: sin el campo, crear un juego daba 500, también desde el panel,
            // que no lo mandaba (C2, #28). Es la duración de una partida, en minutos.
            tiempo_partida: {
                type: DataTypes.INTEGER,
                allowNull: false,
                validate: {
                    notNull: { msg: 'El tiempo de partida (en minutos) es obligatorio.' },
                    isInt: { msg: 'El tiempo de partida tiene que ser un número entero de minutos.' },
                    min: { args: [1], msg: 'El tiempo de partida tiene que ser de al menos 1 minuto.' }
                }
            },
            activado: { type: DataTypes.BOOLEAN, defaultValue: true },
            enlace: {
                type: DataTypes.STRING,
                allowNull: true
            }
        },
        {
            tableName: 'juego',
            paranoid: true
        }
    );
    return Juego;
};
