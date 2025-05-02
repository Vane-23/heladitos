document.addEventListener('DOMContentLoaded', function() {
    const navbar = `
    <nav class="bg-white shadow-sm border-b">
        <div class="max-w-7xl mx-auto px-4">
            <div class="flex justify-between items-center h-16">
                <!-- Logo y Búsqueda -->
                <div class="flex items-center flex-1 space-x-4">
                    <a href="/" class="flex-shrink-0">
                        <img class="h-8 w-auto" src="/images/helado-artesanal.jpg" alt="Logo">
                    </a>
                    <div class="max-w-lg w-full">
                        <div class="relative">
                            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <i class="fas fa-search text-gray-400"></i>
                            </div>
                            <input type="text" 
                                placeholder="Buscar sabor..." 
                                class="w-full bg-gray-50 border border-gray-300 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                id="searchInput">
                            <div id="searchResults" class="absolute mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg z-10 hidden"></div>
                        </div>
                    </div>
                </div>

                <!-- Navegación -->
                <div class="flex items-center space-x-8">
                    <a href="/" class="text-gray-700 hover:text-gray-900 font-medium">
                        Inicio
                    </a>
                    <a href="/nosotros" class="text-gray-700 hover:text-gray-900 font-medium">
                        Nosotros
                    </a>
                    <a href="/flavours" class="text-gray-700 hover:text-gray-900 font-medium">
                        Sabores
                    </a>
                    
                    <!-- Carrito con número azul -->
                    <a href="/cart" class="text-gray-700 hover:text-gray-900 relative">
                        <span id="cartCount" class="absolute -top-2 -right-2 bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">0</span>
                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </a>

                    <!-- Auth Section -->
                    <div id="authSection">
                        <!-- Se actualiza dinámicamente -->
                    </div>
                </div>
            </div>
        </div>
    </nav>
    `;

    document.body.insertAdjacentHTML('afterbegin', navbar);
    updateAuthSection();
    setupSearch();
});

// Función para actualizar la sección de autenticación
function updateAuthSection() {
    const token = localStorage.getItem('token');
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const authSection = document.getElementById('authSection');
    
    if (token) {
        authSection.innerHTML = `
            <div class="flex items-center space-x-4">
                ${isAdmin ? `
                    <a href="/admin/users" class="text-gray-700 hover:text-gray-900 font-medium">
                        <i class="fas fa-users"></i> Usuarios
                    </a>
                ` : ''}
                 <a href="/my-orders" class="text-gray-700 hover:text-gray-900 font-medium">
                    <i class="fas fa-list"></i> Mis Pedidos
                </a>
                <button onclick="logout()" class="text-gray-700 hover:text-gray-900 font-medium">
                    Cerrar Sesión
                </button>
                <div class="relative">
                    <img class="h-10 w-10 rounded-full object-cover border-2 border-gray-200" 
                         src="/imagenes/avatar.jpg" 
                         alt="Avatar">
                </div>
            </div>
        `;
    } else {
        authSection.innerHTML = `
            <a href="/login" class="text-gray-700 hover:text-gray-900 font-medium flex items-center space-x-2">
                <i class="fas fa-user"></i>
                <span>Iniciar Sesión</span>
            </a>
        `;
    }
}

// Función de logout
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    updateAuthSection();
    window.location.href = '/login';
}

// Actualizar contador del carrito
async function updateCartCount() {
    if (!localStorage.getItem('token')) return;
    
    try {
        // Primero intenta obtener los datos del carrito desde la API
        const response = await fetch('/api/cart', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (response.status === 401) {
            logout();
            return;
        }
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const cart = await response.json();
        
        // Guarda los datos del carrito en localStorage para persistencia
        localStorage.setItem('cartItems', JSON.stringify(cart));
        
        // Calcula el total de items
        const count = Array.isArray(cart) ? cart.reduce((total, item) => total + (item.quantity || 0), 0) : 0;
        
        // Actualiza el contador visual
        const cartCountElement = document.querySelector('#cartCount');
        if (cartCountElement) {
            cartCountElement.textContent = count;
            // Ocultar contador si no hay items
            cartCountElement.style.display = count > 0 ? 'flex' : 'none';
        }
    } catch (error) {
        console.error('Error al actualizar carrito:', error);
        
        // Si falla la API, intenta usar datos locales como respaldo
        try {
            const cartDataJson = localStorage.getItem('cartItems');
            if (cartDataJson) {
                const cartData = JSON.parse(cartDataJson);
                const count = cartData.reduce((total, item) => total + (item.quantity || 0), 0);
                
                const cartCountElement = document.querySelector('#cartCount');
                if (cartCountElement) {
                    cartCountElement.textContent = count;
                    cartCountElement.style.display = count > 0 ? 'flex' : 'none';
                }
            }
        } catch (localError) {
            console.error('Error al usar datos locales del carrito:', localError);
        }
    }
}

// Actualizar contador del carrito al cargar la página
if (localStorage.getItem('token')) {
    updateCartCount();
}

// Función para configurar la búsqueda en tiempo real
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');

    searchInput.addEventListener('input', async function() {
        const query = searchInput.value.trim();
        if (query.length === 0) {
            searchResults.innerHTML = '';
            searchResults.classList.add('hidden');
            return;
        }

        try {
            const response = await fetch(`/api/flavours?search=${query}`);
            const results = await response.json();

            if (results.length > 0) {
                searchResults.innerHTML = results.map(result => `
                    <a href="/flavours/${result.id}" class="block px-4 py-2 text-gray-700 hover:bg-gray-100">
                        ${result.name}
                    </a>
                `).join('');
                searchResults.classList.remove('hidden');
            } else {
                searchResults.innerHTML = '<div class="px-4 py-2 text-gray-700">No se encontraron resultados</div>';
                searchResults.classList.remove('hidden');
            }
        } catch (error) {
            console.error('Error al buscar sabores:', error);
        }
    });
    
    window.refreshCart = updateCartCount;

}