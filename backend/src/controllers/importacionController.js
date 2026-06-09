const xlsx = require('xlsx');
const { Producto, Juego, Categoria, sequelize } = require('../models');
const httpCodes = require('../utils/httpCodes');

async function importarProductos(req, res, next) {
    const t = await sequelize.transaction();
    try {
        if (!req.file) throw new Error("No se subió ningún archivo Excel.");

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        for (let [index, row] of rows.entries()) {
            const filaReal = index + 2; // +1 del encabezado, +1 porque el array empieza en 0
            const { nombre, zona, precio, imagen, categoria_id } = row;

            if (!nombre || precio === undefined || !categoria_id) {
                throw new Error(`Faltan datos obligatorios (nombre, precio, o categoria_id) en la fila ${filaReal}.`);
            }

            // Verificar si la categoría existe
            const categoria = await Categoria.findByPk(categoria_id, { transaction: t });
            if (!categoria) {
                throw new Error(`La categoría con ID ${categoria_id} no existe (Fila ${filaReal}).`);
            }

            // Crear producto (Duplicará si ya existe el nombre, según tu requerimiento)
            const nuevoProducto = await Producto.create({ nombre, zona, precio, imagen }, { transaction: t });
            
            // Vincular en la tabla intermedia ProductoCategoria
            await nuevoProducto.addCategoria(categoria_id, { transaction: t });
        }

        await t.commit();
        res.status(httpCodes.OK.code).json({ message: "Productos importados con éxito." });

    } catch (error) {
        await t.rollback();
        res.status(httpCodes.BAD_REQUEST.code).json({ message: error.message });
    }
}

async function importarJuegos(req, res, next) {
    const t = await sequelize.transaction();
    try {
        if (!req.file) throw new Error("No se subió ningún archivo Excel.");

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const rows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        for (let [index, row] of rows.entries()) {
            const filaReal = index + 2;
            const { nombre, precio, jugadores_min, jugadores_max, tiempo_partida, enlace, imagen, categoria_id } = row;

            if (!nombre || !jugadores_min || !jugadores_max || !categoria_id) {
                throw new Error(`Faltan datos obligatorios en la fila ${filaReal}. Revisa nombre, min/max jugadores y categoria_id.`);
            }

            const categoria = await Categoria.findByPk(categoria_id, { transaction: t });
            if (!categoria) {
                throw new Error(`La categoría con ID ${categoria_id} no existe (Fila ${filaReal}).`);
            }

            const nuevoJuego = await Juego.create({
                nombre, 
                precio: precio || 0, 
                jugadores_min, 
                jugadores_max, 
                tiempo_partida, 
                enlace, 
                imagen
            }, { transaction: t });

            await nuevoJuego.addCategoria(categoria_id, { transaction: t });
        }

        await t.commit();
        res.status(httpCodes.OK.code).json({ message: "Juegos importados con éxito." });

    } catch (error) {
        await t.rollback();
        res.status(httpCodes.BAD_REQUEST.code).json({ message: error.message });
    }
}

function enviarPlantillaExcel(res, headers, nombreArchivo) {
    const worksheet = xlsx.utils.aoa_to_sheet([headers]);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Plantilla");
    
    const excelBuffer = xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });

    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}.xlsx"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(excelBuffer);
}

async function descargarPlantillaProductos(req, res, next) {
    try {
        const headers = ['nombre', 'zona', 'precio', 'imagen', 'categoria_id'];
        enviarPlantillaExcel(res, headers, 'Plantilla_Importacion_Productos');
    } catch (error) { next(error); }
}

async function descargarPlantillaJuegos(req, res, next) {
    try {
        const headers = ['nombre', 'precio', 'jugadores_min', 'jugadores_max', 'tiempo_partida', 'enlace', 'imagen', 'categoria_id'];
        enviarPlantillaExcel(res, headers, 'Plantilla_Importacion_Juegos');
    } catch (error) { next(error); }
}

module.exports = { 
    importarProductos, 
    importarJuegos,
    descargarPlantillaProductos,
    descargarPlantillaJuegos
};