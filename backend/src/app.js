const express = require('express');
const cors = require('cors');

const { notFoundHandler, errorHandler } = require('./middlewares/errorHandler');

const authRoute = require('./routes/authRoute'); 
const empleadoRoute = require('./routes/empleadoRoute');
const categoriaRoute = require('./routes/categoriaRoute');
const productoRoute = require('./routes/productoRoute');
const juegoRoute = require('./routes/juegoRoute');
const pisoRoute = require('./routes/pisoRoute');
const mesaRoute = require('./routes/mesaRoute');
const ordenRoute = require('./routes/ordenRoute');
const contenedorProductoRoute = require('./routes/contenedorProductoRoute');
const contenedorJuegoRoute = require('./routes/contenedorJuegoRoute');
const transaccionRoute = require('./routes/transaccionRoute');
const app = express();

app.use(cors()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 



const API_PREFIX = '/api/v1';
app.use(`${API_PREFIX}/auth`, authRoute);
app.use(`${API_PREFIX}/empleados`, empleadoRoute); 
app.use(`${API_PREFIX}/categorias`, categoriaRoute);
app.use(`${API_PREFIX}/productos`, productoRoute);
app.use(`${API_PREFIX}/juegos`, juegoRoute);
app.use(`${API_PREFIX}/pisos`, pisoRoute);
app.use(`${API_PREFIX}/mesas`, mesaRoute);
app.use(`${API_PREFIX}/ordenes`, ordenRoute);
app.use(`${API_PREFIX}/ordenes-productos`, contenedorProductoRoute);
app.use(`${API_PREFIX}/ordenes-juegos`, contenedorJuegoRoute);
app.use(`${API_PREFIX}/pagos`, transaccionRoute);

app.use(notFoundHandler); 
app.use(errorHandler); 


module.exports = app;


































// const logger = require('./config/logger'); // Si ya lo tienes implementado