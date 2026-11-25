// Escapa un dato para insertarlo en HTML (contenido o atributo entre comillas). Todo texto que
// venga de la API (nombres, comentarios, teléfonos…) pasa por aquí antes de ir a innerHTML: si
// no, un nombre como <img src=x onerror=…> se ejecuta en la sesión de otro usuario (XSS, #23).
// La regla de ESLint de eslint.config.js obliga a usarla en las plantillas de innerHTML.
const ENTIDADES_HTML = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export const escaparHTML = (valor) => String(valor ?? '').replace(/[&<>"']/g, (c) => ENTIDADES_HTML[c]);

// Devuelve la URL si es http o https, o null. Evita abrir un enlace guardado como
// "javascript:…", que correría código en la página que lo abre (#23).
export const urlSegura = (valor) => {
    if (typeof valor !== 'string' || valor.trim() === '') return null;
    try {
        const url = new URL(valor.trim());
        return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null;
    } catch {
        return null;
    }
};

let intervaloGlobal = null;

export const iniciarAutoRefresco = (callback, segundos = 30) => {
    detenerAutoRefresco();

    console.log(`[Sistema] Auto-refresco activado cada ${segundos}s`);
    intervaloGlobal = setInterval(async () => {
        console.log('[Sistema] Sincronizando datos...');
        await callback();
    }, segundos * 1000);
};

export const detenerAutoRefresco = () => {
    if (intervaloGlobal) {
        clearInterval(intervaloGlobal);
        intervaloGlobal = null;
        console.log('[Sistema] Auto-refresco desactivado.');
    }
};

export const cargarHTML = (rutaHTML, callback) => {
    detenerAutoRefresco();
    console.log(`[Navegación] Limpiando procesos para cargar: ${rutaHTML}`);
    const cuerpo = document.getElementById('cuerpo');
    fetch(rutaHTML)
        .then((res) => res.text())
        .then((html) => {
            cuerpo.innerHTML = html;

            const contenido = cuerpo.querySelector('.contenido');

            if (contenido) {
                if (getComputedStyle(contenido).display !== 'flex') {
                    contenido.style.display = 'flex';
                }

                if (rutaHTML.includes('mesas')) {
                    contenido.style.flexDirection = 'column';
                } else if (rutaHTML.includes('admin-productos')) {
                    contenido.style.flexDirection = 'column';
                } else if (rutaHTML.includes('productos')) {
                    contenido.style.flexDirection = 'row';
                }
            }

            if (typeof callback === 'function') callback();
        })
        .catch((err) => console.error('Error cargando HTML:', err));
};

export const activarMenu = (id) => {
    document.querySelectorAll('.menu-item, .menu-link').forEach((i) => i.classList.remove('active'));
    const item = document.getElementById(id);
    if (item) {
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
        titleEl.style.color = esError ? '#ff5a5e' : '#2e7d32';
    }
    if (msgEl) msgEl.textContent = mensaje;

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

    if (modal) {
        modal.classList.remove('custom-modal-visible');
        modal.classList.add('custom-modal-hidden');
    }

    const algunModalAbierto = document.querySelector('.custom-modal-visible');
    if (!algunModalAbierto && overlay) {
        overlay.classList.remove('modal-overlay-visible');
        overlay.classList.add('modal-overlay-hidden');
    }
};
