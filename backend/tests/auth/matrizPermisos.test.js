'use strict';

// Recorre la matriz de docs/03_diseno/permisos.md: por cada ruta y cada rol, comprueba
// que el servidor deja pasar a quien tiene el permiso y responde 403 a quien no lo tiene.
//
// La matriz es la especificación (ADR-008). Cuando el código actual ("Hoy") no coincide
// con ella para un rol, la prueba se marca test.failing con #25, que es la issue que lo
// corrige. Al corregir #25, esas pruebas empiezan a pasar y hay que quitarles el failing:
// basta con actualizar la columna "Hoy" del documento.
//
// Los ids de las rutas se reemplazan por uno que no existe (999999): las peticiones
// permitidas terminan en 400/404/500 sin cambiar datos. Esta prueba solo mira el permiso
// (que no sea 401 ni 403); lo que hace cada ruta se prueba en su módulo.

const fs = require('fs');
const path = require('path');
const { comoRol, anonimo } = require('../soporte/api');

const ROLES = ['ADMIN', 'CAJERO', 'MESERO'];
const ID_INEXISTENTE = '999999';
const ISSUE_DIFERENCIAS = '#25';

function leerMatriz() {
    const archivo = path.join(__dirname, '..', '..', '..', 'docs', '03_diseno', 'permisos.md');
    const filas = [];
    for (const linea of fs.readFileSync(archivo, 'utf8').split('\n')) {
        if (!/^\| (GET|POST|PUT|PATCH|DELETE) \|/.test(linea)) continue;
        const [metodo, ruta, permiso, admin, cajero, mesero, hoy] = linea
            .replace(/^\||\|$/g, '')
            .split('|')
            .map((c) => c.trim());
        filas.push({
            metodo,
            ruta: ruta.replace(/`/g, ''),
            permiso: permiso.replace(/`/g, ''),
            permite: { ADMIN: admin, CAJERO: cajero, MESERO: mesero },
            hoy
        });
    }
    return filas;
}

// ¿La matriz deja pasar a este rol? ✅ sí, ❌ no (el ⚠ de "valor de prueba" no cambia nada).
const matrizPermite = (fila, rol) => /✅|🌐/.test(fila.permite[rol]);

// ¿El código actual deja pasar a este rol? Se lee de la columna "Hoy".
function hoyPermite(fila, rol) {
    const hoy = fila.hoy;
    if (/chequeo a mano/.test(hoy)) return matrizPermite(fila, rol); // mismo resultado, otro mecanismo
    if (/público|sesión|los 3 roles/.test(hoy)) return true;
    return hoy
        .split(',')
        .map((r) => r.trim())
        .includes(rol);
}

const rutaConIds = (ruta) => ruta.replace(/:\w+/g, ID_INEXISTENTE);
const esPublica = (fila) => /público/.test(fila.permiso);

const MATRIZ = leerMatriz();

test('la matriz de permisos.md tiene las 69 rutas montadas', () => {
    expect(MATRIZ).toHaveLength(69);
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
        const permitido = matrizPermite(fila, rol);
        const coincideHoy = permitido === hoyPermite(fila, rol);
        const nombre = permitido
            ? `${rol} tiene el permiso (${fila.permiso}): no responde 401 ni 403`
            : `${rol} no tiene el permiso (${fila.permiso}): responde 403`;
        const caso = coincideHoy ? test : test.failing;

        caso(coincideHoy ? nombre : `${nombre} (${ISSUE_DIFERENCIAS})`, async () => {
            const api = await comoRol(rol);
            const res = await api[metodo](ruta).send({});
            if (permitido) {
                expect([401, 403]).not.toContain(res.status);
            } else {
                expect(res.status).toBe(403);
            }
        });
    }
});
