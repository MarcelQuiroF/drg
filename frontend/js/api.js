import { mostrarNotificacion } from './utils.js';

export const API_URL = '/api/v1';

export function getToken() {
    return localStorage.getItem('token_drg');
}

const RUTA_LOGIN = '/html/login.html';

// Una petición que no termina: se devuelve mientras el navegador va al login, para que la vista
// que llamó no siga y no muestre errores de una pantalla que ya se está cerrando.
const sinRespuesta = () => new Promise(() => {});

// Reglas de sesión para todas las respuestas de la API (#26):
// - 401: la sesión no vale (sin token, token inválido o vencido). Se borra la sesión y se vuelve
//   al login con el motivo, que login.js muestra.
// - 403: la sesión vale, pero el rol no tiene permiso. Se avisa y la vista decide qué hacer.
// Devuelve la misma respuesta, o una promesa que no termina si hay que ir al login.
export async function manejarSesion(response) {
    if (response.status === 401) {
        const cuerpo = await response.json().catch(() => ({}));
        localStorage.removeItem('token_drg');
        localStorage.removeItem('usuario_rol');
        sessionStorage.setItem('aviso_login', cuerpo.message || 'La sesión terminó. Vuelva a iniciar sesión.');
        window.location.href = RUTA_LOGIN;
        return sinRespuesta();
    }

    if (response.status === 403) {
        const cuerpo = await response
            .clone()
            .json()
            .catch(() => ({}));
        mostrarNotificacion('Sin permiso', cuerpo.message || 'Tu rol no tiene permiso para esta acción.');
    }

    return response;
}

export async function authFetch(endpoint, options = {}) {
    const token = getToken();

    if (!token) {
        window.location.href = RUTA_LOGIN;
        return sinRespuesta();
    }

    // Con un FormData (subir un Excel) el navegador pone el Content-Type con su separador
    const esFormData = options.body instanceof FormData;
    const headers = {
        ...(esFormData ? {} : { 'Content-Type': 'application/json' }),
        Authorization: `Bearer ${token}`,
        ...options.headers
    };

    const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers
    });

    return manejarSesion(response);
}
