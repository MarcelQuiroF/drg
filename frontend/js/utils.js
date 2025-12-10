export const cargarHTML = (rutaHTML, callback) => {
    const cuerpo = document.getElementById('cuerpo');
    fetch(rutaHTML)
        .then(res => res.text())
        .then(html => {
            cuerpo.innerHTML = html;
            
            // --- CORRECCIÓN DE SEGURIDAD ---
            const contenido = cuerpo.querySelector('.contenido');
            
            // Solo intentamos cambiar estilos si el elemento EXISTE
            if (contenido) {
                if(getComputedStyle(contenido).display !== 'flex') {
                    contenido.style.display = 'flex';
                }
                
                // Lógica de dirección
                if(rutaHTML.includes("mesas")) {
                    contenido.style.flexDirection = "column";
                } else if(rutaHTML.includes("admin-productos")) {
                    // Admin productos necesita columna
                    contenido.style.flexDirection = "column"; 
                } else if(rutaHTML.includes("productos")) {
                    // Productos (Cajero) necesita fila
                    contenido.style.flexDirection = "row";
                }
            }
            // -------------------------------

            if(typeof callback === 'function') callback();
        })
        .catch(err => console.error("Error cargando HTML:", err));
};

// ... activarMenu sigue igual


export const activarMenu = (id) => {
    document.querySelectorAll('.menu-item, .menu-link').forEach(i => i.classList.remove('active'));
    const item = document.getElementById(id);
    if(item) {
        item.classList.add('active');
        const parent = item.closest('.menu-item');
        if (parent) parent.classList.add('active');
    }
};  