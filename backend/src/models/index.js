'use strict';
const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require(__dirname + '/../config/config.js')[env];
const db = {};

// Inicializamos Sequelize con DATABASE_URL
const sequelize = new Sequelize(config.url, {
  dialect: config.dialect,
  dialectOptions: config.dialectOptions,
  logging: config.logging || console.log
});

// 🔹 Carga de modelos automáticamente
fs
  .readdirSync(__dirname)
  .filter(file => (file.indexOf('.') !== 0) && (file !== basename))
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

// ⚡ Asociaciones Bloque 1
db.Categoria.belongsToMany(db.Juego, { through: 'juego_categoria', foreignKey: 'categoria_id' });
db.Juego.belongsToMany(db.Categoria, { through: 'juego_categoria', foreignKey: 'juego_id' });

db.Categoria.belongsToMany(db.Producto, { through: 'producto_categoria', foreignKey: 'categoria_id' });
db.Producto.belongsToMany(db.Categoria, { through: 'producto_categoria', foreignKey: 'producto_id' });


// ContenedorProducto → Producto
db.ContenedorProducto.belongsTo(db.Producto, { foreignKey: 'producto_id' });
db.Producto.hasMany(db.ContenedorProducto, { foreignKey: 'producto_id' });

// ContenedorJuego → Juego
db.ContenedorJuego.belongsTo(db.Juego, { foreignKey: 'juego_id' });
db.Juego.hasMany(db.ContenedorJuego, { foreignKey: 'juego_id' });

// Mesa → Piso
db.Mesa.belongsTo(db.Piso, { foreignKey: 'piso_id' });
db.Piso.hasMany(db.Mesa, { foreignKey: 'piso_id' });

// Mesa → Orden
db.Orden.belongsTo(db.Mesa, { foreignKey: 'mesa_id' });
db.Mesa.hasMany(db.Orden, { foreignKey: 'mesa_id' });

// Cliente → Reserva
db.Reserva.belongsTo(db.Cliente, { foreignKey: 'cliente_id' });
db.Cliente.hasMany(db.Reserva, { foreignKey: 'cliente_id' });

// Mesa → Reserva
db.Reserva.belongsTo(db.Mesa, { foreignKey: 'mesa_id' });
db.Mesa.hasMany(db.Reserva, { foreignKey: 'mesa_id' });

// Orden → ContenedorProducto (muchos a muchos)
db.Orden.belongsToMany(db.ContenedorProducto, { through: 'orden_contenedor_producto', foreignKey: 'orden_id' });
db.ContenedorProducto.belongsToMany(db.Orden, { through: 'orden_contenedor_producto', foreignKey: 'contenedor_producto_id' });


// Orden → ContenedorJuego (muchos a muchos)
db.Orden.belongsToMany(db.ContenedorJuego, { through: 'orden_contenedor_juego', foreignKey: 'orden_id' });
db.ContenedorJuego.belongsToMany(db.Orden, { through: 'orden_contenedor_juego', foreignKey: 'contenedor_juego_id' });

// Orden → Descuento (muchos a muchos)
db.Orden.belongsToMany(db.Descuento, { through: 'orden_descuento', foreignKey: 'orden_id' });
db.Descuento.belongsToMany(db.Orden, { through: 'orden_descuento', foreignKey: 'descuento_id' });

// ContenedorTransaccion → Orden
db.ContenedorTransaccion.belongsTo(db.Orden, { foreignKey: 'orden_id' });
db.Orden.hasMany(db.ContenedorTransaccion, { foreignKey: 'orden_id' });

// ContenedorTransaccion → Cliente
db.ContenedorTransaccion.belongsTo(db.Cliente, { foreignKey: 'cliente_id' });
db.Cliente.hasMany(db.ContenedorTransaccion, { foreignKey: 'cliente_id' });


// Atraso → Empleado, DescuentoAtraso, Horario
db.Atraso.belongsTo(db.Empleado, { foreignKey: 'empleado_id' });
db.Empleado.hasMany(db.Atraso, { foreignKey: 'empleado_id' });

db.Atraso.belongsTo(db.DescuentoAtraso, { foreignKey: 'descuento_id' });
db.DescuentoAtraso.hasMany(db.Atraso, { foreignKey: 'descuento_id' });

db.Atraso.belongsTo(db.Horario, { foreignKey: 'horario_id' });
db.Horario.hasMany(db.Atraso, { foreignKey: 'horario_id' });

// Registro → Orden (muchos a muchos)
db.Registro.belongsToMany(db.Orden, { through: 'registro_orden', foreignKey: 'registro_id' });
db.Orden.belongsToMany(db.Registro, { through: 'registro_orden', foreignKey: 'orden_id' });

// Registro → Atraso (muchos a muchos)
db.Registro.belongsToMany(db.Atraso, { through: 'registro_atraso', foreignKey: 'registro_id' });
db.Atraso.belongsToMany(db.Registro, { through: 'registro_atraso', foreignKey: 'atraso_id' });

// Registro → Reserva (muchos a muchos)
db.Registro.belongsToMany(db.Reserva, { through: 'registro_reserva', foreignKey: 'registro_id' });
db.Reserva.belongsToMany(db.Registro, { through: 'registro_reserva', foreignKey: 'reserva_id' });


db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
