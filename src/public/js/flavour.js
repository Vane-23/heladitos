document.addEventListener('DOMContentLoaded', function () {
    // Verificar si es admin
    const isAdmin = localStorage.getItem('isAdmin') === 'true';

    // Mostrar botón de agregar solo si es admin
    const addFlavorBtn = document.getElementById('addFlavorBtn');
    if (isAdmin && addFlavorBtn) {
        addFlavorBtn.classList.remove('hidden');
    }

    // Cargar sabores
    loadFlavors();

    // Event listener para abrir el modal
    if (addFlavorBtn) {
        addFlavorBtn.addEventListener('click', () => {
            resetFlavorForm();
            document.getElementById('modalTitle').textContent = 'Agregar Nuevo Sabor';
            document.getElementById('flavorModal').classList.remove('hidden');
        });
    }

    // Event listener para guardar sabor
    const flavorForm = document.getElementById('flavorForm');
    if (flavorForm) {
        flavorForm.addEventListener('submit', handleSaveFlavor);
    }
});

/**
 * Cargar sabores desde la API
 */
async function loadFlavors() {
    try {
        const response = await fetch('/api/flavours');
        const flavors = await response.json();
        displayFlavors(flavors);
    } catch (error) {
        console.error('Error loading flavors:', error);
    }
}

/**
 * Mostrar los sabores en la página
 */
function displayFlavors(flavors) {
    const grid = document.getElementById('flavorsGrid');
    if (!grid) return;
    grid.innerHTML = '';

    if (flavors.length === 0) {
        grid.innerHTML = '<p class="col-span-3 text-center text-gray-500 py-12">No hay sabores disponibles</p>';
        return;
    }

    flavors.forEach(flavor => {
        const card = document.createElement('div');
        card.className = 'bg-white rounded-lg shadow border hover:shadow-md transition-shadow';

        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        const hasDiscount = flavor.originalPrice && flavor.originalPrice > flavor.price;

        card.innerHTML = `
            <div class="relative">
                ${hasDiscount ? `<div class="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
                    ${Math.round((1 - flavor.price / flavor.originalPrice) * 100)}% OFF
                </div>` : ''}
                <img src="${flavor.image}" alt="${flavor.name}" 
                    class="w-full h-48 object-cover rounded-t-lg">
                <button class="absolute top-2 right-2 bg-white rounded-full p-2 text-red-400 hover:text-red-500 shadow">
                    <i class="far fa-heart"></i>
                </button>
            </div>
            <div class="p-4">
                <h3 class="font-bold text-gray-800">${flavor.name}</h3>
                <p class="text-gray-600 text-sm mt-2">${flavor.description || 'Delicioso helado artesanal'}</p>
                <div class="flex justify-between items-center mt-4">
                    <div>
                        <span class="text-red-500 font-bold">$${flavor.price.toFixed(2)}</span>
                        ${hasDiscount ? `<span class="text-gray-400 text-sm line-through ml-1">$${flavor.originalPrice.toFixed(2)}</span>` : ''}
                    </div>
                </div>
                <button class="mt-4 w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded flex items-center justify-center" onclick="addToCart(${flavor.id})">
                    <i class="fas fa-shopping-cart mr-2"></i> AÑADIR AL CARRITO
                </button>
                ${isAdmin ? `
                <div class="flex justify-end space-x-3 mt-3 pt-3 border-t border-gray-100">
                    <button class="text-blue-500 hover:text-blue-700 edit-btn" data-id="${flavor.id}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="text-red-500 hover:text-red-700 delete-btn" data-id="${flavor.id}">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
                ` : ''}
            </div>
        `;

        grid.appendChild(card);
    });
}

/**
 * Guardar sabor (crear o actualizar)
 */
async function handleSaveFlavor(e) {
    e.preventDefault();

    const id = document.getElementById('flavour_id').value;
    const name = document.getElementById('flavorName').value;
    const description = document.getElementById('flavorDescription').value;
    const price = parseFloat(document.getElementById('flavorPrice').value);
    const imageUrl = document.getElementById('flavorImage').value;
    const imageFile = document.getElementById('flavorImageFile').files[0];

    try {
        let imagePath = imageUrl;

        // Si hay un archivo de imagen, subirlo primero
        if (imageFile) {
            const formData = new FormData();
            formData.append('image', imageFile);

            const uploadResponse = await fetch('/api/upload', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: formData
            });

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json();
                throw new Error(errorData.error || 'Error al subir la imagen');
            }

            const uploadResult = await uploadResponse.json();
            imagePath = uploadResult.imagePath;
        }

        // Datos del sabor
        const flavorData = { name, description, price, image: imagePath };

        let response;
        if (id) {
            response = await fetch(`/api/flavours/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(flavorData)
            });
        } else {
            response = await fetch('/api/flavours', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(flavorData)
            });
        }

        if (response.ok) {
            closeModal();
            loadFlavors();
        } else {
            const errorData = await response.json();
            alert('Error: ' + (errorData.error || 'Error al guardar el sabor'));
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error: ' + error.message);
    }
}

/**
 * Resetear formulario de sabores
 */
function resetFlavorForm() {
    document.getElementById('flavour_id').value = '';
    document.getElementById('flavorName').value = '';
    document.getElementById('flavorDescription').value = '';
    document.getElementById('flavorPrice').value = '';
    document.getElementById('flavorImage').value = '';
    document.getElementById('flavorImageFile').value = '';
}

/**
 * Cerrar modal
 */
function closeModal() {
    document.getElementById('flavorModal').classList.add('hidden');
}

/**
 * Agregar sabor al carrito
 */
async function addToCart(flavour_id) {
    console.log('🔍 Debug - ID recibido:', flavour_id, 'Tipo:', typeof flavour_id);
    
    if (!localStorage.getItem('token')) {
        window.location.href = '/login';
        return;
    }

    try {
        // Convertir a número si es una cadena
        const id = parseInt(flavour_id);
        
        console.log('🛒 Enviando al servidor:', { flavour_id: id, cantidad: 1 });
        
        const response = await fetch('/api/cart/items', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ 
                flavour_id: id, 
                cantidad: 1 
            })
        });

        const responseText = await response.text();
        console.log('📡 Respuesta del servidor:', response.status, responseText);

        if (response.ok) {
            alert('¡Sabor agregado al carrito!');
            if (typeof updateCartCount === 'function') {
                updateCartCount();
            }
        } else {
            alert('Error al agregar al carrito: ' + responseText);
        }
    } catch (error) {
        console.error('❌ Error:', error);
        alert('Error al agregar al carrito: ' + error.message);
    }
}
