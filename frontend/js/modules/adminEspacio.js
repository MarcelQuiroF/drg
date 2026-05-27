import { authFetch } from '../api.js';

let allPisos = [];
let allMesas = [];
let currentTypeFilter = 'piso';
let currentStatusFilter = 'active';
let searchStr = '';
let EDIT_ID = null;
let ITEM_PARA_TOGGLE = null;

export const initAdminEspacio = async () => {
    await loadData();
    setupEventListeners();
};

const setupEventListeners = () => {
    document.querySelectorAll('.js-type .filter-opt').forEach(opt => {
        opt.onclick = () => {
            document.querySelectorAll('.js-type .filter-opt').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            currentTypeFilter = opt.dataset.type;
            renderGrilla();
        };
    });

    document.querySelectorAll('.js-stats .filter-opt').forEach(opt => {
        opt.onclick = () => {
            document.querySelectorAll('.js-stats .filter-opt').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            currentStatusFilter = opt.dataset.status;
            renderGrilla();
        };
    });


    const searchInput = document.getElementById('admin-search-input');
    if (searchInput) {
        searchInput.oninput = (e) => {
            searchStr = e.target.value.toLowerCase();
            renderGrilla();
        };
    }

    document.getElementById('btn-nuevo-piso').onclick = () => openPisoModal();
    document.getElementById('btn-nueva-mesa').onclick = () => openMesaModal();

    const closeEls = ['close-piso-modal', 'btn-cancelar-piso', 'close-mesa-modal', 'btn-cancelar-mesa', 'close-status-modal', 'modal-overlay'];
    closeEls.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.onclick = closeAllModals;
    });

    document.getElementById('btn-guardar-piso').onclick = handleSavePiso;
    document.getElementById('btn-guardar-mesa').onclick = handleSaveMesa;
    document.getElementById('btn-status-confirm').onclick = handleConfirmToggle;
};

const loadData = async () => {
    try {
        const [resPisos, resMesas] = await Promise.all([
            authFetch('/pisos'),
            authFetch('/mesas')
        ]);

        if (resPisos.ok) allPisos = await resPisos.json();
        if (resMesas.ok) allMesas = await resMesas.json();
        
        renderGrilla();
    } catch (e) { console.error("Error cargando espacios:", e); }
};

const renderGrilla = () => {
    const container = document.getElementById('admin-espacio-container');
    if (!container) return;
    container.innerHTML = '';

    const listToRender = currentTypeFilter === 'piso' ? allPisos : allMesas;
    const templateId = currentTypeFilter === 'piso' ? 'template-piso-card' : 'template-mesa-card';
    const template = document.getElementById(templateId);

    const filtered = listToRender.filter(item => {
        const matchStatus = currentStatusFilter === 'all' || 
                            (currentStatusFilter === 'active' ? (item.activo !== false) : (item.activo === false));
        const textoBusqueda = currentTypeFilter === 'piso' 
            ? item.nombre.toLowerCase() 
            : `${item.nombre} ${item.Piso ? item.Piso.nombre : ''}`.toLowerCase();
        
        const matchSearch = textoBusqueda.includes(searchStr);
        return matchStatus && matchSearch;
    });

    if (filtered.length === 0) {
        container.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: #888; padding: 20px;">No se encontraron ${currentTypeFilter}s.</p>`;
        return;
    }

    filtered.forEach(item => {
        const clon = template.content.cloneNode(true);
        const card = clon.querySelector('.contenedor-producto');
        
        const isActivo = item.activo !== false; 
        card.classList.add(isActivo ? 'activo' : 'inactivo');
        
        clon.querySelector('.prod-name').textContent = item.nombre;
        
        if (currentTypeFilter === 'piso') {
            clon.querySelector('.espacio-extra-text').textContent = `Nivel: ${item.numero}`;
        } else {
            clon.querySelector('.prod-cat').textContent = item.Piso ? item.Piso.nombre.toUpperCase() : 'SIN PISO';
            clon.querySelector('.espacio-extra-text').textContent = `Capacidad: ${item.cantidadMinima}-${item.cantidadMaxima} pers. | N° ${item.numero}`;
        }

        const btnToggle = clon.querySelector('.btn-toggle-status');
        if (btnToggle) {
            btnToggle.textContent = isActivo ? 'Desactivar' : 'Activar';
            btnToggle.onclick = (e) => {
                e.stopPropagation();
                openStatusModal(item, currentTypeFilter);
            };
        }

        clon.querySelector('.btn-edit-float').onclick = (e) => {
            e.stopPropagation();
            if (currentTypeFilter === 'piso') openPisoModal(item);
            else openMesaModal(item);
        };

        container.appendChild(clon);
    });
};


const openPisoModal = (piso = null) => {
    EDIT_ID = piso ? piso.id : null;
    
    document.getElementById('form-piso-title').textContent = piso ? "Editar Piso" : "Nuevo Piso";
    document.getElementById('piso-nombre').value = piso ? piso.nombre : "";
    document.getElementById('piso-numero').value = piso ? piso.numero : "";
    document.getElementById('piso-activo').value = piso && piso.activo === false ? "false" : "true";
    document.getElementById('form-piso-error-msg').className = 'error-text-hidden';

    document.getElementById('modal-overlay').className = 'modal-overlay-visible';
    document.getElementById('piso-modal').className = 'custom-modal-visible';
};

const handleSavePiso = async () => {
    const errorEl = document.getElementById('form-piso-error-msg');
    errorEl.className = 'error-text-hidden';

    const nombre = document.getElementById('piso-nombre').value;
    const numero = document.getElementById('piso-numero').value;

    if (!nombre || !numero) {
        errorEl.textContent = "Nombre y número son obligatorios.";
        errorEl.className = 'error-text-visible';
        return;
    }

    const data = {
        nombre,
        numero: parseInt(numero),
        activo: document.getElementById('piso-activo').value === 'true'
    };

    const method = EDIT_ID ? 'PUT' : 'POST';
    const url = EDIT_ID ? `/pisos/${EDIT_ID}` : '/pisos';

    try {
        const res = await authFetch(url, { method, body: JSON.stringify(data) });
        if (res.ok) {
            closeAllModals();
            await loadData();
        } else {
            const err = await res.json();
            errorEl.textContent = `Error: ${err.message}`;
            errorEl.className = 'error-text-visible';
        }
    } catch (e) {
        errorEl.textContent = "Error de conexión.";
        errorEl.className = 'error-text-visible';
    }
};

const openMesaModal = (mesa = null) => {
    if (allPisos.length === 0) {
        alert("⚠️ No puedes crear una mesa porque no hay pisos registrados. Crea un piso primero.");
        return;
    }

    EDIT_ID = mesa ? mesa.id : null;
    
    document.getElementById('form-mesa-title').textContent = mesa ? "Editar Mesa" : "Nueva Mesa";
    document.getElementById('mesa-nombre').value = mesa ? mesa.nombre : "";
    document.getElementById('mesa-numero').value = mesa ? mesa.numero : "";
    document.getElementById('mesa-cap-min').value = mesa ? mesa.cantidadMinima : "1";
    document.getElementById('mesa-cap-max').value = mesa ? mesa.cantidadMaxima : "4";
    document.getElementById('mesa-activo').value = mesa && mesa.activo === false ? "false" : "true";
    document.getElementById('form-mesa-error-msg').className = 'error-text-hidden';

    const selectPiso = document.getElementById('mesa-piso-id');
    selectPiso.innerHTML = '<option value="" disabled>Seleccione un piso...</option>';
    allPisos.forEach(p => {
        const opt = new Option(p.nombre, p.id);
        selectPiso.add(opt);
    });
    
    if (mesa && mesa.piso_id) {
        selectPiso.value = mesa.piso_id;
    } else {
        selectPiso.selectedIndex = 1; 
    }

    document.getElementById('modal-overlay').className = 'modal-overlay-visible';
    document.getElementById('mesa-modal').className = 'custom-modal-visible';
};

const handleSaveMesa = async () => {
    const errorEl = document.getElementById('form-mesa-error-msg');
    errorEl.className = 'error-text-hidden';

    const nombre = document.getElementById('mesa-nombre').value;
    const numero = document.getElementById('mesa-numero').value;
    const min = parseInt(document.getElementById('mesa-cap-min').value);
    const max = parseInt(document.getElementById('mesa-cap-max').value);
    const piso_id = document.getElementById('mesa-piso-id').value;

    if (!nombre || !numero || !piso_id) {
        errorEl.textContent = "Nombre, número y piso son obligatorios.";
        errorEl.className = 'error-text-visible';
        return;
    }

    if (min > max) {
        errorEl.textContent = "La capacidad mínima no puede ser mayor a la máxima.";
        errorEl.className = 'error-text-visible';
        return;
    }

    const data = {
        nombre,
        numero: parseInt(numero),
        piso_id: parseInt(piso_id),
        cantidadMinima: min,
        cantidadMaxima: max,
        activo: document.getElementById('mesa-activo').value === 'true'
    };

    const method = EDIT_ID ? 'PUT' : 'POST';
    const url = EDIT_ID ? `/mesas/${EDIT_ID}` : '/mesas';

    try {
        const res = await authFetch(url, { method, body: JSON.stringify(data) });
        if (res.ok) {
            closeAllModals();
            await loadData();
        } else {
            const err = await res.json();
            errorEl.textContent = `Error: ${err.message}`;
            errorEl.className = 'error-text-visible';
        }
    } catch (e) {
        errorEl.textContent = "Error de conexión.";
        errorEl.className = 'error-text-visible';
    }
};

/* --- ESTADO (TOGGLE) COMÚN --- */
const openStatusModal = (item, type) => {
    ITEM_PARA_TOGGLE = { id: item.id, type, activo: item.activo !== false };
    const nextStatus = !ITEM_PARA_TOGGLE.activo;
    const msg = document.getElementById('status-modal-message');
    const btnConfirm = document.getElementById('btn-status-confirm');

    msg.innerHTML = `¿Deseas ${nextStatus ? '<strong>activar</strong>' : '<strong>desactivar</strong>'} el ${type} <br> "<strong>${item.nombre}</strong>"?`;

    btnConfirm.className = 'btn-primary ' + (nextStatus ? 'confirm-activar' : 'confirm-desactivar');
    btnConfirm.textContent = nextStatus ? `Activar ${type}` : `Desactivar ${type}`;

    document.getElementById('status-modal').className = 'custom-modal-visible';
    document.getElementById('modal-overlay').className = 'modal-overlay-visible';
};

const handleConfirmToggle = async () => {
    if (!ITEM_PARA_TOGGLE) return;

    const endpoint = ITEM_PARA_TOGGLE.type === 'piso' ? `/pisos/${ITEM_PARA_TOGGLE.id}` : `/mesas/${ITEM_PARA_TOGGLE.id}`;
    
    try {
        const res = await authFetch(endpoint, {
            method: 'PUT',
            body: JSON.stringify({ activo: !ITEM_PARA_TOGGLE.activo })
        });
        if (res.ok) {
            closeAllModals();
            await loadData();
        }
    } catch (e) { console.error(e); }
};

const closeAllModals = () => {
    document.getElementById('modal-overlay').className = 'modal-overlay-hidden';
    document.getElementById('piso-modal').className = 'custom-modal-hidden';
    document.getElementById('mesa-modal').className = 'custom-modal-hidden';
    document.getElementById('status-modal').className = 'custom-modal-hidden';
    EDIT_ID = null;
    ITEM_PARA_TOGGLE = null;
};