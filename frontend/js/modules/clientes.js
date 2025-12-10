import { authFetch } from '../api.js';
import { cargarHTML } from '../utils.js';


export const cargarClienteNuevoPage = (callbackReturn) => {
    cargarHTML("../html/cliente-nuevo.html", () => initClienteNuevo(callbackReturn));
};

const initClienteNuevo = (callbackReturn) => {
    const btnGuardar = document.getElementById('btn-guardar-cliente');
    const btnCancelar = document.getElementById('btn-cancelar-cliente');

    if (btnCancelar) {
        btnCancelar.addEventListener('click', () => {
            if (callbackReturn) callbackReturn();
        });
    }

    if (btnGuardar) {
        btnGuardar.addEventListener('click', async () => {
            const nombre = document.getElementById('new-nombre').value;
            const ci = document.getElementById('new-ci').value;
            const telf = document.getElementById('new-telf').value;

            if (!nombre) return alert("El nombre es obligatorio.");

            try {
                const res = await authFetch('/clientes', {
                    method: 'POST',
                    body: JSON.stringify({
                        nombre: nombre,
                        ci: ci,
                        telefono: telf
                    })
                });

                if (res.ok) {
                    alert("Cliente creado exitosamente.");

                    if (callbackReturn) callbackReturn();
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
};