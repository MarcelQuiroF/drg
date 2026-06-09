import { authFetch } from '../api.js';
import { activarMenu, cargarHTML, iniciarAutoRefresco } from '../utils.js';
import { cargarProductosPage } from './productos.js'; 

const mapEstadoBackendAFrontend = (estado) => {
    if (estado === 0) return 1; 
    if (estado === 1) return 2; 
    if (estado === 3) return 3;
    return 1; 
};

const obtenerImagenPorEstado = (estadoFront) => ({
    1: '../assets/imágenes/imagenMesa.svg',
    2: '../assets/imágenes/imagenMesaBeige.png',
    3: '../assets/imágenes/imagenMesaCeleste.png'
}[estadoFront] || '../assets/imágenes/imagenMesa.svg');

const obtenerEstadoTexto = (estadoFront) => ({
    1: 'Disponible',
    2: 'En uso',
    3: 'Reservado'
}[estadoFront] || 'Desconocido');



export const cargarMesasPage = () => {
    cargarHTML("../html/mesas.html", () => {
        initMesas();
        
        iniciarAutoRefresco(actualizarSoloMesasSilencioso, 15);
    });
};

const actualizarSoloMesasSilencioso = async () => {
    const select = document.querySelector('.dropDownPiso');
    if (!select) return;

    const pisoId = select.value;
    if (pisoId) {
        await cargarMesas(pisoId);
    }
};


export const initMesas = () => {
    cargarPisos(); 
};



const cargarPisos = async () => {
    try {
        const response = await authFetch('/pisos?activo=true');
        if(response && response.ok){
            const pisos = await response.json();
            const select = document.querySelector('.dropDownPiso');

            if(!select) return; 

            select.innerHTML = ''; 
            
            pisos.sort((a,b) => a.numero - b.numero);

            if(pisos.length === 0){
                const option = document.createElement('option');
                option.text = "Sin pisos";
                select.add(option);
                return;
            }

            pisos.forEach(piso => {
                const option = document.createElement('option');
                option.value = piso.id;
                option.text = piso.nombre;
                select.add(option);
            });

            select.value = pisos[0].id;
            cargarMesas(pisos[0].id);

            select.addEventListener('change', (e) => {
                cargarMesas(e.target.value);
            });
        }
    } catch (error) {
        console.error("Error cargando pisos:", error);
    }
};

const cargarMesas = async (pisoId) => {
    try {
        const response = await authFetch(`/mesas?piso_id=${pisoId}&activo=true`);
        if(response && response.ok){
            const mesas = await response.json();
            renderizarMesas(mesas);
        }
    } catch (error) {
        console.error("Error cargando mesas:", error);
    }
};

const actualizarContadoresMesas = (mesas) => {
    const estados = mesas.map(m => mapEstadoBackendAFrontend(m.estado));
    const conteos = estados.reduce((acc, est) => { 
        acc[est] = (acc[est]||0)+1; 
        return acc; 
    }, {1:0, 2:0, 3:0});

    const etiquetas = ["RESERVADAS", "EN USO", "DISPONIBLE"];
    const contenedores = document.querySelectorAll('.cabezeraCuerpo .informacion .contenedorMesa p');
    
    if(contenedores.length >= 3){
        contenedores[0].textContent = `RESERVADAS: ${conteos[3]}`; 
        contenedores[1].textContent = `EN USO: ${conteos[2]}`; 
        contenedores[2].textContent = `DISPONIBLES: ${conteos[1]}`; 
    }
};

const renderizarMesas = (mesas) => {
    const container = document.getElementById('mesas-container');
    if(!container) return;
    
    container.innerHTML = '';
    actualizarContadoresMesas(mesas);

    if(mesas.length === 0){
        container.innerHTML = `<p style="padding:20px;text-align:center;color:#777;">No hay mesas en este piso.</p>`;
        return;
    }

    mesas.forEach(mesa => {
        const estadoVisual = mapEstadoBackendAFrontend(mesa.estado);
        const mesaDiv = document.createElement('div');
        
        mesaDiv.className = `mesa-card estado-${estadoVisual}`;
        mesaDiv.id = `mesa-${mesa.id}`;

        const reservasFuturas = mesa.Reservas || [];
        let relojHTML = '';

        if (reservasFuturas.length > 0) {
            const listaHoras = reservasFuturas.map(res => {
                const d = new Date(res.hora);
                return `• ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
            }).join('\n');

            relojHTML = `
                <div class="mesa-reloj-container" data-tooltip="Próximas Reservas:\n${listaHoras}">
                    <i class="fa-solid fa-clock-rotate-left"></i>
                </div>
            `;
        }

        mesaDiv.innerHTML = `
            <div class="mesa-header">
                <span>${obtenerEstadoTexto(estadoVisual)}</span>
                ${relojHTML}
            </div>
            <div class="mesa-cuerpo">
                <img src="${obtenerImagenPorEstado(estadoVisual)}" alt="Mesa ${mesa.id}" class="mesa-icono">
            </div>
            <div class="mesa-footer">
                <p class="mesa-nombre">Mesa ${mesa.numero}</p>
                <div class="mesa-capacidad">
                    <img src="../assets/íconos/iconoUsuario.png" alt="Capacidad" class="icono-persona">
                    <span class="capacidad-texto">${mesa.cantidadMaxima}</span>
                </div>
            </div>
        `;

        mesaDiv.addEventListener('click', () => {
             sessionStorage.setItem("mesaSeleccionada", mesa.id); 
             activarMenu('menu-productos');
             cargarProductosPage(mesa.id);
        });

        container.appendChild(mesaDiv);
    });
};