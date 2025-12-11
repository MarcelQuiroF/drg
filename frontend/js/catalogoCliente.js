const API_URL = 'http://localhost:3000/api/v1'; 

let todosLosJuegos = [];

document.addEventListener('DOMContentLoaded', () => {
    // 1. Cargar los juegos del servidor
    cargarJuegos();

    // 2. Activar los botones que YA están en tu HTML
    setupFiltrosEstaticos();
});

async function cargarJuegos() {
    const contenedor = document.getElementById('lista-juegos');
    try {
        const response = await fetch(`${API_URL}/juegos`);
        
        if (!response.ok) throw new Error('Error al conectar con el servidor');
        
        todosLosJuegos = await response.json();
        
        // Renderizar todos al principio
        renderizarJuegos(todosLosJuegos);

    } catch (error) {
        console.error(error);
        contenedor.innerHTML = '<p style="text-align:center; margin-top:20px; color:#aaa;">No se pudieron cargar los juegos.</p>';
    }
}

function setupFiltrosEstaticos() {
    // Seleccionamos los botones que escribiste en el HTML
    const botones = document.querySelectorAll('.cat-pill');

    botones.forEach(boton => {
        boton.addEventListener('click', () => {
            // A. Cambio Visual (Quitar/Poner clase active)
            botones.forEach(b => b.classList.remove('active'));
            boton.classList.add('active');

            // B. Lógica de Filtrado
            const categoriaSeleccionada = boton.dataset.cat; // Ej: "Estrategia" o "all"
            
            console.log("Filtro seleccionado:", categoriaSeleccionada);

            if (categoriaSeleccionada === 'all') {
                renderizarJuegos(todosLosJuegos);
            } else {
                // Filtramos los juegos
                const filtrados = todosLosJuegos.filter(juego => {
                    // Verificamos si el juego tiene categorías (Viene como 'Categoria' en singular)
                    if (!juego.Categoria || !Array.isArray(juego.Categoria)) return false;

                    // Buscamos si alguna coincide (ignorando mayúsculas/minúsculas)
                    return juego.Categoria.some(catJuego => 
                        catJuego.nombre.toLowerCase() === categoriaSeleccionada.toLowerCase()
                    );
                });

                renderizarJuegos(filtrados);
            }
        });
    });
}

function renderizarJuegos(juegos) {
    const contenedor = document.getElementById('lista-juegos');
    const template = document.getElementById('card-juego-cliente');
    
    contenedor.innerHTML = ''; 

    if (juegos.length === 0) {
        contenedor.innerHTML = '<p style="grid-column: 1/-1; text-align:center; color: #888; margin-top: 20px;">No hay juegos en esta categoría.</p>';
        return;
    }

    juegos.forEach(juego => {
        const clon = template.content.cloneNode(true);
        const card = clon.querySelector('.game-card');
        
        // --- IMAGEN ---
        const imgEl = clon.querySelector('.game-img');
        if (juego.imagen) {
            imgEl.src = juego.imagen.startsWith('http') ? juego.imagen : `../assets/productos/${juego.imagen}`;
        } else {
            imgEl.src = '../assets/productos/default-game.png'; 
        }

        // --- DATOS ---
        clon.querySelector('.game-title').textContent = juego.nombre;
        
        // Badge (Categoría)
        const catNombre = (juego.Categoria && juego.Categoria.length > 0) 
            ? juego.Categoria[0].nombre 
            : 'General';
        clon.querySelector('.game-badge').textContent = catNombre;

        // Specs
        const minP = juego.jugadores_min || 2;
        const maxP = juego.jugadores_max || 4;
        const tiempo = juego.tiempo_partida || '30';
        
        clon.querySelector('.players-txt').textContent = `${minP}-${maxP}`;
        clon.querySelector('.time-txt').textContent = `${tiempo}m`;

        // --- CLICK (Enlace) ---
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            if (juego.enlace && juego.enlace.trim() !== "") {
                window.open(juego.enlace, '_blank'); 
            } else {
                // Si no tiene enlace, mostramos un aviso simple
                alert(`¡${juego.nombre} está disponible! Pídelo a tu mesero.`);
            }
        });

        contenedor.appendChild(clon);
    });
}