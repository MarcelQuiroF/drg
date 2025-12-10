import { authFetch } from '../api.js';
import { cargarHTML } from '../utils.js';

let allProducts = []; // Almacenará productos y juegos
let currentCategoryFilter = 'all';
let currentStatusFilter = 'all';
let searchTerm = '';

export const initAdminProductos = async () => {
    // 1. Cargar Datos
    await loadAllInventory();

    // 2. Eventos de Filtros (Categoría)
    const catFilters = document.querySelectorAll('.js-cats .filter-opt');
    catFilters.forEach(btn => {
        btn.addEventListener('click', () => {
            catFilters.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentCategoryFilter = btn.dataset.filter;
            renderInventory();
        });
    });

    // 3. Eventos de Filtros (Estado)
    const statFilters = document.querySelectorAll('.js-stats .filter-opt');
    statFilters.forEach(btn => {
        btn.addEventListener('click', () => {
            statFilters.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentStatusFilter = btn.dataset.status;
            renderInventory();
        });
    });

    // 4. Buscador
    const searchInput = document.getElementById('admin-search-input');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchTerm = e.target.value.toLowerCase();
            renderInventory();
        });
    }

    // 5. Botón Nuevo
    document.getElementById('btn-nuevo-producto')?.addEventListener('click', () => {
        cargarFormularioProducto(null);
    });

    
};

const loadAllInventory = async () => {
    try {
        const [resProds, resJuegos] = await Promise.all([
            authFetch('/productos'),
            authFetch('/juegos')
        ]);

        let combined = [];

        if (resProds.ok) {
            const prods = await resProds.json();
            // Normalizar datos para que tengan estructura común
            combined = combined.concat(prods.map(p => ({
                ...p,
                type: 'producto',
                category: p.zona === 'Cocina' ? 'comida' : 'bebida' // Mapeo simple basado en tu lógica anterior
            })));
        }

        if (resJuegos.ok) {
            const juegos = await resJuegos.json();
            combined = combined.concat(juegos.map(j => ({
                ...j,
                type: 'juego',
                category: 'juego'
            })));
        }

        allProducts = combined;
        renderInventory();

    } catch (error) {
        console.error("Error cargando inventario:", error);
    }
};

const renderInventory = () => {
    const container = document.getElementById('admin-products-container');
    const template = document.getElementById('template-admin-card');
    if (!container || !template) return;

    container.innerHTML = '';

    // 1. CONFIGURACIÓN DE IMÁGENES POR DEFECTO
    const IMAGENES_DEFECTO = {
        comida: '../assets/productos/default-burger.png',
        bebida: '../assets/productos/default-drink.png',
        juego: '../assets/productos/default-game.png'
    };
    
    // Ruta base si en la BD solo guardaste el nombre del archivo (ej: "pizza.png")
    const RUTA_BASE_PRODUCTOS = '../assets/productos/';

    // --- FILTRADO ---
    const filtered = allProducts.filter(item => {
        const catMatch = currentCategoryFilter === 'all' || item.category === currentCategoryFilter;
        
        let statusMatch = true;
        if (currentStatusFilter === 'active') statusMatch = item.activado;
        if (currentStatusFilter === 'inactive') statusMatch = !item.activado;

        const nameMatch = item.nombre.toLowerCase().includes(searchTerm);

        return catMatch && statusMatch && nameMatch;
    });

    if (filtered.length === 0) {
        container.innerHTML = '<p style="color: #666; grid-column: 1/-1; text-align: center;">No se encontraron productos.</p>';
        return;
    }

    filtered.forEach(item => {
        const clon = template.content.cloneNode(true);
        const card = clon.querySelector('.contenedor-producto');

        // Estado Visual (Borde y Opacidad)
        if (item.activado) {
            card.classList.add('activo');
            card.classList.remove('inactivo');
        } else {
            card.classList.add('inactivo');
            card.classList.remove('activo');
        }
        const btnEdit = clon.querySelector('.btn-edit-float');
        if(btnEdit) {
        btnEdit.style.display = 'block'; // Hacerlo visible
        btnEdit.addEventListener('click', (e) => {
            e.stopPropagation();
            cargarFormularioProducto(item.id);
        });
        }

        // Datos de Texto
        clon.querySelector('.prod-name').textContent = item.nombre;
        clon.querySelector('.prod-cat').textContent = item.category; // 'comida', 'bebida', 'juego'
        clon.querySelector('.val-price').textContent = `Bs. ${item.precio}`;

        // --- LÓGICA DE IMAGEN ---
        const img = clon.querySelector('.prod-img');
        
        // Determinamos qué imagen mostrar
        if (item.imagen && item.imagen.trim() !== "") {
            // Si la ruta ya es absoluta o relativa manual, la usamos tal cual
            if (item.imagen.startsWith('http') || item.imagen.startsWith('.') || item.imagen.startsWith('/')) {
                img.src = item.imagen;
            } else {
                // Si es solo el nombre, le pegamos la ruta base
                img.src = `${RUTA_BASE_PRODUCTOS}${item.imagen}`;
            }
        } else {
            // Si no tiene imagen, usamos el defecto según su categoría
            img.src = IMAGENES_DEFECTO[item.category] || IMAGENES_DEFECTO.comida;
        }

        // Manejo de error de carga (si la imagen del producto no existe, pone el default)
        img.onerror = () => { 
            img.src = IMAGENES_DEFECTO[item.category] || IMAGENES_DEFECTO.comida; 
        };

        // --- BOTÓN ACTIVAR/DESACTIVAR ---
        const btnToggle = clon.querySelector('.btn-toggle-status');
        
        if (item.activado) {
            // Si está activo, mostramos opción de desactivar
            btnToggle.style.display = 'block';
            btnToggle.textContent = 'Desactivar';
            btnToggle.style.backgroundColor = '#333';
            btnToggle.style.color = '#fff';
        } else {
            // Si está inactivo, mostramos activar
            btnToggle.style.display = 'block';
            btnToggle.textContent = 'Activar';
            // Usa el estilo por defecto del CSS (gris claro)
            btnToggle.style.backgroundColor = ''; 
            btnToggle.style.color = '';
        }

        btnToggle.addEventListener('click', (e) => {
            e.stopPropagation(); 
            toggleProductStatus(item);
        });

        container.appendChild(clon);
    });
};

const toggleProductStatus = async (item) => {
    const newStatus = !item.activado;
    const action = newStatus ? 'activar' : 'desactivar';

    if(!confirm(`¿Deseas ${action} el producto "${item.nombre}"?`)) return;

    try {
        let endpoint = item.type === 'producto' 
            ? `/productos/${item.id}` 
            : `/juegos/${item.id}`;
        
        // Asumiendo que tu backend acepta PUT para actualizar 'activado'
        // Si no, necesitamos crear un endpoint específico o usar el update general
        const res = await authFetch(endpoint, {
            method: 'PUT',
            body: JSON.stringify({ activado: newStatus })
        });

        if (res.ok) {
            // Actualizar localmente para no recargar todo
            item.activado = newStatus;
            renderInventory();
        } else {
            alert("Error al actualizar estado.");
        }
    } catch (error) {
        console.error(error);
    }
};

// Variable para saber si editamos o creamos
let PRODUCTO_EDIT_ID = null;

// Función para abrir el formulario
export const cargarFormularioProducto = (idProducto = null) => {
    PRODUCTO_EDIT_ID = idProducto;
    cargarHTML('../html/admin-producto-form.html', initFormulario);
};

const initFormulario = async () => {
    // 1. Cargar Categorías en el Select
    await cargarCategoriasSelect();

    // 2. Si es edición, cargar datos del producto
    if (PRODUCTO_EDIT_ID) {
        document.getElementById('form-title').textContent = "Editar Producto";
        await cargarDatosProducto(PRODUCTO_EDIT_ID);
    }

    // 3. Eventos de botones
    document.getElementById('btn-cancelar-producto')?.addEventListener('click', () => {
        // CORRECCIÓN: Eliminamos la línea 'require' que causaba el error.
        // Simplemente hacemos clic en el enlace del menú para volver a la lista.
        const btnMenuProductos = document.getElementById('menu-admin-productos');
        if (btnMenuProductos) {
            btnMenuProductos.click();
        } else {
            console.error("No se encontró el botón del menú para volver.");
        }
    });

    document.getElementById('btn-guardar-producto')?.addEventListener('click', guardarProducto);

    // 4. Lógica de Imagen (Previsualización local)
    const fileInput = document.getElementById('file-input');
    const btnUpload = document.getElementById('btn-upload-img');
    const imgPreview = document.getElementById('preview-img');

    if (btnUpload && fileInput) {
        btnUpload.addEventListener('click', () => fileInput.click());

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => imgPreview.src = e.target.result;
                reader.readAsDataURL(file);
            }
        });
    }
};

const cargarCategoriasSelect = async () => {
    const select = document.getElementById('categoria');
    try {
        const res = await authFetch('/categorias');
        if (res.ok) {
            const categorias = await res.json();
            select.innerHTML = '<option value="" disabled selected>Seleccionar...</option>';
            categorias.forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id; // Asumiendo que la relación usa ID
                opt.text = c.nombre;
                select.add(opt);
            });
        }
    } catch (e) { console.error(e); }
};

const cargarDatosProducto = async (id) => {
    try {
        // Intentar buscar en productos (si falla, buscar en juegos)
        // O mejor, el botón de editar debería decirnos qué tipo es.
        // Por simplicidad, buscamos en productos primero.
        let res = await authFetch(`/productos/${id}`); // Necesitas endpoint GET /:id
        if (!res.ok) res = await authFetch(`/juegos/${id}`); // Fallback

        if (res.ok) {
            const data = await res.json();
            document.getElementById('nombre').value = data.nombre;
            document.getElementById('precio').value = data.precio;
            document.getElementById('estado').value = data.activado.toString();
            
            // Zona y Categoría
            if (data.zona) document.getElementById('zona').value = data.zona;
            // Para categoría, si es N:M, es complejo mostrarlo en un select simple.
            // Asumiremos que seleccionamos la primera categoría.
            if (data.Categorias && data.Categorias.length > 0) {
                document.getElementById('categoria').value = data.Categorias[0].id;
            }

            // Imagen
            if (data.imagen) document.getElementById('preview-img').src = data.imagen;
        }
    } catch (e) { console.error(e); }
};

const guardarProducto = async () => {
    const nombre = document.getElementById('nombre').value;
    const precio = document.getElementById('precio').value;
    const zona = document.getElementById('zona').value; // 'COCINA', 'BARRA', 'JUEGO'
    const estado = document.getElementById('estado').value === 'true';
    const categoriaId = document.getElementById('categoria').value;

    // Validaciones básicas
    if (!nombre || !precio || !categoriaId) return alert("Faltan datos obligatorios.");

    // 1. Determinar si es Producto o Juego según la Zona
    const esJuego = (zona === 'JUEGO' || zona === 'juego');
    
    // 2. Preparar el Payload (Datos)
    const payload = {
        nombre,
        precio: parseFloat(precio),
        activado: estado,
        categorias: categoriaId ? [categoriaId] : []
    };

    // Solo los productos tienen zona, los juegos tienen jugadores
    if (esJuego) {
        // Valores por defecto para juegos si no los pedimos en el formulario simplificado
        payload.jugadores_min = 2; 
        payload.jugadores_max = 4;
        payload.tiempo_partida = 30;
    } else {
        payload.zona = zona;
    }

    // 3. Determinar URL y Método
    const method = PRODUCTO_EDIT_ID ? 'PUT' : 'POST';
    
    let urlBase = esJuego ? '/juegos' : '/productos';
    let url = PRODUCTO_EDIT_ID ? `${urlBase}/${PRODUCTO_EDIT_ID}` : urlBase;

    try {
        const res = await authFetch(url, {
            method,
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            alert(PRODUCTO_EDIT_ID ? "Actualizado correctamente." : "Creado correctamente.");
            // Volver a la lista simulando click en el menú
            document.getElementById('menu-admin-productos').click(); 
        } else {
            const err = await res.json();
            alert("Error: " + err.message);
        }
    } catch (e) { console.error(e); }
};