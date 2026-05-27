import { authFetch } from '../api.js';

let allEmployees = [];
let localSchedules = [];
let currentStatusFilter = 'active';
let currentDayFilter = 'all';
let searchStr = '';
let EDIT_ID = null;
let ITEM_PARA_TOGGLE = null;

export const initAdminEmpleados = async () => {
    await loadEmployees();
    setupEventListeners();
};

const setupEventListeners = () => {
    document.querySelectorAll('.js-stats .filter-opt').forEach(opt => {
        opt.onclick = () => {
            document.querySelectorAll('.js-stats .filter-opt').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            currentStatusFilter = opt.dataset.status;
            renderEmployees();
        };
    });

    const dayFilter = document.getElementById('filter-dia-semana');
    if (dayFilter) {
        dayFilter.onchange = (e) => {
            currentDayFilter = e.target.value;
            renderEmployees();
        };
    }

    const searchInput = document.getElementById('admin-search-input');
    if (searchInput) {
        searchInput.oninput = (e) => {
            searchStr = e.target.value.toLowerCase();
            renderEmployees();
        };
    }

    document.getElementById('btn-nuevo-empleado').onclick = () => openEmployeeModal();
    document.getElementById('close-modal').onclick = closeAllModals;
    document.getElementById('btn-cancelar').onclick = closeAllModals;
    document.getElementById('modal-overlay').onclick = closeAllModals;
    document.getElementById('close-status-modal').onclick = closeAllModals;
    document.getElementById('btn-guardar').onclick = handleSaveEmployee;
    document.getElementById('btn-status-confirm').onclick = handleConfirmToggle;

    document.getElementById('btn-abrir-horarios').onclick = openScheduleModal;
    document.getElementById('close-schedule-modal').onclick = closeScheduleModal;
    document.getElementById('btn-guardar-horarios').onclick = saveScheduleState;

    document.querySelectorAll('.schedule-row').forEach(row => {
        const chk = row.querySelector('.chk-day');
        const timeInput = row.querySelector('.time-input');
        chk.onchange = (e) => {
            timeInput.disabled = !e.target.checked;
        };
    });
};

const loadEmployees = async () => {
    try {
        const res = await authFetch('/empleados'); 
        if (res.ok) {
            allEmployees = await res.json();
            renderEmployees();
        }
    } catch (e) { console.error("Error cargando empleados:", e); }
};

const renderEmployees = () => {
    const container = document.getElementById('admin-employees-container');
    const template = document.getElementById('template-employee-card');
    if (!container || !template) return;

    container.innerHTML = '';

    const filtered = allEmployees.filter(emp => {
        const matchStatus = currentStatusFilter === 'all' || (currentStatusFilter === 'active' ? emp.activo : !emp.activo);
        const matchSearch = emp.nombre.toLowerCase().includes(searchStr) || emp.ci.includes(searchStr);
        
        let matchDay = true;
        const horarios = emp.Horarios || [];
        if (currentDayFilter === 'SIN_ASIGNAR') {
            matchDay = horarios.length === 0;
        } else if (currentDayFilter !== 'all') {
            matchDay = horarios.some(h => h.dia === currentDayFilter);
        }

        return matchStatus && matchSearch && matchDay;
    });

    if (filtered.length === 0) {
        container.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: #888; padding: 20px;">No se encontraron empleados.</p>';
        return;
    }

    filtered.forEach(emp => {
        const clon = template.content.cloneNode(true);
        const card = clon.querySelector('.contenedor-producto');
        
        card.classList.add(emp.activo ? 'activo' : 'inactivo');
        clon.querySelector('.prod-name').textContent = emp.nombre;
        clon.querySelector('.prod-cat').textContent = emp.rol;
        clon.querySelector('.employee-ci-text').textContent = `CI: ${emp.ci}`;

        const btnToggle = clon.querySelector('.btn-toggle-status');
        if (btnToggle) {
            btnToggle.textContent = emp.activo ? 'Anular' : 'Activar';
            btnToggle.onclick = (e) => {
                e.stopPropagation();
                openStatusModal(emp);
            };
        }

        clon.querySelector('.btn-edit-float').onclick = (e) => {
            e.stopPropagation();
            openEmployeeModal(emp);
        };

        container.appendChild(clon);
    });
};

const openEmployeeModal = (emp = null) => {
    EDIT_ID = emp ? emp.id : null;
    localSchedules = emp ? (emp.Horarios || []).map(h => ({ dia: h.dia, hora_entrada: h.hora_entrada.substring(0,5) })) : [];

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
    };

    document.getElementById('form-title').textContent = emp ? "Editar Empleado" : "Nuevo Empleado";
    setVal('emp-nombre', emp ? emp.nombre : "");
    setVal('emp-ci', emp ? emp.ci : "");
    setVal('emp-telefono', emp ? emp.telefono : "");
    setVal('emp-correo', emp ? (emp.correo || "") : "");
    setVal('emp-contrasenia', "");
    setVal('emp-rol', emp ? emp.rol : "MESERO");
    setVal('emp-activo', emp ? emp.activo.toString() : "true");

    // Mostrar advertencia sobre contraseña si es edición
    document.getElementById('pass-help-text').style.display = emp ? 'block' : 'none';
    document.getElementById('form-error-msg').className = 'error-text-hidden';

    renderScheduleTags();

    document.getElementById('modal-overlay').className = 'modal-overlay-visible';
    document.getElementById('employee-modal').className = 'custom-modal-visible';
};

const renderScheduleTags = () => {
    const container = document.getElementById('employee-schedule-tags');
    if (!container) return;

    if (localSchedules.length === 0) {
        container.innerHTML = '<span style="font-size: 0.8rem; color:#888; text-align:center;">Sin horarios asignados</span>';
        return;
    }

    container.innerHTML = localSchedules.map(h => `
        <span class="tag">
            <span><strong>${h.dia}</strong> a las ${h.hora_entrada}</span>
        </span>
    `).join('');
};

const openScheduleModal = (e) => {
    e.preventDefault();
    
    document.querySelectorAll('.schedule-row').forEach(row => {
        const day = row.dataset.day;
        const chk = row.querySelector('.chk-day');
        const timeInput = row.querySelector('.time-input');

        const saved = localSchedules.find(h => h.dia === day);
        if (saved) {
            chk.checked = true;
            timeInput.disabled = false;
            timeInput.value = saved.hora_entrada;
        } else {
            chk.checked = false;
            timeInput.disabled = true;
            timeInput.value = "16:00";
        }
    });

    document.getElementById('schedule-modal').className = 'custom-modal-visible sub-modal';
};

const closeScheduleModal = () => {
    document.getElementById('schedule-modal').className = 'custom-modal-hidden sub-modal';
};

const saveScheduleState = () => {
    let tempSchedules = [];
    document.querySelectorAll('.schedule-row').forEach(row => {
        const day = row.dataset.day;
        const chk = row.querySelector('.chk-day');
        const timeInput = row.querySelector('.time-input');

        if (chk.checked) {
            tempSchedules.push({
                dia: day,
                hora_entrada: timeInput.value
            });
        }
    });

    localSchedules = tempSchedules;
    renderScheduleTags();
    closeScheduleModal();
};


const handleSaveEmployee = async () => {
    const errorEl = document.getElementById('form-error-msg');
    errorEl.className = 'error-text-hidden';

    const nombre = document.getElementById('emp-nombre').value;
    const ci = document.getElementById('emp-ci').value;
    const telefono = document.getElementById('emp-telefono').value;
    const contrasenia = document.getElementById('emp-contrasenia').value;
    const correoVal = document.getElementById('emp-correo').value;

    if (!nombre || !ci || !telefono || (!EDIT_ID && !contrasenia)) {
        errorEl.textContent = "Nombre, CI, Teléfono y Contraseña son obligatorios.";
        errorEl.className = 'error-text-visible';
        return;
    }

    const data = {
        nombre,
        ci,
        telefono,
        rol: document.getElementById('emp-rol').value,
        activo: document.getElementById('emp-activo').value === 'true',
        horarios: localSchedules,
        correo: correoVal.trim() !== "" ? correoVal : null
    };

    if (contrasenia.trim() !== "") {
        data.contrasenia = contrasenia;
    }

    const method = EDIT_ID ? 'PUT' : 'POST';
    const url = EDIT_ID ? `/empleados/${EDIT_ID}` : '/empleados';

    try {
        const res = await authFetch(url, { method, body: JSON.stringify(data) });
        if (res.ok) {
            closeAllModals();
            await loadEmployees();
        } else {
            const err = await res.json();
            errorEl.textContent = `Error: ${err.message || 'No se pudo guardar'}`;
            errorEl.className = 'error-text-visible';
        }
    } catch (e) {
        errorEl.textContent = "Error de conexión con el servidor.";
        errorEl.className = 'error-text-visible';
    }
};

const openStatusModal = (emp) => {
    ITEM_PARA_TOGGLE = emp;
    const nextStatus = !emp.activo;
    const msg = document.getElementById('status-modal-message');
    const btnConfirm = document.getElementById('btn-status-confirm');

    if (msg) msg.innerHTML = `¿Deseas ${nextStatus ? '<strong>activar</strong>' : '<strong>anular</strong>'} al empleado <br> "<strong>${emp.nombre}</strong>"?`;

    if (btnConfirm) {
        btnConfirm.className = 'btn-primary ' + (nextStatus ? 'confirm-activar' : 'confirm-desactivar');
        btnConfirm.textContent = nextStatus ? 'Activar Empleado' : 'Anular Empleado';
    }

    document.getElementById('status-modal').className = 'custom-modal-visible';
    document.getElementById('modal-overlay').className = 'modal-overlay-visible';
};

const handleConfirmToggle = async () => {
    if (!ITEM_PARA_TOGGLE) return;

    try {
        const res = await authFetch(`/empleados/${ITEM_PARA_TOGGLE.id}`, {
            method: 'PUT',
            body: JSON.stringify({ activo: !ITEM_PARA_TOGGLE.activo })
        });
        if (res.ok) {
            closeAllModals();
            await loadEmployees();
        }
    } catch (e) { console.error(e); }
};

const closeAllModals = () => {
    document.getElementById('modal-overlay').className = 'modal-overlay-hidden';
    document.getElementById('employee-modal').className = 'custom-modal-hidden';
    document.getElementById('status-modal').className = 'custom-modal-hidden';
    document.getElementById('schedule-modal').className = 'custom-modal-hidden sub-modal';
    EDIT_ID = null;
    ITEM_PARA_TOGGLE = null;
    localSchedules = [];
};