import { authFetch } from '../api.js';
import { cargarHTML } from '../utils.js';

let allEmployees = [];
let currentRoleFilter = 'all';
let currentStatusFilter = 'all';
let searchTerm = '';
let EMPLOYEE_EDIT_ID = null;

const SUELDO_BASE = 2500; 

/* ---------------- INITIALIZATION ---------------- */

export const initAdminEmpleados = async () => {
    await loadEmployees();

    // Filters
    setupFilters('.js-roles .filter-opt', (val) => { 
        currentRoleFilter = val; 
        renderEmployees(); 
    });
    
    setupFilters('.js-status .filter-opt', (val) => { 
        currentStatusFilter = val; 
        renderEmployees(); 
    });

    // Search
    document.getElementById('search-employee')?.addEventListener('input', (e) => {
        searchTerm = e.target.value.toLowerCase();
        renderEmployees();
    });

    // Add New
    document.getElementById('btn-nuevo-empleado')?.addEventListener('click', () => {
        EMPLOYEE_EDIT_ID = null;
        cargarFormularioEmpleado();
    });
};

const setupFilters = (selector, callback) => {
    const items = document.querySelectorAll(selector);
    items.forEach(btn => {
        btn.addEventListener('click', () => {
            items.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // Guardamos el valor del data-role o data-status
            callback(btn.dataset.role || btn.dataset.status);
        });
    });
};

/* ---------------- LIST LOGIC ---------------- */

const loadEmployees = async () => {
    try {
        const res = await authFetch('/empleados'); 
        if (res.ok) {
            allEmployees = await res.json();
            renderEmployees();
        } else {
            const grid = document.getElementById('employee-grid');
            if(grid) grid.innerHTML = '<p>Error cargando empleados.</p>';
        }
    } catch (e) { console.error(e); }
};

const renderEmployees = () => {
    const container = document.getElementById('employee-grid');
    const template = document.getElementById('template-employee-card');
    if(!container || !template) return;

    container.innerHTML = '';

    const filtered = allEmployees.filter(emp => {
        // --- FILTRO DE ROL ROBUSTO (CASE INSENSITIVE) ---
        // Compara "ADMIN" con "admin", "Admin" o "ADMIN" sin problemas
        const roleMatch = currentRoleFilter === 'all' || 
                          emp.rol.toUpperCase() === currentRoleFilter.toUpperCase();
        
        let statusMatch = true;
        if(currentStatusFilter === 'active') statusMatch = emp.activo;
        if(currentStatusFilter === 'inactive') statusMatch = !emp.activo;
        
        const searchMatch = emp.nombre.toLowerCase().includes(searchTerm);
        
        return roleMatch && statusMatch && searchMatch;
    });

    if(filtered.length === 0) {
        container.innerHTML = '<p style="color:#666; grid-column:1/-1; text-align:center">No se encontraron empleados.</p>';
        return;
    }

    filtered.forEach(emp => {
        const clon = template.content.cloneNode(true);
        const card = clon.querySelector('.contenedor-empleado');

        // Visual State
        if(emp.activo) {
            card.classList.add('activo');
            card.classList.remove('inactivo');
        } else {
            card.classList.add('inactivo');
            card.classList.remove('activo');
        }

        // Data
        clon.querySelector('.emp-name').textContent = emp.nombre;
        clon.querySelector('.emp-role').textContent = emp.rol;
        
        const img = clon.querySelector('.emp-img');
        // Usa la foto si existe, si no usa el default
        img.src = emp.foto || '../assets/imágenes/imagenUsuario.jpg'; 

        // Buttons
        const btnPago = clon.querySelector('.btn-pago');
        const btnActivar = clon.querySelector('.btn-activar');

        // Click en tarjeta -> Editar
        card.addEventListener('click', () => {
            EMPLOYEE_EDIT_ID = emp.id;
            cargarFormularioEmpleado();
        });

        btnPago.addEventListener('click', (e) => {
            e.stopPropagation();
            EMPLOYEE_EDIT_ID = emp.id;
            cargarFormularioEmpleado();
        });

        // Toggle Active
        btnActivar.textContent = emp.activo ? "Desactivar" : "Activar";
        btnActivar.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleEmployeeStatus(emp);
        });

        container.appendChild(clon);
    });
};

const toggleEmployeeStatus = async (emp) => {
    try {
        // Asumiendo que el backend tiene PUT /empleados/:id para cambiar 'activo'
        // Si tu backend 'crearEmpleado' manejaba todo en uno, necesitas asegurar 
        // que haya una ruta de actualización o crearla.
        /* NOTA: En tu controlador backend actual 'crearEmpleado' es solo POST.
           Necesitas implementar 'actualizarEmpleado' en el backend si no existe.
           Por ahora, asumimos que existe o que solo cambiarás esto en memoria para la demo.
        */
       
        // Simulación visual si no tienes el endpoint listo:
        if(confirm(`¿Cambiar estado de ${emp.nombre}?`)){
             // Aquí iría el fetch real:
             // await authFetch(`/empleados/${emp.id}`, { method: 'PUT', body: JSON.stringify({ activo: !emp.activo }) });
             
             // Por ahora lo hacemos local para que veas el efecto:
             emp.activo = !emp.activo;
             renderEmployees();
        }

    } catch(e) { console.error(e); }
};

/* ---------------- FORM LOGIC ---------------- */

const cargarFormularioEmpleado = () => {
    cargarHTML('../html/admin-empleado-form.html', initFormulario);
};

const initFormulario = async () => {
    // Botón Atrás
    document.getElementById('btn-atras')?.addEventListener('click', () => {
        // Volver a la lista
        document.getElementById('menu-admin-empleados').click();
    });

    // Botón Guardar
    document.getElementById('btn-guardar')?.addEventListener('click', guardarEmpleado);

    // Cambio de mes (Recalcular)
    const monthInput = document.getElementById('mes-calculo');
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7); 
    if(monthInput) monthInput.value = currentMonth;
    
    monthInput?.addEventListener('change', () => {
        if(EMPLOYEE_EDIT_ID) calcularSueldo(EMPLOYEE_EDIT_ID, monthInput.value);
    });

    // Cargar Datos si es Edición
    if (EMPLOYEE_EDIT_ID) {
        await cargarDatosEmpleado(EMPLOYEE_EDIT_ID);
        calcularSueldo(EMPLOYEE_EDIT_ID, currentMonth);
    } else {
        // Nuevo empleado
        const atrasosBox = document.querySelector('.atrasos-box');
        if(atrasosBox) atrasosBox.innerHTML = '<p>Guarde el empleado para gestionar asistencia.</p>';
        
        const salaryDisplay = document.querySelector('.salary-display');
        if(salaryDisplay) salaryDisplay.style.display = 'none';
    }
};

const cargarDatosEmpleado = async (id) => {
    // Asumimos que tienes una lista local 'allEmployees' cargada. 
    // Podemos buscar ahí en vez de hacer fetch de nuevo para ser más rápidos.
    const emp = allEmployees.find(e => e.id == id);
    
    if(emp) {
        document.getElementById('nombre').value = emp.nombre;
        document.getElementById('ci').value = emp.ci;
        document.getElementById('correo').value = emp.correo || '';
        document.getElementById('telefono').value = emp.telefono || '';
        document.getElementById('rol').value = emp.rol; // Asegúrate que el select tenga el valor exacto (Cajero vs CAJERO)
    }
};

const calcularSueldo = async (id, yearMonth) => {
    const container = document.getElementById('atrasos-list');
    if(!container) return;
    container.innerHTML = 'Cargando...';

    try {
        const res = await authFetch(`/asistencias`); 
        if(res.ok) {
            const allAsistencias = await res.json();
            
            // Filtrar localmente
            const asistenciasMes = allAsistencias.filter(a => {
                return a.empleado_id == id && a.fecha.startsWith(yearMonth) && a.descuento_id;
            });

            container.innerHTML = '';
            let totalDescuento = 0;

            if(asistenciasMes.length === 0) {
                container.innerHTML = '<div class="atraso-item"><span>Sin atrasos</span><span>0 Bs</span></div>';
            } else {
                asistenciasMes.forEach(a => {
                    let monto = 0;
                    if(a.DescuentoAtraso) {
                        if(a.DescuentoAtraso.descuento > 0) monto = parseFloat(a.DescuentoAtraso.descuento);
                        if(a.DescuentoAtraso.descuento_porcentual > 0) {
                            monto = (SUELDO_BASE * a.DescuentoAtraso.descuento_porcentual) / 100;
                        }
                    }
                    totalDescuento += monto;

                    const div = document.createElement('div');
                    div.className = 'atraso-item';
                    const fecha = new Date(a.fecha).toLocaleDateString();
                    div.innerHTML = `<span>${fecha}</span> <span style="color:#ff6565">-${monto} Bs</span>`;
                    container.appendChild(div);
                });
            }

            // Actualizar Totales
            document.getElementById('sueldo-base').textContent = `${SUELDO_BASE} Bs`;
            document.getElementById('total-descuentos').textContent = `${totalDescuento} Bs`;
            document.getElementById('sueldo-neto').textContent = `${SUELDO_BASE - totalDescuento} Bs`;
        }
    } catch(e) { console.error(e); }
};

const guardarEmpleado = async () => {
    const data = {
        nombre: document.getElementById('nombre').value,
        ci: document.getElementById('ci').value,
        correo: document.getElementById('correo').value,
        telefono: document.getElementById('telefono').value,
        rol: document.getElementById('rol').value,
    };
    
    const pass = document.getElementById('contrasenia').value;
    if(pass) data.contrasenia = pass; 

    // Ojo: Necesitas el endpoint PUT en backend si es edición
    const method = EMPLOYEE_EDIT_ID ? 'PUT' : 'POST'; 
    const url = EMPLOYEE_EDIT_ID ? `/empleados/${EMPLOYEE_EDIT_ID}` : '/empleados';

    // (Simulación si no tienes PUT aún):
    if(method === 'PUT') {
        alert("Función de guardar edición pendiente de backend.");
        return;
    }

    try {
        const res = await authFetch(url, {
            method,
            body: JSON.stringify(data)
        });

        if(res.ok) {
            alert("Guardado correctamente");
            document.getElementById('menu-admin-empleados').click();
        } else {
            const err = await res.json();
            alert("Error: " + err.message);
        }
    } catch(e) { console.error(e); }
};