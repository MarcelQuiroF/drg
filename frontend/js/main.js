import { authFetch } from './api.js';
import { cerrarNotificacion } from './utils.js';
import { cargarHTML } from './utils.js';

import { initMesas } from './modules/mesas.js';
import { cargarProductosPage } from './modules/productos.js';
import { cargarOrdenesPage } from './modules/ordenes.js';
import { cargarAsistenciaPage } from './modules/asistencia.js';
import { cargarReservasPage } from './modules/reservas.js';

import { initAdminDashboard } from './modules/adminDashboard.js';
import { initAdminProductos } from './modules/adminProductos.js';
import { initAdminEspacio } from './modules/adminEspacio.js'; 
import { initAdminEmpleados } from './modules/adminEmpleados.js'; 

const token = localStorage.getItem('token_drg');
const rol = localStorage.getItem('usuario_rol');
const path = window.location.pathname;

if (!token) {
    window.location.href = 'login.html';
}

if (path.includes('indexAdmin.html') && rol !== 'ADMIN') {
    alert("Acceso denegado: Área restringida.");
    window.location.href = 'index.html';
}

document.addEventListener('click', (e) => {
    const overlay = document.getElementById('modal-overlay');
    
    if (e.target.id === 'btn-close-notification' || e.target.id === 'close-notification-modal') {
        cerrarNotificacion();
        return;
    }

    if (e.target.id === 'modal-overlay') {
        const notificationModal = document.getElementById('notification-modal');
        if (notificationModal && notificationModal.classList.contains('custom-modal-visible')) {
            cerrarNotificacion();
        }

        const deleteModal = document.getElementById('delete-modal');
        if (deleteModal && deleteModal.classList.contains('custom-modal-visible')) {
            document.getElementById('close-delete-modal')?.click();
        }

        const modalAsistencia = document.getElementById('modal-asistencia');
        if (modalAsistencia && modalAsistencia.classList.contains('custom-modal-visible')) {
            document.getElementById('btn-cerrar-asistencia')?.click();
        }

        const modalAprobar = document.getElementById('modal-aprobar');
        if (modalAprobar && modalAprobar.classList.contains('custom-modal-visible')) {
            document.getElementById('btn-cerrar-aprobar')?.click();
        }
        
        const reservaModal = document.getElementById('reserva-modal');
        if (reservaModal && reservaModal.classList.contains('custom-modal-visible')) {
            document.getElementById('close-reserva-modal')?.click();
        }
    }
});


document.addEventListener('DOMContentLoaded', async () => {
    
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('menu-btn');
    const darkModeBtn = document.getElementById('dark-mode-btn');
    const menusItemsDropDown = document.querySelectorAll(".menu-item-dropdown");
    const menusItemsStatic = document.querySelectorAll('.menu-item-static');


    
    if (path.includes('indexAdmin.html')) {
        cargarHTML('../html/admin-registros.html', initAdminDashboard); 

        document.getElementById("menu-admin-registros")?.addEventListener("click", () => {
            cargarHTML("../html/admin-registros.html", initAdminDashboard);
        });

        document.getElementById("menu-admin-empleados")?.addEventListener("click", () => {
            cargarHTML("../html/admin-empleados.html", initAdminEmpleados); 
        });


        document.getElementById("menu-admin-espacio")?.addEventListener("click", () => {
            cargarHTML("../html/admin-espacio.html", initAdminEspacio);
        });

        document.getElementById("menu-admin-productos")?.addEventListener("click", () => {
        cargarHTML("../html/admin-productos.html", initAdminProductos); // <--- CALL INIT
        });

    } else {
        cargarHTML('../html/mesas.html', initMesas);

        document.getElementById("menu-mesas")?.addEventListener("click", () => cargarHTML("../html/mesas.html", initMesas));
        
        document.getElementById("menu-productos")?.addEventListener("click", () => {
            const mesaGuardada = sessionStorage.getItem("mesaSeleccionada");
            if(mesaGuardada) cargarProductosPage(mesaGuardada);
            else alert("Seleccione una mesa primero.");
        });

        document.getElementById("menu-ordenes")?.addEventListener("click", cargarOrdenesPage);
        
        document.getElementById("menu-asistencia")?.addEventListener("click", () => {
            cargarHTML("../html/asistencia.html", cargarAsistenciaPage);
        });

        document.getElementById("menu-reservar")?.addEventListener("click", cargarReservasPage);

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

    document.getElementById('logout-btn')?.addEventListener('click', () => {
        localStorage.removeItem('token_drg');
        localStorage.removeItem('usuario_rol');
        window.location.href = 'login.html';
    });

    
    
    darkModeBtn?.addEventListener('click', () => document.body.classList.toggle('dark-mode'));
    menuBtn?.addEventListener('click', () => sidebar.classList.toggle('minimize'));

    
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

    
    document.addEventListener("click", e => {
        const link = e.target.closest(".menu-link");
        if (!link) return;
        document.querySelectorAll(".menu-item, .menu-link").forEach(i => i.classList.remove("active"));
        link.classList.add("active");
        const parentItem = link.closest(".menu-item");
        if (parentItem) parentItem.classList.add("active");
    });
});