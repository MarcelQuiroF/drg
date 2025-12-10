import { authFetch, API_URL } from '../api.js'; 
import { cargarHTML } from '../utils.js';


let listaIdsPorAprobar = [];

export const cargarAsistenciaPage = () => {
    cargarHTML("../html/asistencia.html", initAsistencia);
};


const initAsistencia = async () => {
    const contenedor = document.getElementById('lista-asistencias');
    const template = document.getElementById('template-asistencia-card');
    const btnConfirmarLote = document.getElementById('btn-confirmar-lote');
    
    const txtHorario = document.getElementById('txt-horario-hoy');
    if (txtHorario) {
        try {
            const resHorario = await authFetch('/asistencias/horario-hoy');
            if (resHorario.ok) {
                const data = await resHorario.json();
                if (data.hora_entrada) {

                    const entrada = data.hora_entrada.slice(0, 5);
                    const salida = data.hora_salida.slice(0, 5);
                    txtHorario.textContent = `${entrada} - ${salida}`;
                } else {
                    txtHorario.textContent = "Día Libre";
                }
            }
        } catch (e) {
            console.error("Error cargando horario", e);
            txtHorario.textContent = "--:--";
        }
    }
    
    if(!contenedor) return;


    listaIdsPorAprobar = [];
    if(btnConfirmarLote) btnConfirmarLote.style.display = 'none';

    contenedor.innerHTML = '<p style="padding:10px; color: white;">Cargando...</p>';

    try {
        const response = await authFetch('/asistencias');
        if (response.ok) {
            const asistencias = await response.json();
            renderizarAsistencias(contenedor, template, asistencias);
        } else {
            contenedor.innerHTML = '<p style="padding:10px; color: white;">Error cargando datos.</p>';
        }
    } catch (error) {
        console.error(error);
        contenedor.innerHTML = '<p style="padding:10px; color: white;">Error de conexión.</p>';
    }


    document.getElementById('btn-ir-registro')?.addEventListener('click', cargarAsistenciaRegistroPage);
    document.getElementById('btn-refrescar')?.addEventListener('click', initAsistencia);

    if(btnConfirmarLote){
        btnConfirmarLote.addEventListener('click', () => {
            if(listaIdsPorAprobar.length > 0){
                cargarAdminReauthPage();
            }
        });
    }
};

const renderizarAsistencias = (contenedor, template, asistencias) => {
    contenedor.innerHTML = '';
    const btnConfirmarLote = document.getElementById('btn-confirmar-lote');

    if (asistencias.length === 0) {
        contenedor.innerHTML = '<p style="padding:20px; color: white;">No hay registros hoy.</p>';
        return;
    }

    asistencias.forEach(asistencia => {
        const clon = template.content.cloneNode(true);
        
        // Datos básicos
        const nombre = asistencia.Empleado ? asistencia.Empleado.nombre : 'Desconocido';
        clon.querySelector('.nombre-empleado').textContent = nombre;

        const fechaObj = new Date(asistencia.fecha);
        const horaStr = fechaObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        const spanHora = clon.querySelector('.hora-llegada');
        spanHora.textContent = horaStr;


        if (asistencia.descuento_id) {
            spanHora.style.color = '#ff5a5e';
            spanHora.title = "Con atraso";
        }


        const checkbox = clon.querySelector('.check-aprobar'); 
        
        if (asistencia.aprobado) {
            checkbox.checked = true;
            checkbox.disabled = true; 
        } else {

            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    listaIdsPorAprobar.push(asistencia.id);
                } else {
                    listaIdsPorAprobar = listaIdsPorAprobar.filter(id => id !== asistencia.id);
                }

                if(btnConfirmarLote){
                    if (listaIdsPorAprobar.length > 0) {
                        btnConfirmarLote.style.display = 'inline-block';
                        btnConfirmarLote.textContent = `Confirmar (${listaIdsPorAprobar.length})`;
                    } else {
                        btnConfirmarLote.style.display = 'none';
                    }
                }
            });
        }

        contenedor.appendChild(clon);
    });
};

const cargarAsistenciaRegistroPage = () => {
    cargarHTML("../html/asistencia-registro.html", initAsistenciaRegistro);
};

const initAsistenciaRegistro = () => {
    const btnConfirmar = document.getElementById('btn-marcar-asistencia');
    const btnAtras = document.getElementById('btn-volver-asistencia');

    if(btnAtras) {
        btnAtras.addEventListener('click', cargarAsistenciaPage);
    }

    if(btnConfirmar) {
        btnConfirmar.addEventListener('click', async () => {
            const ci = document.getElementById('ci-input').value;
            const pass = document.getElementById('contrasena-input').value;

            if(!ci || !pass) return alert("Complete los campos");

            try {
                const response = await fetch(`${API_URL}/asistencias/marcar`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ci: ci, contrasenia: pass })
                });

                const data = await response.json();

                if(response.ok) {
                    alert("" + data.message);
                    cargarAsistenciaPage(); 
                } else {
                    alert("Error: " + (data.message || "Credenciales incorrectas"));
                }

            } catch (error) {
                console.error(error);
                alert("Error de conexión con el servidor.");
            }
        });
    }
};

const cargarAdminReauthPage = () => {
    cargarHTML("../html/admin-reauth.html", initAdminReauth);
};

const initAdminReauth = () => {
    const btnValidar = document.getElementById('btn-validar-admin');
    const btnCancelar = document.getElementById('btn-cancelar-auth');

    if(btnCancelar) {
        btnCancelar.addEventListener('click', cargarAsistenciaPage);
    }

    if(btnValidar) {
        btnValidar.addEventListener('click', async () => {
            const ci = document.getElementById('admin-ci').value;
            const pass = document.getElementById('admin-pass').value;

            if(!ci || !pass) return alert("Ingrese sus credenciales de Admin");

            try {
                const resLogin = await fetch(`${API_URL}/auth/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ci: ci, contrasenia: pass })
                });

                const dataLogin = await resLogin.json();

                if(!resLogin.ok || dataLogin.empleado.rol !== 'ADMIN') {
                    return alert("Error: Credenciales inválidas o no es Administrador.");
                }

                const promesas = listaIdsPorAprobar.map(id => 
                    authFetch(`/asistencias/${id}/aprobar`, { method: 'PATCH' })
                );

                await Promise.all(promesas);

                alert("Aprobaciones registradas correctamente.");
                cargarAsistenciaPage(); 

            } catch (error) {
                console.error(error);
                alert("Error de conexión durante la autorización.");
            }
        });
    }
};