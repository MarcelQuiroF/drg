import { API_URL } from './api.js';
import { fechaLocalISO } from './utils.js';

const loginForm = document.getElementById('loginForm');

// Motivo por el que se volvió al login (sesión vencida o token inválido, #26), puesto por api.js
const avisoLogin = sessionStorage.getItem('aviso_login');
const avisoEl = document.getElementById('aviso-login');
if (avisoLogin && avisoEl) {
    avisoEl.textContent = avisoLogin;
    avisoEl.hidden = false;
}
sessionStorage.removeItem('aviso_login');

const fechaHoy = fechaLocalISO(); // el día en Bolivia, no en UTC (#27)
const cierreGuardado = localStorage.getItem('dia_cerrado');

if (cierreGuardado === fechaHoy) {
    window.location.href = 'cerrado.html';
}

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const ci = document.getElementById('ci').value;
        const contrasenia = document.getElementById('password').value;

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ci, contrasenia })
            });

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem('token_drg', data.token);
                const rolUsuario = data.empleado.rol;
                localStorage.setItem('usuario_rol', rolUsuario);

                if (rolUsuario === 'ADMIN') {
                    window.location.href = '/html/indexAdmin.html';
                } else {
                    window.location.href = '/html/index.html';
                }
            } else {
                alert(data.message || 'Error al iniciar sesión');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('No se pudo conectar con el servidor. Revisa que el backend esté corriendo.');
        }
    });
}
