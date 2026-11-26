// Pantalla del día (#34): abre y cierra la jornada en el servidor. Antes el cierre era una marca
// en el localStorage de este navegador (otro navegador no la veía y el servidor seguía aceptando
// órdenes). Abrir y cerrar piden el CI y la contraseña de quien lo hace (RF-22, RN-16).
import { authFetch } from './api.js';
import { escaparHTML, ZONA_HORARIA } from './utils.js';

const $ = (id) => document.getElementById(id);

const fechaCorta = (fecha) => (fecha ? fecha.split('-').reverse().join('/') : '');
const hora = (instante) =>
    new Date(instante).toLocaleTimeString('es-BO', { timeZone: ZONA_HORARIA, hour: '2-digit', minute: '2-digit' });
const bs = (n) => `Bs ${Number(n || 0).toFixed(2)}`;

function mostrarResumen(resumen) {
    const contenedor = $('resumen-dia');
    if (!resumen) {
        contenedor.hidden = true;
        return;
    }
    const filas = [
        ['Órdenes cobradas', resumen.ordenes],
        ['Total cobrado', bs(resumen.ingresos)],
        ['Efectivo', bs(resumen.efectivo)],
        ['QR', bs(resumen.qr)],
        [`Descuentos (${resumen.descuentos?.cantidad ?? 0})`, bs(resumen.descuentos?.monto)]
    ];
    const filasHTML = filas
        .map(([nombre, valor]) => `<tr><td>${escaparHTML(nombre)}</td><td>${escaparHTML(valor)}</td></tr>`)
        .join('');
    contenedor.innerHTML = `<table>${filasHTML}</table>`;
    contenedor.hidden = false;
}

function mostrarOrdenesAbiertas(ordenes = []) {
    const contenedor = $('ordenes-abiertas');
    if (ordenes.length === 0) {
        contenedor.hidden = true;
        return;
    }
    const itemsHTML = ordenes
        .map(
            (o) =>
                `<li>${escaparHTML(o.mesa?.nombre ?? 'Sin mesa')} · orden ${escaparHTML(o.id)} · ${escaparHTML(bs(o.total))}</li>`
        )
        .join('');
    contenedor.innerHTML = `<p>Cobre o borre estas órdenes antes de cerrar el día:</p><ul>${itemsHTML}</ul>`;
    contenedor.hidden = false;
}

function mostrarError(mensaje) {
    $('error-dia').textContent = mensaje || '';
    $('error-dia').hidden = !mensaje;
}

let estadoActual = null;

function pintar({ abierta, jornada }) {
    estadoActual = abierta;
    $('titulo-estado').textContent = abierta ? 'ABIERTO' : 'CERRADO';
    mostrarError('');
    mostrarOrdenesAbiertas([]);
    $('dia-contrasenia').value = '';

    if (abierta) {
        $('texto-estado').textContent =
            `El día ${fechaCorta(jornada.fecha)} está abierto desde las ${hora(jornada.abierta_en)}` +
            (jornada.abridor ? ` (lo abrió ${jornada.abridor.nombre}).` : '.');
        $('texto-form').textContent = 'Para cerrar el día, escriba su CI y su contraseña.';
        $('btn-dia').textContent = 'CERRAR EL DÍA';
        mostrarResumen(null);
        $('btn-volver').hidden = false;
    } else {
        $('texto-estado').textContent = jornada
            ? `El día ${fechaCorta(jornada.fecha)} se cerró a las ${hora(jornada.cerrada_en)}` +
              (jornada.cerrador ? ` (lo cerró ${jornada.cerrador.nombre}).` : '.')
            : 'Todavía no se abrió ningún día.';
        $('texto-form').textContent = 'Para abrir el día, escriba su CI y su contraseña.';
        $('btn-dia').textContent = 'ABRIR EL DÍA';
        mostrarResumen(jornada?.resumen);
        $('btn-volver').hidden = true;
    }
    $('form-dia').hidden = false;
}

async function cargarEstado() {
    const res = await authFetch('/jornadas/actual');
    if (!res.ok) {
        $('texto-estado').textContent = 'No se pudo consultar el estado del día.';
        return;
    }
    pintar(await res.json());
}

async function enviar(e) {
    e.preventDefault();
    mostrarError('');
    const credenciales = { ci: $('dia-ci').value.trim(), contrasenia: $('dia-contrasenia').value };
    const abrir = !estadoActual;
    const ruta = abrir ? '/jornadas' : '/jornadas/actual/cerrar';

    $('btn-dia').disabled = true;
    try {
        const res = await authFetch(ruta, { method: 'POST', body: JSON.stringify(credenciales) });
        const cuerpo = await res.json().catch(() => ({}));
        if (!res.ok) {
            mostrarError(cuerpo.message || 'No se pudo completar la operación.');
            mostrarOrdenesAbiertas(cuerpo.ordenesAbiertas);
            return;
        }
        if (abrir) {
            window.location.href = 'index.html';
            return;
        }
        pintar({ abierta: false, jornada: cuerpo.jornada });
    } finally {
        $('btn-dia').disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    $('form-dia').addEventListener('submit', enviar);
    $('btn-volver').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
    $('btn-salir').addEventListener('click', () => {
        localStorage.removeItem('token_drg');
        localStorage.removeItem('usuario_rol');
        window.location.href = 'login.html';
    });
    cargarEstado();
});
