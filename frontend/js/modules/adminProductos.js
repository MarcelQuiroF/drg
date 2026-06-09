import { authFetch } from '../api.js';

let allInventory = [];
let allCategories = [];  
let selectedCategories = []; 
let currentCategory = 'all';
let currentStatus = 'active';
let searchStr = '';
let EDIT_ID = null;
let ITEM_PARA_TOGGLE = null;

export const initAdminProductos = async () => {
    await loadCategories(); 
    await loadInventory();
    setupEventListeners();
};

const setupEventListeners = () => {
    document.querySelectorAll('.js-cats .filter-opt').forEach(opt => {
        opt.onclick = () => {
            document.querySelectorAll('.js-cats .filter-opt').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            currentCategory = opt.dataset.filter;
            renderInventory();
        };
    });

    document.querySelectorAll('.js-stats .filter-opt').forEach(opt => {
        opt.onclick = () => {
            document.querySelectorAll('.js-stats .filter-opt').forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            currentStatus = opt.dataset.status;
            renderInventory();
        };
    });

    const searchInput = document.getElementById('admin-search-input');
    if (searchInput) {
        searchInput.oninput = (e) => {
            searchStr = e.target.value.toLowerCase();
            renderInventory();
        };
    }

    const btnNuevo = document.getElementById('btn-nuevo-producto');
    if (btnNuevo) btnNuevo.onclick = () => openModal();

    document.getElementById('close-modal')?.addEventListener('click', closeAllModals);
    document.getElementById('close-status-modal')?.addEventListener('click', closeAllModals);
    document.getElementById('btn-cancelar')?.addEventListener('click', closeAllModals);
    document.getElementById('modal-overlay')?.addEventListener('click', closeAllModals);
    document.getElementById('btn-guardar')?.addEventListener('click', handleSave);
    document.getElementById('btn-status-confirm')?.addEventListener('click', handleConfirmToggle);

    const selectZona = document.getElementById('prod-zona');
    if (selectZona) {
        selectZona.onchange = (e) => {
            const gameFields = document.getElementById('game-only-fields');
            if (gameFields) {
                gameFields.style.display = e.target.value === 'JUEGO' ? 'flex' : 'none';
            }
        };
    }

    const categorySearchInput = document.getElementById('category-search-input');
    if (categorySearchInput) {
        categorySearchInput.oninput = (e) => {
            const term = e.target.value.toLowerCase();
            renderCategoryResults(term);
        };
    }

    document.addEventListener('click', (e) => {
        const results = document.getElementById('category-results');
        if (results && !e.target.closest('.category-search-container')) {
            results.classList.add('hidden');
        }
    });

    const fileInput = document.getElementById('file-input');
    const btnUpload = document.getElementById('btn-upload-img');
    if (btnUpload && fileInput) {
        btnUpload.onclick = () => fileInput.click();
        fileInput.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    const preview = document.getElementById('preview-img');
                    if (preview) preview.src = ev.target.result;
                };
                reader.readAsDataURL(file);
            }
        };
    }
};

const loadInventory = async () => {
    try {
        const [resP, resJ] = await Promise.all([authFetch('/productos'), authFetch('/juegos')]);
        let combined = [];

        if (resP.ok) {
            const data = await resP.json();
            combined = combined.concat(data.map(p => ({ ...p, type: 'producto', category: p.zona })));
        }
        if (resJ.ok) {
            const data = await resJ.json();
            combined = combined.concat(data.map(j => ({ ...j, type: 'juego', category: 'JUEGO' })));
        }

        allInventory = combined;
        renderInventory();
    } catch (e) { console.error(e); }
};

const loadCategories = async () => {
    try {
        const res = await authFetch('/categorias');
        if (res.ok) allCategories = await res.json();
    } catch (e) { console.error(e); }
};

const renderInventory = () => {
    const container = document.getElementById('admin-products-container');
    const template = document.getElementById('template-admin-card');
    if (!container || !template) return;
    
    container.innerHTML = '';

    const filtered = allInventory.filter(item => {
        const matchCat = currentCategory === 'all' || item.category === currentCategory;
        const matchStatus = currentStatus === 'all' || (currentStatus === 'active' ? item.activado : !item.activado);
        const matchSearch = item.nombre.toLowerCase().includes(searchStr);
        return matchCat && matchStatus && matchSearch;
    });

    filtered.forEach(item => {
        const clon = template.content.cloneNode(true);
        const card = clon.querySelector('.contenedor-producto');
        const img = clon.querySelector('.prod-img');
        
        card.classList.add(item.activado ? 'activo' : 'inactivo');
        clon.querySelector('.prod-name').textContent = item.nombre;
        clon.querySelector('.val-price').textContent = `Bs ${item.precio}`;
        
        const categoriaVisual = item.type === 'juego' ? 'Juego de Mesa' : item.zona;
        clon.querySelector('.prod-cat').textContent = categoriaVisual;
        
        const imgDefault = {
            'COCINA': '../assets/productos/default-burger.png',
            'CAFETERIA': '../assets/productos/default-drink.png',
            'JUEGO': '../assets/productos/default-game.png'
        }[item.category] || '../assets/productos/default-burger.png';

        // MODIFICADO: Resolución inteligente del path para nombres de archivos puros
        if (item.imagen) {
            if (item.imagen.startsWith('data:image') || item.imagen.startsWith('http') || item.imagen.startsWith('.')) {
                img.src = item.imagen;
            } else {
                img.src = `../assets/imágenes/${item.imagen}`;
            }
        } else {
            img.src = imgDefault;
        }

        img.onerror = () => { img.src = imgDefault; };

        const btnToggle = clon.querySelector('.btn-toggle-status');
        if (btnToggle) {
            btnToggle.textContent = item.activado ? 'Anular' : 'Activar';
            
            btnToggle.onclick = (e) => {
                e.stopPropagation();
                toggleStatus(item);
            };
        }

        clon.querySelector('.btn-edit-float').onclick = (e) => {
            e.stopPropagation();
            openModal(item);
        };

        container.appendChild(clon);
    });
};

const renderCategoryResults = (term) => {
    const resultsDiv = document.getElementById('category-results');
    if (!resultsDiv) return;
    if (!term) {
        resultsDiv.classList.add('hidden');
        return;
    }

    const filtered = allCategories.filter(c => 
        c.nombre.toLowerCase().includes(term) && 
        !selectedCategories.find(sel => sel.id === c.id)
    );

    resultsDiv.innerHTML = filtered.length === 0 
        ? '<div class="category-option">No hay resultados</div>'
        : filtered.map(c => `<div class="category-option" data-id="${c.id}" data-nombre="${c.nombre}">${c.nombre}</div>`).join('');
    
    resultsDiv.querySelectorAll('.category-option').forEach(opt => {
        opt.onclick = () => addCategoryTag(opt.dataset.id, opt.dataset.nombre);
    });
    resultsDiv.classList.remove('hidden');
};

const addCategoryTag = (id, nombre) => {
    selectedCategories.push({ id: parseInt(id), nombre });
    const input = document.getElementById('category-search-input');
    if (input) input.value = '';
    document.getElementById('category-results')?.classList.add('hidden');
    renderTags();
};

window.removeCategoryTag = (id) => {
    selectedCategories = selectedCategories.filter(c => c.id !== id);
    renderTags();
};

const renderTags = () => {
    const container = document.getElementById('category-tags');
    if (container) {
        container.innerHTML = selectedCategories.map(c => `
            <span class="tag">${c.nombre}<i class='bx bx-x' onclick="removeCategoryTag(${c.id})"></i></span>
        `).join('');
    }
};

const openModal = (item = null) => {
    EDIT_ID = item ? item.id : null;
    selectedCategories = item ? (item.Categorias || []) : [];
    
    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val;
    };

    const errorEl = document.getElementById('form-error-msg');
    if (errorEl) {
        errorEl.textContent = '';
        errorEl.className = 'error-text-hidden';
    }

    const formTitle = document.getElementById('form-title');
    if (formTitle) formTitle.textContent = item ? "Editar Producto" : "Nuevo Producto";

    setVal('prod-nombre', item ? item.nombre : "");
    setVal('prod-precio', item ? item.precio : "");
    setVal('prod-activado', item ? item.activado.toString() : "true");
    
    const previewImg = document.getElementById('preview-img');
    if (previewImg) {
        // MODIFICADO: Ajuste de path para previsualización correcta en el modal
        if (item?.imagen) {
            if (item.imagen.startsWith('data:image') || item.imagen.startsWith('http') || item.imagen.startsWith('.')) {
                previewImg.src = item.imagen;
            } else {
                previewImg.src = `../assets/imágenes/${item.imagen}`;
            }
        } else {
            previewImg.src = "../assets/productos/default-burger.png";
        }
    }

    const selectZona = document.getElementById('prod-zona');
    if (selectZona) {
        const options = selectZona.options;
        for (let opt of options) opt.disabled = false;
        selectZona.disabled = false;

        if (item) {
            if (item.type === 'juego') {
                selectZona.value = 'JUEGO';
                selectZona.disabled = true; 
            } else {
                for (let opt of options) if (opt.value === 'JUEGO') opt.disabled = true;
                selectZona.value = item.zona;
            }
        } else {
            selectZona.value = 'COCINA';
        }
        selectZona.dispatchEvent(new Event('change'));
    }

    setVal('prod-jug-min', item?.jugadores_min || 1);
    setVal('prod-jug-max', item?.jugadores_max || 4);

    renderTags();

    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('product-modal');
    if (overlay) overlay.className = 'modal-overlay-visible';
    if (modal) modal.className = 'custom-modal-visible';
};

const handleSave = async () => {
    const errorEl = document.getElementById('form-error-msg');
    const previewImg = document.getElementById('preview-img');
    const zona = document.getElementById('prod-zona')?.value;
    const nombre = document.getElementById('prod-nombre')?.value;
    const precio = parseFloat(document.getElementById('prod-precio')?.value);

    if (!nombre || isNaN(precio)) {
        if (errorEl) {
            errorEl.textContent = "Nombre y precio son obligatorios.";
            errorEl.className = 'error-text-visible';
        }
        return;
    }

    const data = {
        nombre,
        precio,
        activado: document.getElementById('prod-activado')?.value === 'true',
        categorias: selectedCategories.map(c => c.id),
        imagen: previewImg.src.includes('data:image') ? previewImg.src : (EDIT_ID && allInventory.find(i => i.id === EDIT_ID)?.imagen || null) 
    };

    if (zona === 'JUEGO') {
        data.jugadores_min = parseInt(document.getElementById('prod-jug-min')?.value);
        data.jugadores_max = parseInt(document.getElementById('prod-jug-max')?.value);
    } else {
        data.zona = zona;
    }

    const endpoint = zona === 'JUEGO' ? '/juegos' : '/productos';
    const url = EDIT_ID ? `${endpoint}/${EDIT_ID}` : endpoint;

    try {
        const res = await authFetch(url, { 
            method: EDIT_ID ? 'PUT' : 'POST', 
            body: JSON.stringify(data) 
        });

        if (res.ok) {
            closeAllModals();
            await loadInventory();
        } else {
            const err = await res.json();
            if (errorEl) {
                errorEl.textContent = `Error: ${err.message || 'No se pudo guardar'}`;
                errorEl.className = 'error-text-visible';
            }
        }
    } catch (e) {
        if (errorEl) {
            errorEl.textContent = "Error de conexión con el servidor.";
            errorEl.className = 'error-text-visible';
        }
    }
};

const closeAllModals = () => {
    document.getElementById('modal-overlay').className = 'modal-overlay-hidden';
    document.getElementById('product-modal').className = 'custom-modal-hidden';
    document.getElementById('status-modal').className = 'custom-modal-hidden';
    EDIT_ID = null;
    ITEM_PARA_TOGGLE = null;
    selectedCategories = [];
    
    const fileInput = document.getElementById('file-input');
    if (fileInput) fileInput.value = '';
};

const toggleStatus = (item) => {
    ITEM_PARA_TOGGLE = item;
    const nextStatus = !item.activado;
    const msg = document.getElementById('status-modal-message');
    const btnConfirm = document.getElementById('btn-status-confirm');

    if (msg) msg.innerHTML = `¿Deseas ${nextStatus ? '<strong>activar</strong>' : '<strong>desactivar</strong>'} <br> "<strong>${item.nombre}</strong>"?`;

    if (btnConfirm) {
        btnConfirm.className = 'btn-primary ' + (nextStatus ? 'confirm-activar' : 'confirm-desactivar');
        btnConfirm.textContent = nextStatus ? 'Activar Producto' : 'Desactivar Producto';
    }

    document.getElementById('status-modal').className = 'custom-modal-visible';
    document.getElementById('modal-overlay').className = 'modal-overlay-visible';
};

const handleConfirmToggle = async () => {
    if (!ITEM_PARA_TOGGLE) return;
    const endpoint = ITEM_PARA_TOGGLE.type === 'producto' ? `/productos/${ITEM_PARA_TOGGLE.id}` : `/juegos/${ITEM_PARA_TOGGLE.id}`;

    try {
        const res = await authFetch(endpoint, {
            method: 'PUT',
            body: JSON.stringify({ activado: !ITEM_PARA_TOGGLE.activado })
        });
        if (res.ok) {
            closeAllModals();
            await loadInventory();
        }
    } catch (e) { console.error(e); }
};