import { authFetch } from '../api.js';
import { cargarImpresionPage } from './impresion.js';


let ORDEN_ACTUAL_ID = null; 


export const cargarProductosPage = async (mesaId) => {
    const cuerpo = document.getElementById("cuerpo");
    
    try {
        const response = await fetch("../html/productos.html");
        const html = await response.text();
        cuerpo.innerHTML = html;
        
        const contenido = cuerpo.querySelector(".contenido");
        if(contenido) contenido.style.flexDirection = "row";
        
        sessionStorage.setItem("mesaSeleccionada", mesaId);
        
        const tituloMesa = document.querySelector(".barra-principal .titulo");
        if(tituloMesa) tituloMesa.textContent = `Mesa (ID: ${mesaId})`; 

        ORDEN_ACTUAL_ID = null;
        await verificarOrdenActiva(mesaId);
        cargarProductos('comida'); 
        inicializarEventosProductos(); 

    } catch (err) {
        console.error("Error cargando productos.html:", err);
    }
};

const verificarOrdenActiva = async (mesaId) => {
    try {

        const res = await authFetch(`/ordenes?mesa_id=${mesaId}&finalizado=false`);
        if(res && res.ok){
            const ordenes = await res.json();
            if(ordenes.length > 0){

                ORDEN_ACTUAL_ID = ordenes[0].id;
                actualizarTotalVisual(ordenes[0].total);
                cargarDetalleOrden(ORDEN_ACTUAL_ID);
            } else {

                const panelMesa = document.getElementById('mesa-productos');
                if(panelMesa) panelMesa.innerHTML = '';
                actualizarTotalVisual(0);
            }
        }
    } catch (error) {
        console.error("Error verificando orden:", error);
    }
};


const cargarProductos = async (tipo) => {
    const contenedor = document.getElementById('productos-container');
    if(!contenedor) return;
    contenedor.innerHTML = '<p style="text-align:center;width:100%;">Cargando...</p>';

    document.querySelectorAll('.btn-categoria').forEach(btn => btn.classList.remove('active'));

    try {
        let items = [];
        let esJuego = false;

        if (tipo === 'juego') {
            esJuego = true;
            const res = await authFetch('/juegos');
            if(res.ok) items = await res.json();
        } else {
            const res = await authFetch('/productos');
            if(res.ok) {
                const todos = await res.json();
                const zonaFiltro = tipo === 'comida' ? 'Cocina' : 'Cafeteria'; 
                items = todos.filter(p => p.zona === zonaFiltro);
            }
        }

        renderizarCatalogo(contenedor, items, esJuego);

    } catch (error) {
        contenedor.innerHTML = '<p>Error cargando datos.</p>';
        console.error(error);
    }
};

const renderizarCatalogo = (contenedor, items, esJuego) => {
    contenedor.innerHTML = '';
    const template = document.getElementById('template-producto-card');


    const IMAGENES_DEFECTO = {
        comida: '../assets/productos/default-burger.png',
        bebida: '../assets/productos/default-drink.png',
        juego: '../assets/productos/default-game.png'
    };
    
    const RUTA_BASE_PRODUCTOS = '../assets/productos/';

    if(items.length === 0) {
        contenedor.innerHTML = '<p style="padding:20px; text-align:center;">No hay items disponibles.</p>';
        return;
    }

    items.forEach(p => {
        const clon = template.content.cloneNode(true);
        
        clon.querySelector('.nombre-producto').textContent = p.nombre;
        clon.querySelector('.precio-producto').textContent = `Bs ${p.precio}`;


        const img = clon.querySelector('.img-producto');
        
        let tipoActual = 'comida';
        if (esJuego) {
            tipoActual = 'juego';
        } else if (p.zona === 'BARRA' || p.zona === 'Cafeteria') { 
            tipoActual = 'bebida';
        }


        if (p.imagen && p.imagen.trim() !== "") {

            if (p.imagen.startsWith('http') || p.imagen.startsWith('.') || p.imagen.startsWith('/')) {
                img.src = p.imagen; 
            } else {
                img.src = `${RUTA_BASE_PRODUCTOS}${p.imagen}`; 
            }
        } else {

            img.src = IMAGENES_DEFECTO[tipoActual];
        }

        img.onerror = () => { img.src = IMAGENES_DEFECTO[tipoActual]; };


        const icono = clon.querySelector('.icono-producto');
        if(icono) icono.style.display = 'none';

        const detalleJuego = clon.querySelector('.detalle-juego');
        if(esJuego){
            detalleJuego.style.display = 'block';
            detalleJuego.textContent = `${p.jugadores_min}-${p.jugadores_max} Jugadores`;
        } else {
            detalleJuego.style.display = 'none';
        }

        const cardDiv = clon.querySelector('.producto-card');
        cardDiv.addEventListener('click', () => agregarItemAOrden(p, esJuego));
        
        contenedor.appendChild(clon);
    });
};


const agregarItemAOrden = async (item, esJuego) => {
    try {

        if (!ORDEN_ACTUAL_ID) {
            const mesaId = sessionStorage.getItem("mesaSeleccionada");
            const resOrden = await authFetch('/ordenes', {
                method: 'POST',
                body: JSON.stringify({ mesa_id: mesaId })
            });
            if(!resOrden.ok) return alert("Error abriendo mesa.");
            const dataOrden = await resOrden.json();
            ORDEN_ACTUAL_ID = dataOrden.orden.id;
        }

        const endpoint = esJuego ? '/ordenes-juegos' : '/ordenes-productos';
        const body = {
            orden_id: ORDEN_ACTUAL_ID,
            cantidad: 1,
            comentario: ""
        };
        
        if(esJuego) body.juego_id = item.id;
        else body.producto_id = item.id;

        const resItem = await authFetch(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });

        if(resItem.ok){
            verificarOrdenActiva(sessionStorage.getItem("mesaSeleccionada"));
        } else {
            alert("Error agregando item");
        }

    } catch (error) {
        console.error("Error agregando item:", error);
    }
};

const cargarDetalleOrden = async (ordenId) => {
    const contenedor = document.getElementById('mesa-productos');
    if(!contenedor) return;
    contenedor.innerHTML = '';
    
    const template = document.getElementById('template-item-orden');

    try {
        const [resProd, resJuegos, resDesc] = await Promise.all([
            authFetch(`/ordenes-productos?orden_id=${ordenId}`),
            authFetch(`/ordenes-juegos?orden_id=${ordenId}`),
            authFetch(`/ordenes/${ordenId}/descuentos`)
        ]);

        let items = [];
        
        if(resProd.ok) {
            const prods = await resProd.json();
            items = items.concat(prods.map(i => ({
                id: i.id, nombre: i.Producto.nombre, precio: i.Producto.precio,
                cantidad: i.cantidad, comentario: i.comentario, tipo: 'producto'
            })));
        }

        if(resJuegos.ok) {
            const juegos = await resJuegos.json();
            items = items.concat(juegos.map(j => ({
                id: j.id, nombre: j.Juego.nombre, precio: j.Juego.precio,
                cantidad: j.cantidad, comentario: j.comentario, tipo: 'juego'
            })));
        }

        let listaDescuentos = [];
        if(resDesc.ok) {
            const descuentos = await resDesc.json();
            listaDescuentos = descuentos.map(d => {
                let nombre = d.comentario || "Descuento";
                let valorVisual = "";

                if(d.monto > 0) {
                    valorVisual = `- Bs ${parseFloat(d.monto).toFixed(2)}`;
                } else {
                    valorVisual = `Desc. ${d.porcentaje}%`;
                    nombre += ` (${d.porcentaje}%)`;
                }

                return {
                    id: d.id,
                    nombre: nombre,
                    valorVisual: valorVisual, 
                    tipo: 'descuento'
                };
            });
        }


        items.forEach(item => {
            const clon = template.content.cloneNode(true);
            
            clon.querySelector('.item-texto').textContent = `${item.cantidad} x ${item.nombre}`;
            clon.querySelector('.item-subtotal').textContent = `Bs ${(item.precio * item.cantidad).toFixed(2)}`;

            const iconComentario = clon.querySelector('.btn-comentario');
            const textComentario = clon.querySelector('.item-comentario-texto');
            if (item.comentario && item.comentario.trim() !== "") {
                textComentario.textContent = `"${item.comentario}"`;
                iconComentario.classList.replace('fa-regular', 'fa-solid');
                iconComentario.classList.replace('fa-comment-dots', 'fa-comment');
                iconComentario.style.color = '#e67e22'; 
            }
            iconComentario.addEventListener('click', async () => {
                const nuevoComentario = prompt("Nota:", item.comentario || "");
                if (nuevoComentario !== null) guardarComentario(item.id, item.tipo, nuevoComentario);
            });

            const btnRestar = clon.querySelector('.btn-restar');
            btnRestar.addEventListener('click', () => gestionarCantidad(item, -1));

            contenedor.appendChild(clon);
        });

        if(listaDescuentos.length > 0) {
            const hr = document.createElement('div');
            hr.style.borderTop = "1px dashed #ccc";
            hr.style.margin = "10px 0";
            contenedor.appendChild(hr);

            listaDescuentos.forEach(desc => {
                const clon = template.content.cloneNode(true);
                
                const texto = clon.querySelector('.item-texto');
                texto.textContent = desc.nombre;
                texto.style.color = "#2e7d32"; 
                texto.style.fontStyle = "italic";

                const precio = clon.querySelector('.item-subtotal');
                precio.textContent = desc.valorVisual;
                precio.style.color = "#2e7d32"; 

                clon.querySelector('.btn-restar').style.display = 'none';
                clon.querySelector('.btn-comentario').style.display = 'none';

                const divIzquierdo = clon.querySelector('div[style*="align-items:center"]');
                
                const btnBasura = document.createElement('i');
                btnBasura.className = "fa-solid fa-trash";
                btnBasura.style.color = "#cc0000";
                btnBasura.style.cursor = "pointer";
                btnBasura.style.marginRight = "10px";
                btnBasura.title = "Eliminar descuento";

                divIzquierdo.prepend(btnBasura);

                btnBasura.addEventListener('click', async () => {
                    if(confirm("¿Quitar este descuento?")){
                        await eliminarDescuento(ordenId, desc.id);
                    }
                });

                contenedor.appendChild(clon);
            });
        }

    } catch (error) {
        console.error("Error cargando detalle:", error);
    }
};

const eliminarDescuento = async (ordenId, descuentoId) => {
    try {
        const res = await authFetch(`/ordenes/${ordenId}/descuento/${descuentoId}`, {
            method: 'DELETE'
        });

        if (res.ok) {
            verificarOrdenActiva(sessionStorage.getItem("mesaSeleccionada"));
        } else {
            alert("Error al eliminar descuento.");
        }
    } catch (error) {
        console.error("Error eliminando descuento:", error);
    }
};

const guardarComentario = async (itemId, tipo, comentario) => {
    try {
        
        let endpoint = '';
        if (tipo === 'producto') {
            endpoint = `/ordenes-productos/${itemId}`;
        } else {
            endpoint = `/ordenes-juegos/${itemId}`; 
        }

        const res = await authFetch(endpoint, {
            method: 'PUT', 
            body: JSON.stringify({ comentario: comentario })
        });

        if (res.ok) {
            cargarDetalleOrden(sessionStorage.getItem("mesaSeleccionada") ? ORDEN_ACTUAL_ID : null); 
        } else {
            alert("No se pudo guardar el comentario. (Verifica si es un Juego y si el backend lo permite)");
        }
    } catch (error) {
        console.error("Error guardando comentario:", error);
    }
};

const gestionarCantidad = async (item, cambio) => {
    try {
        const nuevaCantidad = item.cantidad + cambio;
        
        let endpoint = item.tipo === 'producto' 
            ? '/ordenes-productos' 
            : '/ordenes-juegos';

        if (nuevaCantidad > 0) {
            const res = await authFetch(`${endpoint}/${item.id}`, {
                method: 'PUT',
                body: JSON.stringify({ cantidad: nuevaCantidad })
            });
            if(res.ok) verificarOrdenActiva(sessionStorage.getItem("mesaSeleccionada"));
        } else {
            if(confirm(`¿Eliminar ${item.nombre} de la orden?`)){
                const res = await authFetch(`${endpoint}/${item.id}`, {
                    method: 'DELETE'
                });
                if(res.ok) verificarOrdenActiva(sessionStorage.getItem("mesaSeleccionada"));
            }
        }
    } catch (error) {
        console.error("Error gestionando cantidad:", error);
    }
};


const actualizarTotalVisual = (total) => {
    const el = document.getElementById('total-mesa');
    if(el) el.textContent = `Bs ${parseFloat(total).toFixed(2)}`;
};

const inicializarEventosProductos = () => {
    document.getElementById('btn-cat-comida')?.addEventListener('click', () => cargarProductos('comida'));
    document.getElementById('btn-cat-bebida')?.addEventListener('click', () => cargarProductos('bebida'));
    document.getElementById('btn-cat-juego')?.addEventListener('click', () => cargarProductos('juego'));

    const inputBusqueda = document.querySelector(".input-busqueda");
    if(inputBusqueda){
        inputBusqueda.addEventListener("input", (e) => {
            const texto = e.target.value.toLowerCase();
            document.querySelectorAll(".producto-card").forEach(carta => {
                const nombre = carta.querySelector("h3")?.textContent.toLowerCase() || "";
                carta.style.display = nombre.includes(texto) ? "flex" : "none";
            });
        });
    }

    const btnDescuento = document.querySelector(".agregar-descuento");
    if (btnDescuento) {
        btnDescuento.addEventListener("click", async () => {
            if (!ORDEN_ACTUAL_ID) return alert("No hay orden activa para aplicar descuento.");

            const tipo = prompt("Escriba 'P' para Porcentaje (%) o 'M' para Monto Fijo ($):");
            if (!tipo) return;

            let body = {};
            
            if (tipo.toUpperCase() === 'P') {
                const val = prompt("Ingrese el porcentaje (ej. 10 para 10%):");
                if(!val || isNaN(val)) return alert("Valor inválido");
                body.porcentaje = parseFloat(val);
            } else if (tipo.toUpperCase() === 'M') {
                const val = prompt("Ingrese el monto a descontar (ej. 20):");
                if(!val || isNaN(val)) return alert("Valor inválido");
                body.monto = parseFloat(val);
            } else {
                return alert("Opción no válida. Use P o M.");
            }

            const comentario = prompt("Motivo del descuento (Opcional):");
            body.comentario = comentario || "Descuento general";

            try {
                const res = await authFetch(`/ordenes/${ORDEN_ACTUAL_ID}/descuento`, {
                    method: 'POST',
                    body: JSON.stringify(body)
                });

                if (res.ok) {
                    alert("Descuento aplicado correctamente.");
                    verificarOrdenActiva(sessionStorage.getItem("mesaSeleccionada"));
                } else {
                    const err = await res.json();
                    alert("Error: " + err.message);
                }
            } catch (error) {
                console.error(error);
                alert("Error de conexión.");
            }
        });
    }

    const btnCobrar = document.querySelector(".cobrar");
    if(btnCobrar){
        btnCobrar.addEventListener("click", async () => {
            if(!ORDEN_ACTUAL_ID) return alert("No hay orden para cobrar.");
            
            const montoTexto = document.getElementById('total-mesa').textContent.replace('Bs ', '');
            const monto = parseFloat(montoTexto);

            if(confirm(`¿Confirmar pago FINAL de Bs ${monto}? (Se cerrará la mesa)`)){
                try {
                    const res = await authFetch('/pagos', {
                        method: 'POST',
                        body: JSON.stringify({
                            orden_id: ORDEN_ACTUAL_ID,
                            cantidad: monto,
                            tipo: "EFECTIVO"
                        })
                    });
                    
                    if(res.ok){
                        alert("¡Pago exitoso! Mesa liberada.");
                        cargarProductosPage(sessionStorage.getItem("mesaSeleccionada"));
                    } else {
                        alert("Error al procesar pago.");
                    }
                } catch (error) { console.error(error); }
            }
        });
    }

    const btnImprimir = document.querySelector(".imprimir");
    if (btnImprimir) {
    btnImprimir.addEventListener("click", () => {
        if (!ORDEN_ACTUAL_ID) return alert("No hay orden activa para imprimir.");

        const mesaId = sessionStorage.getItem("mesaSeleccionada");
        cargarImpresionPage(ORDEN_ACTUAL_ID, mesaId);
    });
    }

    
};