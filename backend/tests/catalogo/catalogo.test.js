'use strict';

// Catálogo (categorías, productos, juegos) y espacio (pisos, mesas), más el alta de empleados.
// Casos F2, C1, C2, C3, T4, P1 y T16 del análisis, y el CRUD básico del ADMIN.
const { comoRol, anonimo } = require('../soporte/api');
const { sequelize, Producto, Juego, JuegoCategoria } = require('../../src/models');

let admin;

beforeAll(async () => {
    admin = await comoRol('ADMIN');
});

// Sequelize no pluraliza "Categoria": la asociación llega como `Categoria` (un arreglo).
const nombresDe = (entidad) => (entidad.Categoria ?? []).map((c) => c.nombre).sort();

async function categoria(nombre) {
    const res = await admin.post('/categorias').send({ nombre });
    expect(res.status).toBe(201);
    return res.body;
}

const juegoValido = (datos = {}) => ({
    nombre: 'Dixit',
    precio: 15,
    jugadores_min: 3,
    jugadores_max: 6,
    tiempo_partida: 30,
    ...datos
});

describe('Categorías', () => {
    test('el ADMIN crea, lista y elimina una categoría', async () => {
        const nueva = await categoria('Bebidas calientes');
        expect((await admin.get('/categorias')).body.map((c) => c.id)).toContain(nueva.id);
        expect((await admin.delete(`/categorias/${nueva.id}`)).status).toBe(200);
        expect((await admin.get('/categorias')).body.map((c) => c.id)).not.toContain(nueva.id);
    });

    test('sin nombre responde 400', async () => {
        expect((await admin.post('/categorias').send({})).status).toBe(400);
    });
});

describe('Productos', () => {
    test('el ADMIN crea un producto con categorías, lo edita sin tocarlas y lo elimina', async () => {
        const cat = await categoria('Postres');
        const creado = await admin
            .post('/productos')
            .send({ nombre: 'Brownie', precio: 12, zona: 'CAFETERIA', categorias: [cat.id] });
        expect(creado.status).toBe(201);
        expect(nombresDe(creado.body)).toEqual(['Postres']);

        const editado = await admin.put(`/productos/${creado.body.id}`).send({ precio: 14 });
        expect(editado.status).toBe(200);
        expect(Number(editado.body.precio)).toBe(14);
        expect(nombresDe(editado.body)).toEqual(['Postres']);

        expect((await admin.delete(`/productos/${creado.body.id}`)).status).toBe(200);
        expect((await admin.get(`/productos/${creado.body.id}`)).status).toBe(404);
    });

    test('sin nombre o sin precio responde 400', async () => {
        expect((await admin.post('/productos').send({ nombre: 'Sin precio' })).status).toBe(400);
    });

    test('C1 · editar un producto conservando su categoría responde 200 y la mantiene (#78)', async () => {
        const cat = await categoria('Salados');
        const creado = (
            await admin.post('/productos').send({ nombre: 'Empanada', precio: 8, zona: 'COCINA', categorias: [cat.id] })
        ).body;
        const res = await admin
            .put(`/productos/${creado.id}`)
            .send({ nombre: 'Empanada de queso', categorias: [cat.id] });
        expect(res.status).toBe(200); // antes 400: chocaba con la clave primaria de producto_categoria
        const guardado = (await admin.get(`/productos/${creado.id}`)).body;
        expect(nombresDe(guardado)).toEqual(['Salados']); // antes quedaba sin categorías
    });

    test('C1b · agregar, quitar y volver a asignar categorías deja exactamente las elegidas (#78)', async () => {
        const [a, b, c] = [await categoria('Cat A'), await categoria('Cat B'), await categoria('Cat C')];
        const creado = (
            await admin
                .post('/productos')
                .send({ nombre: 'Tostado', precio: 12, zona: 'COCINA', categorias: [a.id, b.id] })
        ).body;
        const editar = async (categorias) => {
            const res = await admin.put(`/productos/${creado.id}`).send({ categorias });
            expect(res.status).toBe(200);
            return nombresDe((await admin.get(`/productos/${creado.id}`)).body).sort();
        };
        expect(await editar([b.id, c.id])).toEqual(['Cat B', 'Cat C']); // quita A, conserva B, agrega C
        expect(await editar([])).toEqual([]); // quita todas
        expect(await editar([a.id])).toEqual(['Cat A']); // vuelve a asignar una que se había quitado
        expect(await editar([a.id, a.id])).toEqual(['Cat A']); // un id repetido no choca
        // sin "categorias" en el cuerpo no se tocan
        expect((await admin.put(`/productos/${creado.id}`).send({ precio: 13 })).status).toBe(200);
        expect(nombresDe((await admin.get(`/productos/${creado.id}`)).body)).toEqual(['Cat A']);
    });

    test('C1c · editar con una categoría que no existe responde 400 y no cambia nada (#78)', async () => {
        const cat = await categoria('Dulces');
        const creado = (
            await admin
                .post('/productos')
                .send({ nombre: 'Alfajor', precio: 6, zona: 'CAFETERIA', categorias: [cat.id] })
        ).body;
        const res = await admin
            .put(`/productos/${creado.id}`)
            .send({ nombre: 'Alfajor cambiado', categorias: [999999] });
        expect(res.status).toBe(400);
        const guardado = (await admin.get(`/productos/${creado.id}`)).body;
        expect(guardado.nombre).toBe('Alfajor'); // la transacción deshace también el cambio de nombre
        expect(nombresDe(guardado)).toEqual(['Dulces']);
    });

    test('C1d · crear con una categoría que no existe responde 400 y no crea el producto (#78)', async () => {
        const res = await admin
            .post('/productos')
            .send({ nombre: 'Producto huérfano', precio: 5, zona: 'COCINA', categorias: [999999] });
        expect(res.status).toBe(400);
        expect(await Producto.findOne({ where: { nombre: 'Producto huérfano' }, paranoid: false })).toBeNull();
    });

    test('P1 · una zona que no es COCINA ni CAFETERIA responde 400 (#32)', async () => {
        const res = await admin.post('/productos').send({ nombre: 'Limonada', precio: 10, zona: 'Barra' });
        expect(res.status).toBe(400); // antes 201 con cualquier texto
    });
});

describe('Juegos', () => {
    test('el ADMIN crea un juego sin categorías, lo edita y lo elimina', async () => {
        const creado = await admin.post('/juegos').send(juegoValido());
        expect(creado.status).toBe(201);
        const editado = await admin.put(`/juegos/${creado.body.id}`).send({ precio: 18 });
        expect(editado.status).toBe(200);
        expect(Number(editado.body.precio)).toBe(18);
        expect((await admin.delete(`/juegos/${creado.body.id}`)).status).toBe(200);
    });

    test('T16 · el catálogo de juegos responde sin sesión (catálogo por QR)', async () => {
        const res = await anonimo.get('/juegos');
        expect(res.status).toBe(200);
        expect(res.body.map((j) => j.nombre)).toEqual(expect.arrayContaining(['Catan', 'Exploding Kittens']));
    });

    test('juego_categoria: quitar una categoría y volver a asignarla funciona (#78; el servicio de juegos es #24)', async () => {
        const cat = await categoria('Cooperativo');
        const j = (await admin.post('/juegos').send(juegoValido({ nombre: 'Pandemic' }))).body;
        await JuegoCategoria.create({ juego_id: j.id, categoria_id: cat.id });
        await JuegoCategoria.destroy({ where: { juego_id: j.id } });
        expect(await JuegoCategoria.count({ where: { juego_id: j.id } })).toBe(0); // borrado físico
        await expect(JuegoCategoria.create({ juego_id: j.id, categoria_id: cat.id })).resolves.toBeDefined();
    });

    test('F2 · crear un juego con categorías responde 201 y las guarda (#24)', async () => {
        const cat = await categoria('Estrategia');
        const res = await admin.post('/juegos').send(juegoValido({ nombre: 'Carcassonne', categorias: [cat.id] }));
        expect(res.status).toBe(201); // antes 500: juego.setCategorias is not a function
        expect(nombresDe(res.body)).toEqual(['Estrategia']);
    });

    test('F2 · editar las categorías de un juego responde 200 y las guarda (#24)', async () => {
        const cat = await categoria('Familiar');
        const creado = (await admin.post('/juegos').send(juegoValido({ nombre: 'Ticket to Ride' }))).body;
        const res = await admin.put(`/juegos/${creado.id}`).send({ categorias: [cat.id] });
        expect(res.status).toBe(200); // antes 500
        expect(nombresDe(res.body)).toEqual(['Familiar']);
    });

    test('F2b · reasignar categorías varias veces: quitar, volver a poner y repetir un id (#24)', async () => {
        const a = await categoria('Party');
        const b = await categoria('Cartas');
        const j = (await admin.post('/juegos').send(juegoValido({ nombre: 'Codenames', categorias: [a.id, b.id] })))
            .body;
        expect(nombresDe(j)).toEqual(['Cartas', 'Party']);

        const soloA = await admin.put(`/juegos/${j.id}`).send({ categorias: [a.id] });
        expect(soloA.status).toBe(200);
        expect(nombresDe(soloA.body)).toEqual(['Party']);

        const otraVez = await admin.put(`/juegos/${j.id}`).send({ categorias: [a.id, b.id, b.id] });
        expect(otraVez.status).toBe(200);
        expect(nombresDe(otraVez.body)).toEqual(['Cartas', 'Party']);

        const editarSinCategorias = await admin.put(`/juegos/${j.id}`).send({ precio: 20 });
        expect(nombresDe(editarSinCategorias.body)).toEqual(['Cartas', 'Party']); // no las toca

        const ninguna = await admin.put(`/juegos/${j.id}`).send({ categorias: [] });
        expect(ninguna.status).toBe(200);
        expect(nombresDe(ninguna.body)).toEqual([]);
    });

    test('F2c · crear con una categoría que no existe responde 400 y no crea el juego (#24)', async () => {
        const res = await admin.post('/juegos').send(juegoValido({ nombre: 'Juego huérfano', categorias: [999999] }));
        expect(res.status).toBe(400);
        expect(await Juego.findOne({ where: { nombre: 'Juego huérfano' }, paranoid: false })).toBeNull();
    });

    test('F2d · editar con una categoría que no existe responde 400 y no cambia nada (#24)', async () => {
        const cat = await categoria('Abstracto');
        const j = (await admin.post('/juegos').send(juegoValido({ nombre: 'Azul', categorias: [cat.id] }))).body;
        const res = await admin.put(`/juegos/${j.id}`).send({ nombre: 'Azul cambiado', categorias: [999999] });
        expect(res.status).toBe(400);
        const guardado = (await admin.get(`/juegos/${j.id}`)).body;
        expect(guardado.nombre).toBe('Azul'); // la transacción deshace también el cambio de nombre
        expect(nombresDe(guardado)).toEqual(['Abstracto']);
    });

    test('C2 · crear un juego sin tiempo_partida responde 400, no 500 (#28)', async () => {
        const { tiempo_partida: _omitido, ...sinTiempo } = juegoValido({ nombre: 'Uno' });
        const res = await admin.post('/juegos').send(sinTiempo);
        expect(res.status).toBe(400); // antes 500: la columna es NOT NULL y el modelo no lo validaba
    });
});

describe('Pisos y mesas', () => {
    test('el ADMIN crea un piso con una mesa, edita la mesa y elimina los dos', async () => {
        const piso = await admin.post('/pisos').send({ nombre: 'Terraza', numero: 5 });
        expect(piso.status).toBe(201);
        const mesa = await admin.post('/mesas').send({ nombre: 'Terraza 1', numero: 51, piso_id: piso.body.id });
        expect(mesa.status).toBe(201);
        const editada = await admin.put(`/mesas/${mesa.body.id}`).send({ cantidadMaxima: 6 });
        expect(editada.status).toBe(200);
        expect(editada.body.cantidadMaxima).toBe(6);
        expect((await admin.delete(`/mesas/${mesa.body.id}`)).status).toBe(200);
        expect((await admin.delete(`/pisos/${piso.body.id}`)).status).toBe(200);
    });

    test('una mesa sin número o sin piso responde 400', async () => {
        expect((await admin.post('/mesas').send({ nombre: 'Sin piso', numero: 60 })).status).toBe(400);
    });

    test('la capacidad máxima no puede ser menor a la mínima', async () => {
        const piso = (await admin.get('/pisos')).body[0];
        const res = await admin
            .post('/mesas')
            .send({ nombre: 'Al revés', numero: 61, piso_id: piso.id, cantidadMinima: 4, cantidadMaxima: 2 });
        expect(res.status).toBeGreaterThanOrEqual(400);
        expect(res.status).toBeLessThan(500);
    });

    test('T4 · crear una mesa sin nombre responde 400, no 500 (#28)', async () => {
        const piso = (await admin.get('/pisos')).body[0];
        const res = await admin.post('/mesas').send({ numero: 62, piso_id: piso.id });
        expect(res.status).toBe(400); // antes 500: la columna es NOT NULL y el modelo no lo validaba
    });
});

describe('Empleados', () => {
    test('C3 · la dirección de un empleado nuevo se guarda (#28)', async () => {
        const res = await admin.post('/empleados').send({
            nombre: 'Empleado con dirección',
            ci: '8888888LP',
            contrasenia: 'una-contrasenia',
            rol: 'MESERO',
            direccion: 'Calle Falsa 123'
        });
        expect(res.status).toBe(201);
        const [[fila]] = await sequelize.query("SELECT direccion FROM empleado WHERE ci = '8888888LP'");
        expect(fila.direccion).toBe('Calle Falsa 123'); // antes null: el modelo no tenía el campo
    });
});
