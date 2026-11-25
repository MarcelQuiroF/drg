'use strict';

// Lee docs/03_diseno/permisos.md, que es la especificación de los permisos (ADR-008). Lo usan
// las pruebas de tests/auth/: así la matriz de pruebas sale siempre del documento.
const fs = require('fs');
const path = require('path');

const ARCHIVO = path.join(__dirname, '..', '..', '..', 'docs', '03_diseno', 'permisos.md');
const ROLES = ['ADMIN', 'CAJERO', 'MESERO'];

const celdas = (linea) =>
    linea
        .replace(/^\||\|$/g, '')
        .split('|')
        .map((c) => c.trim());

const sinComillas = (texto) => texto.replace(/`/g, '');

// ✅ / 🌐: sí. ❌: no. El ⚠ de "valor de prueba" no cambia nada.
const permite = (celda) => /✅|🌐/.test(celda);

function leerLineas() {
    return fs.readFileSync(ARCHIVO, 'utf8').split('\n');
}

// Filas de la matriz: | Método | Ruta | Permiso | ADMIN | CAJERO | MESERO | Notas |
function leerMatriz() {
    return leerLineas()
        .filter((linea) => /^\| (GET|POST|PUT|PATCH|DELETE) \|/.test(linea))
        .map((linea) => {
            const [metodo, ruta, permiso, admin, cajero, mesero] = celdas(linea);
            return {
                metodo,
                ruta: sinComillas(ruta),
                permiso: sinComillas(permiso),
                permite: { ADMIN: permite(admin), CAJERO: permite(cajero), MESERO: permite(mesero) }
            };
        });
}

// Tabla "Catálogo de permisos": | `permiso` | Qué permite | CAJERO | MESERO |
function leerCatalogo() {
    const lineas = leerLineas();
    const inicio = lineas.findIndex((l) => l.startsWith('### Catálogo de permisos'));
    const catalogo = {};
    for (const linea of lineas.slice(inicio + 1)) {
        if (/^#/.test(linea)) break;
        const m = /^\| `([a-z_]+\.[a-z_]+)` \|/.exec(linea);
        if (!m) continue;
        const [, descripcion, cajero, mesero] = celdas(linea);
        catalogo[m[1]] = { descripcion, CAJERO: permite(cajero), MESERO: permite(mesero) };
    }
    return catalogo;
}

const esPublica = (fila) => /público/.test(fila.permiso);
const soloSesion = (fila) => /solo sesión/.test(fila.permiso);

module.exports = { ROLES, leerMatriz, leerCatalogo, esPublica, soloSesion };
