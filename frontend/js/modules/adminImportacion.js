import { authFetch } from '../api.js';
import { mostrarNotificacion } from '../utils.js';

export const initAdminImportacion = async () => {
    await cargarCategoriasReferencia();
    configurarFormularios();
};

const cargarCategoriasReferencia = async () => {
    try {
        const res = await authFetch('/categorias');
        if (res.ok) {
            const categorias = await res.json();
            const ul = document.getElementById('lista-categorias-ref');
            ul.innerHTML = '';
            
            categorias.forEach(cat => {
                ul.innerHTML += `
                    <li style="padding: 8px 0; border-bottom: 1px solid #eee; display: flex; justify-content: space-between;">
                        <span style="color: var(--color-text-primary); font-weight: bold;">${cat.nombre}</span>
                        <span style="background: #e2e8f0; color: #333; padding: 2px 8px; border-radius: 12px; font-size: 0.8em;">ID: ${cat.id}</span>
                    </li>
                `;
            });
        }
    } catch (e) {
        console.error("Error cargando categorías:", e);
    }
};

const configurarFormularios = () => {
    document.getElementById('form-import-productos').addEventListener('submit', (e) => {
        e.preventDefault();
        subirExcel('file-productos', '/api/v1/importacion/productos', 'btn-submit-productos');
    });

    document.getElementById('form-import-juegos').addEventListener('submit', (e) => {
        e.preventDefault();
        subirExcel('file-juegos', '/api/v1/importacion/juegos', 'btn-submit-juegos');
    });

    // CORREGIDO: Quitamos el '/api/v1' manual para que lo maneje authFetch
    document.getElementById('btn-plantilla-prod').addEventListener('click', () => {
        descargarArchivoExcel(
            '/importacion/plantillas/productos',
            'Plantilla_Productos.xlsx'
        );
    });

    document.getElementById('btn-plantilla-juegos').addEventListener('click', () => {
        descargarArchivoExcel(
            '/importacion/plantillas/juegos',
            'Plantilla_Juegos.xlsx'
        );
    });
};

const subirExcel = async (inputId, endpoint, btnId) => {
    const input = document.getElementById(inputId);
    const btn = document.getElementById(btnId);
    
    if (input.files.length === 0) return;

    const file = input.files[0];
    const formData = new FormData();
    formData.append('archivoExcel', file);

    const textoOriginal = btn.textContent;
    btn.textContent = "Procesando...";
    btn.disabled = true;

    try {
        const token = localStorage.getItem('token_drg');

        // Utilizamos fetch nativo para omitir el Content-Type
        // y permitir que el navegador gestione el FormData
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const result = await response.json();

        if (response.ok) {
            mostrarNotificacion("¡Éxito!", result.message, false);
            input.value = "";
        } else {
            mostrarNotificacion("Error en la importación", result.message, true);
        }

    } catch (error) {
        mostrarNotificacion(
            "Error",
            "No se pudo conectar con el servidor.",
            true
        );
    } finally {
        btn.textContent = textoOriginal;
        btn.disabled = false;
    }
};

// NUEVA: Función genérica para descargar archivos protegidos con Token
const descargarArchivoExcel = async (endpoint, nombreArchivo) => {
    try {
        const res = await authFetch(endpoint);

        if (res.ok) {
            // Convertimos la respuesta del servidor en un Blob
            const blob = await res.blob();

            // Creamos una URL temporal
            const url = window.URL.createObjectURL(blob);

            // Creamos un enlace invisible y forzamos la descarga
            const a = document.createElement('a');
            a.href = url;
            a.download = nombreArchivo;

            document.body.appendChild(a);
            a.click();
            a.remove();

            // Liberamos memoria
            window.URL.revokeObjectURL(url);
        } else {
            mostrarNotificacion(
                "Error",
                "No se pudo generar la plantilla.",
                true
            );
        }
    } catch (error) {
        mostrarNotificacion(
            "Error",
            "Fallo de conexión al descargar.",
            true
        );
        console.error(error);
    }
};