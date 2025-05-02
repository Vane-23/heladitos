document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');

    loginForm.addEventListener('submit', async function(event) {
        event.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                console.log('Inicio de sesión exitoso:', data); // Debug log
                localStorage.setItem('token', data.token);
                localStorage.setItem('isAdmin', data.isAdmin);
                window.location.href = '/';
            } else {
                console.error('Error en el inicio de sesión:', data.error); // Debug log
                alert('Error: ' + data.error);
            }
        } catch (error) {
            console.error('Error en el proceso de inicio de sesión:', error);
            alert('Error al iniciar sesión. Por favor, inténtelo de nuevo.');
        }
    });
});
