import { authFetch } from '../api.js';
import { cargarHTML, activarMenu } from '../utils.js';
import { cargarProductosPage } from './productos.js'; 


export const cargarOrdenesPage = () => {

    cargarHTML("../html/ordenes.html", initOrdenes);
};



const initOrdenes = () => {

    cargarListaOrdenes(false);
};

const cargarListaOrdenes = async (finalizadas = false) => {
    const contenedor = document.getElementById('contenido');
    if(!contenedor) return;
    

    contenedor.className = 'contenido ordenes-grid'; 
    contenedor.innerHTML = '<p style="color:#888; grid-column:1/-1; text-align:center;">Cargando...</p>';

    try {

        const response = await authFetch(`/ordenes?finalizado=${finalizadas}`);
        
        if(response.ok) {
            const ordenes = await response.json();
            renderizarOrdenes(contenedor, ordenes);
        } else {
            contenedor.innerHTML = '<p style="text-align:center;">Error cargando órdenes.</p>';
        }
    } catch (error) {
        console.error("Error:", error);
        contenedor.innerHTML = '<p style="text-align:center;">Error de conexión.</p>';
    }
};

const renderizarOrdenes = (contenedor, ordenes) => {
    contenedor.innerHTML = '';
    

    const template = document.getElementById('template-orden-card');
    

    if (!template) return;


    if (ordenes.length === 0) {
        contenedor.innerHTML = `
            <div class="ordenes-vacio">
                <i class='bx bx-coffee' style="font-size: 3em; margin-bottom: 10px;"></i>
                <p>No hay órdenes activas en este momento.</p>
            </div>
        `;
        return;
    }

    ordenes.forEach(orden => {

        const clon = template.content.cloneNode(true);
        

        clon.querySelector('.orden-id').textContent = `#${orden.id}`;
        
        const nombreMesa = orden.Mesa ? orden.Mesa.nombre : 'Mesa ???';
        clon.querySelector('.orden-mesa').textContent = nombreMesa;
        
        const fecha = new Date(orden.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        clon.querySelector('.orden-hora').textContent = fecha;
        
        clon.querySelector('.monto-total').textContent = `Bs ${parseFloat(orden.total).toFixed(2)}`;

        const card = clon.querySelector('.orden-card');
        
        card.addEventListener('click', () => {
            if(orden.Mesa){

                sessionStorage.setItem("mesaSeleccionada", orden.Mesa.id);
                
                activarMenu('menu-productos'); 
                
                cargarProductosPage(orden.Mesa.id);
            }
        });

        contenedor.appendChild(clon);
    });
};