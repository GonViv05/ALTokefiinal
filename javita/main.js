document.addEventListener('DOMContentLoaded', function() {
    // Inicializar componentes comunes
    initComponents();
    
    // Manejar menú móvil
    setupMobileMenu();
    
    // Manejar dropdown de usuario
    setupUserDropdown();
    
    // Inicializar tooltips
    initTooltips();
    
    // Manejar acordeones
    setupAccordions();
    
    // Configurar modales
    setupModals();
});

function initComponents() {
    // Actualizar año de copyright
    document.querySelector('.copyright')?.textContent = 
        `© ${new Date().getFullYear()} ALToke. Todos los derechos reservados.`;
    
    // Agregar clase de carga a las imágenes
    document.querySelectorAll('img[loading="lazy"]').forEach(img => {
        img.classList.add('loading-image');
        img.addEventListener('load', function() {
            this.classList.remove('loading-image');
            this.classList.add('loaded-image');
        });
    });
    
    // Mostrar/ocultar contador del carrito según autenticación
    if (typeof Auth !== 'undefined' && !Auth.isAuthenticated()) {
        document.querySelectorAll('.cart-count').forEach(el => el.style.display = 'none');
    }
}

function setupMobileMenu() {
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mainNav = document.querySelector('.main-nav');
    
    if(mobileMenuBtn && mainNav) {
        mobileMenuBtn.addEventListener('click', function() {
            mainNav.classList.toggle('show');
            this.innerHTML = mainNav.classList.contains('show') ? 
                '<i class="fas fa-times"></i>' : '<i class="fas fa-bars"></i>';
        });
    }
}

function setupUserDropdown() {
    const userBtn = document.querySelector('.user-btn');
    const dropdown = document.querySelector('.dropdown-menu');
    
    if(userBtn && dropdown) {
        userBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            dropdown.classList.toggle('show');
        });
        
        // Cerrar dropdown al hacer clic fuera
        document.addEventListener('click', function() {
            dropdown.classList.remove('show');
        });
    }
}

function initTooltips() {
    const tooltips = document.querySelectorAll('.tooltip');
    
    tooltips.forEach(tooltip => {
        const tooltipText = tooltip.querySelector('.tooltip-text');
        
        tooltip.addEventListener('mouseenter', function() {
            if(tooltipText) {
                tooltipText.style.visibility = 'visible';
                tooltipText.style.opacity = '1';
            }
        });
        
        tooltip.addEventListener('mouseleave', function() {
            if(tooltipText) {
                tooltipText.style.visibility = 'hidden';
                tooltipText.style.opacity = '0';
            }
        });
    });
}

function setupAccordions() {
    const accordions = document.querySelectorAll('.accordion');
    
    accordions.forEach(accordion => {
        const header = accordion.querySelector('.accordion-header');
        
        header.addEventListener('click', function() {
            accordion.classList.toggle('active');
            
            const content = accordion.querySelector('.accordion-content');
            if(accordion.classList.contains('active')) {
                content.style.maxHeight = content.scrollHeight + 'px';
            } else {
                content.style.maxHeight = '0';
            }
        });
    });
}

function setupModals() {
    // Abrir modales
    document.querySelectorAll('[data-modal]').forEach(btn => {
        btn.addEventListener('click', function() {
            const modalId = this.getAttribute('data-modal');
            const modal = document.getElementById(modalId);
            
            if(modal) {
                modal.style.display = 'block';
                document.body.style.overflow = 'hidden';
            }
        });
    });
    
    // Cerrar modales
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if(modal) {
                modal.style.display = 'none';
                document.body.style.overflow = '';
            }
        });
    });
    
    // Cerrar al hacer clic fuera
    window.addEventListener('click', function(e) {
        if(e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
            document.body.style.overflow = '';
        }
    });
}

// Helper para fetch con timeout
function fetchWithTimeout(url, options = {}, timeout = 8000) {
    return Promise.race([
        fetch(url, options),
        new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), timeout)
        )
    ]);
}

// Helper para formatear moneda
function formatCurrency(amount, currency = '₲') {
    return `${currency} ${amount.toLocaleString('es-PY')}`;
}

// Helper para formatear fechas
function formatDate(dateString, locale = 'es-PY') {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(locale, options);
}

// Exportar funciones para uso global (si es necesario)
window.App = {
    formatCurrency,
    formatDate,
    fetchWithTimeout
};