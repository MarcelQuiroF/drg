'use strict';

const fs = require('fs');
const path = require('path');
const Sequelize = require('sequelize');
const process = require('process');

const envPath = path.resolve(__dirname, '../../.env');
require('dotenv').config({ path: envPath });

const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';

const configPath = path.join(__dirname, '..', 'config', 'config.js');
const config = require(configPath)[env];

const db = {};
let sequelize;

if (process.env.DATABASE_URL2) {
  sequelize = new Sequelize(process.env.DATABASE_URL2, config);
} else {

  sequelize = new Sequelize(config.url, config);
}

fs
  .readdirSync(__dirname)
  .filter(file => {
    return (
      file.indexOf('.') !== 0 &&
      file !== basename &&
      file.slice(-3) === '.js' &&
      file.indexOf('.test.js') === -1
    );
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

db.Categoria.belongsToMany(db.Juego, { 
  through: db.JuegoCategoria, 
  foreignKey: 'categoria_id',
  otherKey: 'juego_id',
  
});

db.Juego.belongsToMany(db.Categoria, { 
  through: db.JuegoCategoria, 
  foreignKey: 'juego_id',
  otherKey: 'categoria_id'
});

db.Categoria.belongsToMany(db.Producto, { 
  through: db.ProductoCategoria, 
  foreignKey: 'categoria_id',
  otherKey: 'producto_id'
});

db.Producto.belongsToMany(db.Categoria, { 
  through: db.ProductoCategoria, 
  foreignKey: 'producto_id',
  otherKey: 'categoria_id'
});

db.Piso.hasMany(db.Mesa, { foreignKey: 'piso_id' });
db.Mesa.belongsTo(db.Piso, { foreignKey: 'piso_id' });

db.Mesa.hasMany(db.Orden, { foreignKey: 'mesa_id' });
db.Orden.belongsTo(db.Mesa, { foreignKey: 'mesa_id' });

db.Orden.hasMany(db.ContenedorProducto, { foreignKey: 'orden_id' });
db.ContenedorProducto.belongsTo(db.Orden, { foreignKey: 'orden_id' });

db.Orden.hasMany(db.ContenedorJuego, { foreignKey: 'orden_id' });
db.ContenedorJuego.belongsTo(db.Orden, { foreignKey: 'orden_id' });

db.Producto.hasMany(db.ContenedorProducto, { foreignKey: 'producto_id' });
db.ContenedorProducto.belongsTo(db.Producto, { foreignKey: 'producto_id' });

db.Juego.hasMany(db.ContenedorJuego, { foreignKey: 'juego_id' });
db.ContenedorJuego.belongsTo(db.Juego, { foreignKey: 'juego_id' });

db.Cliente.hasMany(db.Reserva, { foreignKey: 'cliente_id' });
db.Reserva.belongsTo(db.Cliente, { foreignKey: 'cliente_id' });

db.Mesa.hasMany(db.Reserva, { foreignKey: 'mesa_id' });
db.Reserva.belongsTo(db.Mesa, { foreignKey: 'mesa_id' });

db.Orden.belongsToMany(db.Descuento, { 
  through: db.OrdenDescuento,
  foreignKey: 'orden_id',
  otherKey: 'descuento_id'
});

db.Descuento.belongsToMany(db.Orden, { 
  through: db.OrdenDescuento,
  foreignKey: 'descuento_id',
  otherKey: 'orden_id'
});

db.Empleado.hasMany(db.Asistencia, { foreignKey: 'empleado_id' });
db.Asistencia.belongsTo(db.Empleado, { foreignKey: 'empleado_id' });

db.Horario.hasMany(db.Asistencia, { foreignKey: 'horario_id' });
db.Asistencia.belongsTo(db.Horario, { foreignKey: 'horario_id' });

db.DescuentoAtraso.hasMany(db.Asistencia, { foreignKey: 'descuento_id' });
db.Asistencia.belongsTo(db.DescuentoAtraso, { foreignKey: 'descuento_id' });

db.Orden.hasMany(db.ContenedorTransaccion, { foreignKey: 'orden_id' });
db.ContenedorTransaccion.belongsTo(db.Orden, { foreignKey: 'orden_id' });

db.Cliente.hasMany(db.ContenedorTransaccion, { foreignKey: 'cliente_id' });
db.ContenedorTransaccion.belongsTo(db.Cliente, { foreignKey: 'cliente_id' });

db.Registro.belongsToMany(db.Orden, { 
  through: db.RegistroOrden, 
  foreignKey: 'registro_id',
  otherKey: 'orden_id'
});
db.Orden.belongsToMany(db.Registro, { 
  through: db.RegistroOrden, 
  foreignKey: 'orden_id',
  otherKey: 'registro_id'
});

db.Registro.belongsToMany(db.Reserva, { 
  through: db.RegistroReserva, 
  foreignKey: 'registro_id',
  otherKey: 'reserva_id'
});
db.Reserva.belongsToMany(db.Registro, { 
  through: db.RegistroReserva, 
  foreignKey: 'reserva_id',
  otherKey: 'registro_id'
});

db.Registro.belongsToMany(db.Asistencia, { 
  through: db.RegistroAsistencia, 
  foreignKey: 'registro_id',
  otherKey: 'atraso_id' 
});
db.Asistencia.belongsToMany(db.Registro, { 
  through: db.RegistroAsistencia, 
  foreignKey: 'atraso_id',
  otherKey: 'registro_id'
});


db.sequelize = sequelize;

module.exports = db;