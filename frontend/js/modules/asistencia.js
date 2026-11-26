import { authFetch } from '../api.js';
import { mostrarNotificacion, escaparHTML } from '../utils.js';

let relojInterval = null;
let empleadosHoy = [];
let asistenciasHoy = [];
let empleadoSeleccionado = null;
let horarioSeleccionado = null;
let asistenciaAAprobarId = null;
// La misma ventana de firma sirve para aprobar y para anular una asistencia ya aprobada (#30)
let modoFirma = 'aprobar';
let ASISTENCIA_ID_ELIMINAR = null;

const DIAS_SEMANA = ['DOMINGO', 'LUNES', 'MARTES', 'MIERCOLES', 'JUEVES', 'VIERNES', 'SABADO'];

export const cargarAsistenciaPage = async () => {
    iniciarReloj();
    await recargarDatos();
    configurarEventosModales();
    configurarBotonEliminarGlobal();
};

const recargarDatos = async () => {
    await Promise.all([cargarTurnosHoy(), cargarAsistenciasHoy()]);
    renderizarTablas();
};

const iniciarReloj = () => {
    if (relojInterval) clearInterval(relojInterval);
    const actualizarReloj = () => {
        const ahora = new Date();
        const opcionesFecha = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const fechaEl = document.getElementById('fecha-hoy-display');
        if (fechaEl) {
            const f = ahora.toLocaleDateString('es-ES', opcionesFecha);
            fechaEl.textContent = f.charAt(0).toUpperCase() + f.slice(1);
        }
        const relojEl = document.getElementById('reloj-vivo');
        if (relojEl) relojEl.textContent = ahora.toLocaleTimeString('es-ES', { hour12: false });
    };
    actualizarReloj();
    relojInterval = setInterval(actualizarReloj, 1000);
};

const cargarTurnosHoy = async () => {
    const diaActual = DIAS_SEMANA[new Date().getDay()];
    try {
        const res = await authFetch('/empleados');
        if (res.ok) {
            const todos = await res.json();
            empleadosHoy = todos.filter(
                (emp) => emp.activo && emp.Horarios && emp.Horarios.some((h) => h.dia === diaActual)
            );
        }
    } catch (error) {
        mostrarNotificacion('Error', 'Error al cargar empleados.', true);
    }
};

const cargarAsistenciasHoy = async () => {
    try {
        const res = await authFetch('/asistencias/hoy');
        if (res.ok) asistenciasHoy = await res.json();
    } catch (error) {
        console.error('Error al cargar asistencias de hoy.', error);
    }
};

const renderizarTablas = () => {
    const tbodyTurnos = document.getElementById('turnos-tbody');
    const tbodyRegistros = document.getElementById('registros-tbody');
    if (!tbodyTurnos || !tbodyRegistros) return;

    tbodyTurnos.innerHTML = '';
    tbodyRegistros.innerHTML = '';

    const diaActual = DIAS_SEMANA[new Date().getDay()];
    let contadorTurnos = 0;

    empleadosHoy.forEach((emp) => {
        const yaRegistro = asistenciasHoy.find((a) => a.empleado_id === emp.id);
        if (yaRegistro) return;

        const horarioHoy = emp.Horarios.find((h) => h.dia === diaActual);
        if (!horarioHoy) return;

        contadorTurnos++;
        const tr = document.createElement('tr');
        // El atraso lo calcula el servidor al registrar la llegada (RN-01, #29), no el navegador
        const estadoHTML = '<span class="status-badge status-ontime">Pendiente</span>';

        tr.innerHTML = `
            <td><strong>${escaparHTML(emp.nombre)}</strong></td>
            <td>${escaparHTML(emp.rol)}</td>
            <td>${escaparHTML(horarioHoy.hora_entrada.substring(0, 5))}</td>
            <td>${estadoHTML}</td>
            <td><button class="btn-primary btn-registrar-llegada">Registrar</button></td>
        `;
        tr.querySelector('.btn-registrar-llegada').onclick = () => abrirModalAsistencia(emp, horarioHoy);
        tbodyTurnos.appendChild(tr);
    });

    if (contadorTurnos === 0) {
        tbodyTurnos.innerHTML =
            '<tr><td colspan="5" style="text-align:center; padding: 20px; color: #888;">No hay turnos pendientes.</td></tr>';
    }

    if (asistenciasHoy.length === 0) {
        tbodyRegistros.innerHTML =
            '<tr><td colspan="6" style="text-align:center; padding: 20px; color: #888;">Aún no hay asistencias registradas hoy.</td></tr>';
    } else {
        asistenciasHoy.forEach((asist) => {
            const tr = document.createElement('tr');

            let colorEstado = '#3730a3';
            if (asist.estado === 'FALTA') colorEstado = '#dc2626';
            if (asist.estado === 'PERMISO') colorEstado = '#d97706';

            const descuentoAtrasoHTML = etiquetaDescuento(asist.DescuentoAtraso);
            const estadoHTML = `<span style="font-weight: bold; color: ${escaparHTML(colorEstado)}">${escaparHTML(asist.estado)}</span>${descuentoAtrasoHTML}`;

            const checkIconHTML = asist.aprobado
                ? '<i class="fa-solid fa-circle-check status-aprobado" title="Aprobado"></i>'
                : '<i class="fa-solid fa-clock status-pendiente" title="Pendiente de aprobación"></i>';

            const btnAprobarHTML = asist.aprobado
                ? `<span style="color: #16a34a; font-size: 0.9em; margin-right: 5px;">Aprobado</span>`
                : `<button class="btn-aprobar" data-id="${Number(asist.id)}">Aprobar</button>`;

            tr.innerHTML = `
                <td><strong>${escaparHTML(asist.Empleado?.nombre || 'Desconocido')}</strong></td>
                <td>${escaparHTML(asist.Empleado?.rol || '-')}</td>
                <td>${escaparHTML(asist.Horario ? asist.Horario.hora_entrada.substring(0, 5) : '-')}</td>
                <td>${estadoHTML}</td>
                <td style="text-align:center;">${checkIconHTML}</td>
                <td>
                    ${btnAprobarHTML}
                    <button class="btn-eliminar" data-id="${Number(asist.id)}" title="Anular registro"><i class="fa-solid fa-xmark"></i></button>
                </td>
            `;

            if (!asist.aprobado) {
                tr.querySelector('.btn-aprobar').onclick = () => abrirModalAprobar(asist.id);
            }

            tr.querySelector('.btn-eliminar').onclick = () =>
                asist.aprobado
                    ? abrirModalFirma(asist.id, 'anular')
                    : prepararEliminacion(asist.id, asist.Empleado?.nombre || 'Desconocido');

            tbodyRegistros.appendChild(tr);
        });
    }
};

// Lo que calculó el servidor (RN-01, #29): el navegador solo lo muestra
export const textoAtraso = (atraso) => {
    if (!atraso || !atraso.segundos) return 'Llegada registrada a tiempo.';
    const minutos = `${Number(atraso.minutos)} min de atraso`;
    return atraso.descuento_porcentual
        ? `Llegada registrada con ${minutos}: descuento de ${Number(atraso.descuento_porcentual)} % del pago del día.`
        : `Llegada registrada con ${minutos}, sin descuento.`;
};

const etiquetaDescuento = (descuento) =>
    descuento && descuento.descuento_porcentual
        ? ` <span class="status-badge status-late">−${Number(descuento.descuento_porcentual)} %</span>`
        : '';

const abrirModalAsistencia = (empleado, horario) => {
    empleadoSeleccionado = empleado;
    horarioSeleccionado = horario;
    // RF-43 (#30): la llegada la confirma el propio empleado con su CI y contraseña
    document.getElementById('asistencia-ci').value = '';
    document.getElementById('asistencia-contrasenia').value = '';
    const ahora = new Date();

    document.getElementById('modal-emp-nombre').textContent = empleado.nombre;
    document.getElementById('modal-emp-esperada').textContent = horario.hora_entrada.substring(0, 5);
    document.getElementById('modal-emp-llegada').textContent = ahora.toLocaleTimeString('es-ES', { hour12: false });

    abrirCerrarModal('modal-asistencia', true);
};

const TEXTOS_FIRMA = {
    aprobar: {
        titulo: 'Aprobar Registro',
        texto: 'Ingresa tus credenciales de Administrador o Cajero para validar este registro.',
        boton: 'Aprobar'
    },
    anular: {
        titulo: 'Anular Registro Aprobado',
        texto: 'Esta asistencia ya está aprobada: para anularla, firma con tus credenciales de Administrador o Cajero. El registro queda guardado como anulado.',
        boton: 'Anular'
    }
};

const abrirModalFirma = (id, modo) => {
    asistenciaAAprobarId = id;
    modoFirma = modo;
    document.getElementById('modal-aprobar-titulo').textContent = TEXTOS_FIRMA[modo].titulo;
    document.getElementById('modal-aprobar-texto').textContent = TEXTOS_FIRMA[modo].texto;
    document.getElementById('btn-firmar-aprobar').textContent = TEXTOS_FIRMA[modo].boton;
    document.getElementById('admin-ci').value = '';
    document.getElementById('admin-password').value = '';
    abrirCerrarModal('modal-aprobar', true);
};

const abrirModalAprobar = (id) => abrirModalFirma(id, 'aprobar');

const prepararEliminacion = (id, nombre) => {
    ASISTENCIA_ID_ELIMINAR = id;

    const modal = document.getElementById('delete-modal');
    const overlay = document.getElementById('modal-overlay');

    document.getElementById('delete-modal-message').innerHTML =
        `¿Anular el registro de asistencia de <strong>${escaparHTML(nombre)}</strong>?<br><small>El empleado regresará a la lista de turnos pendientes. El registro queda guardado como anulado.</small>`;

    if (modal && overlay) {
        overlay.classList.remove('modal-overlay-hidden');
        overlay.classList.add('modal-overlay-visible');
        modal.classList.remove('custom-modal-hidden');
        modal.classList.add('custom-modal-visible');
    }
};

const abrirCerrarModal = (modalId, abrir) => {
    const modal = document.getElementById(modalId);
    const overlay = document.getElementById('modal-overlay');
    if (modal && overlay) {
        if (abrir) {
            overlay.classList.remove('modal-overlay-hidden');
            overlay.classList.add('modal-overlay-visible');
            modal.classList.remove('custom-modal-hidden');
            modal.classList.add('custom-modal-visible');
        } else {
            modal.classList.remove('custom-modal-visible');
            modal.classList.add('custom-modal-hidden');

            const algunModalAbierto = document.querySelector('.custom-modal-visible');
            if (!algunModalAbierto) {
                overlay.classList.remove('modal-overlay-visible');
                overlay.classList.add('modal-overlay-hidden');
            }
        }
    }
};

const cerrarModalEliminarGlobal = () => {
    const modal = document.getElementById('delete-modal');
    const overlay = document.getElementById('modal-overlay');
    if (modal && overlay) {
        modal.classList.remove('custom-modal-visible');
        modal.classList.add('custom-modal-hidden');

        const algunModalAbierto = document.querySelector('.custom-modal-visible');
        if (!algunModalAbierto) {
            overlay.classList.remove('modal-overlay-visible');
            overlay.classList.add('modal-overlay-hidden');
        }
    }
    ASISTENCIA_ID_ELIMINAR = null;
};

const configurarEventosModales = () => {
    document
        .getElementById('btn-cerrar-asistencia')
        ?.addEventListener('click', () => abrirCerrarModal('modal-asistencia', false));

    document.getElementById('form-asistencia')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            empleado_id: empleadoSeleccionado.id,
            ci: document.getElementById('asistencia-ci').value.trim(),
            contrasenia: document.getElementById('asistencia-contrasenia').value,
            horario_id: horarioSeleccionado ? horarioSeleccionado.id : null,
            estado: document.getElementById('asistencia-estado').value
        };

        try {
            const res = await authFetch('/asistencias', { method: 'POST', body: JSON.stringify(payload) });
            if (res.ok) {
                const { atraso } = await res.json();
                mostrarNotificacion('Éxito', textoAtraso(atraso), false);
                abrirCerrarModal('modal-asistencia', false);
                await recargarDatos();
            } else {
                const err = await res.json();
                mostrarNotificacion('Error', err.message || 'Error al registrar.', true);
            }
        } catch (e) {
            mostrarNotificacion('Error', 'Fallo de conexión.', true);
        }
    });

    document
        .getElementById('btn-cerrar-aprobar')
        ?.addEventListener('click', () => abrirCerrarModal('modal-aprobar', false));

    document.getElementById('form-aprobar')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const payload = {
            ci: document.getElementById('admin-ci').value,
            contrasenia: document.getElementById('admin-password').value
        };

        const anular = modoFirma === 'anular';
        try {
            const res = await authFetch(
                anular ? `/asistencias/${asistenciaAAprobarId}` : `/asistencias/${asistenciaAAprobarId}/aprobar`,
                { method: anular ? 'DELETE' : 'PUT', body: JSON.stringify(payload) }
            );

            if (res.ok) {
                mostrarNotificacion(
                    anular ? 'Anulado' : 'Aprobado',
                    anular ? 'La asistencia quedó anulada.' : 'La asistencia ha sido aprobada.',
                    false
                );
                abrirCerrarModal('modal-aprobar', false);
                await recargarDatos();
            } else {
                const err = await res.json();
                mostrarNotificacion('Error', err.message || 'Credenciales incorrectas.', true);
            }
        } catch (e) {
            mostrarNotificacion('Error', 'Fallo de conexión al aprobar.', true);
        }
    });
};

const configurarBotonEliminarGlobal = () => {
    const closeDeleteBtn = document.getElementById('close-delete-modal');
    if (closeDeleteBtn) {
        const newCloseBtn = closeDeleteBtn.cloneNode(true);
        closeDeleteBtn.parentNode.replaceChild(newCloseBtn, closeDeleteBtn);
        newCloseBtn.addEventListener('click', cerrarModalEliminarGlobal);
    }

    const deleteConfirmBtn = document.getElementById('btn-confirm-delete');
    if (deleteConfirmBtn) {
        const newConfirmBtn = deleteConfirmBtn.cloneNode(true);
        deleteConfirmBtn.parentNode.replaceChild(newConfirmBtn, deleteConfirmBtn);

        newConfirmBtn.addEventListener('click', async () => {
            if (!ASISTENCIA_ID_ELIMINAR) return;

            try {
                const res = await authFetch(`/asistencias/${ASISTENCIA_ID_ELIMINAR}`, { method: 'DELETE' });
                if (res.ok) {
                    mostrarNotificacion('Anulado', 'Registro anulado correctamente.', false);
                    cerrarModalEliminarGlobal();
                    await recargarDatos();
                } else {
                    const err = await res.json().catch(() => ({}));
                    mostrarNotificacion('Error', err.message || 'No se pudo anular el registro.', true);
                }
            } catch (e) {
                mostrarNotificacion('Error', 'Fallo de conexión.', true);
            }
        });
    }
};
