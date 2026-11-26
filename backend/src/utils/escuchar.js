'use strict';

// Pone a escuchar la app en un puerto y avisa CLARO si no se puede (#110).
//
// Express 5 le pasa el error de listen() al callback de app.listen() (ya no lo lanza como evento
// sin manejar). server.js ignoraba ese argumento: con el puerto ocupado mostraba "escuchando…" y el
// proceso quedaba vivo sin atender nada. Aquí el error se convierte en un rechazo con un mensaje
// que dice qué pasó y qué hacer, y server.js termina con código 1.
function mensajeDeError(error, puerto) {
    if (error.code === 'EADDRINUSE') {
        return (
            `El puerto ${puerto} ya está en uso: otro programa (¿otro "npm start" abierto?) lo está ocupando. ` +
            'Cierre ese programa o cambie PORT en backend/.env.'
        );
    }
    if (error.code === 'EACCES') {
        return `No hay permiso para usar el puerto ${puerto}. Use un puerto mayor que 1024 en PORT (backend/.env).`;
    }
    return `No se pudo escuchar en el puerto ${puerto}: ${error.message}`;
}

function escuchar(app, puerto) {
    return new Promise((resolve, reject) => {
        const servidor = app.listen(puerto, (error) => {
            if (error) {
                const claro = new Error(mensajeDeError(error, puerto));
                claro.code = error.code;
                return reject(claro);
            }
            resolve(servidor);
        });
    });
}

module.exports = { escuchar, mensajeDeError };
