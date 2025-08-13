class Auth {
    static isAuthenticated() {
        const token = localStorage.getItem('token');
        if(!token) return false;
        try {
            let payload;
            if (token.includes('.')) {
                payload = JSON.parse(atob(token.split('.')[1]));
            } else {
                payload = JSON.parse(atob(token));
            }
            return payload.exp > Math.floor(Date.now() / 1000);
        } catch {
            return false;
        }
    }
    
    static getUser() {
        const token = localStorage.getItem('token');
        if(!token) return null;
        try {
            let payload;
            if (token.includes('.')) {
                payload = JSON.parse(atob(token.split('.')[1]));
            } else {
                payload = JSON.parse(atob(token));
            }
            return {
                id: payload.id,
                email: payload.email,
                name: payload.name || '',
                role: payload.role || 'user',
                exp: payload.exp
            };
        } catch {
            return null;
        }
    }
    
    static async login(email, password) {
        try {
            const response = await fetch('http://localhost:5002/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if(!response.ok) {
                throw new Error(data.message || 'Error de autenticación');
            }
            
            if(data.success && data.token) {
                localStorage.setItem('token', data.token);
                
                // Actualizar UI según rol
                this.updateAuthUI();
                
                return true;
            } else {
                throw new Error(data.message || 'Credenciales inválidas');
            }
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }
    
    static logout() {
        localStorage.removeItem('token');
        this.updateAuthUI();
        window.location.href = '/login.html';
    }
    
    static updateAuthUI() {
        const user = this.getUser();
        const authElements = document.querySelectorAll('[data-auth]');
        
        authElements.forEach(el => {
            const authState = el.getAttribute('data-auth');
            
            if(authState === 'authenticated') {
                el.style.display = user ? 'block' : 'none';
            } else if(authState === 'unauthenticated') {
                el.style.display = user ? 'none' : 'block';
            } else if(authState === 'admin' && user?.role === 'admin') {
                el.style.display = 'block';
            }
        });
        
        // Actualizar información del usuario
        const userElements = document.querySelectorAll('[data-user]');
        userElements.forEach(el => {
            const prop = el.getAttribute('data-user');
            if(user && user[prop]) {
                el.textContent = user[prop];
            }
        });
    }
    
    static async fetchWithAuth(url, options = {}) {
        const token = localStorage.getItem('token');
        
        if(!token) {
            throw new Error('No autenticado');
        }
        
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        };
        
        const config = {
            ...options,
            headers
        };
        
        const response = await fetch(url, config);
        
        if(response.status === 401) {
            this.logout();
            throw new Error('Sesión expirada');
        }
        
        if(!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error en la solicitud');
        }
        
        return response;
    }
    
    static async refreshToken() {
        try {
            const response = await this.fetchWithAuth('/auth/refresh');
            const data = await response.json();
            
            if(data.success && data.token) {
                localStorage.setItem('token', data.token);
                return true;
            }
        } catch (error) {
            console.error('Error al refrescar token:', error);
            return false;
        }
    }
}

// Asegurar disponibilidad global
window.Auth = Auth;

// Inicializar UI de autenticación al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    Auth.updateAuthUI();
    
    // Verificar expiración del token cada minuto
    setInterval(() => {
        if(Auth.isAuthenticated()) {
            const user = Auth.getUser();
            // Refrescar token si falta menos de 5 minutos para expirar
            if(user.exp - 300 < Math.floor(Date.now() / 1000)) {
                Auth.refreshToken();
            }
        }
    }, 60000);
});