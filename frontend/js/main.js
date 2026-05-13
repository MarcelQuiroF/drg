import { authFetch } from './api.js';
import { cerrarNotificacion } from './utils.js';
import { cargarHTML } from './utils.js';

// --- MÓDULOS OPERATIVOS (CAJERO/MESERO) ---
import { initMesas } from './modules/mesas.js';
import { cargarProductosPage } from './modules/productos.js';
import { cargarOrdenesPage } from './modules/ordenes.js';
import { cargarAsistenciaPage } from './modules/asistencia.js';
import { cargarReservasPage } from './modules/reservas.js';


// --- MÓDULOS ADMINISTRATIVOS ---
// Asegúrate de crear este archivo en el paso 2, o dará error 404
import { initAdminDashboard } from './modules/adminDashboard.js';
import { initAdminProductos } from './modules/adminProductos.js'; 

/* ---------------------------------------------------- */
/* 1. SEGURIDAD Y ENRUTAMIENTO */
/* ---------------------------------------------------- */
const token = localStorage.getItem('token_drg');
const rol = localStorage.getItem('usuario_rol');
const path = window.location.pathname;

if (!token) {
    window.location.href = 'login.html';
}

// Protección de Rutas: Si intenta entrar al Admin y no lo es
if (path.includes('indexAdmin.html') && rol !== 'ADMIN') {
    alert("Acceso denegado: Área restringida.");
    window.location.href = 'index.html';
}

/* ---------------------------------------------------- */
/* 2. INICIALIZACIÓN DE LA APP */
/* ---------------------------------------------------- */
document.addEventListener('click', (e) => {
    if (e.target.id === 'modal-overlay' || e.target.id === 'btn-close-notification' || e.target.id === 'close-notification-modal') {
        cerrarNotificacion();
    }
});


document.addEventListener('click', (e) => {
    // If the user clicks the dark overlay, close any active modal
    if (e.target.id === 'modal-overlay') {
        cerrarNotificacion();
        
        // Manual trigger for the delete modal since it uses a local let for the ID
        const deleteModal = document.getElementById('delete-modal');
        if (deleteModal && deleteModal.classList.contains('custom-modal-visible')) {
            // Trigger the X button click or call your close function
            document.getElementById('close-delete-modal')?.click();
        }
    }
});


document.addEventListener('DOMContentLoaded', async () => {
    
    // Referencias UI Globales
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('menu-btn');
    const darkModeBtn = document.getElementById('dark-mode-btn');
    const menusItemsDropDown = document.querySelectorAll(".menu-item-dropdown");
    const menusItemsStatic = document.querySelectorAll('.menu-item-static');

    // ------------------------------------------------------
    // A. LÓGICA DIFERENCIADA POR ROL
    // ------------------------------------------------------
    
    if (path.includes('indexAdmin.html')) {
        /* ================= MODO ADMIN ================= */
        
        // Carga por defecto: DASHBOARD
        cargarHTML('../html/admin-registros.html', initAdminDashboard); 

        // Eventos Menú Admin
        document.getElementById("menu-admin-registros")?.addEventListener("click", () => {
            cargarHTML("../html/admin-registros.html", initAdminDashboard);
        });

        document.getElementById("menu-admin-empleados")?.addEventListener("click", () => {
            cargarHTML("../html/admin-empleados.html"); // (Falta crear initEmpleados)
        });


        document.getElementById("menu-admin-espacio")?.addEventListener("click", () => {
            cargarHTML("../html/admin-espacio.html"); // (Falta crear initEspacio)
        });

        document.getElementById("menu-admin-productos")?.addEventListener("click", () => {
        cargarHTML("../html/admin-productos.html", initAdminProductos); // <--- CALL INIT
        });

    } else {
        /* ================= MODO CAJERO/MESERO ================= */
        
        // Carga por defecto: MESAS
        cargarHTML('../html/mesas.html', initMesas);

        // Eventos Menú Operativo
        document.getElementById("menu-mesas")?.addEventListener("click", () => cargarHTML("../html/mesas.html", initMesas));
        
        document.getElementById("menu-productos")?.addEventListener("click", () => {
            const mesaGuardada = sessionStorage.getItem("mesaSeleccionada");
            if(mesaGuardada) cargarProductosPage(mesaGuardada);
            else alert("Seleccione una mesa primero.");
        });

        document.getElementById("menu-ordenes")?.addEventListener("click", cargarOrdenesPage);
        document.getElementById("menu-asistencia")?.addEventListener("click", cargarAsistenciaPage);
        document.getElementById("menu-reservar")?.addEventListener("click", cargarReservasPage);

        // Cerrar Día (Solo Cajero/Mesero tiene este botón en su index)
        const btnCerrarDia = document.querySelector('a[href="cerrado.html"]');
        if (btnCerrarDia) {
            btnCerrarDia.addEventListener('click', (e) => {
                e.preventDefault(); 
                if(confirm("¿Estás seguro de cerrar el día?")){
                    const fechaHoy = new Date().toISOString().split('T')[0];
                    localStorage.setItem('dia_cerrado', fechaHoy);
                    window.location.href = 'cerrado.html';
                }
            });
        }
    }

    // ------------------------------------------------------
    // B. LÓGICA COMPARTIDA (Header, Sidebar, User)
    // ------------------------------------------------------

    // Cargar Datos del Usuario en el Sidebar
    try {
        const response = await authFetch('/empleados/perfil');
        if (response && response.ok) {
            const data = await response.json();
            const nombreEl = document.getElementById('user-name');
            const rolEl = document.getElementById('user-role');
            if(nombreEl) nombreEl.textContent = data.empleado.nombre;
            if(rolEl) rolEl.textContent = data.empleado.rol;
        }
    } catch (error) { console.error(error); }

    // Botón Salir
    document.getElementById('logout-btn')?.addEventListener('click', () => {
        localStorage.removeItem('token_drg');
        localStorage.removeItem('usuario_rol');
        window.location.href = 'login.html';
    });

    // --- INTERACCIÓN VISUAL SIDEBAR ---
    
    darkModeBtn?.addEventListener('click', () => document.body.classList.toggle('dark-mode'));
    menuBtn?.addEventListener('click', () => sidebar.classList.toggle('minimize'));

    // Dropdowns
    menusItemsDropDown.forEach(menuItem => menuItem.addEventListener("click", () => {
        const subMenu = menuItem.querySelector(".sub-menu");
        const isActive = menuItem.classList.toggle("sub-menu-toggle");
        if(subMenu){
            subMenu.style.height = isActive ? `${subMenu.scrollHeight + 6}px` : '0';
            subMenu.style.padding = isActive ? '0.2rem 0' : '0';
        }
        menusItemsDropDown.forEach(item => {
            if(item !== menuItem){
                const otherSubmenu = item.querySelector('.sub-menu');
                if(otherSubmenu){
                    item.classList.remove('sub-menu-toggle');
                    otherSubmenu.style.height = '0';
                    otherSubmenu.style.padding = '0';
                }
            }
        });
    }));

    // Hover Sidebar Minimizado
    menusItemsStatic.forEach(menuItem => menuItem.addEventListener('mouseenter', () => {
        if(!sidebar.classList.contains('minimize')) return;
        menusItemsDropDown.forEach(item => {
            const otherSubmenu = item.querySelector('.sub-menu');
            if(otherSubmenu){
                item.classList.remove('sub-menu-toggle');
                otherSubmenu.style.height = '0';
                otherSubmenu.style.padding = '0';
            }
        });
    }));

    // Clase Active
    document.addEventListener("click", e => {
        const link = e.target.closest(".menu-link");
        if (!link) return;
        document.querySelectorAll(".menu-item, .menu-link").forEach(i => i.classList.remove("active"));
        link.classList.add("active");
        const parentItem = link.closest(".menu-item");
        if (parentItem) parentItem.classList.add("active");
    });
});