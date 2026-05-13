const { Empleado } = require('../models');
const { comparePassword } = require('../utils/bcrypt');
const { generateToken } = require('../utils/jwt');
const httpCodes = require('../utils/httpCodes');


async function login(ci, contrasenia) {
    try {
        console.log("--- Login Attempt ---");
        console.log("Searching for CI:", ci);

        const empleado = await Empleado.findOne({ 
            where: { ci: ci }
        });

        if (!empleado) {
            console.log("Empleado no encontrado");
            return null;
        }

        console.log("Found Employee:", empleado.nombre);
        console.log("Is active?:", empleado.activo);

        const isPasswordValid = await comparePassword(contrasenia, empleado.contrasenia);
        
        if (!isPasswordValid) {
            return null;
        }
        
        if (!empleado.activo) {
             console.log("Empleado inactivo");
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
        console.error("Error in login service:", error);
        throw new Error("Internal server error during login.");
    }
}

module.exports = {
    login,
};