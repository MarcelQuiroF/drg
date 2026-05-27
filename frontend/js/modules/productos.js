import { authFetch } from '../api.js';
import { cargarImpresionPage } from './impresion.js';
import { cargarHTML, activarMenu, mostrarNotificacion, cerrarNotificacion } from '../utils.js';
import { initMesas } from './mesas.js';

let ORDEN_ACTUAL_ID = null; 
let ITEM_PARA_COMENTAR = null;
let ITEM_PARA_ELIMINAR = null;

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
                const notepad = document.getElementById('notepad-textarea');
                if(notepad) notepad.value = ordenes[0].notas || "";
                
                actualizarTotalVisual(ordenes[0].total);
                cargarDetalleOrden(ORDEN_ACTUAL_ID);
            }  else {
                const panelMesa = document.getElementById('mesa-productos');
                if(panelMesa) panelMesa.innerHTML = '';
                actualizarTotalVisual(0);
            }
        }
    } catch (error) { console.error(error); }
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
            if(res.ok) {
                const todosJuegos = await res.json();
                // NUEVO: Filtrar solo los juegos activos
                items = todosJuegos.filter(j => j.activado === true);
            }
        } else {
            const res = await authFetch('/productos');
            if(res.ok) {
                const todos = await res.json();
                const zonaFiltro = tipo === 'comida' ? 'COCINA' : 'CAFETERIA'; 
                
                // NUEVO: Filtrar por zona Y que estén activos
                items = todos.filter(p => 
                    p.zona && 
                    p.zona.toUpperCase() === zonaFiltro && 
                    p.activado === true
                );
            }
        }

        renderizarCatalogo(contenedor, items, esJuego);

    } catch (error) {
        contenedor.innerHTML = '<p>Error cargando datos.</p>';
        console.error(error);
    }
};

const mostrarErrorDescuento = (mensaje) => {
    const errorEl = document.getElementById('discount-error-msg');
    if (errorEl) {
        errorEl.textContent = mensaje;
        errorEl.className = 'error-text-visible';
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
        } else if (p.zona && (p.zona.toUpperCase() === 'BARRA' || p.zona.toUpperCase() === 'CAFETERIA')) { 
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
        cardDiv.onclick = () => agregarItemAOrden(p, esJuego);
        
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
            if(!resOrden.ok) return mostrarNotificacion("Error", "No se pudo abrir la mesa.");
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
            mostrarNotificacion("Error", "No se pudo agregar el producto.");
        }
    } catch (error) { console.error("Error agregando item:", error); }
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

                return { id: d.id, nombre: nombre, valorVisual: valorVisual, tipo: 'descuento' };
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
            iconComentario.onclick = () => {
                ITEM_PARA_COMENTAR = { id: item.id, tipo: item.tipo };
                abrirModalComentario(item.comentario || "");
            };

            const btnRestar = clon.querySelector('.btn-restar');
            btnRestar.onclick = () => gestionarCantidad(item, -1);

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

                btnBasura.onclick = () => prepararEliminacionDescuento(ordenId, desc.id, desc.nombre);

                contenedor.appendChild(clon);
            });
        }

    } catch (error) { console.error("Error cargando detalle:", error); }
};

const prepararEliminacionDescuento = (ordenId, descuentoId, nombreDescuento) => {
    const totalFilas = document.querySelectorAll('#mesa-productos .item-orden').length;
    const esUltimoItem = (totalFilas === 1);

    ITEM_PARA_ELIMINAR = { 
        id: descuentoId, 
        ordenId: ordenId,
        nombre: nombreDescuento, 
        tipo: 'descuento',
        esUltimoItem: esUltimoItem 
    };

    abrirModalEliminar(nombreDescuento, esUltimoItem);
};

const guardarComentario = async (itemId, tipo, comentario) => {
    try {
        let endpoint = tipo === 'producto' ? `/ordenes-productos/${itemId}` : `/ordenes-juegos/${itemId}`;

        const res = await authFetch(endpoint, {
            method: 'PUT', 
            body: JSON.stringify({ comentario: comentario })
        });

        if (res.ok) {
            cargarDetalleOrden(sessionStorage.getItem("mesaSeleccionada") ? ORDEN_ACTUAL_ID : null); 
        } else {
            mostrarNotificacion("Error", "Hubo un problema al guardar la nota del producto.");
        }
    } catch (error) { console.error("Error guardando comentario:", error); }
};

const gestionarCantidad = async (item, cambio) => {
    try {
        const nuevaCantidad = item.cantidad + cambio;
        let endpoint = item.tipo === 'producto' ? '/ordenes-productos' : '/ordenes-juegos';

        if (nuevaCantidad > 0) {
            const res = await authFetch(`${endpoint}/${item.id}`, {
                method: 'PUT',
                body: JSON.stringify({ cantidad: nuevaCantidad })
            });
            if(res.ok) verificarOrdenActiva(sessionStorage.getItem("mesaSeleccionada"));
        } else {
            const totalFilas = document.querySelectorAll('#mesa-productos .item-orden').length;
            const esUltimoItem = (totalFilas === 1);
            ITEM_PARA_ELIMINAR = { ...item, endpoint, esUltimoItem }; 
            abrirModalEliminar(item.nombre, esUltimoItem);
        }
    } catch (error) { console.error("Error gestionando cantidad:", error); }
};

const actualizarTotalVisual = (total) => {
    const el = document.getElementById('total-mesa');
    if(el) el.textContent = `Bs ${parseFloat(total).toFixed(2)}`;
};

const initNotepadLogic = () => {
    const btn = document.getElementById('btn-notepad');
    const modal = document.getElementById('notepad-modal');
    const textarea = document.getElementById('notepad-textarea');
    const closeBtn = document.getElementById('close-notepad');

    const closeAndSave = async () => {
        if (!modal.classList.contains('notepad-visible')) return;
        
        modal.classList.remove('notepad-visible');
        
        if (ORDEN_ACTUAL_ID && textarea) {
            try {
                await authFetch(`/ordenes/${ORDEN_ACTUAL_ID}`, {
                    method: 'PUT',
                    body: JSON.stringify({ notas: textarea.value })
                });
            } catch (err) { console.error("Failed to save notes:", err); }
        }
    };

    if(btn) btn.onclick = (e) => {
        e.stopPropagation();
        modal.classList.toggle('notepad-visible');
        if (modal.classList.contains('notepad-visible')) textarea.focus();
    };

    if(closeBtn) closeBtn.onclick = (e) => {
        e.stopPropagation();
        closeAndSave();
    };
};

const abrirModalComentario = (comentarioActual) => {
    const modal = document.getElementById('comment-modal');
    const overlay = document.getElementById('modal-overlay');
    const textarea = document.getElementById('comment-textarea');

    textarea.value = comentarioActual;
    modal.classList.add('custom-modal-visible');
    overlay.classList.add('modal-overlay-visible');
    textarea.focus();
};

const cerrarModalComentario = () => {
    document.getElementById('comment-modal').classList.remove('custom-modal-visible');
    document.getElementById('modal-overlay').classList.remove('modal-overlay-visible');
    ITEM_PARA_COMENTAR = null;
};

const abrirModalEliminar = (nombreProducto, esUltimoItem = false) => {
    const modal = document.getElementById('delete-modal');
    const overlay = document.getElementById('modal-overlay');
    const message = document.getElementById('delete-modal-message');

    if (esUltimoItem) {
        message.innerHTML = `
            <div style="color: #d9534f; font-weight: bold; margin-bottom: 10px;">
                <i class="fa-solid fa-triangle-exclamation"></i> ¡Atención!
            </div>
            <strong>"${nombreProducto}"</strong> es el único item en la orden. 
            Al eliminarlo, la orden se cerrará
        `;
    } else {
        message.textContent = `¿Eliminar "${nombreProducto}" de la orden?`;
    }
    
    modal.classList.add('custom-modal-visible');
    overlay.classList.add('modal-overlay-visible');
};

const cerrarModalEliminar = () => {
    document.getElementById('delete-modal').classList.remove('custom-modal-visible');
    document.getElementById('modal-overlay').classList.remove('modal-overlay-visible');
    ITEM_PARA_ELIMINAR = null;
};

const abrirModalDescuento = () => {
    const modal = document.getElementById('discount-modal');
    const overlay = document.getElementById('modal-overlay');
    const errorEl = document.getElementById('discount-error-msg');
    
    if (errorEl) errorEl.className = 'error-text-hidden';
    document.getElementById('discount-amount-input').value = "";
    document.getElementById('discount-reason-input').value = "";

    modal.classList.add('custom-modal-visible');
    overlay.classList.add('modal-overlay-visible');
};

const cerrarModalDescuento = () => {
    document.getElementById('discount-modal').classList.remove('custom-modal-visible');
    document.getElementById('modal-overlay').classList.remove('modal-overlay-visible');
};

// --- LÓGICA DE COBRO MIXTO ---
const abrirModalPago = () => {
    const modal = document.getElementById('payment-modal');
    const btnConfirmar = document.getElementById('btn-confirm-payment');
    const inputQR = document.getElementById('input-pago-qr');
    const inputEfe = document.getElementById('input-pago-efectivo');
    
    const totalTexto = document.getElementById('total-mesa').textContent.replace('Bs ', '');
    const totalMonto = parseFloat(totalTexto);

    document.getElementById('payment-total-display').textContent = `Bs ${totalMonto.toFixed(2)}`;
    
    inputQR.value = "";
    inputEfe.value = totalMonto.toFixed(2); 
    inputEfe.placeholder = "0.00";

    btnConfirmar.disabled = false;
    btnConfirmar.style.opacity = "1";
    btnConfirmar.style.cursor = "pointer";

    document.getElementById('payment-error-msg').className = 'error-text-hidden';
    document.getElementById('payment-change-display').textContent = "Bs 0.00";

    const calcularSaldos = (evento) => {
        if (evento && evento.target.id === 'input-pago-qr' && inputQR.value.trim() !== "") {
            inputEfe.value = ""; 
        }

        const qr = parseFloat(inputQR.value) || 0;
        const efe = parseFloat(inputEfe.value) || 0;
        const pagado = qr + efe;
        
        const faltante = Math.max(0, totalMonto - qr);
        inputEfe.placeholder = faltante.toFixed(2);

        const sobrante = Math.max(0, pagado - totalMonto);
        const displaySobrante = document.getElementById('payment-change-display');
        displaySobrante.textContent = `Bs ${sobrante.toFixed(2)}`;
        displaySobrante.style.color = sobrante > 0 ? "#2e7d32" : "#333";

        if (pagado >= totalMonto - 0.01) {
            btnConfirmar.disabled = false;
            btnConfirmar.style.opacity = "1";
            btnConfirmar.style.cursor = "pointer";
            document.getElementById('payment-error-msg').className = 'error-text-hidden';
        } else {
            btnConfirmar.disabled = true;
            btnConfirmar.style.opacity = "0.5";
            btnConfirmar.style.cursor = "not-allowed";
        }
    };

    inputQR.oninput = calcularSaldos;
    inputEfe.oninput = calcularSaldos;

    modal.classList.add('custom-modal-visible');
    document.getElementById('modal-overlay').classList.add('modal-overlay-visible');
};

const cerrarModalPago = () => {
    document.getElementById('payment-modal').classList.remove('custom-modal-visible');
    document.getElementById('modal-overlay').classList.remove('modal-overlay-visible');
};

const inicializarEventosProductos = () => {
    const btnCatComida = document.getElementById('btn-cat-comida');
    if(btnCatComida) btnCatComida.onclick = () => cargarProductos('comida');
    
    const btnCatBebida = document.getElementById('btn-cat-bebida');
    if(btnCatBebida) btnCatBebida.onclick = () => cargarProductos('bebida');
    
    const btnCatJuego = document.getElementById('btn-cat-juego');
    if(btnCatJuego) btnCatJuego.onclick = () => cargarProductos('juego');

    const inputBusqueda = document.querySelector(".input-busqueda");
    if(inputBusqueda){
        inputBusqueda.oninput = (e) => {
            const texto = e.target.value.toLowerCase();
            document.querySelectorAll(".producto-card").forEach(carta => {
                const nombre = carta.querySelector("h3")?.textContent.toLowerCase() || "";
                carta.style.display = nombre.includes(texto) ? "flex" : "none";
            });
        };
    }

    initNotepadLogic();

    const btnSaveComment = document.getElementById('btn-save-comment');
    if(btnSaveComment) btnSaveComment.onclick = async () => {
        if (ITEM_PARA_COMENTAR) {
            const nuevoComentario = document.getElementById('comment-textarea').value;
            await guardarComentario(ITEM_PARA_COMENTAR.id, ITEM_PARA_COMENTAR.tipo, nuevoComentario);
            cerrarModalComentario();
        }
    };

    const btnCancelComment = document.getElementById('btn-cancel-comment');
    if(btnCancelComment) btnCancelComment.onclick = cerrarModalComentario;
    
    const closeCommentModal = document.getElementById('close-comment-modal');
    if(closeCommentModal) closeCommentModal.onclick = cerrarModalComentario;

    const btnDescuento = document.querySelector(".agregar-descuento");
    if (btnDescuento) {
        btnDescuento.onclick = () => {
            if (!ORDEN_ACTUAL_ID) return mostrarNotificacion("Aviso", "Debes seleccionar una mesa con orden activa.");
            abrirModalDescuento();
        };
    }

    const btnApplyDiscount = document.getElementById('btn-apply-discount');
    if(btnApplyDiscount) btnApplyDiscount.onclick = async () => {
        const tipo = document.getElementById('discount-type-select').value;
        const valor = parseFloat(document.getElementById('discount-amount-input').value);
        const motivo = document.getElementById('discount-reason-input').value.trim();

        if (isNaN(valor) || valor <= 0) return mostrarErrorDescuento("Ingrese un monto válido.");
        if (motivo === "" || motivo.length < 3) return mostrarErrorDescuento("El motivo es obligatorio (mín. 3 caracteres).");

        let body = { comentario: motivo };
        if (tipo === 'P') body.porcentaje = valor;
        else body.monto = valor;

        try {
            const res = await authFetch(`/ordenes/${ORDEN_ACTUAL_ID}/descuento`, {
                method: 'POST',
                body: JSON.stringify(body)
            });

            if (res.ok) {
                cerrarModalDescuento();
                verificarOrdenActiva(sessionStorage.getItem("mesaSeleccionada"));
            } else {
                const err = await res.json();
                mostrarErrorDescuento("Error: " + err.message);
            }
        } catch (error) { mostrarErrorDescuento("Error de conexión con el servidor."); }
    };

    const btnCancelDiscount = document.getElementById('btn-cancel-discount');
    if(btnCancelDiscount) btnCancelDiscount.onclick = cerrarModalDescuento;

    const btnCobrar = document.querySelector(".cobrar");
    if (btnCobrar) {
        btnCobrar.onclick = () => {
            if (!ORDEN_ACTUAL_ID) return mostrarNotificacion("Aviso", "No hay orden activa para cobrar.");
            abrirModalPago();
        };
    }

    const btnCancelPayment = document.getElementById('btn-cancel-payment');
    if(btnCancelPayment) btnCancelPayment.onclick = cerrarModalPago;

    const btnConfirmPayment = document.getElementById('btn-confirm-payment');
    if(btnConfirmPayment) btnConfirmPayment.onclick = async () => {
        const totalMonto = parseFloat(document.getElementById('total-mesa').textContent.replace('Bs ', ''));
        const qr = parseFloat(document.getElementById('input-pago-qr').value) || 0;
        const efe = parseFloat(document.getElementById('input-pago-efectivo').value) || 0;
        const pagado = qr + efe;

        if (pagado < totalMonto - 0.01) {
            const errorEl = document.getElementById('payment-error-msg');
            errorEl.textContent = `Monto insuficiente. Faltan Bs ${(totalMonto - pagado).toFixed(2)}`;
            errorEl.className = 'error-text-visible';
            return;
        }

        const pagosArray = [];
        if (qr > 0) pagosArray.push({ tipo: 'QR', monto: qr });
        if (efe > 0) {
            const montoEfectivoReal = (qr >= totalMonto) ? 0 : totalMonto - qr;
            if (montoEfectivoReal > 0) pagosArray.push({ tipo: 'EFECTIVO', monto: montoEfectivoReal.toFixed(2) });
        }

        try {
            const res = await authFetch(`/ordenes/${ORDEN_ACTUAL_ID}/finalizar`, {
                method: 'POST',
                body: JSON.stringify({ pagos: pagosArray })
            });

            if (res.ok) {
                cerrarModalPago();
                mostrarNotificacion("¡Éxito!", "Pago procesado y mesa liberada.", false);
                cargarHTML("../html/mesas.html", initMesas); 
                activarMenu('menu-mesas');
                sessionStorage.removeItem("mesaSeleccionada");
            } else {
                const err = await res.json();
                mostrarNotificacion("Error", err.message || "Error al procesar el pago.");
            }
        } catch (error) { mostrarNotificacion("Error", "Error de conexión."); }
    };

    const btnImprimir = document.querySelector(".imprimir");
    if (btnImprimir) {
        btnImprimir.onclick = () => {
            if (!ORDEN_ACTUAL_ID) return mostrarNotificacion("Aviso", "No hay productos para imprimir.");
            const mesaId = sessionStorage.getItem("mesaSeleccionada");
            cargarImpresionPage(ORDEN_ACTUAL_ID, mesaId);
        };
    }

    const btnConfirmDelete = document.getElementById('btn-confirm-delete');
    if(btnConfirmDelete) btnConfirmDelete.onclick = async () => {
        if (ITEM_PARA_ELIMINAR) {
            try {
                let res;
                if (ITEM_PARA_ELIMINAR.tipo === 'descuento') {
                    res = await authFetch(`/ordenes/${ITEM_PARA_ELIMINAR.ordenId}/descuento/${ITEM_PARA_ELIMINAR.id}`, { method: 'DELETE' });
                } else {
                    res = await authFetch(`${ITEM_PARA_ELIMINAR.endpoint}/${ITEM_PARA_ELIMINAR.id}`, { method: 'DELETE' });
                }

                if (res.ok) {
                    if (ITEM_PARA_ELIMINAR.esUltimoItem && ORDEN_ACTUAL_ID) {
                        await authFetch(`/ordenes/${ORDEN_ACTUAL_ID}`, { method: 'DELETE' });
                        cargarHTML("../html/mesas.html", initMesas); 
                        activarMenu('menu-mesas');
                        sessionStorage.removeItem("mesaSeleccionada");
                    } else {
                        verificarOrdenActiva(sessionStorage.getItem("mesaSeleccionada"));
                    }
                }
            } catch (error) { console.error("Error al eliminar:", error); } 
            finally { cerrarModalEliminar(); }
        }
    };

    const btnCancelDelete = document.getElementById('btn-cancel-delete');
    if(btnCancelDelete) btnCancelDelete.onclick = cerrarModalEliminar;
    
    // El overlay ahora cerrará los modales de esta vista
    const overlay = document.getElementById('modal-overlay');
    if(overlay) overlay.onclick = () => {
        cerrarNotificacion();
        cerrarModalComentario();
        cerrarModalEliminar();
        cerrarModalDescuento();
        cerrarModalPago();
    };
};