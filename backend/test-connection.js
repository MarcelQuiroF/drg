

const sequelize = require('./src/config/db');


sequelize.authenticate()
  .then(() => console.log('Conectado correctamente a Supabase'))
  .catch(err => console.error('Error de conexión:', err));
