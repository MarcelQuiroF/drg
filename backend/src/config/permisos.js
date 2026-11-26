'use strict';

// Permisos por acción (RBAC, ADR-008). Este archivo es la ÚNICA fuente del mapa rol → permisos
// en el backend, y tiene que coincidir con el catálogo de docs/03_diseno/permisos.md (una prueba
// lo comprueba: tests/auth/catalogoPermisos.test.js). Un permiso nuevo se agrega primero en el
// documento y después aquí.
//
// Las rutas piden un permiso con requierePermiso('ordenes.cobrar') (middlewares/permisoMiddleware.js),
// nunca un rol: cambiar lo que puede hacer un rol es cambiar este mapa, sin tocar las rutas.

// Catálogo: permiso → qué permite
const CATALOGO = Object.freeze({
    'catalogo.ver': 'Ver productos',
    'catalogo.gestionar': 'Crear, editar y borrar productos, juegos y categorías',
    'espacio.ver': 'Ver pisos y mesas',
    'espacio.gestionar': 'Crear, editar y borrar pisos y mesas',
    'ordenes.ver': 'Ver órdenes, sus ítems y sus descuentos',
    'ordenes.tomar': 'Abrir órdenes, agregar, cambiar y quitar productos y juegos, editar notas',
    'ordenes.eliminar': 'Borrar una orden',
    'ordenes.descontar': 'Aplicar y quitar descuentos',
    'ordenes.cobrar': 'Cobrar una orden y registrar pagos',
    'pagos.anular': 'Anular un pago ya registrado',
    'comandas.gestionar': 'Ver las comandas y avanzar su estado',
    'clientes.gestionar': 'Ver, crear y editar clientes',
    'clientes.eliminar': 'Borrar clientes',
    'reservas.gestionar': 'Ver, crear, editar y cancelar reservas',
    'asistencia.registrar': 'Ver la asistencia del día y registrar llegadas',
    'asistencia.aprobar': 'Aprobar o anular asistencias (con firma)',
    'empleados.gestionar': 'Crear y editar empleados y horarios',
    'reportes.ver': 'Ver el dashboard',
    'configuracion.editar': 'Cambiar los tiempos de reserva y otros valores',
    'importacion.usar': 'Importar desde Excel y descargar las plantillas',
    'dia.abrir_cerrar': 'Ver el estado del día, abrirlo y cerrarlo (con CI y contraseña)'
});

const ROL_ADMIN = 'ADMIN';

// Permisos que el mesero y el cajero comparten (RN-16: cualquiera de los dos abre el sistema
// y atiende la caja si el otro se atrasa). ⚠ ordenes.eliminar está pendiente de P-21.
const OPERACION = [
    'catalogo.ver',
    'espacio.ver',
    'ordenes.ver',
    'ordenes.tomar',
    'ordenes.eliminar',
    'ordenes.descontar',
    'ordenes.cobrar',
    'comandas.gestionar',
    'clientes.gestionar',
    'reservas.gestionar',
    'asistencia.registrar',
    'configuracion.editar',
    'dia.abrir_cerrar'
];

// El ADMIN no figura: tiene siempre TODOS los permisos del catálogo, también los que se agreguen
// después, y no se le puede quitar ninguno (RN-17). Un rol que no está aquí no tiene ninguno.
const PERMISOS_POR_ROL = Object.freeze({
    // ⚠ Las dos diferencias con el mesero se confirman con el dueño el 10/12 (P-22)
    CAJERO: Object.freeze([...OPERACION, 'pagos.anular', 'asistencia.aprobar']),
    MESERO: Object.freeze([...OPERACION])
});

const existePermiso = (permiso) => Object.prototype.hasOwnProperty.call(CATALOGO, permiso);

function permisosDe(rol) {
    if (rol === ROL_ADMIN) return Object.keys(CATALOGO);
    return [...(PERMISOS_POR_ROL[rol] || [])];
}

function tienePermiso(rol, permiso) {
    if (!existePermiso(permiso)) return false;
    if (rol === ROL_ADMIN) return true;
    return (PERMISOS_POR_ROL[rol] || []).includes(permiso);
}

// Si el mapa nombra un permiso que no está en el catálogo, es un error de escritura: mejor que
// el servidor no arranque a que ese permiso no sirva nunca.
for (const [rol, permisos] of Object.entries(PERMISOS_POR_ROL)) {
    for (const permiso of permisos) {
        if (!existePermiso(permiso)) throw new Error(`Permiso desconocido "${permiso}" en el mapa del rol ${rol}.`);
    }
}

module.exports = { CATALOGO, PERMISOS_POR_ROL, ROL_ADMIN, existePermiso, permisosDe, tienePermiso };
