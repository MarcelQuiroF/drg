require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: { require: true, rejectUnauthorized: false }
  },
  logging: console.log
});

(async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa a Supabase');
  } catch (err) {
    console.error('❌ Error de conexión:', err);
  }
})();
