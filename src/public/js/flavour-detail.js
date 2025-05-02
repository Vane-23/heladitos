document.addEventListener('DOMContentLoaded', async function() {
    const flavourId = window.location.pathname.split('/').pop();
    const flavourDetailDiv = document.getElementById('flavourDetail');

    try {
        const response = await fetch(`/api/flavours/${flavourId}`);
        if (!response.ok) {
            throw new Error('Error al obtener los detalles del sabor');
        }
        const flavour = await response.json();
        displayFlavourDetail(flavour);
    } catch (error) {
        console.error('Error al cargar los detalles del sabor:', error);
        flavourDetailDiv.innerHTML = '<p class="text-red-500">Error al cargar los detalles del sabor</p>';
    }
});

function displayFlavourDetail(flavour) {
    const flavourDetailDiv = document.getElementById('flavourDetail');
    flavourDetailDiv.innerHTML = `
        <div class="flex flex-col md:flex-row items-center md:items-start">
            <img src="${flavour.image}" alt="${flavour.name}" class="w-64 h-64 object-cover rounded-lg shadow-md mb-4 md:mb-0 md:mr-8">
            <div class="flex-1">
                <h1 class="text-3xl font-bold mb-4">${flavour.name}</h1>
                <p class="text-gray-600 mb-4">${flavour.description || 'Descripción no disponible'}</p>
                <p class="text-2xl font-bold text-blue-600 mb-4">$${flavour.price.toFixed(2)}</p>
                <button onclick="addToCart(${flavour.id})" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                    Agregar al carrito
                </button>
            </div>
        </div>
    `;
}

async function addToCart(flavourId) {
    if (!localStorage.getItem('token')) {
        window.location.href = '/login';
        return;
    }

    try {
        const response = await fetch('/api/cart/items', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({
                flavour_id: flavourId,
                cantidad: 1
            })
        });

        if (response.ok) {
            alert('Sabor agregado al carrito');
            updateCartCount();
        } else {
            alert('Error al agregar al carrito');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al agregar al carrito');
    }
}

// Actualizar contador del carrito
async function updateCartCount() {
    if (!localStorage.getItem('token')) return;
    
    try {
        const response = await fetch('/api/cart', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        const cart = await response.json();
        const count = cart.reduce((total, item) => total + item.quantity, 0);
        
        const cartCountElement = document.querySelector('#cartCount');
        if (cartCountElement) {
            cartCountElement.textContent = count;
        }
    } catch (error) {
        console.error('Error al actualizar carrito:', error);
    }
}