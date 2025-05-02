document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Verificar si el usuario tiene un token válido
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login?redirect=/my-orders';
            return;
        }

        // Realizar la petición al backend para obtener todas las órdenes
        const response = await fetch('/api/orders', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'No se pudieron obtener los pedidos');
        }

        const orders = await response.json();
        
        // Referencia al contenedor donde mostraremos las órdenes
        const ordersContainer = document.getElementById('ordersContainer');
        ordersContainer.innerHTML = ''; // Limpiar el spinner
        
        if (!orders || !Array.isArray(orders) || orders.length === 0) {
            // Mostrar mensaje de que no hay órdenes
            document.getElementById('noOrdersMessage').classList.remove('hidden');
            return;
        }
        
        // Template para cada orden
        const orderTemplate = document.getElementById('orderTemplate');
        const orderItemTemplate = document.getElementById('orderItemTemplate');
        
        // Para cada orden
        orders.forEach(order => {
            // Clonar el template de orden
            const orderElement = document.importNode(orderTemplate.content, true);
            
            // Llenar los datos de la orden
            orderElement.querySelector('.order-id').textContent = order.id;
            
            // Formatear la fecha (yyyy-mm-dd a dd/mm/yyyy)
            const orderDate = new Date(order.created_at);
            const formattedDate = orderDate.toLocaleDateString('es-ES', {
                day: '2-digit', 
                month: '2-digit', 
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
            orderElement.querySelector('.order-date').textContent = formattedDate;
            
            // Establecer el estado con color adecuado
            const statusElement = orderElement.querySelector('.order-status');
            statusElement.textContent = order.status;
            
            // Ajustar color según estado
            switch(order.status.toLowerCase()) {
                case 'pendiente':
                    statusElement.classList.add('bg-yellow-100', 'text-yellow-800');
                    break;
                case 'completada':
                    statusElement.classList.add('bg-green-100', 'text-green-800');
                    break;
                case 'cancelada':
                    statusElement.classList.add('bg-red-100', 'text-red-800');
                    break;
                default:
                    statusElement.classList.add('bg-gray-100', 'text-gray-800');
            }
            
            // Contenedor de items
            const itemsContainer = orderElement.querySelector('.order-items');
            
            // Para cada item de la orden
            order.items.forEach(item => {
                // Clonar el template de item
                const itemElement = document.importNode(orderItemTemplate.content, true);
                
                // Llenar los datos del item
                itemElement.querySelector('.item-image').src = item.flavour_image || '/images/uploads/default-flavor.png';
                itemElement.querySelector('.item-image').alt = item.flavour_name;
                itemElement.querySelector('.item-name').textContent = item.flavour_name;
                itemElement.querySelector('.item-quantity').textContent = `Cantidad: ${item.quantity}`;
                itemElement.querySelector('.item-price').textContent = `$${(item.price * item.quantity).toFixed(2)}`;
                
                // Añadir el item a su contenedor
                itemsContainer.appendChild(itemElement);
            });
            
            // Mostrar el total
            orderElement.querySelector('.order-total').textContent = `$${order.total_amount.toFixed(2)}`;
            
            // Añadir la orden al contenedor principal
            ordersContainer.appendChild(orderElement);
        });
        
    } catch (error) {
        console.error('Error al cargar las órdenes:', error);
        
        const ordersContainer = document.getElementById('ordersContainer');
        ordersContainer.innerHTML = `
            <div class="text-center py-10">
                <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                <p class="text-red-500 font-semibold">No se pudieron cargar tus pedidos</p>
                <p class="text-gray-600 mt-2">${error.message}</p>
                <a href="/" class="inline-block mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                    Volver al Inicio
                </a>
            </div>
        `;
    }
});