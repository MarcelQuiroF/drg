//define tu aplicación Express (rutas, middlewares, conexión a DB)

const express = require("express");
const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API funcionando");
});

module.exports = app;