class Carrito {
    static async agregarProducto(productoId, cantidad = 1) {
        try {
            // Asegura que productoId sea número
            productoId = Number(productoId);
            const response = await Auth.fetchWithAuth('http://localhost:5003/carrito', {
                method: 'POST',
                body: JSON.stringify({ productoId, cantidad })
            });
            const data = await response.json();
            if(!data.success) {
                // Devuelve el mensaje de error del backend
                throw new Error(data.message || 'Error al agregar al carrito');
            }
            this.actualizarContador();
            return data;
        } catch (error) {
            console.error('Error al agregar al carrito:', error);
            throw error;
        }
    }
    
    static async obtenerCarrito() {
        try {
            const response = await Auth.fetchWithAuth('http://localhost:5003/carrito');
            const data = await response.json();
            
            if(!data.success) {
                throw new Error(data.message || 'Error al obtener carrito');
            }
            
            return data;
        } catch (error) {
            console.error('Error al obtener carrito:', error);
            
            // Si es error de autenticación, redirigir a login
            if(error.message.includes('No autenticado') || error.message.includes('Sesión expirada')) {
                window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
            }
            
            throw error;
        }
    }
    
    static async actualizarCantidad(itemId, nuevaCantidad) {
        try {
            const response = await Auth.fetchWithAuth('http://localhost:5003/carrito', {
                method: 'PUT',
                body: JSON.stringify({ itemId, nuevaCantidad })
            });
            
            const data = await response.json();
            
            if(!data.success) {
                throw new Error(data.message || 'Error al actualizar carrito');
            }
            
            this.actualizarContador();
            return data;
        } catch (error) {
            console.error('Error al actualizar carrito:', error);
            throw error;
        }
    }
    
    static async eliminarItem(itemId) {
        try {
            const response = await Auth.fetchWithAuth('http://localhost:5003/carrito', {
                method: 'DELETE',
                body: JSON.stringify({ itemId })
            });
            
            const data = await response.json();
            
            if(!data.success) {
                throw new Error(data.message || 'Error al eliminar del carrito');
            }
            
            this.actualizarContador();
            return data;
        } catch (error) {
            console.error('Error al eliminar del carrito:', error);
            throw error;
        }
    }
    
    static async actualizarContador() {
        try {
            if(!Auth.isAuthenticated()) {
                document.querySelectorAll('.cart-count').forEach(el => {
                    el.style.display = 'none';
                });
                return;
            }
            
            const data = await this.obtenerCarrito();
            const count = data.items?.reduce((total, item) => total + item.cantidad, 0) || 0;
            
            document.querySelectorAll('.cart-count').forEach(el => {
                el.textContent = count;
                el.style.display = count > 0 ? 'inline-block' : 'none';
            });
        } catch (error) {
            console.error('Error al actualizar contador:', error);
            document.querySelectorAll('.cart-count').forEach(el => {
                el.style.display = 'none';
            });
        }
    }
    
    static async vaciarCarrito() {
        try {
            const response = await Auth.fetchWithAuth('http://localhost:5003/carrito', {
                method: 'DELETE'
            });
            
            const data = await response.json();
            
            if(!data.success) {
                throw new Error(data.message || 'Error al vaciar carrito');
            }
            
            this.actualizarContador();
            return data;
        } catch (error) {
            console.error('Error al vaciar carrito:', error);
            throw error;
        }
    }
}

// Actualizar contador al cargar la página y cada minuto
document.addEventListener('DOMContentLoaded', () => {
    Carrito.actualizarContador();
    setInterval(() => Carrito.actualizarContador(), 60000);
});