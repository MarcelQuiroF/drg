let intervaloGlobal = null;

/**
 * Inicia un refresco automático para la página actual.
 * @param {Function} callback - La función que recarga los datos (ej: initReservas)
 * @param {Number} segundos - Cada cuánto tiempo (por defecto 30s)
 */
export const iniciarAutoRefresco = (callback, segundos = 30) => {
    detenerAutoRefresco(); // Limpiamos cualquier intervalo previo por seguridad
    
    console.log(`[Sistema] Auto-refresco activado cada ${segundos}s`);
    intervaloGlobal = setInterval(async () => {
        console.log("[Sistema] Sincronizando datos...");
        await callback();
    }, segundos * 1000);
};

/**
 * Detiene cualquier refresco activo. 
 * Úsalo al cambiar de sección para no gastar recursos.
 */
export const detenerAutoRefresco = () => {
    if (intervaloGlobal) {
        clearInterval(intervaloGlobal);
        intervaloGlobal = null;
        console.log("[Sistema] Auto-refresco desactivado.");
    }
};


export const cargarHTML = (rutaHTML, callback) => {
    detenerAutoRefresco();
    console.log(`[Navegación] Limpiando procesos para cargar: ${rutaHTML}`);
    const cuerpo = document.getElementById('cuerpo');
    fetch(rutaHTML)
        .then(res => res.text())
        .then(html => {
            cuerpo.innerHTML = html;
            
            // --- CORRECCIÓN DE SEGURIDAD ---
            const contenido = cuerpo.querySelector('.contenido');
            
            // Solo intentamos cambiar estilos si el elemento EXISTE
            if (contenido) {
                if(getComputedStyle(contenido).display !== 'flex') {
                    contenido.style.display = 'flex';
                }
                
                // Lógica de dirección
                if(rutaHTML.includes("mesas")) {
                    contenido.style.flexDirection = "column";
                } else if(rutaHTML.includes("admin-productos")) {
                    // Admin productos necesita columna
                    contenido.style.flexDirection = "column"; 
                } else if(rutaHTML.includes("productos")) {
                    // Productos (Cajero) necesita fila
                    contenido.style.flexDirection = "row";
                }
            }
            // -------------------------------

            if(typeof callback === 'function') callback();
        })
        .catch(err => console.error("Error cargando HTML:", err));
};



export const activarMenu = (id) => {
    document.querySelectorAll('.menu-item, .menu-link').forEach(i => i.classList.remove('active'));
    const item = document.getElementById(id);
    if(item) {
        item.classList.add('active');
        const parent = item.closest('.menu-item');
        if (parent) parent.classList.add('active');
    }
};  



export const mostrarNotificacion = (titulo, mensaje, esError = true) => {
    const modal = document.getElementById('notification-modal');
    const overlay = document.getElementById('modal-overlay');
    const titleEl = document.getElementById('notification-title');
    const msgEl = document.getElementById('notification-message');

    if (titleEl) {
        titleEl.textContent = titulo;
        titleEl.style.color = esError ? "#ff5a5e" : "#2e7d32";
    }
    if (msgEl) msgEl.textContent = mensaje;

    modal?.classList.add('custom-modal-visible');
    overlay?.classList.add('modal-overlay-visible');
};

export const cerrarNotificacion = () => {
    document.getElementById('notification-modal')?.classList.remove('custom-modal-visible');
    document.getElementById('modal-overlay')?.classList.remove('modal-overlay-visible');
};