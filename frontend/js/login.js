import { API_URL } from './api.js';

const loginForm = document.getElementById('loginForm');

const fechaHoy = new Date().toISOString().split('T')[0];
const cierreGuardado = localStorage.getItem('dia_cerrado');

if (cierreGuardado === fechaHoy) {
    window.location.href = 'cerrado.html';
}




if(loginForm){
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