'use strict';

// Recorre la matriz de docs/03_diseno/permisos.md: por cada ruta y cada rol, comprueba que el
// servidor deja pasar a quien tiene el permiso y responde 403 a quien no lo tiene (ADR-008, #25).
// La matriz es la especificación: si el código no coincide, la prueba falla.
//
// Los ids de las rutas se reemplazan por uno que no existe (999999): las peticiones permitidas
// terminan en 400/404/500 sin cambiar datos. Esta prueba solo mira el permiso (que no sea 401
// ni 403); lo que hace cada ruta se prueba en su módulo.

const { comoRol, anonimo } = require('../soporte/api');
const { ROLES, leerMatriz, esPublica } = require('../soporte/permisosDoc');

const ID_INEXISTENTE = '999999';
const rutaConIds = (ruta) => ruta.replace(/:\w+/g, ID_INEXISTENTE);

const MATRIZ = leerMatriz();

// Que cada ruta montada tenga su fila (y ninguna sobre) lo comprueba catalogoPermisos.test.js; aquí
// basta con que el documento se haya leído. Sin un número fijo, agregar una ruta no obliga a
// cambiar esta prueba.
test('la matriz de permisos.md tiene filas', () => {
    expect(MATRIZ.length).toBeGreaterThan(0);
});

describe.each(MATRIZ.map((f) => [`${f.metodo} ${f.ruta}`, f]))('%s', (_nombre, fila) => {
    const metodo = fila.metodo.toLowerCase();
    const ruta = rutaConIds(fila.ruta);

    if (esPublica(fila)) {
        test('es pública: responde sin sesión', async () => {
            const res = await anonimo[metodo](ruta).send({});
            expect([401, 403]).not.toContain(res.status);
        });
        return;
    }

    test('sin sesión responde 401', async () => {
        const res = await anonimo[metodo](ruta).send({});
        expect(res.status).toBe(401);
    });

    for (const rol of ROLES) {
        const permitido = fila.permite[rol];
        const nombre = permitido
            ? `${rol} tiene el permiso (${fila.permiso}): no responde 401 ni 403`
            : `${rol} no tiene el permiso (${fila.permiso}): responde 403`;

        test(nombre, async () => {
            const api = await comoRol(rol);
            const res = await api[metodo](ruta).send({});
            if (permitido) {
                expect([401, 403]).not.toContain(res.status);
            } else {
                expect(res.status).toBe(403);
                expect(res.body.permiso).toBe(fila.permiso);
            }
        });
    }
});
