'use strict';


module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    await queryInterface.bulkInsert('piso', [
      { id: 1, nombre: 'Planta Baja', numero: 0, activo: true, createdAt: now, updatedAt: now },
      { id: 2, nombre: 'Primer Piso', numero: 1, activo: true, createdAt: now, updatedAt: now }
    ]);

    await queryInterface.bulkInsert('mesa', [
      { id: 1, nombre: 'Mesa 1 (Ventana)', numero: 1, estado: 0, piso_id: 1, createdAt: now, updatedAt: now },
      { id: 2, nombre: 'Mesa 2 (Barra)', numero: 2, estado: 0, piso_id: 1, createdAt: now, updatedAt: now },
      { id: 3, nombre: 'Mesa 3 (Sillones)', numero: 3, estado: 0, piso_id: 2, createdAt: now, updatedAt: now }
    ]);

    await queryInterface.bulkInsert('categoria', [
      { id: 1, nombre: 'Estrategia', createdAt: now, updatedAt: now },
      { id: 2, nombre: 'Party Games', createdAt: now, updatedAt: now },
      { id: 3, nombre: 'Cafetería', createdAt: now, updatedAt: now },
      { id: 4, nombre: 'Bebidas', createdAt: now, updatedAt: now }
    ]);

    await queryInterface.bulkInsert('juego', [
      { id: 1, nombre: 'Catan', precio: 25.00, jugadores_min: 3, jugadores_max: 4, activado: true, tiempo_partida: 90, createdAt: now, updatedAt: now },
      { id: 2, nombre: 'Exploding Kittens', precio: 10.00, jugadores_min: 2, jugadores_max: 5, activado: true, tiempo_partida: 15, createdAt: now, updatedAt: now }
    ]);

    await queryInterface.bulkInsert('producto', [
      { id: 1, nombre: 'Cappuccino', zona: 'Barra', activado: true, precio: 18.00, estado: true, createdAt: now, updatedAt: now },
      { id: 2, nombre: 'Sandwich de Pollo', zona: 'Cocina', activado: true, precio: 35.00, estado: true, createdAt: now, updatedAt: now }
    ]);

    await queryInterface.bulkInsert('juego_categoria', [
      { juego_id: 1, categoria_id: 1, createdAt: now, updatedAt: now },
      { juego_id: 2, categoria_id: 2, createdAt: now, updatedAt: now }
    ]);
    await queryInterface.bulkInsert('producto_categoria', [
      { producto_id: 1, categoria_id: 3, createdAt: now, updatedAt: now },
      { producto_id: 2, categoria_id: 3, createdAt: now, updatedAt: now }
    ]);

    await queryInterface.bulkInsert('empleado', [
      { 
        id: 1, 
        nombre: 'Admin Mesa Dragon', 
        ci: '1234567LP', 
        telefono: '77712345', 
        contrasenia: '$2b$10$5/wnhUJUAGPKPNLfdlvR3eDwXq/0fgNhwnTpHSdj.5lGWy43YQgwq', 
        rol: 'CAJERO', 
        activo: true, 
        correo: 'admin@mesadragon.com', 
        createdAt: now, 
        updatedAt: now 
      }
    ]);

    await queryInterface.bulkInsert('cliente', [
      { id: 1, nombre: 'Juan Perez', ci: '9988776', telefono: '60011223', createdAt: now, updatedAt: now }
    ]);

    await queryInterface.bulkInsert('horario', [
      { id: 1, dia: 'Lunes', hora_entrada: '08:00:00', hora_salida: '16:00:00', createdAt: now, updatedAt: now }
    ]);
    await queryInterface.bulkInsert('descuento_atraso', [
      { id: 1, cantidad_tiempo: '00:15:00', descuento: 10, descuento_porcentual: 0, createdAt: now, updatedAt: now }
    ]);

    await queryInterface.bulkInsert('orden', [
      { id: 1, total: 53.00, finalizado: false, mesa_id: 1, createdAt: now, updatedAt: now }
    ]);

    await queryInterface.bulkInsert('contenedor_producto', [
      { orden_id: 1, producto_id: 2, cantidad: 1, cantidad_recibido: 1, cantidad_preparando: 0, cantidad_terminado: 1, cantidad_enviado: 1, createdAt: now, updatedAt: now }
    ]);
    await queryInterface.bulkInsert('contenedor_juego', [
      { orden_id: 1, juego_id: 1, hora_inicio: '14:00:00', cantidad: 1, createdAt: now, updatedAt: now }
    ]);

    console.log('Bien nomas');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('contenedor_juego', null, {});
    await queryInterface.bulkDelete('contenedor_producto', null, {});
    await queryInterface.bulkDelete('orden', null, {});
    await queryInterface.bulkDelete('descuento_atraso', null, {});
    await queryInterface.bulkDelete('horario', null, {});
    await queryInterface.bulkDelete('cliente', null, {});
    await queryInterface.bulkDelete('empleado', null, {});
    await queryInterface.bulkDelete('producto_categoria', null, {});
    await queryInterface.bulkDelete('juego_categoria', null, {});
    await queryInterface.bulkDelete('producto', null, {});
    await queryInterface.bulkDelete('juego', null, {});
    await queryInterface.bulkDelete('categoria', null, {});
    await queryInterface.bulkDelete('mesa', null, {});
    await queryInterface.bulkDelete('piso', null, {});
  }
};