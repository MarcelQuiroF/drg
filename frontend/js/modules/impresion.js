import { authFetch } from '../api.js';
import { cargarHTML } from '../utils.js';
import { cargarProductosPage } from './productos.js';

let MESA_ID_ORIGEN = null;

export const cargarImpresionPage = (ordenId, mesaId) => {
    MESA_ID_ORIGEN = mesaId;
    cargarHTML("../html/imprimir-comanda.html", () => initImpresion(ordenId));
};

const initImpresion = async (ordenId) => {

    try {

        const [resProds, resOrden] = await Promise.all([
            authFetch(`/ordenes-productos?orden_id=${ordenId}`),
            authFetch(`/ordenes/${ordenId}`) 
        ]);

        if (resProds.ok && resOrden.ok) {
            const items = await resProds.json();
            const orden = await resOrden.json();
            
            llenarTickets(items, orden);
        } else {
            alert("Error cargando datos para impresión.");
        }
    } catch (error) {
        console.error(error);
    }


    document.getElementById('btn-volver-productos')?.addEventListener('click', () => {
        cargarProductosPage(MESA_ID_ORIGEN);
    });


    document.getElementById('btn-print-cocina')?.addEventListener('click', () => imprimir('cocina'));
    document.getElementById('btn-print-cafeteria')?.addEventListener('click', () => imprimir('cafeteria'));
    document.getElementById('btn-print-todo')?.addEventListener('click', () => imprimir('todo'));
};

const llenarTickets = (items, orden) => {
    const listaCocina = document.getElementById('lista-cocina');
    const listaCafeteria = document.getElementById('lista-cafeteria');
    

    const nombreMesa = orden.Mesa ? orden.Mesa.nombre : '???';
    const fecha = new Date().toLocaleString();
    
    document.querySelectorAll('.lbl-mesa').forEach(el => el.textContent = nombreMesa);
    document.querySelectorAll('.lbl-orden').forEach(el => el.textContent = `#${orden.id}`);
    document.querySelectorAll('.fecha-hora').forEach(el => el.textContent = fecha);

 
    items.forEach(item => {
        const li = document.createElement('li');
 
        const comentarioHtml = item.comentario ? `<br><small>(${item.comentario})</small>` : '';
        
        li.innerHTML = `
            <div>
                <span class="ticket-cant">${item.cantidad} x</span>
                <span>${item.Producto.nombre}</span>
                ${comentarioHtml}
            </div>
        `;


        if (item.Producto.zona === 'COCINA') {
            listaCocina.appendChild(li);
        } else {
            listaCafeteria.appendChild(li);
        }
    });

    if (listaCocina.children.length === 0) listaCocina.innerHTML = '<li><i>Sin pedidos</i></li>';
    if (listaCafeteria.children.length === 0) listaCafeteria.innerHTML = '<li><i>Sin pedidos</i></li>';
};

const imprimir = (tipo) => {

    document.body.classList.remove('print-cocina', 'print-cafeteria');

    if (tipo === 'cocina') document.body.classList.add('print-cocina');
    if (tipo === 'cafeteria') document.body.classList.add('print-cafeteria');
    

    window.print();

    document.body.classList.remove('print-cocina', 'print-cafeteria');
};