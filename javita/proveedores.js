document.addEventListener('DOMContentLoaded', function() {
    // Manejar el formulario de registro
    const supplierForm = document.getElementById('supplierForm');
    
    if (supplierForm) {
        supplierForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Validar RUC (ejemplo para Paraguay)
            const ruc = document.getElementById('ruc').value;
            if(!/^\d{6,8}-\d$/.test(ruc)) {
                showToast('El RUC debe tener el formato 1234567-8', 'error');
                return;
            }
            
            // Validar teléfono
            const phone = document.getElementById('phone').value;
            if(!/^(\+595|0)[1-9]\d{7,8}$/.test(phone)) {
                showToast('Ingrese un número de teléfono válido para Paraguay', 'error');
                return;
            }
            
            // Validar categorías seleccionadas
            const categories = Array.from(document.getElementById('categories').selectedOptions)
                .map(option => option.value);
                
            if(categories.length === 0) {
                showToast('Seleccione al menos una categoría', 'error');
                return;
            }
            
            // Mostrar loader
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
            submitBtn.disabled = true;
            
            try {
                // Envío real al backend Python
                const payload = {
                    company: document.getElementById('company').value,
                    ruc: ruc,
                    contact: document.getElementById('contact').value,
                    email: document.getElementById('email').value,
                    phone: phone,
                    categories: categories,
                    message: document.getElementById('message').value
                };
                const response = await fetch('/proveedor/registro', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await response.json();
                if (!data.success) throw new Error(data.message || 'Error en el registro');
                showToast('Gracias por tu solicitud. Nos pondremos en contacto contigo pronto.', 'success');
                supplierForm.reset();
                
                // Mostrar mensaje de confirmación
                const confirmationModal = document.createElement('div');
                confirmationModal.className = 'modal';
                confirmationModal.innerHTML = `
                    <div class="modal-content">
                        <h3>Solicitud Enviada</h3>
                        <p>Hemos recibido tu solicitud para ser proveedor de ALToke. Nuestro equipo revisará tu información y se pondrá en contacto contigo en un plazo de 3 días hábiles.</p>
                        <p>Mientras tanto, puedes explorar nuestra plataforma y conocer más sobre nuestros servicios.</p>
                        <button class="btn btn-primary close-confirmation">Entendido</button>
                    </div>
                `;
                document.body.appendChild(confirmationModal);
                confirmationModal.style.display = 'block';
                
                document.querySelector('.close-confirmation').addEventListener('click', () => {
                    confirmationModal.style.display = 'none';
                    document.body.removeChild(confirmationModal);
                });
            } catch (error) {
                console.error('Error:', error);
                showToast('Ocurrió un error al enviar el formulario. Por favor intenta nuevamente.', 'error');
            } finally {
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
        });
    }
    
    // Manejar la paginación
    const paginationButtons = document.querySelectorAll('.pagination button');
    
    paginationButtons.forEach(button => {
        button.addEventListener('click', async function() {
            // Mostrar loader
            const suppliersList = document.querySelector('.suppliers-list');
            const loader = document.createElement('div');
            loader.className = 'loading-overlay';
            loader.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Cargando más proveedores...';
            suppliersList.appendChild(loader);
            
            // Simular carga de datos
            try {
                await new Promise(resolve => setTimeout(resolve, 1000));
                
                // Aquí iría la lógica real para cargar más proveedores
                // Por ahora solo agregamos un proveedor de ejemplo
                const newSupplier = document.createElement('div');
                newSupplier.className = 'supplier-detail slide-up';
                newSupplier.innerHTML = `
                    <div class="supplier-main">
                        <div class="supplier-logo">
                            <img src="https://via.placeholder.com/100" alt="Nuevo Proveedor">
                        </div>
                        <div class="supplier-info">
                            <h3>Nuevo Proveedor Ejemplo</h3>
                            <div class="supplier-meta">
                                <span class="supplier-category"><i class="fas fa-tag"></i> Materiales Básicos</span>
                                <span class="supplier-location"><i class="fas fa-map-marker-alt"></i> Asunción</span>
                            </div>
                            <div class="supplier-rating">
                                <div class="stars">
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="fas fa-star"></i>
                                    <i class="far fa-star"></i>
                                    <span>4.0 (10 evaluaciones)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="supplier-actions">
                        <a href="#" class="btn btn-outline"><i class="fas fa-boxes"></i> Ver Productos</a>
                        <a href="#" class="btn btn-primary"><i class="fas fa-envelope"></i> Contactar</a>
                    </div>
                `;
                
                suppliersList.insertBefore(newSupplier, loader);
                loader.remove();
                
                // Animación para el nuevo elemento
                setTimeout(() => {
                    newSupplier.classList.add('fade-in');
                }, 50);
                
            } catch (error) {
                console.error('Error:', error);
                loader.innerHTML = '<div class="error-message">Error al cargar proveedores. <button class="retry-btn">Reintentar</button></div>';
                loader.querySelector('.retry-btn').addEventListener('click', () => button.click());
            }
        });
    });
    
    // Manejar búsqueda y filtros
    const searchBox = document.querySelector('.search-box input');
    const categoryFilter = document.querySelector('.category-filter');
    
    if(searchBox) {
        searchBox.addEventListener('input', debounce(() => {
            filterSuppliers();
        }, 300));
    }
    
    if(categoryFilter) {
        categoryFilter.addEventListener('change', () => {
            filterSuppliers();
        });
    }
    
    function filterSuppliers() {
        const searchTerm = searchBox.value.toLowerCase();
        const category = categoryFilter.value;
        
        document.querySelectorAll('.supplier-detail').forEach(supplier => {
            const name = supplier.querySelector('h3').textContent.toLowerCase();
            const supplierCategory = supplier.querySelector('.supplier-category').textContent.toLowerCase();
            const matchSearch = name.includes(searchTerm);
            const matchCategory = category === '' || supplierCategory.includes(category.toLowerCase());
            
            if(matchSearch && matchCategory) {
                supplier.style.display = 'flex';
                supplier.classList.add('fade-in');
            } else {
                supplier.style.display = 'none';
            }
        });
    }
    
    // Función para mostrar notificaciones
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
    
    // Función debounce para mejorar performance en búsqueda
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this, args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(context, args);
            }, wait);
        };
    }
    
    // Cargar proveedores al inicio
    loadFeaturedSuppliers();
    
    async function loadFeaturedSuppliers() {
        try {
            // Simular carga de datos
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Aquí iría la llamada real a la API
            // const response = await fetch('/api/suppliers/featured');
            // const data = await response.json();
            
            // Por ahora solo mostramos un mensaje en consola
            console.log('Proveedores destacados cargados');
        } catch (error) {
            console.error('Error al cargar proveedores destacados:', error);
        }
    }
});