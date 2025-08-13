document.addEventListener('DOMContentLoaded', function() {
    const container = document.getElementById('products-container');
    const loadingSpinner = document.querySelector('.loading-spinner');
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('categoria');
    const searchQuery = urlParams.get('search') || urlParams.get('q');
    const supplier = urlParams.get('proveedor');
    
    // Cargar productos
    loadProducts(category, searchQuery, supplier);
    
    // Manejar filtros
    const filterButtons = document.querySelectorAll('.category-filter');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filterCategory = this.getAttribute('data-category');
            loadProducts(filterCategory, searchQuery, supplier);
        });
    });
    
    async function loadProducts(category = null, searchQuery = null, supplier = null) {
        try {
            showLoading();
            let base = 'http://localhost:5000/productos';
            const params = [];
            if (category) params.push(`categoria=${encodeURIComponent(category)}`);
            if (searchQuery) params.push(`search=${encodeURIComponent(searchQuery)}`);
            if (supplier) params.push(`proveedor=${encodeURIComponent(supplier)}`);
            const url = params.length ? `${base}?${params.join('&')}` : base;
            
            const response = await fetch(url);
            
            if(!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if(data.success && data.productos && data.productos.length > 0) {
                renderProducts(data.productos);
                
                if (searchQuery) {
                    updateSearchTitle(searchQuery);
                } else if (category) {
                    updateCategoryTitle(category);
                } else if (supplier) {
                    updateSupplierTitle(supplier);
                }
            } else {
                renderEmptyState(category, searchQuery);
            }
            
        } catch (error) {
            console.error('Error al cargar productos:', error);
            renderError(error.message);
        } finally {
            hideLoading();
        }
    }
    
    function showLoading() {
        container.innerHTML = '';
        loadingSpinner.style.display = 'flex';
    }
    
    function hideLoading() {
        loadingSpinner.style.display = 'none';
    }
    
    function renderProducts(products) {
        container.innerHTML = products.map(product => `
            <div class="product-card card-hover">
                ${product.descuento > 0 ? `
                    <div class="discount-badge">-${product.descuento}%</div>
                ` : ''}
                
                ${product.es_nuevo ? `
                    <div class="new-badge">Nuevo</div>
                ` : ''}
                
                <div class="product-image">
                    <img src="${product.imagen || '/estilos/imagenes/placeholder-producto.jpg'}" 
                         alt="${product.nombre}" 
                         loading="lazy"
                         class="image-zoom">
                    
                    ${product.stock <= 0 ? `
                        <div class="out-of-stock-overlay">
                            Agotado
                        </div>
                    ` : ''}
                </div>
                
                <div class="product-details">
                    <h3>${product.nombre}</h3>
                    <p class="product-supplier">${product.proveedor}</p>
                    
                    <div class="product-rating">
                        <div class="stars">
                            ${Array(Math.floor(product.valoracion || 0)).fill('<i class="fas fa-star"></i>').join('')}
                            ${product.valoracion % 1 >= 0.5 ? '<i class="fas fa-star-half-alt"></i>' : ''}
                            ${Array(5 - Math.ceil(product.valoracion || 0)).fill('<i class="far fa-star"></i>').join('')}
                            <span>(${product.resenas || 0})</span>
                        </div>
                    </div>
                    
                    <p class="product-description">${product.descripcion}</p>
                    
                    <div class="product-footer">
                        <div class="price-container">
                            <span class="price">₲ ${product.precio.toLocaleString()}</span>
                            ${product.precio_original ? `
                                <span class="original-price">₲ ${product.precio_original.toLocaleString()}</span>
                            ` : ''}
                        </div>
                        
                        <button class="add-to-cart action-btn" 
                                data-id="${product.id_producto}" 
                                ${product.stock <= 0 ? 'disabled' : ''}
                                aria-label="Añadir al carrito">
                            <i class="fas fa-cart-plus"></i>
                        </button>
                        
                        <button class="wishlist-btn action-btn" 
                                data-id="${product.id_producto}"
                                aria-label="Añadir a favoritos">
                            <i class="far fa-heart"></i>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
        // Agregar event listeners a los botones
        document.querySelectorAll('.add-to-cart').forEach(btn => {
            btn.addEventListener('click', addToCart);
        });
        
        document.querySelectorAll('.wishlist-btn').forEach(btn => {
            btn.addEventListener('click', toggleWishlist);
        });
        
        // Animación para los productos
        setTimeout(() => {
            document.querySelectorAll('.product-card').forEach((card, index) => {
                card.style.animationDelay = `${index * 0.1}s`;
                card.classList.add('slide-up');
            });
        }, 50);
    }
    
    function updateCategoryTitle(category) {
        const categoryTitles = {
            'materiales-basicos': 'Materiales Básicos',
            'acabados': 'Acabados',
            'herramientas': 'Herramientas',
            'electricidad': 'Materiales Eléctricos',
            'fontaneria': 'Fontanería',
            'otros': 'Otros Productos'
        };
        
        const titleElement = document.querySelector('.section-title') || document.querySelector('h1');
        if(titleElement && categoryTitles[category]) {
            titleElement.textContent = categoryTitles[category];
        }
    }
    
    function updateSearchTitle(query) {
        const titleElement = document.querySelector('.section-title') || document.querySelector('h1');
        if (titleElement) {
            titleElement.textContent = `Resultados para: ${query}`;
        }
    }
    
    function updateSupplierTitle(name) {
        const titleElement = document.querySelector('.section-title') || document.querySelector('h1');
        if (titleElement) {
            titleElement.textContent = `Productos de: ${name}`;
        }
    }
    
    function renderEmptyState(category = null, searchQuery = null) {
        const text = searchQuery ? `Para "${searchQuery}"` : (category ? 'En esta categoría' : 'En este momento');
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-box-open"></i>
                <h3>No hay productos disponibles</h3>
                <p>${text}</p>
                <a href="/productos.html" class="btn btn-primary">Ver todos los productos</a>
            </div>
        `;
    }
    
    function renderError(message) {
        container.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>${message || 'Error al cargar los productos'}</p>
                <button class="btn btn-primary" id="retry-btn">Reintentar</button>
            </div>
        `;
        
        document.getElementById('retry-btn').addEventListener('click', () => loadProducts(category));
    }
    
    async function addToCart(e) {
        const productId = e.currentTarget.getAttribute('data-id');
        const toast = showToast('Añadiendo al carrito...');
        
        try {
            if (!window.Auth) {
                throw new Error('No autenticado');
            }
            const response = await Auth.fetchWithAuth('http://localhost:5003/carrito', {
                method: 'POST',
                body: JSON.stringify({ productoId: productId, cantidad: 1 })
            });
            const data = await response.json();
            if(!response.ok || !data.success) {
                throw new Error(data.message || 'Error al añadir al carrito');
            }
            toast.update('success', 'Producto añadido al carrito');
            // Opcional: refrescar contador
            if (window.Carrito?.actualizarContador) window.Carrito.actualizarContador();
            
            // Animación del botón
            const btn = e.currentTarget;
            btn.innerHTML = '<i class="fas fa-check"></i>';
            btn.classList.add('btn-success');
            
            setTimeout(() => {
                btn.innerHTML = '<i class="fas fa-cart-plus"></i>';
                btn.classList.remove('btn-success');
            }, 2000);
        } catch (error) {
            console.error('Error:', error);
            
            if(error.message.includes('No autenticado')) {
                toast.update('error', 'Debes iniciar sesión para añadir al carrito');
                setTimeout(() => {
                    window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
                }, 1500);
            } else {
                toast.update('error', error.message);
            }
        }
    }
    
    async function toggleWishlist(e) {
        if(!window.Auth || !Auth.isAuthenticated()) {
            showToast('Inicia sesión para guardar favoritos', 'error');
            setTimeout(() => {
                window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
            }, 1500);
            return;
        }
        
        const btn = e.currentTarget;
        const productId = btn.getAttribute('data-id');
        const isActive = btn.classList.contains('active');
        
        try {
            const response = await Auth.fetchWithAuth('/wishlist', {
                method: isActive ? 'DELETE' : 'POST',
                body: JSON.stringify({ productoId: productId })
            });
            
            const data = await response.json();
            
            if(data.success) {
                btn.classList.toggle('active');
                btn.innerHTML = isActive ? '<i class="far fa-heart"></i>' : '<i class="fas fa-heart"></i>';
                
                showToast(
                    isActive ? 'Eliminado de favoritos' : 'Añadido a favoritos', 
                    isActive ? 'info' : 'success'
                );
            } else {
                throw new Error(data.message || 'Error al actualizar favoritos');
            }
        } catch (error) {
            console.error('Error:', error);
            showToast(error.message, 'error');
        }
    }
    
    function updateCartCount(count) {
        document.querySelectorAll('.cart-count').forEach(el => {
            el.textContent = count;
            el.style.display = count > 0 ? 'inline-block' : 'none';
            
            // Animación
            el.classList.add('pulse');
            setTimeout(() => {
                el.classList.remove('pulse');
            }, 1000);
        });
    }
    
    function showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        return {
            update: function(newType, newMessage) {
                toast.className = `toast-notification ${newType}`;
                toast.textContent = newMessage;
            }
        };
    }
    
    // Verificar favoritos al cargar
    if (window.Auth && Auth.isAuthenticated()) {
        checkWishlistStatus();
    }
    
    async function checkWishlistStatus() {
        try {
            const response = await Auth.fetchWithAuth('/wishlist');
            const data = await response.json();
            
            if(data.success && data.wishlist) {
                data.wishlist.forEach(productId => {
                    const btn = document.querySelector(`.wishlist-btn[data-id="${productId}"]`);
                    if(btn) {
                        btn.classList.add('active');
                        btn.innerHTML = '<i class="fas fa-heart"></i>';
                    }
                });
            }
        } catch (error) {
            console.error('Error al cargar favoritos:', error);
        }
    }
});