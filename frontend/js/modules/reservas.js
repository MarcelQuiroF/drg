import { authFetch } from '../api.js';
import { cargarHTML } from '../utils.js';
import { cargarClienteNuevoPage } from './clientes.js';


export const cargarReservasPage = () => {
    cargarHTML("../html/reservar.html", initReservas);
};

const initReservas = async () => {
    const tbody = document.querySelector('.tabla-reserva tbody');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Cargando...</td></tr>';

    try {
        const response = await authFetch('/reservas');
        if (response.ok) {
            const reservas = await response.json();
            renderizarReservas(tbody, reservas);
        } else {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Error cargando reservas.</td></tr>';
        }
    } catch (error) {
        console.error("Error:", error);
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Error de conexión.</td></tr>';
    }

    const btnNueva = document.getElementById('btn-nueva-reserva');
    if(btnNueva){
        btnNueva.addEventListener('click', () => cargarFormularioReserva()); // Modo Crear
    }
};

const renderizarReservas = (tbody, reservas) => {
    tbody.innerHTML = '';

    if (reservas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">No hay reservas actuales.</td></tr>';
        return;
    }

    reservas.forEach(reserva => {
        const tr = document.createElement('tr');
        
        const d = new Date(reserva.hora);
        const dia = d.getDate().toString().padStart(2, '0');
        const mes = (d.getMonth() + 1).toString().padStart(2, '0');
        const fechaStr = `${dia}-${mes}`;
        const horaStr = d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

        tr.innerHTML = `
            <td>
                ${reserva.Cliente ? reserva.Cliente.nombre : 'Cliente ???'}
                <span class="icono-lapiz btn-editar-reserva" style="cursor:pointer; margin-left:10px;">&#9998;</span>
            </td>
            <td>${fechaStr}</td>
            <td>${horaStr}</td>
            <td>${reserva.Mesa ? reserva.Mesa.numero : '?'}</td>
        `;


        const btnEditar = tr.querySelector('.btn-editar-reserva');
        btnEditar.addEventListener('click', () => {
            cargarFormularioReserva(reserva.id);
        });

        tbody.appendChild(tr);
    });
};


const cargarFormularioReserva = (idReserva = null) => {
    cargarHTML("../html/reserva-agregar.html", () => initFormularioReserva(idReserva));
};

const initFormularioReserva = async (idReserva) => {

    if (idReserva) {
        document.querySelector('.tituloCabecera p').textContent = "Editar Reserva";
    }

    await cargarSelectores();


    if (idReserva) {
        try {
            const res = await authFetch(`/reservas/${idReserva}`);
            if (res.ok) {
                const data = await res.json();
                
                document.getElementById('cliente-select').value = data.cliente_id;
                document.getElementById('mesa-select').value = data.mesa_id;

                const fechaObj = new Date(data.hora);

                const yyyy = fechaObj.getFullYear();
                const mm = String(fechaObj.getMonth() + 1).padStart(2, '0');
                const dd = String(fechaObj.getDate()).padStart(2, '0');
                
                document.getElementById('fecha').value = `${yyyy}-${mm}-${dd}`;
                
                const hh = String(fechaObj.getHours()).padStart(2, '0');
                const min = String(fechaObj.getMinutes()).padStart(2, '0');
                document.getElementById('hora').value = `${hh}:${min}`;
            }
        } catch (e) { console.error(e); }
    }

    const btnCrearCliente = document.getElementById('btn-crear-cliente');
    if (btnCrearCliente) {
        btnCrearCliente.addEventListener('click', () => {
            cargarClienteNuevoPage(() => cargarFormularioReserva(idReserva)); // Volver al mismo estado
        });
    }

    const btnConfirmar = document.querySelector('.confirmar');
    if (btnConfirmar) {
        btnConfirmar.textContent = idReserva ? "Actualizar" : "Guardar Reserva";
        
        btnConfirmar.addEventListener('click', async () => {
            const clienteId = document.getElementById('cliente-select').value;
            const mesaId = document.getElementById('mesa-select').value;
            const fechaVal = document.getElementById('fecha').value;
            const horaVal = document.getElementById('hora').value;

            if (!clienteId || !mesaId || !fechaVal || !horaVal) {
                return alert("Todos los campos son obligatorios.");
            }

            const fechaHoraISO = `${fechaVal}T${horaVal}:00`;
            const payload = {
                cliente_id: clienteId,
                mesa_id: mesaId,
                hora: fechaHoraISO
            };

            try {
                let res;
                if (idReserva) {
                    res = await authFetch(`/reservas/${idReserva}`, {
                        method: 'PUT',
                        body: JSON.stringify(payload)
                    });
                } else {
                    res = await authFetch('/reservas', {
                        method: 'POST',
                        body: JSON.stringify(payload)
                    });
                }

                if (res.ok) {
                    alert(idReserva ? "Reserva actualizada." : "Reserva creada.");
                    cargarReservasPage();
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

    const btnAtras = document.querySelector('.atras');
    if (btnAtras) {
        btnAtras.addEventListener('click', cargarReservasPage);
    }
};

async function cargarSelectores() {
    const selectCliente = document.getElementById('cliente-select');
    const selectMesa = document.getElementById('mesa-select');

    try {
        const [resClientes, resMesas] = await Promise.all([
            authFetch('/clientes'),
            authFetch('/mesas')
        ]);

        if (resClientes.ok && selectCliente) {
            const clientes = await resClientes.json();
            clientes.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.text = c.nombre;
                selectCliente.add(opt);
            });
        }

        if (resMesas.ok && selectMesa) {
            const mesas = await resMesas.json();
            mesas.sort((a,b) => a.numero - b.numero);
            mesas.forEach(m => {
                const opt = document.createElement('option');
                opt.value = m.id;
                opt.text = `${m.nombre} (Nº ${m.numero})`;
                selectMesa.add(opt);
            });
        }
    } catch (e) { console.error("Error cargando selectores", e); }
}