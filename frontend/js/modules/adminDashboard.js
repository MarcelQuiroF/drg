import { authFetch } from '../api.js';
import { mostrarNotificacion, escaparHTML, fechaLocalISO, sumarDias } from '../utils.js';

let chartIngresosInst = null;
let chartDistribucionInst = null;
let chartOrdenesInst = null;

export const initAdminDashboard = () => {
    establecerFechasPredeterminadas();
    configurarFiltros();
    cargarDatosDashboard();
};

// Nueva función para establecer por defecto la fecha de hoy en ambos inputs
const establecerFechasPredeterminadas = () => {
    const fechaHoyStr = fechaLocalISO(); // Formato requerido por el navegador (#27)

    document.getElementById('fecha-inicio').value = fechaHoyStr;
    document.getElementById('fecha-fin').value = fechaHoyStr;
};

const configurarFiltros = () => {
    const radios = document.querySelectorAll('input[name="rangoTiempo"]');
    const btnFiltrar = document.getElementById('btn-filtrar-dash');
    const inputInicio = document.getElementById('fecha-inicio');
    const inputFin = document.getElementById('fecha-fin');

    const toggleDates = (modo) => {
        const isCustom = modo === 'custom';
        inputInicio.disabled = !isCustom;
        inputFin.disabled = !isCustom;
    };

    toggleDates('semana');

    radios.forEach((r) => {
        r.addEventListener('change', (e) => {
            toggleDates(e.target.value);
            if (e.target.value !== 'custom') {
                cargarDatosDashboard();
            }
        });
    });

    btnFiltrar.addEventListener('click', () => {
        document.querySelector('input[value="custom"]').checked = true;
        toggleDates('custom');
        cargarDatosDashboard();
    });
};

const obtenerRangoFechas = () => {
    const modo = document.querySelector('input[name="rangoTiempo"]:checked').value;
    let inicio = '';
    let fin = '';

    // Los días son de Bolivia (#27), igual que en el servidor
    const hoyStr = fechaLocalISO();
    fin = hoyStr;

    // Hoy y los días anteriores: 7 días en total (antes -7, que eran 8) y 30 días (antes 31, #31)
    if (modo === 'semana') {
        inicio = sumarDias(hoyStr, -6);
    } else if (modo === 'mes') {
        inicio = sumarDias(hoyStr, -29);
    } else if (modo === 'custom') {
        inicio = document.getElementById('fecha-inicio').value;
        fin = document.getElementById('fecha-fin').value;
        if (!inicio || !fin) {
            mostrarNotificacion('Aviso', 'Selecciona ambas fechas', true);
            return null;
        }
    } else if (modo === 'todos') {
        inicio = '';
        fin = '';
    }

    return { inicio, fin };
};

const cargarDatosDashboard = async () => {
    const rango = obtenerRangoFechas();
    if (!rango) return;

    let url = '/reportes/dashboard';
    if (rango.inicio && rango.fin) {
        url += `?inicio=${rango.inicio}&fin=${rango.fin}`;
    }

    try {
        const res = await authFetch(url);
        if (res.ok) {
            const data = await res.json();
            actualizarKPIs(data.totales);
            dibujarGraficas(data);
            actualizarRankings(data.rankings);
        } else {
            mostrarNotificacion('Error', 'No se pudieron cargar los datos', true);
        }
    } catch (e) {
        console.error(e);
        mostrarNotificacion('Error', 'Fallo de conexión', true);
    }
};

const actualizarKPIs = (totales) => {
    document.getElementById('kpi-ingresos').textContent = `Bs ${totales.ingresos.toFixed(2)}`;
    document.getElementById('kpi-promedio-ingreso').textContent = `Bs ${totales.ingresoPromedioDiario.toFixed(2)}`;
    document.getElementById('kpi-ordenes').textContent = totales.ordenes;
    document.getElementById('kpi-promedio-ordenes').textContent = totales.ordenesPromedioDiario.toFixed(1);
    document.getElementById('kpi-reservas').textContent = totales.reservas;

    const pctQR = totales.ingresos > 0 ? (totales.qr / totales.ingresos) * 100 : 0;
    const pctEfectivo = totales.ingresos > 0 ? (totales.efectivo / totales.ingresos) * 100 : 0;

    document.getElementById('kpi-qr').textContent = `${pctQR.toFixed(1)}%`;
    document.getElementById('kpi-efectivo').textContent = `${pctEfectivo.toFixed(1)}%`;
};

const actualizarRankings = (rankings) => {
    const renderLista = (id, arr, labelUnidad) => {
        const ul = document.getElementById(id);
        ul.innerHTML = arr.length === 0 ? '<li>Sin datos</li>' : '';
        arr.forEach((item) => {
            ul.innerHTML += `<li><span>${escaparHTML(item[0])}</span> <span class="ranking-qty">${escaparHTML(item[1])} ${escaparHTML(labelUnidad)}</span></li>`;
        });
    };

    renderLista('lista-top-comidas', rankings.comidas, 'veces');
    renderLista('lista-top-juegos', rankings.juegos, 'veces');
};

const dibujarGraficas = (data) => {
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#fff' : '#333';
    const gridColor = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

    Chart.defaults.color = textColor;

    if (chartIngresosInst) chartIngresosInst.destroy();
    if (chartDistribucionInst) chartDistribucionInst.destroy();
    if (chartOrdenesInst) chartOrdenesInst.destroy();

    // NUEVO: Mapear y convertir etiquetas de YYYY-MM-DD a DD/MM/YYYY para los gráficos
    const etiquetasFormateadas = data.graficas.etiquetas.map((fecha) => {
        if (!fecha || !fecha.includes('-')) return fecha;
        const [yyyy, mm, dd] = fecha.split('-');
        return `${dd}/${mm}/${yyyy}`;
    });

    const ctxIngresos = document.getElementById('chart-ingresos').getContext('2d');
    chartIngresosInst = new Chart(ctxIngresos, {
        type: 'line',
        data: {
            labels: etiquetasFormateadas, // Aplicado aquí
            datasets: [
                {
                    label: 'Ingresos (Bs)',
                    data: data.graficas.ingresos,
                    borderColor: '#ff5a5e',
                    backgroundColor: 'rgba(255, 90, 94, 0.2)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            scales: { x: { grid: { color: gridColor } }, y: { grid: { color: gridColor }, beginAtZero: true } }
        }
    });

    const ctxDist = document.getElementById('chart-distribucion').getContext('2d');
    chartDistribucionInst = new Chart(ctxDist, {
        type: 'doughnut',
        data: {
            labels: ['Comida/Bebida', 'Juegos'],
            datasets: [
                {
                    data: [data.distribucion.comida, data.distribucion.juegos],
                    backgroundColor: ['#f59e0b', '#3b82f6'],
                    borderWidth: 0
                }
            ]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    const ctxOrdenes = document.getElementById('chart-ordenes').getContext('2d');
    chartOrdenesInst = new Chart(ctxOrdenes, {
        type: 'bar',
        data: {
            labels: etiquetasFormateadas, // Aplicado aquí
            datasets: [
                {
                    label: 'Cantidad de Órdenes',
                    data: data.graficas.ordenes,
                    backgroundColor: '#10b981',
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            scales: { x: { grid: { color: gridColor } }, y: { grid: { color: gridColor }, beginAtZero: true } }
        }
    });
};
