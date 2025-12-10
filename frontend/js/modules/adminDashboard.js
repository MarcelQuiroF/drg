import { authFetch } from '../api.js';

export const initAdminDashboard = async () => {
    console.log("Iniciando Dashboard...");
    // Aquí pondremos la lógica de los gráficos más adelante
    const contenedor = document.querySelector('.contenido');
    if(contenedor) {
        // Mensaje temporal para verificar que carga
        contenedor.innerHTML = '<h2 style="padding:20px;">Bienvenido al Panel de Control</h2><p style="padding:20px;">Cargando estadísticas...</p>';
        
        // Ejemplo de llamada a reporte (si ya tienes el endpoint)
        /*
        try {
            const res = await authFetch('/reportes/cierre-dia');
            if(res.ok) {
                const data = await res.json();
                console.log("Datos del día:", data);
            }
        } catch(e) { console.error(e); }
        */
    }
};