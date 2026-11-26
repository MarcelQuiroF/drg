// Mover la orden abierta a otra mesa (#38, RF-55). Muestra las mesas libres y activas; el servidor
// decide de verdad (libre, activa y sin una reserva próxima, RN-15) y su mensaje se muestra tal cual.
// El diálogo tiene su propio fondo para no depender del overlay compartido de la vista.
import { authFetch } from '../api.js';
import { escaparHTML, mostrarNotificacion } from '../utils.js';

const ID = 'dialogo-mover-orden';

function cerrar() {
    document.getElementById(ID)?.remove();
}

const nombreMesa = (m) => `${m.nombre}${m.Piso?.nombre ? ` · ${m.Piso.nombre}` : ''}`;

export async function abrirMoverOrden(ordenId, mesaActualId, alMover) {
    if (!ordenId) {
        mostrarNotificacion('Sin orden', 'Esta mesa no tiene una orden abierta para mover.');
        return;
    }

    const res = await authFetch('/mesas?activo=true');
    if (!res.ok) {
        mostrarNotificacion('Error', 'No se pudieron cargar las mesas.');
        return;
    }
    const libres = (await res.json()).filter((m) => m.estado === 0 && m.id !== Number(mesaActualId));

    cerrar();
    const opcionesHTML = libres
        .map((m) => `<option value="${escaparHTML(m.id)}">${escaparHTML(nombreMesa(m))}</option>`)
        .join('');
    const eleccionHTML =
        libres.length > 0
            ? `<label for="mover-orden-mesa">Mesa libre de destino</label>
               <select id="mover-orden-mesa">${opcionesHTML}</select>`
            : '<p>No hay mesas libres en este momento.</p>';
    const deshabilitadoHTML = libres.length > 0 ? '' : 'disabled';
    const dialogo = document.createElement('div');
    dialogo.id = ID;
    dialogo.className = 'mover-orden-fondo';
    dialogo.innerHTML = `
        <div class="mover-orden" role="dialog" aria-modal="true" aria-labelledby="mover-orden-titulo">
            <h3 id="mover-orden-titulo">Mover la orden a otra mesa</h3>
            ${eleccionHTML}
            <p class="mover-orden-error" id="mover-orden-error" hidden></p>
            <div class="mover-orden-botones">
                <button type="button" id="mover-orden-cancelar">Cancelar</button>
                <button type="button" id="mover-orden-confirmar" ${deshabilitadoHTML}>Mover</button>
            </div>
        </div>`;
    document.body.appendChild(dialogo);

    dialogo.addEventListener('click', (e) => {
        if (e.target === dialogo) cerrar();
    });
    document.getElementById('mover-orden-cancelar').onclick = cerrar;
    document.getElementById('mover-orden-confirmar').onclick = async () => {
        const destino = Number(document.getElementById('mover-orden-mesa').value);
        const boton = document.getElementById('mover-orden-confirmar');
        boton.disabled = true;
        const r = await authFetch(`/ordenes/${ordenId}/mover`, {
            method: 'POST',
            body: JSON.stringify({ mesa_id: destino })
        });
        const cuerpo = await r.json().catch(() => ({}));
        if (!r.ok) {
            const error = document.getElementById('mover-orden-error');
            error.textContent = cuerpo.message || 'No se pudo mover la orden.';
            error.hidden = false;
            boton.disabled = false;
            return;
        }
        cerrar();
        alMover(destino);
    };
}
