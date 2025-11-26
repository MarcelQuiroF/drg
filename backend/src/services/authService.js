const { Empleado } = require('../models');
const { comparePassword } = require('../utils/bcrypt');
const { generateToken } = require('../utils/jwt');
const httpCodes = require('../utils/httpCodes');


async function login(ci, contrasenia) {
    try {

        const empleado = await Empleado.findOne({ 
            where: { ci: ci }
        });

        if (!empleado) {
            return null; 
        }
        const isPasswordValid = await comparePassword(contrasenia, empleado.contrasenia);

        if (!isPasswordValid) {
            return null; 
        }
        
        if (!empleado.activo) {
             return null; 
        }

        const tokenPayload = {
            id: empleado.id,
            rol: empleado.rol,
            nombre: empleado.nombre
        };

        const token = generateToken(tokenPayload);

        const empleadoSeguro = empleado.toJSON();
        delete empleadoSeguro.contrasenia;
        delete empleadoSeguro.deletedAt;

        return {
            token,
            empleado: empleadoSeguro
        };

    } catch (error) {
        console.error("Error en el servicio de login:", error);
        throw new Error("Error interno del servidor durante el login.");
    }
}

module.exports = {
    login,
};