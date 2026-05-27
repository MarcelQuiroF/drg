import { authFetch } from '../api.js';
import { mostrarNotificacion, cargarHTML, iniciarAutoRefresco, cerrarNotificacion } from '../utils.js';

let RESERVA_ID_PARA_ELIMINAR = null;
let ID_RESERVA_EDICION = null;
let TODAS_LAS_MESAS = [];

let TODOS_LOS_CLIENTES = []; 


const filtrarClientes = (termino) => {
    const resultsContainer = document.getElementById('cliente-options-results');
    const query = termino.toLowerCase().trim();
    
    if (!query) {
        resultsContainer.classList.replace('search-results-visible', 'search-results-hidden');
        return;
    }

    const filtrados = TODOS_LOS_CLIENTES.filter(c => 
        c.nombre.toLowerCase().includes(query) || 
        (c.telefono && c.telefono.includes(query))
    );

    if (filtrados.length > 0) {
        resultsContainer.innerHTML = filtrados.map(c => `
            <div class="search-option-item" data-id="${c.id}" data-nombre="${c.nombre}" data-telf="${c.telefono || ''}">
                ${c.nombre}
                <span>(${c.telefono || 'Sin teléfono'})</span>
            </div>
        `).join('');
        resultsContainer.classList.replace('search-results-hidden', 'search-results-visible');
    } else {
        resultsContainer.innerHTML = '<div class="search-option-item">No se encontraron resultados</div>';
        resultsContainer.classList.replace('search-results-hidden', 'search-results-visible');
    }
};

const seleccionarCliente = (id, nombre, telf) => {
    const displayTelf = telf ? ` (${telf})` : "";
    document.getElementById('cliente-search').value = `${nombre}${displayTelf}`;
    document.getElementById('cliente-select-id').value = id;
    
    const resultsContainer = document.getElementById('cliente-options-results');
    resultsContainer.classList.replace('search-results-visible', 'search-results-hidden');
};


const mostrarErrorModal = (mensaje) => {
    const errorEl = document.getElementById('reserva-error-msg');
    if (errorEl) {
        errorEl.textContent = mensaje;
        errorEl.classList.remove('error-text-hidden');
        errorEl.classList.add('error-text-visible');
    }
};

const limpiarErrorModal = () => {
    const errorEl = document.getElementById('reserva-error-msg');
    if (errorEl) {
        errorEl.classList.remove('error-text-visible');
        errorEl.classList.add('error-text-hidden');
        errorEl.textContent = "";
    }
};

const mostrarErrorCliente = (mensaje) => {
    const errorEl = document.getElementById('cliente-error-msg');
    if (errorEl) {
        errorEl.textContent = mensaje;
        errorEl.classList.replace('error-text-hidden', 'error-text-visible');
    }
};

const limpiarErrorCliente = () => {
    const errorEl = document.getElementById('cliente-error-msg');
    if (errorEl) {
        errorEl.classList.replace('error-text-visible', 'error-text-hidden');
        errorEl.textContent = "";
    }
};


const abrirModalReserva = async (idReserva = null) => {
    const modal = document.getElementById('reserva-modal');
    const overlay = document.getElementById('modal-overlay');
    const titulo = document.getElementById('reserva-modal-titulo');
    
    ID_RESERVA_EDICION = idReserva;
    titulo.textContent = idReserva ? "Editar Reserva" : "Nueva Reserva";
    document.getElementById('btn-guardar-reserva').textContent = idReserva ? "Actualizar" : "Guardar Reserva";

    limpiarErrorModal();
    await prepararSelectoresForm();
    
    if (!idReserva) {
        const today = new Date();
        document.getElementById('fecha-reserva').value = today.toISOString().split('T')[0];
        document.getElementById('hora-reserva').value = "19:00";
    } else {
        try {
            const res = await authFetch(`/reservas/${idReserva}`);
            if (res.ok) {
                const data = await res.json();

                if (data.Cliente) {
                    const textoCliente = `${data.Cliente.nombre} (${data.Cliente.telefono || 'Sin tel.'})`;
                    document.getElementById('cliente-search').value = textoCliente;
                    document.getElementById('cliente-select-id').value = data.cliente_id;
                }
                document.getElementById('piso-select').value = data.Mesa?.piso_id || "";
                actualizarMesasPorPiso(data.Mesa?.piso_id);
                document.getElementById('mesa-select-form').value = data.mesa_id;

                const d = new Date(data.hora);
                document.getElementById('fecha-reserva').value = d.toISOString().split('T')[0];
                document.getElementById('hora-reserva').value = d.toTimeString().slice(0,5);
            }
        } catch (e) { console.error("Error al cargar reserva:", e); }
    }

    modal.classList.replace('custom-modal-hidden', 'custom-modal-visible');
    overlay.classList.replace('modal-overlay-hidden', 'modal-overlay-visible');
};

const cerrarModalReserva = () => {
    document.getElementById('reserva-modal').classList.replace('custom-modal-visible', 'custom-modal-hidden');
    document.getElementById('modal-overlay').classList.replace('modal-overlay-visible', 'modal-overlay-hidden');
    ID_RESERVA_EDICION = null;
};


const abrirModalCliente = () => {
    const clienteModal = document.getElementById('cliente-modal');
    const reservaModal = document.getElementById('reserva-modal');
    
    document.getElementById('new-nombre').value = "";
    document.getElementById('new-ci').value = "";
    document.getElementById('new-telf').value = "";
    
    limpiarErrorCliente(); 

    reservaModal?.classList.add('modal-backdrop-blur');
    clienteModal.classList.replace('custom-modal-hidden', 'custom-modal-visible');
};

const cerrarModalCliente = () => {
    const clienteModal = document.getElementById('cliente-modal');
    const reservaModal = document.getElementById('reserva-modal');
    reservaModal?.classList.remove('modal-backdrop-blur');
    clienteModal.classList.replace('custom-modal-visible', 'custom-modal-hidden');
};

async function manejarGuardarReserva() {
    limpiarErrorModal();
    const payload = {
        cliente_id: document.getElementById('cliente-select-id').value,
        mesa_id: document.getElementById('mesa-select-form').value,
        hora: `${document.getElementById('fecha-reserva').value}T${document.getElementById('hora-reserva').value}:00`
    };

    if (!payload.cliente_id || !payload.mesa_id || !payload.hora.includes('T')) {
        return mostrarErrorModal("Todos los campos son obligatorios.");
    }

    try {
        const method = ID_RESERVA_EDICION ? 'PUT' : 'POST';
        const url = ID_RESERVA_EDICION ? `/reservas/${ID_RESERVA_EDICION}` : '/reservas';
        const res = await authFetch(url, { method, body: JSON.stringify(payload) });

        if (!res.ok) {
            const data = await res.json();
            return mostrarErrorModal(data.message || "Error al guardar.");
        }

        cerrarModalReserva();
        mostrarNotificacion("¡Éxito!", "Reserva guardada.", false);
        cargarReservasPage();
    } catch (error) {
        console.error("DEBUG - El error es:", error);
        mostrarErrorModal("Error detectado en consola");
    }
}

async function manejarGuardarClienteRapido() {
    limpiarErrorCliente(); 

    const payload = {
        nombre: document.getElementById('new-nombre').value.trim(),
        ci: document.getElementById('new-ci').value.trim(),
        telefono: document.getElementById('new-telf').value.trim()
    };

    if (!payload.nombre) {
        return mostrarErrorCliente("El nombre completo es obligatorio.");
    }

    try {
        const res = await authFetch('/clientes', { method: 'POST', body: JSON.stringify(payload) });
        
        if (res.ok) {
            const nuevo = await res.json();
            cerrarModalCliente();
            await actualizarListaClientes(nuevo.id);
        } else {
            const data = await res.json();
            mostrarErrorCliente(data.message || "Error al registrar el cliente.");
        }
    } catch (e) { 
        console.error(e);
        mostrarErrorCliente("Error de conexión con el servidor.");
    }
}


export const cargarReservasPage = () => {
    cargarHTML("../html/reservar.html", () => {
        initReservas();
        
        iniciarAutoRefresco(actualizarSoloDatosReservas, 30);
    });
};

const actualizarSoloDatosReservas = async () => {
    const tbody = document.getElementById('reserva-tbody');
    try {
        const response = await authFetch('/reservas');
        if (response.ok) {
            const datos = await response.json();
            renderizarReservas(tbody, datos); 
        }
    } catch (e) { console.error("Error en auto-refresco:", e); }
};

const initReservas = async () => {

    

    const tbody = document.getElementById('reserva-tbody');
    if (!tbody) {
        console.error("No se encontró el elemento #reserva-tbody");
        return;
    }

    const inputSearch = document.getElementById('cliente-search');
    const resultsContainer = document.getElementById('cliente-options-results');

    inputSearch?.addEventListener('input', (e) => filtrarClientes(e.target.value));

    resultsContainer?.addEventListener('click', (e) => {
        const item = e.target.closest('.search-option-item');
        if (item && item.dataset.id) {
            seleccionarCliente(item.dataset.id, item.dataset.nombre, item.dataset.telf);
        }
    });

    document.addEventListener('click', (e) => {
        if (!inputSearch.contains(e.target) && !resultsContainer.contains(e.target)) {
            resultsContainer.classList.replace('search-results-visible', 'search-results-hidden');
        }
    });

    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:20px;">Cargando dragones...</td></tr>';

    try {
        const response = await authFetch('/reservas');
        if (response.ok) {
            const datos = await response.json();
            renderizarReservas(tbody, datos);
        } else {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Error al obtener reservas.</td></tr>';
        }
    } catch (e) { 
        console.error(e); 
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;">Error de conexión.</td></tr>';
    }

    document.getElementById('btn-abrir-settings')?.addEventListener('click', abrirModalSettings);
    document.getElementById('close-settings-modal')?.addEventListener('click', cerrarModalSettings);
    
    const btnSaveS = document.getElementById('btn-save-settings');
    if (btnSaveS) {
        const nBtn = btnSaveS.cloneNode(true);
        btnSaveS.parentNode.replaceChild(nBtn, btnSaveS);
        nBtn.addEventListener('click', manejarGuardarSettings);
    }
    
    document.getElementById('btn-nueva-reserva')?.addEventListener('click', () => abrirModalReserva());
    document.getElementById('close-reserva-modal')?.addEventListener('click', cerrarModalReserva);
    
    const btnG = document.getElementById('btn-guardar-reserva');
    if (btnG) {
        const nBtn = btnG.cloneNode(true);
        btnG.parentNode.replaceChild(nBtn, btnG);
        nBtn.addEventListener('click', manejarGuardarReserva);
    }

    document.getElementById('piso-select')?.addEventListener('change', (e) => actualizarMesasPorPiso(e.target.value));

    document.getElementById('btn-crear-cliente-reserva')?.addEventListener('click', (e) => {
        e.preventDefault();
        abrirModalCliente();
    });
    document.getElementById('close-cliente-modal')?.addEventListener('click', cerrarModalCliente);
    
    const btnGC = document.getElementById('btn-guardar-cliente-modal');
    if (btnGC) {
        const nBtn = btnGC.cloneNode(true);
        btnGC.parentNode.replaceChild(nBtn, btnGC);
        nBtn.addEventListener('click', manejarGuardarClienteRapido);
    }

    document.getElementById('close-delete-modal')?.addEventListener('click', cerrarModalEliminar);

    document.getElementById('modal-overlay')?.addEventListener('click', () => {
        const clienteModal = document.getElementById('cliente-modal');
        if (clienteModal && clienteModal.classList.contains('custom-modal-visible')) {
            cerrarModalCliente();
        } else {
            cerrarModalReserva();
            cerrarModalEliminar();
            cerrarModalSettings();
        }
    });
};


async function prepararSelectoresForm() {
    const selectPiso = document.getElementById('piso-select');
    selectPiso.innerHTML = '<option value="">Todos</option>';
    
    document.getElementById('cliente-search').value = "";
    document.getElementById('cliente-select-id').value = "";

    try {
        const [resC, resP, resM] = await Promise.all([
            authFetch('/clientes'),
            authFetch('/pisos'),
            authFetch('/mesas')
        ]);

        if (resC.ok) TODOS_LOS_CLIENTES = await resC.json();
        if (resP.ok) (await resP.json()).forEach(p => selectPiso.add(new Option(p.nombre, p.id)));
        if (resM.ok) TODAS_LAS_MESAS = await resM.json();
        
        actualizarMesasPorPiso("");
    } catch (e) { console.error("Error cargando selectores:", e); }
}

function actualizarMesasPorPiso(pisoId) {
    const selectMesa = document.getElementById('mesa-select-form');
    selectMesa.innerHTML = '<option value="">Seleccione...</option>';
    const filtradas = pisoId ? TODAS_LAS_MESAS.filter(m => m.piso_id == pisoId) : TODAS_LAS_MESAS;
    filtradas.sort((a,b) => a.numero - b.numero).forEach(m => selectMesa.add(new Option(`${m.nombre} (Nº ${m.numero})`, m.id)));
}

async function actualizarListaClientes(idParaSeleccionar = null) {
    try {
        const res = await authFetch('/clientes');
        if (res.ok) {
            TODOS_LOS_CLIENTES = await res.json(); 
            
            if (idParaSeleccionar) {
                const nuevo = TODOS_LOS_CLIENTES.find(c => c.id == idParaSeleccionar);
                if (nuevo) {
                    seleccionarCliente(nuevo.id, nuevo.nombre, nuevo.telefono);
                }
            }
        }
    } catch (e) {
        console.error("Error actualizando lista de clientes:", e);
    }
}

const renderizarReservas = async (tbody, reservas) => {
    tbody.innerHTML = '';
    
    let tolerancia = 20;
    let anticipacion = 30;

    try {
        const resConf = await authFetch('/configuracion');
        if (resConf.ok) {
            const configs = await resConf.json();
            configs.forEach(c => {
                if (c.clave === 'minutos_tolerancia') tolerancia = c.valor;
                if (c.clave === 'ventana_llegada') anticipacion = c.valor;
            });
        }
    } catch (e) { console.error(e); }

    if (reservas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 30px;">No hay reservas programadas.</td></tr>';
        return;
    }

    const ahora = new Date();

    reservas.forEach(reserva => {
        const tr = document.createElement('tr');
        const d = new Date(reserva.hora);

        
        
        const diffMs = ahora - d;
        const diffMins = diffMs / 60000;
        
        console.log(`Reserva: ${reserva.Cliente?.nombre} | Diff: ${diffMins.toFixed(2)} min | Estado: ${reserva.estado}`);

        let timeClass = "";
        const estadoLimpio = reserva.estado ? reserva.estado.toUpperCase() : "";


        if (estadoLimpio === 'PENDIENTE') {
            if (diffMins > 0 && diffMins <= tolerancia) {
                timeClass = "time-tolerance";
            } 
            else if (diffMins < 0 && Math.abs(diffMins) <= anticipacion) {
                timeClass = "time-early";
            }
        }

        const fechaStr = `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}`;
        const horaStr = d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        tr.innerHTML = `
            <td>
                <div class="client-info-cell">
                    <span class="client-name">${reserva.Cliente ? reserva.Cliente.nombre : 'Sin Nombre'}</span>
                    <span class="client-phone">(${reserva.Cliente ? reserva.Cliente.telefono : 'N/A'})</span>
                </div>
            </td>
            <td><span class="date-tag">${fechaStr}</span></td>
            <td><span class="hour-tag ${timeClass}">${horaStr}</span></td>
            <td>
                <div style="font-weight: 500;">
                    ${reserva.Mesa ? 'Mesa ' + reserva.Mesa.numero : 'No asignada'}
                </div>
                <small style="color: var(--color-text-secondary)">${reserva.Mesa?.nombre || ''}</small>
            </td>
            <td>
                <div class="action-buttons">
                    <i class="fa-solid fa-pen-to-square btn-editar" style="cursor:pointer; color: #2e7d32; font-size: 1.2rem; margin-right:15px;" title="Editar"></i>
                    <i class="fa-solid fa-trash btn-eliminar" style="cursor:pointer; color: #ff5a5e; font-size: 1.2rem;" title="Cancelar"></i>
                </div>
            </td>
        `;

        tr.querySelector('.btn-editar').addEventListener('click', () => abrirModalReserva(reserva.id));
        tr.querySelector('.btn-eliminar').addEventListener('click', () => prepararEliminacionReserva(reserva.id, reserva.Cliente?.nombre));
        tbody.appendChild(tr);
    });
};

const abrirModalSettings = async () => {
    const modal = document.getElementById('settings-reserva-modal');
    const overlay = document.getElementById('modal-overlay');
    document.getElementById('input-tolerancia').value = 20;
    document.getElementById('input-ventana-bloqueo').value = 120;
    document.getElementById('input-ventana-llegada').value = 30;
    try {
        const res = await authFetch('/configuracion');
        if (res.ok) {
            const configs = await res.json();
            configs.forEach(c => {
                if (c.clave === 'minutos_tolerancia') document.getElementById('input-tolerancia').value = c.valor;
                if (c.clave === 'ventana_bloqueo') document.getElementById('input-ventana-bloqueo').value = c.valor;
                if (c.clave === 'ventana_llegada') document.getElementById('input-ventana-llegada').value = c.valor;
            });
        }
    } catch (e) { console.error(e); }
    modal.classList.replace('custom-modal-hidden', 'custom-modal-visible');
    overlay.classList.replace('modal-overlay-hidden', 'modal-overlay-visible');
};

const cerrarModalSettings = () => {
    document.getElementById('settings-reserva-modal')?.classList.replace('custom-modal-visible', 'custom-modal-hidden');
    document.getElementById('modal-overlay')?.classList.replace('modal-overlay-visible', 'modal-overlay-hidden');
};

async function manejarGuardarSettings() {
    const payload = {
        configuraciones: [
            { clave: 'minutos_tolerancia', valor: document.getElementById('input-tolerancia').value },
            { clave: 'ventana_bloqueo', valor: document.getElementById('input-ventana-bloqueo').value },
            { clave: 'ventana_llegada', valor: document.getElementById('input-ventana-llegada').value }
        ]
    };
    try {
        const res = await authFetch('/configuracion', { method: 'PUT', body: JSON.stringify(payload) });
        if (res.ok) {
            cerrarModalSettings();
            mostrarNotificacion("¡Éxito!", "Tiempos actualizados.", false);
        }
    } catch (e) { console.error(e); }
}

const prepararEliminacionReserva = (id, nombre) => {
    RESERVA_ID_PARA_ELIMINAR = id;
    const modal = document.getElementById('delete-modal');
    document.getElementById('delete-modal-message').innerHTML = `¿Eliminar reserva de <strong>${nombre}</strong>?`;
    modal.classList.replace('custom-modal-hidden', 'custom-modal-visible');
    document.getElementById('modal-overlay').classList.replace('modal-overlay-hidden', 'modal-overlay-visible');
};

const cerrarModalEliminar = () => {
    document.getElementById('delete-modal').classList.replace('custom-modal-visible', 'custom-modal-hidden');
    document.getElementById('modal-overlay').classList.replace('modal-overlay-visible', 'modal-overlay-hidden');
    RESERVA_ID_PARA_ELIMINAR = null;
};

const deleteConfirmBtn = document.getElementById('btn-confirm-delete');
if (deleteConfirmBtn) {
    const nBtn = deleteConfirmBtn.cloneNode(true);
    deleteConfirmBtn.parentNode.replaceChild(nBtn, deleteConfirmBtn);
    nBtn.addEventListener('click', async () => {
        if (!RESERVA_ID_PARA_ELIMINAR) return;
        try {
            const res = await authFetch(`/reservas/${RESERVA_ID_PARA_ELIMINAR}`, { method: 'DELETE' });
            if (res.ok) {
                cerrarModalEliminar();
                cargarReservasPage();
            }
        } catch (e) { console.error(e); }
    });
}