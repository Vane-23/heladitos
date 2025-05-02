class CartService {
    /**
     * Obtiene los items del carrito
     * Primero intenta desde la API, si falla usa localStorage
     */
    static async getCartItems() {
        try {
            if (!localStorage.getItem('token')) {
                return this.getLocalCart();
            }

            // Intentar obtener desde la API
            const response = await fetch('/api/cart', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const cartItems = await response.json();
            
            // Guardar en localStorage como respaldo
            localStorage.setItem('cartItems', JSON.stringify(cartItems));
            
            return cartItems;
        } catch (error) {
            console.error('❌ Error obteniendo carrito desde API:', error);
            
            // Si falla, usar localStorage
            return this.getLocalCart();
        }
    }

    /**
     * Obtiene el carrito desde localStorage
     */
    static getLocalCart() {
        const cartJson = localStorage.getItem('cartItems');
        return cartJson ? JSON.parse(cartJson) : [];
    }

    /**
     * Añade un item al carrito
     */
    static async addItem(flavour_id, quantity = 1) {
        try {
            if (!localStorage.getItem('token')) {
                // Si no hay token, guardar solo localmente
                // Esta lógica debería expandirse para manejar items locales
                alert('Inicia sesión para agregar productos al carrito');
                window.location.href = '/login';
                return;
            }

            const response = await fetch('/api/cart/items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ flavour_id, cantidad: quantity })
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            // Actualizar versión local después de éxito
            await this.refreshLocalCart();
            
            return true;
        } catch (error) {
            console.error('❌ Error agregando item al carrito:', error);
            throw error;
        }
    }

    /**
     * Actualiza la cantidad de un item
     */
    static async updateQuantity(itemId, quantity) {
        try {
            const response = await fetch(`/api/cart/items/${itemId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ cantidad: quantity })
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            // Actualizar versión local después de éxito
            await this.refreshLocalCart();
            
            return true;
        } catch (error) {
            console.error('❌ Error actualizando cantidad:', error);
            throw error;
        }
    }

    /**
     * Elimina un item del carrito
     */
    static async removeItem(itemId) {
        try {
            const response = await fetch(`/api/cart/items/${itemId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            // Actualizar versión local después de éxito
            await this.refreshLocalCart();
            
            return true;
        } catch (error) {
            console.error('❌ Error eliminando item:', error);
            throw error;
        }
    }

    /**
     * Vacía el carrito
     */
    static async clearCart() {
        try {
            const response = await fetch('/api/cart', {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            // Limpiar versión local
            localStorage.removeItem('cartItems');
            
            return true;
        } catch (error) {
            console.error('❌ Error vaciando carrito:', error);
            throw error;
        }
    }

    /**
     * Actualiza la versión local del carrito desde el servidor
     */
    static async refreshLocalCart() {
        try {
            if (!localStorage.getItem('token')) return false;

            const response = await fetch('/api/cart', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) return false;

            const cartItems = await response.json();
            localStorage.setItem('cartItems', JSON.stringify(cartItems));
            
            return true;
        } catch (error) {
            console.error('❌ Error actualizando caché local del carrito:', error);
            return false;
        }
    }

    /**
     * Calcula el total del carrito
     */
    static calculateTotal(items) {
        const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        const tax = subtotal * 0.21;
        const total = subtotal + tax;
        
        return {
            subtotal,
            tax,
            total
        };
    }

    /**
     * Obtiene el número total de items en el carrito
     */
    static getItemCount() {
        const items = this.getLocalCart();
        return items.reduce((count, item) => count + item.quantity, 0);
    }
}

// Función para actualizar la visualización del carrito
function updateCartDisplay(items) {
    console.log('🖥️ Renderizando carrito con datos:', items);
    
    const cartItemsDiv = document.getElementById('cartItems');
    cartItemsDiv.innerHTML = '';

    if (!items || items.length === 0) {
        cartItemsDiv.innerHTML = `
            <div class="bg-white rounded-lg shadow-sm p-8 text-center">
                <div class="text-gray-400 mb-4">
                    <i class="fas fa-shopping-cart fa-4x"></i>
                </div>
                <h3 class="text-xl font-semibold text-gray-700 mb-2">Tu carrito está vacío</h3>
                <p class="text-gray-500 mb-6">¡Agrega algunos productos deliciosos!</p>
                <a href="/flavours" class="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                    Ver Sabores Disponibles
                </a>
            </div>
        `;
        
        // Ocultar sección de totales y botón de checkout
        const totalSection = document.getElementById('totalsSection');
        if (totalSection) totalSection.classList.add('hidden');
        return;
    }

    // Mostrar sección de totales si hay items
    const totalSection = document.getElementById('totalsSection');
    if (totalSection) totalSection.classList.remove('hidden');

    // Crear elementos para cada item
    items.forEach(item => {
        // Comprobar que los valores necesarios no sean nulos
        const name = item.name || 'Producto sin nombre';
        const price = item.price || 0;
        const quantity = item.quantity || 0;
        const image = item.flavour_image || '/images/uploads/default-flavor.png';
        
        console.log(`🖼️ Detalles de imagen para ${name}:`, {
            id: item.flavour_id,
            image: image
        });

        const itemElement = document.createElement('div');
        itemElement.className = 'bg-white rounded-lg shadow-sm p-4 flex items-center justify-between';
        itemElement.innerHTML = `
            <div class="flex items-center">
                <img 
                    src="${image}" 
                    alt="${name}" 
                    class="w-16 h-16 rounded-lg object-cover"
                    onerror="this.src='/images/uploads/default-flavor.png'; this.onerror=null;"
                >
                <div class="ml-4">
                    <h3 class="font-semibold">${name}</h3>
                    <p class="text-gray-600">$${typeof price === 'number' ? price.toFixed(2) : '0.00'}</p>
                </div>
            </div>
            <div class="flex items-center">
                <button class="text-gray-500 hover:text-gray-700 decrement-btn" data-id="${item.id}" data-quantity="${quantity}">
                    <i class="fas fa-minus"></i>
                </button>
                <span class="mx-4">${quantity}</span>
                <button class="text-gray-500 hover:text-gray-700 increment-btn" data-id="${item.id}" data-quantity="${quantity}">
                    <i class="fas fa-plus"></i>
                </button>
                <button class="ml-6 text-red-500 hover:text-red-700 remove-btn" data-id="${item.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        cartItemsDiv.appendChild(itemElement);
    });

    // Asignar event listeners a los botones de incrementar, decrementar y eliminar
    cartItemsDiv.querySelectorAll('.increment-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const itemId = this.getAttribute('data-id');
            let quantity = parseInt(this.getAttribute('data-quantity'));
            quantity++;
            try {
                await CartService.updateQuantity(itemId, quantity);
                await loadCartItems();
            } catch (error) {
                alert('Error al incrementar la cantidad');
            }
        });
    });
    cartItemsDiv.querySelectorAll('.decrement-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const itemId = this.getAttribute('data-id');
            let quantity = parseInt(this.getAttribute('data-quantity'));
            if (quantity > 1) {
                quantity--;
                try {
                    await CartService.updateQuantity(itemId, quantity);
                    await loadCartItems();
                } catch (error) {
                    alert('Error al decrementar la cantidad');
                }
            }
        });
    });
    cartItemsDiv.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', async function() {
            const itemId = this.getAttribute('data-id');
            if (confirm('¿Seguro que quieres eliminar este producto del carrito?')) {
                try {
                    await CartService.removeItem(itemId);
                    await loadCartItems();
                } catch (error) {
                    alert('Error al eliminar el producto');
                }
            }
        });
    });

    updateTotals(items);
}

// Función para actualizar los totales
function updateTotals(items) {
    const { subtotal, tax, total } = CartService.calculateTotal(items);

    console.log('💰 Calculando totales:');
    console.log('- Subtotal:', subtotal.toFixed(2));
    console.log('- IVA:', tax.toFixed(2));
    console.log('- Total:', total.toFixed(2));

    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
}

// Función para cargar los items del carrito
async function loadCartItems() {
    try {
        console.log('🔍 Intentando cargar el carrito...');
        
        // Mostrar spinner mientras carga
        document.getElementById('cartItems').innerHTML = `
            <div class="text-center py-6">
                <i class="fas fa-spinner fa-spin fa-2x text-blue-500 mb-3"></i>
                <p class="text-gray-500">Cargando tu carrito...</p>
            </div>
        `;
        
        // Usar el servicio de carrito mejorado
        const cartItems = await CartService.getCartItems();
        console.log('🛒 Items cargados del carrito:', cartItems);
        
        // Verificar estructura de los datos
        if (Array.isArray(cartItems)) {
            console.log(`🛍️ Se encontraron ${cartItems.length} items en el carrito`);
            cartItems.forEach((item, index) => {
                console.log(`Item ${index+1}:`, item);
            });
        } else {
            console.error('⚠️ Los datos del carrito no son un array:', cartItems);
        }
        
        updateCartDisplay(cartItems);
    } catch (error) {
        console.error('❌ Error cargando el carrito:', error);
        document.getElementById('cartItems').innerHTML = 
            '<div class="bg-white rounded-lg shadow-sm p-4 text-center text-red-500">Error al cargar el carrito: ' + error.message + '</div>';
    }
}

// Función para actualizar el contador del carrito en el navbar
function updateCartCount() {
    const count = CartService.getItemCount();
    const countElement = document.getElementById('cartCount');
    
    if (countElement) {
        countElement.textContent = count;
        countElement.classList.toggle('hidden', count === 0);
    }
}

// Inicializar la página de carrito
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔄 Inicializando página de carrito');
    loadCartItems();

    // Procesar al pago
    const checkoutButton = document.getElementById('checkoutButton');
    if (checkoutButton) {
        checkoutButton.addEventListener('click', function() {
            // Crear el modal de confirmación
            const modalHtml = `
                <div id="confirmationModal" class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
                    <div class="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
                        <h2 class="text-2xl font-bold mb-4">Confirmar Compra</h2>
                        <p class="mb-4">¿Estás seguro de que deseas finalizar tu compra?</p>
                        
                        <div class="flex justify-between">
                            <button id="cancelPurchase" class="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300">
                                Cancelar
                            </button>
                            <button id="confirmPurchase" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                                Confirmar Compra
                            </button>
                        </div>
                    </div>
                </div>
            `;

            // Insertar el modal en el documento
            document.body.insertAdjacentHTML('beforeend', modalHtml);

            // Obtener referencias a los botones del modal
            const cancelButton = document.getElementById('cancelPurchase');
            const confirmButton = document.getElementById('confirmPurchase');

            // Evento para cerrar el modal
            const closeModal = () => {
                const modal = document.getElementById('confirmationModal');
                if (modal) {
                    modal.remove();
                }
            };

            // Evento de cancelar
            cancelButton.addEventListener('click', closeModal);

            // Evento de confirmar compra
            confirmButton.addEventListener('click', async function() {
                try {
                    // Obtener los items del carrito
                    const response = await fetch('/api/cart', {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    });

                    if (!response.ok) {
                        throw new Error('No se pudo obtener los items del carrito');
                    }

                    const cartItems = await response.json();

                    // Calcular total
                    const totalAmount = cartItems.reduce((total, item) => 
                        total + (item.price * item.quantity), 0);

                    // Preparar datos para la orden
                    const orderData = {
                        total_amount: totalAmount,
                        items: cartItems.map(item => ({
                            flavour_id: item.flavour_id,
                            quantity: item.quantity,
                            price: item.price
                        }))
                    };

                    // Enviar orden al backend
                    const orderResponse = await fetch('/api/orders', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        },
                        body: JSON.stringify(orderData)
                    });

                    if (!orderResponse.ok) {
                        throw new Error('Error al crear la orden');
                    }

                    // Cerrar modal
                    closeModal();

                    // Mostrar mensaje de éxito
                    alert('¡Compra realizada con éxito!');

                    // Redirigir a lista de compras o recargar página
                    window.location.href = '/orders';
                } catch (error) {
                    console.error('Error al procesar la compra:', error);
                    alert('Hubo un error al procesar tu compra. Intenta nuevamente.');
                }
            });
        });
    }
});

// Exponer globalmente
window.CartService = CartService;
window.updateCartCount = updateCartCount;