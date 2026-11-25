'use strict';

// El mapa de permisos del código (src/config/permisos.js) y las rutas montadas tienen que decir
// lo mismo que docs/03_diseno/permisos.md (#25, ADR-008). Si alguien agrega un permiso, cambia
// el mapa o protege una ruta con otro permiso sin actualizar el documento (o al revés), falla.

const fs = require('fs');
const path = require('path');
const { CATALOGO, PERMISOS_POR_ROL, permisosDe, tienePermiso } = require('../../src/config/permisos');
const { requierePermiso } = require('../../src/middlewares/permisoMiddleware');
const { leerMatriz, leerCatalogo, esPublica, soloSesion } = require('../soporte/permisosDoc');
const { comoRol } = require('../soporte/api');

const DOC = leerCatalogo();
const MATRIZ = leerMatriz();
const SRC = path.join(__dirname, '..', '..', 'src');

// Rutas que montan los routers de app.js: { 'GET /ordenes/:id': ['ordenes.ver'], ... }
function rutasMontadas() {
    const app = fs.readFileSync(path.join(SRC, 'app.js'), 'utf8');
    const archivos = {};
    for (const [, variable, archivo] of app.matchAll(/const (\w+) = require\('\.\/routes\/(\w+)'\)/g)) {
        archivos[variable] = archivo;
    }
    const rutas = {};
    for (const [, prefijo, variable] of app.matchAll(/app\.use\(`\$\{API_PREFIX\}(\/[\w-]+)`, (\w+)\)/g)) {
        const router = require(path.join(SRC, 'routes', archivos[variable]));
        for (const capa of router.stack) {
            if (!capa.route) continue;
            const sufijo = capa.route.path === '/' ? '' : capa.route.path;
            const permisos = capa.route.stack.map((c) => c.handle.permiso).filter(Boolean);
            for (const metodo of Object.keys(capa.route.methods)) {
                rutas[`${metodo.toUpperCase()} ${prefijo}${sufijo}`] = permisos;
            }
        }
    }
    return rutas;
}

describe('Catálogo de permisos: documento y código', () => {
    test('el catálogo tiene los mismos permisos en permisos.md y en config/permisos.js', () => {
        expect(Object.keys(CATALOGO).sort()).toEqual(Object.keys(DOC).sort());
        expect(Object.keys(DOC)).toHaveLength(20);
    });

    test.each(['CAJERO', 'MESERO'])('los permisos del %s coinciden con su columna del catálogo', (rol) => {
        const enDoc = Object.keys(DOC).filter((p) => DOC[p][rol]);
        expect([...PERMISOS_POR_ROL[rol]].sort()).toEqual(enDoc.sort());
    });

    test('el ADMIN no figura en el mapa y tiene todos los permisos, también uno nuevo (RN-17)', () => {
        expect(PERMISOS_POR_ROL).not.toHaveProperty('ADMIN');
        expect(permisosDe('ADMIN').sort()).toEqual(Object.keys(CATALOGO).sort());
        for (const permiso of Object.keys(CATALOGO)) expect(tienePermiso('ADMIN', permiso)).toBe(true);
    });

    test('un rol que no está en el mapa no tiene ningún permiso', () => {
        expect(permisosDe('COCINERO')).toEqual([]);
        expect(tienePermiso('COCINERO', 'ordenes.ver')).toBe(false);
        expect(tienePermiso(undefined, 'ordenes.ver')).toBe(false);
    });

    test('un permiso que no está en el catálogo no lo tiene nadie y requierePermiso no lo acepta', () => {
        expect(tienePermiso('ADMIN', 'ordenes.volar')).toBe(false);
        expect(() => requierePermiso('ordenes.volar')).toThrow(/no está en el catálogo/);
    });
});

describe('Matriz de permisos.md frente a las rutas montadas', () => {
    const montadas = rutasMontadas();

    test('las 69 rutas montadas son las de la matriz', () => {
        expect(Object.keys(montadas).sort()).toEqual(MATRIZ.map((f) => `${f.metodo} ${f.ruta}`).sort());
    });

    test.each(MATRIZ.map((f) => [`${f.metodo} ${f.ruta}`, f]))('%s declara el permiso de su fila', (clave, fila) => {
        const esperado = esPublica(fila) || soloSesion(fila) ? [] : [fila.permiso];
        expect(montadas[clave]).toEqual(esperado);
    });

    test.each(MATRIZ.filter((f) => DOC[f.permiso]).map((f) => [`${f.metodo} ${f.ruta}`, f]))(
        '%s: las columnas de los roles coinciden con el catálogo',
        (_clave, fila) => {
            expect(fila.permite).toEqual({
                ADMIN: true,
                CAJERO: DOC[fila.permiso].CAJERO,
                MESERO: DOC[fila.permiso].MESERO
            });
        }
    );
});

describe('El login y el perfil devuelven los permisos del usuario', () => {
    test.each(['ADMIN', 'CAJERO', 'MESERO'])('%s', async (rol) => {
        const api = await comoRol(rol);
        const res = await api.get('/empleados/perfil');
        expect(res.status).toBe(200);
        expect([...res.body.permisos].sort()).toEqual(permisosDe(rol).sort());
    });

    test('el login también los devuelve', async () => {
        const { anonimo, USUARIOS } = require('../soporte/api');
        const res = await anonimo.post('/auth/login').send(USUARIOS.MESERO);
        expect(res.status).toBe(200);
        expect(res.body.permisos).toContain('asistencia.registrar');
        expect(res.body.permisos).not.toContain('asistencia.aprobar');
    });
});
