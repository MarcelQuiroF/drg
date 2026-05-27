import { authFetch } from '../api.js';
import { mostrarNotificacion } from '../utils.js';

let chartIngresosInst = null;
let chartDistribucionInst = null;
let chartOrdenesInst = null;

export const initAdminDashboard = () => {
    configurarFiltros();
    cargarDatosDashboard(); 
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

    radios.forEach(r => {
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
    const hoy = new Date();
    let inicio = '';
    let fin = hoy.toISOString().split('T')[0];

    if (modo === 'semana') {
        const hace7Dias = new Date(hoy);
        hace7Dias.setDate(hoy.getDate() - 7);
        inicio = hace7Dias.toISOString().split('T')[0];
    } else if (modo === 'mes') {
        const hace30Dias = new Date(hoy);
        hace30Dias.setDate(hoy.getDate() - 30);
        inicio = hace30Dias.toISOString().split('T')[0];
    } else if (modo === 'custom') {
        inicio = document.getElementById('fecha-inicio').value;
        fin = document.getElementById('fecha-fin').value;
        if(!inicio || !fin) {
            mostrarNotificacion("Aviso", "Selecciona ambas fechas", true);
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
            mostrarNotificacion("Error", "No se pudieron cargar los datos", true);
        }
    } catch (e) {
        console.error(e);
        mostrarNotificacion("Error", "Fallo de conexión", true);
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
        arr.forEach(item => {
            ul.innerHTML += `<li><span>${item[0]}</span> <span class="ranking-qty">${item[1]} ${labelUnidad}</span></li>`;
        });
    };

    renderLista('lista-top-comidas', rankings.comidas, 'uds');
    renderLista('lista-top-juegos', rankings.juegos, 'veces');
};

const dibujarGraficas = (data) => {
    const isDarkMode = document.body.classList.contains('dark-mode');
    const textColor = isDarkMode ? '#fff' : '#333';
    const gridColor = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

    Chart.defaults.color = textColor;

    if(chartIngresosInst) chartIngresosInst.destroy();
    if(chartDistribucionInst) chartDistribucionInst.destroy();
    if(chartOrdenesInst) chartOrdenesInst.destroy();

    const ctxIngresos = document.getElementById('chart-ingresos').getContext('2d');
    chartIngresosInst = new Chart(ctxIngresos, {
        type: 'line',
        data: {
            labels: data.graficas.etiquetas,
            datasets: [{
                label: 'Ingresos (Bs)',
                data: data.graficas.ingresos,
                borderColor: '#ff5a5e',
                backgroundColor: 'rgba(255, 90, 94, 0.2)',
                borderWidth: 2,
                fill: true,
                tension: 0.3 
            }]
        },
        options: { responsive: true, scales: { x: { grid: { color: gridColor } }, y: { grid: { color: gridColor }, beginAtZero: true } } }
    });

    const ctxDist = document.getElementById('chart-distribucion').getContext('2d');
    chartDistribucionInst = new Chart(ctxDist, {
        type: 'doughnut',
        data: {
            labels: ['Comida/Bebida', 'Juegos'],
            datasets: [{
                data: [data.distribucion.comida, data.distribucion.juegos],
                backgroundColor: ['#f59e0b', '#3b82f6'],
                borderWidth: 0
            }]
        },
        options: { responsive: true, maintainAspectRatio: false }
    });

    const ctxOrdenes = document.getElementById('chart-ordenes').getContext('2d');
    chartOrdenesInst = new Chart(ctxOrdenes, {
        type: 'bar', 
        data: {
            labels: data.graficas.etiquetas,
            datasets: [{
                label: 'Cantidad de Órdenes',
                data: data.graficas.ordenes,
                backgroundColor: '#10b981',
                borderRadius: 4
            }]
        },
        options: { responsive: true, scales: { x: { grid: { color: gridColor } }, y: { grid: { color: gridColor }, beginAtZero: true } } }
    });
};