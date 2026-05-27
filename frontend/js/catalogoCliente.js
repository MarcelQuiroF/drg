const API_URL = 'http://localhost:3000/api/v1'; 

let todosLosJuegos = [];

document.addEventListener('DOMContentLoaded', () => {
    cargarJuegos();

    setupFiltrosEstaticos();
});

async function cargarJuegos() {
    const contenedor = document.getElementById('lista-juegos');
    try {
        const response = await fetch(`${API_URL}/juegos`);
        
        if (!response.ok) throw new Error('Error al conectar con el servidor');
        
        todosLosJuegos = await response.json();
        
        renderizarJuegos(todosLosJuegos);

    } catch (error) {
        console.error(error);
        contenedor.innerHTML = '<p style="text-align:center; margin-top:20px; color:#aaa;">No se pudieron cargar los juegos.</p>';
    }
}

function setupFiltrosEstaticos() {
    const botones = document.querySelectorAll('.cat-pill');

    botones.forEach(boton => {
        boton.addEventListener('click', () => {
            botones.forEach(b => b.classList.remove('active'));
            boton.classList.add('active');

            const categoriaSeleccionada = boton.dataset.cat; 
            
            console.log("Filtro seleccionado:", categoriaSeleccionada);

            if (categoriaSeleccionada === 'all') {
                renderizarJuegos(todosLosJuegos);
            } else {
                const filtrados = todosLosJuegos.filter(juego => {
                    if (!juego.Categoria || !Array.isArray(juego.Categoria)) return false;

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
        
        const imgEl = clon.querySelector('.game-img');
        if (juego.imagen) {
            imgEl.src = juego.imagen.startsWith('http') ? juego.imagen : `../assets/productos/${juego.imagen}`;
        } else {
            imgEl.src = '../assets/productos/default-game.png'; 
        }

        clon.querySelector('.game-title').textContent = juego.nombre;
        
        const catNombre = (juego.Categoria && juego.Categoria.length > 0) 
            ? juego.Categoria[0].nombre 
            : 'General';
        clon.querySelector('.game-badge').textContent = catNombre;

        const minP = juego.jugadores_min || 2;
        const maxP = juego.jugadores_max || 4;
        const tiempo = juego.tiempo_partida || '30';
        
        clon.querySelector('.players-txt').textContent = `${minP}-${maxP}`;
        clon.querySelector('.time-txt').textContent = `${tiempo}m`;

        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
            if (juego.enlace && juego.enlace.trim() !== "") {
                window.open(juego.enlace, '_blank'); 
            } else {
                alert(`¡${juego.nombre} está disponible! Pídelo a tu mesero.`);
            }
        });

        contenedor.appendChild(clon);
    });
}