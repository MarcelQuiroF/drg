'use strict';

// La hora "de ahora" del servidor, en un solo lugar. Las pruebas la reemplazan con
// jest.spyOn(reloj, 'ahora') para registrar una llegada a una hora exacta (bordes de RN-01, #29)
// sin depender de cuánto tarda cada petición.
function ahora() {
    return new Date();
}

module.exports = { ahora };
