// Control de descuentos del administrador (#39, RF-49). Lista todos los descuentos aplicados, con
// el motivo y quién los aplicó, filtrable por fechas (días de Bolivia) y por empleado.
import { authFetch } from '../api.js';
import { escaparHTML, ZONA_HORARIA } from '../utils.js';

const $ = (id) => document.getElementById(id);
const bs = (n) => `Bs ${Number(n || 0).toFixed(2)}`;
const fechaHora = (instante) =>
    new Date(instante).toLocaleString('es-BO', {
        timeZone: ZONA_HORARIA,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

async function cargarEmpleados() {
    const res = await authFetch('/empleados');
    if (!res.ok) return;
    const empleados = await res.json();
    const opcionesHTML = (Array.isArray(empleados) ? empleados : empleados.data || [])
        .map((e) => `<option value="${escaparHTML(e.id)}">${escaparHTML(e.nombre)}</option>`)
        .join('');
    $('descuentos-empleado').insertAdjacentHTML('beforeend', opcionesHTML);
}

function pintar({ descuentos, totales }) {
    $('resumen-descuentos').textContent = `${totales.cantidad} descuento(s) · ${bs(totales.descontado)} descontados`;
    if (descuentos.length === 0) {
        $('tabla-descuentos-cuerpo').innerHTML = '<tr><td colspan="7">No hay descuentos con estos filtros.</td></tr>';
        return;
    }
    const filasHTML = descuentos
        .map((d) => {
            const valor = d.tipo === 'MONTO' ? bs(d.valor) : `${Number(d.valor)} %`;
            const estado = d.orden.cobrada ? 'cobrada' : 'abierta';
            const empleadoHTML = d.empleado
                ? escaparHTML(d.empleado.nombre)
                : '<span class="sin-registro">sin registro</span>';
            const motivoHTML = d.motivo ? escaparHTML(d.motivo) : '<span class="sin-registro">sin motivo</span>';
            return `<tr>
                <td>${escaparHTML(fechaHora(d.fecha))}</td>
                <td>#${escaparHTML(d.orden.id)} (${escaparHTML(estado)})</td>
                <td>${escaparHTML(d.mesa ? d.mesa.nombre : '—')}</td>
                <td class="monto">${escaparHTML(valor)}</td>
                <td class="monto">${escaparHTML(bs(d.descontado))}</td>
                <td>${motivoHTML}</td>
                <td>${empleadoHTML}</td>
            </tr>`;
        })
        .join('');
    $('tabla-descuentos-cuerpo').innerHTML = filasHTML;
}

async function cargarDescuentos() {
    const filtros = new URLSearchParams();
    const desde = $('descuentos-desde').value;
    const hasta = $('descuentos-hasta').value;
    const empleado = $('descuentos-empleado').value;
    if (desde || hasta) {
        filtros.set('desde', desde || hasta);
        filtros.set('hasta', hasta || desde);
    }
    if (empleado) filtros.set('empleado_id', empleado);

    const res = await authFetch(`/descuentos?${filtros}`);
    const cuerpo = await res.json().catch(() => ({}));
    $('error-descuentos').hidden = res.ok;
    if (!res.ok) {
        $('error-descuentos').textContent = cuerpo.message || 'No se pudieron cargar los descuentos.';
        return;
    }
    pintar(cuerpo);
}

export async function initAdminDescuentos() {
    $('filtros-descuentos').addEventListener('submit', (e) => {
        e.preventDefault();
        cargarDescuentos();
    });
    $('descuentos-limpiar').addEventListener('click', () => {
        $('filtros-descuentos').reset();
        cargarDescuentos();
    });
    await cargarEmpleados();
    await cargarDescuentos();
}
