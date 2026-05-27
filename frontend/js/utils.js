let intervaloGlobal = null;


export const iniciarAutoRefresco = (callback, segundos = 30) => {
    detenerAutoRefresco();
    
    console.log(`[Sistema] Auto-refresco activado cada ${segundos}s`);
    intervaloGlobal = setInterval(async () => {
        console.log("[Sistema] Sincronizando datos...");
        await callback();
    }, segundos * 1000);
};

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
            
            const contenido = cuerpo.querySelector('.contenido');
            
            if (contenido) {
                if(getComputedStyle(contenido).display !== 'flex') {
                    contenido.style.display = 'flex';
                }
                
                if(rutaHTML.includes("mesas")) {
                    contenido.style.flexDirection = "column";
                } else if(rutaHTML.includes("admin-productos")) {
                   
                    contenido.style.flexDirection = "column"; 
                } else if(rutaHTML.includes("productos")) {
                    
                    contenido.style.flexDirection = "row";
                }
            }
            

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



// utils.js

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

    // MODIFICADO: Usamos una lógica de clases consistente
    if (modal && overlay) {
        modal.classList.remove('custom-modal-hidden');
        modal.classList.add('custom-modal-visible');
        overlay.classList.remove('modal-overlay-hidden');
        overlay.classList.add('modal-overlay-visible');
    }
};

export const cerrarNotificacion = () => {
    const modal = document.getElementById('notification-modal');
    const overlay = document.getElementById('modal-overlay');
    
    // MODIFICADO: Solo quita el de notificación, no asumas que controla todo el overlay
    if (modal) {
        modal.classList.remove('custom-modal-visible');
        modal.classList.add('custom-modal-hidden');
    }
    
    // El overlay solo se apaga si no hay ningún otro modal visible en la pantalla
    const algunModalAbierto = document.querySelector('.custom-modal-visible');
    if (!algunModalAbierto && overlay) {
        overlay.classList.remove('modal-overlay-visible');
        overlay.classList.add('modal-overlay-hidden');
    }
};