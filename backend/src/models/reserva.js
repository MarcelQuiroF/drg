'use strict';
module.exports = (sequelize, DataTypes) => {
    return sequelize.define(
        'Reserva',
        {
            hora: {
                type: DataTypes.DATE,
                allowNull: false,
                validate: {
                    isFuture(value) {
                        if (value <= new Date()) {
                            throw new Error('La reserva debe ser para una fecha y hora futura');
                        }
                    }
                }
            },
            estado: {
                type: DataTypes.ENUM('PENDIENTE', 'LLEGO', 'CANCELADA', 'EXPIRADA'),
                defaultValue: 'PENDIENTE'
            },
            cliente_id: DataTypes.INTEGER,
            mesa_id: DataTypes.INTEGER,
            // RF-25 (#40): opcional; si viene, entero positivo. Vacío ('' del formulario) = sin dato
            cantidad_personas: {
                type: DataTypes.INTEGER,
                allowNull: true,
                set(valor) {
                    this.setDataValue('cantidad_personas', valor === '' || valor === undefined ? null : valor);
                },
                validate: {
                    isInt: {
                        args: { min: 1, max: 2147483647 },
                        msg: 'La cantidad de personas tiene que ser un número entero mayor a 0.'
                    }
                }
            }
        },
        {
            tableName: 'reserva',
            paranoid: true
        }
    );
};
