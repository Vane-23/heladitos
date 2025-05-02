class AuthService {
    static async register(userData) {
        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: userData.name,
                    email: userData.email,
                    password: userData.password
                })
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || 'Error en el registro');
            }

            return data;
        } catch (error) {
            throw error;
        }
    }

    static async login(credentials) {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(credentials)
            });
    
            const data = await response.json();
    
            if (!response.ok) {
                throw new Error(data.error || 'Error en el login');
            }
    
            // Asegúrate de que isAdmin se guarde como string 'true' o 'false'
            localStorage.setItem('token', data.token);
            localStorage.setItem('isAdmin', data.isAdmin === 1 || data.isAdmin === true ? 'true' : 'false');
            
            console.log('Login exitoso, isAdmin:', data.isAdmin);
            console.log('isAdmin guardado:', localStorage.getItem('isAdmin'));
            
            return data;
        } catch (error) {
            throw error;
        }
    }

    static logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('isAdmin');
        window.location.href = '/login';
    }

    static isAuthenticated() {
        return !!localStorage.getItem('token');
    }

    static isAdmin() {
        return localStorage.getItem('isAdmin') === 'true';
    }
}

// Event listeners para los formularios
document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.getElementById('loginForm');

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);

            try {
                await AuthService.register({
                    name: formData.get('name'),
                    email: formData.get('email'),
                    password: formData.get('password')
                });

                alert('Registro exitoso!');
                window.location.href = '/login';
            } catch (error) {
                alert(error.message);
            }
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);

            try {
                await AuthService.login({
                    email: formData.get('email'),
                    password: formData.get('password')
                });

                window.location.href = '/';
            } catch (error) {
                alert(error.message);
            }
        });
    }
});