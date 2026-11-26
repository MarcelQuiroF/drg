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

// Fechas y horas en la zona del negocio (#27), la misma que usa el servidor. Se fija la zona en
// lugar de usar la del navegador para que un celular o una PC mal configurados no cambien el día.
// No usar toISOString().split('T')[0]: da la fecha en UTC y en Bolivia desde las 20:00 ya es
// mañana.
export const ZONA_HORARIA = 'America/La_Paz';

const partesLocales = (fecha) => {
    const formato = new Intl.DateTimeFormat('en-US', {
        timeZone: ZONA_HORARIA,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h23'
    });
    return Object.fromEntries(formato.formatToParts(new Date(fecha)).map((p) => [p.type, p.value]));
};

// 'YYYY-MM-DD' (el formato de <input type="date">) del día en Bolivia. Por defecto, hoy.
export const fechaLocalISO = (fecha = new Date()) => {
    const p = partesLocales(fecha);
    return `${p.year}-${p.month}-${p.day}`;
};

// 'HH:mm' (el formato de <input type="time">) de la hora en Bolivia.
export const horaLocal = (fecha = new Date()) => {
    const p = partesLocales(fecha);
    return `${p.hour}:${p.minute}`;
};

// Suma (o resta) días a una fecha 'YYYY-MM-DD'. Se calcula sobre la fecha, no sobre la hora,
// así que no lo afectan la zona horaria ni la hora del día.
export const sumarDias = (fechaISO, dias) => {
    const [anio, mes, dia] = fechaISO.split('-').map(Number);
    return new Date(Date.UTC(anio, mes - 1, dia + dias)).toISOString().slice(0, 10);
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

// Fotos de productos y juegos (#96): una sola carpeta y una sola función para las tres pantallas
// que las muestran (POS, panel del admin y catálogo de clientes). Antes el catálogo las buscaba en
// assets/productos/ y el POS y el admin en assets/imagenes/: la misma foto se veía en un lado y
// daba 404 en el otro. assets/productos/ queda solo para las imágenes por defecto.
export const CARPETA_IMAGENES = '../assets/imagenes/';

// imagen: lo que guarda la base (un nombre de archivo, una URL, una ruta o una imagen data:).
// porDefecto: la imagen a usar si no hay ninguna.
export function rutaImagen(imagen, porDefecto) {
    const valor = String(imagen ?? '').trim();
    if (!valor) return porDefecto;
    // Imagen subida desde el panel (data:image/…), URL externa o ruta ya armada: se usa tal cual
    if (/^(data:image\/|https?:\/\/)/i.test(valor) || valor.startsWith('.') || valor.startsWith('/')) return valor;
    // Un nombre de archivo: va a la carpeta de fotos (codificado por si tiene espacios)
    return CARPETA_IMAGENES + encodeURIComponent(valor);
}
