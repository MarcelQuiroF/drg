const { Asistencia, Empleado, Horario, DescuentoAtraso, sequelize } = require('../models');
const { comparePassword } = require('../utils/bcrypt');
const { Op } = require('sequelize');


function getNombreDia(fecha) {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
    return dias[fecha.getDay()];
}


async function registrarLlegada(ci, contrasenia) {
 
    const empleado = await Empleado.findOne({ where: { ci, activo: true } });
    if (!empleado) throw new Error("Credenciales inválidas.");

    const isValid = await comparePassword(contrasenia, empleado.contrasenia);
    if (!isValid) throw new Error("Credenciales inválidas.");

 
    const hoyInicio = new Date();
    hoyInicio.setHours(0, 0, 0, 0);
    
    const hoyFin = new Date();
    hoyFin.setHours(23, 59, 59, 999);

    const asistenciaExistente = await Asistencia.findOne({
        where: {
            empleado_id: empleado.id,
            fecha: {
                [Op.between]: [hoyInicio, hoyFin]
            }
        }
    });

    if (asistenciaExistente) {
        throw new Error(`Hola ${empleado.nombre}, ya registraste tu asistencia el día de hoy.`);
    }


    const fechaActual = new Date();
    const nombreDia = getNombreDia(fechaActual); 

    const horario = await Horario.findOne({
        where: { dia: nombreDia },
        order: [['createdAt', 'DESC']] 
    });

    if (!horario) throw new Error(`No existe un horario configurado para el día ${nombreDia}.`);


    const [hora, minuto] = horario.hora_entrada.split(':');
    const fechaHoraEntrada = new Date(fechaActual);
    fechaHoraEntrada.setHours(parseInt(hora), parseInt(minuto), 0);

    const fechaLimite = new Date(fechaHoraEntrada.getTime() + 10 * 60000); 

    let descuentoId = null;

    if (fechaActual > fechaLimite) {

        const descuentos = await DescuentoAtraso.findAll();
        if (descuentos.length > 0) {
            const indiceAleatorio = Math.floor(Math.random() * descuentos.length);
            descuentoId = descuentos[indiceAleatorio].id;
        }
    }

 
    return await Asistencia.create({
        empleado_id: empleado.id,
        horario_id: horario.id,
        descuento_id: descuentoId,
        fecha: fechaActual,
        aprobado: false 
    });
}

async function listarAsistencias(soloPendientes = false, fecha = null) {
    const where = {};
    
    if (soloPendientes) {
        where.aprobado = false;
    }

    // --- NUEVO: FILTRO DE FECHA ---
    if (fecha) {

        const [anio, mes, dia] = fecha.split('-');
        

        const inicioDia = new Date(anio, mes - 1, dia, 0, 0, 0);
        

        const finDia = new Date(anio, mes - 1, dia, 23, 59, 59, 999);

        where.fecha = {
            [Op.between]: [inicioDia, finDia]
        };
    }

    return await Asistencia.findAll({
        where,
        include: [
            { model: Empleado, attributes: ['nombre', 'ci'] },
            { model: Horario, attributes: ['hora_entrada', 'hora_salida'] },
            { model: DescuentoAtraso }
        ],
        order: [['fecha', 'DESC']]
    });
}

async function obtenerHorarioHoy() {
    const fechaActual = new Date();
    const nombreDia = getNombreDia(fechaActual); 

    const horario = await Horario.findOne({
        where: { dia: nombreDia },
        order: [['createdAt', 'DESC']],
        attributes: ['hora_entrada', 'hora_salida']
    });

    if (!horario) {
        return null; 
    }

    return horario;
}

async function aprobarAsistencia(id) {
    const asistencia = await Asistencia.findByPk(id);
    if (!asistencia) throw new Error("Registro no encontrado.");

    return await asistencia.update({ aprobado: true });
}

module.exports = {
    registrarLlegada,
    obtenerHorarioHoy,
    listarAsistencias,
    aprobarAsistencia,
};