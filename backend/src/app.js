const express = require('express');
const path = require('path');
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
const clienteRoute = require('./routes/clienteRoute');
const reservaRoute = require('./routes/reservaRoute');
const comandaRoute = require('./routes/comandaRoute');
const asistenciaRoute = require('./routes/asistenciaRoute');
const reporteRoute = require('./routes/reportesRoute');
const configuracionRoutes = require('./routes/configuracionRoutes');
const importacionRoute = require('./routes/importacionRoute');

const app = express();

app.use(cors()); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); 

const API_PREFIX = '/api/v1';

const pathFrontend = path.join(__dirname, '..', '..', 'frontend');

console.log("Sirviendo archivos estáticos desde:", pathFrontend);

app.use(express.static(pathFrontend));

app.get('/', (req, res) => {
    res.sendFile(path.join(pathFrontend, 'html', 'login.html'));
});

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
app.use(`${API_PREFIX}/clientes`, clienteRoute);
app.use(`${API_PREFIX}/reservas`, reservaRoute);
app.use(`${API_PREFIX}/comandas`, comandaRoute);
app.use(`${API_PREFIX}/asistencias`, asistenciaRoute);
app.use(`${API_PREFIX}/reportes`, reporteRoute);
app.use(`${API_PREFIX}/configuracion`, configuracionRoutes);
app.use(`${API_PREFIX}/importacion`, importacionRoute);

app.use(notFoundHandler); 
app.use(errorHandler); 

module.exports = app;



// const logger = require('./config/logger'); 