document.addEventListener('DOMContentLoaded', async function() {
    // Código del carrusel (sin cambios)
    const carousel = document.querySelector('#carousel');
    const slides = document.querySelector('#slides');
    const prevBtn = document.querySelector('#prevBtn');
    const nextBtn = document.querySelector('#nextBtn');
    const indicators = document.querySelectorAll('[data-index]');
    
    let currentIndex = 0;
    const slideCount = document.querySelectorAll('.carousel-slide').length;
    let interval;
    
    function goToSlide(index) {
        if (index < 0) index = slideCount - 1;
        if (index >= slideCount) index = 0;
        
        slides.style.transform = `translateX(-${index * 100}%)`;
        
        // Update indicators
        indicators.forEach((indicator, i) => {
            if (i === index) {
                indicator.classList.add('bg-white');
                indicator.classList.remove('bg-opacity-50');
            } else {
                indicator.classList.remove('bg-white');
                indicator.classList.add('bg-opacity-50');
            }
        });
        
        currentIndex = index;
    }
    
    function startAutoSlide() {
        interval = setInterval(() => {
            goToSlide(currentIndex + 1);
        }, 5000);
    }
    
    function stopAutoSlide() {
        clearInterval(interval);
    }
    
    prevBtn.addEventListener('click', () => {
        goToSlide(currentIndex - 1);
        stopAutoSlide();
        startAutoSlide();
    });
    
    nextBtn.addEventListener('click', () => {
        goToSlide(currentIndex + 1);
        stopAutoSlide();
        startAutoSlide();
    });
    
    indicators.forEach(indicator => {
        indicator.addEventListener('click', () => {
            const index = parseInt(indicator.dataset.index);
            goToSlide(index);
            stopAutoSlide();
            startAutoSlide();
        });
    });
    
    carousel.addEventListener('mouseenter', stopAutoSlide);
    carousel.addEventListener('mouseleave', startAutoSlide);
    
    startAutoSlide();
    
    // Cargar sabores existentes
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const token = localStorage.getItem('token');
    const addFlavorCard = document.getElementById('addFlavorCard');
    const flavoursGrid = document.getElementById('flavoursGrid');
    
    // Mostrar botón de agregar solo si es admin
    if (isAdmin && token) {
        addFlavorCard.classList.remove('hidden');
        
        // Agregar event listener al botón de agregar nuevo sabor
        addFlavorCard.addEventListener('click', function() {
            openAddFlavorModal();
        });
    }
    
    try {
        const response = await fetch('/api/flavours');
        const flavours = await response.json();
        
        // Mostrar sabores
        flavours.forEach(flavour => {
            const card = createFlavorCard(flavour);
            flavoursGrid.appendChild(card);
        });
    } catch (error) {
        console.error('Error al cargar sabores:', error);
    }
});

// Función para abrir el modal de agregar sabor
function openAddFlavorModal() {
    // Crear el modal
    const modalHtml = `
        <div id="addFlavorModal" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold">Agregar Nuevo Sabor</h2>
                    <button id="closeModal" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <form id="addFlavorForm" class="space-y-4">
                    <div class="space-y-2">
                        <label for="flavorName" class="block text-sm font-medium text-gray-700">Nombre</label>
                        <input type="text" id="flavorName" name="name" class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500" required>
                    </div>
                    
                    <div class="space-y-2">
                        <label for="flavorDescription" class="block text-sm font-medium text-gray-700">Descripción</label>
                        <textarea id="flavorDescription" name="description" rows="3" class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500" required></textarea>
                    </div>
                    
                    <div class="space-y-2">
                        <label for="flavorPrice" class="block text-sm font-medium text-gray-700">Precio</label>
                        <input type="number" id="flavorPrice" name="price" step="0.01" min="0" class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500" required>
                    </div>
                    
                    <div class="space-y-2">
                        <label for="flavorImage" class="block text-sm font-medium text-gray-700">Imagen</label>
                        <input type="file" id="flavorImage" name="image" accept="image/*" class="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500" required>
                        <p class="text-sm text-gray-500 mt-1">Selecciona una imagen en formato JPG, PNG o GIF</p>
                    </div>
                    
                    <div class="flex justify-end pt-4">
                        <button type="button" id="cancelAdd" class="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg mr-2 hover:bg-gray-300">
                            Cancelar
                        </button>
                        <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                            Guardar Sabor
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Agregar el modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Agregar event listeners para cerrar el modal
    document.getElementById('closeModal').addEventListener('click', closeModal);
    document.getElementById('cancelAdd').addEventListener('click', closeModal);
    
    // Manejar el envío del formulario
    document.getElementById('addFlavorForm').addEventListener('submit', function(e) {
        e.preventDefault();
        addNewFlavor(this);
    });
}

// Función para añadir un nuevo sabor (actualizada para usar /api/upload)
async function addNewFlavor(form) {
    // Obtener los valores del formulario
    const name = form.querySelector('#flavorName').value;
    const description = form.querySelector('#flavorDescription').value;
    const price = parseFloat(form.querySelector('#flavorPrice').value);
    const imageFile = form.querySelector('#flavorImage').files[0];
    
    if (!name || !price) {
        alert('El nombre y el precio son campos obligatorios');
        return;
    }
    
    if (!imageFile || imageFile.size === 0) {
        alert('Por favor selecciona una imagen para el sabor');
        return;
    }
    
    try {
        // Mostrar indicador de carga
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Guardando...';
        
        // Primero, subir la imagen al servidor
        let imagePath = null;
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
            throw new Error('Error al subir la imagen');
        }
        
        const uploadResult = await uploadResponse.json();
        imagePath = uploadResult.imagePath;
        
        // Crear el objeto JSON para enviar al servidor
        const flavorData = {
            name: name,
            description: description,
            price: price,
            image: imagePath
        };
        
        // Enviar la solicitud como JSON
        const response = await fetch('/api/flavours', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(flavorData)
        });
        
        // Clonar la respuesta antes de leerla (para evitar "body stream already read")
        const responseClone = response.clone();
        
        if (response.ok) {
            alert('Sabor agregado correctamente');
            closeModal();
            location.reload(); // Recargar la página para mostrar el nuevo sabor
        } else {
            // Restaurar botón
            submitButton.disabled = false;
            submitButton.textContent = originalText;
            
            let errorMessage = 'No se pudo agregar el sabor';
            
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (jsonError) {
                try {
                    // Si no es JSON, intentar obtener el texto
                    const errorText = await responseClone.text();
                    errorMessage = errorText || errorMessage;
                } catch (textError) {
                    console.error('Error al leer la respuesta:', textError);
                }
            }
            
            alert(`Error: ${errorMessage}`);
            console.error('Error en la respuesta:', response.status, errorMessage);
        }
    } catch (error) {
        console.error('Error al agregar sabor:', error);
        alert('Error al agregar el sabor: ' + error.message);
    }
}

// Función para cerrar el modal
function closeModal() {
    const modal = document.getElementById('addFlavorModal');
    if (modal) {
        modal.remove();
    }
}

function createFlavorCard(flavour) {
    const card = document.createElement('div');
    card.className = 'bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition';
    
    // Preparar la URL de la imagen con manejo de NULL
    let imageUrl = '/images/uploads/default-flavor.png'; // Imagen por defecto relativa
    
    if (flavour.image) {
        // Usar la imagen proporcionada por el sabor
        imageUrl = flavour.image;
    }
    
    // Agregar botones de edición/eliminación solo para admin
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    const adminButtons = isAdmin ? `
        <div class="flex space-x-2 mt-2">
            <button onclick="editFlavour(${flavour.id})" class="text-blue-600 hover:text-blue-800">
                <i class="fas fa-edit"></i>
            </button>
            <button onclick="deleteFlavour(${flavour.id})" class="text-red-600 hover:text-red-800">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    ` : '';

    card.innerHTML = `
        <div class="aspect-w-1 aspect-h-1 mb-4">
            <img src="${imageUrl}" 
                 alt="${flavour.name}"
                 class="object-cover rounded-lg w-full h-48"
                 onerror="this.src='/images/uploads/default-flavor.png'; this.onerror=null;">
        </div>
        <h3 class="text-lg font-semibold mb-2">${flavour.name}</h3>
        <p class="text-gray-600 text-sm mb-4">${flavour.description}</p>
        <div class="flex justify-between items-center">
            <span class="text-lg font-bold">$${flavour.price}</span>
            <button onclick="addToCart(${flavour.id})" 
                    class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Agregar al carrito
            </button>
        </div>
        ${adminButtons}
    `;
    return card;
}

// Función para editar un sabor existente
async function editFlavour(id) {
    if (localStorage.getItem('isAdmin') !== 'true') return;
    
    try {
        // Obtener datos del sabor actual
        const response = await fetch(`/api/flavours/${id}`);
        if (!response.ok) {
            throw new Error('No se pudo obtener la información del sabor');
        }
        
        const flavour = await response.json();
        
        // Crear modal similar al de agregar pero con los datos cargados
        openEditFlavorModal(flavour);
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar el sabor para editar');
    }
}

// Función para abrir modal de edición
function openEditFlavorModal(flavour) {
    // Preparar la URL de la imagen con manejo de NULL
    let imageUrl = '/images/uploads/default-flavor.png'; // Imagen por defecto
    
    if (flavour.image) {
        imageUrl = flavour.image;
    }
    
    // Crear el modal similar al de agregar pero con los campos prellenados
    const modalHtml = `
        <div id="editFlavorModal" class="fixed inset-0 bg-gray-900 bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white rounded-lg shadow-xl p-6 max-w-lg w-full">
                <div class="flex justify-between items-center mb-4">
                    <h2 class="text-xl font-bold">Editar Sabor</h2>
                    <button id="closeModal" class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <form id="editFlavorForm" class="space-y-4">
                    <input type="hidden" id="flavorId" name="id" value="${flavour.id}">
                    
                    <div class="space-y-2">
                        <label for="flavorName" class="block text-sm font-medium text-gray-700">Nombre</label>
                        <input type="text" id="flavorName" name="name" value="${flavour.name}" class="w-full rounded-lg border border-gray-300 px-3 py-2" required>
                    </div>
                    
                    <div class="space-y-2">
                        <label for="flavorDescription" class="block text-sm font-medium text-gray-700">Descripción</label>
                        <textarea id="flavorDescription" name="description" rows="3" class="w-full rounded-lg border border-gray-300 px-3 py-2" required>${flavour.description}</textarea>
                    </div>
                    
                    <div class="space-y-2">
                        <label for="flavorPrice" class="block text-sm font-medium text-gray-700">Precio</label>
                        <input type="number" id="flavorPrice" name="price" step="0.01" min="0" value="${flavour.price}" class="w-full rounded-lg border border-gray-300 px-3 py-2" required>
                    </div>
                    
                    <div class="space-y-2">
                        <label class="block text-sm font-medium text-gray-700">Imagen Actual</label>
                        <img src="${imageUrl}" alt="${flavour.name}" class="h-20 object-cover rounded-lg" onerror="this.src='/images/uploads/default-flavor.png'; this.onerror=null;">
                    </div>
                    
                    <div class="space-y-2">
                        <label for="flavorImage" class="block text-sm font-medium text-gray-700">Nueva Imagen (opcional)</label>
                        <input type="file" id="flavorImage" name="image" accept="image/*" class="w-full rounded-lg border border-gray-300 px-3 py-2">
                        <p class="text-sm text-gray-500 mt-1">Dejar en blanco para mantener la imagen actual</p>
                    </div>
                    
                    <div class="flex justify-end pt-4">
                        <button type="button" id="cancelEdit" class="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg mr-2 hover:bg-gray-300">
                            Cancelar
                        </button>
                        <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                            Guardar Cambios
                        </button>
                    </div>
                </form>
            </div>
        </div>
    `;
    
    // Agregar el modal al DOM
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    // Agregar event listeners para cerrar el modal
    document.getElementById('closeModal').addEventListener('click', closeEditModal);
    document.getElementById('cancelEdit').addEventListener('click', closeEditModal);
    
    // Manejar el envío del formulario
    document.getElementById('editFlavorForm').addEventListener('submit', function(e) {
        e.preventDefault();
        updateFlavor(this);
    });
}

// Función para actualizar un sabor (actualizada para usar /api/upload)
async function updateFlavor(form) {
    const id = form.querySelector('#flavorId').value;
    const name = form.querySelector('#flavorName').value;
    const description = form.querySelector('#flavorDescription').value;
    const price = parseFloat(form.querySelector('#flavorPrice').value);
    const imageFile = form.querySelector('#flavorImage').files[0];
    
    if (!name || !price) {
        alert('El nombre y el precio son campos obligatorios');
        return;
    }
    
    try {
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Guardando...';
        
        // Preparar los datos para la actualización
        const updateData = {
            name: name,
            description: description,
            price: price
        };
        
        // Si hay una nueva imagen, subirla primero
        if (imageFile && imageFile.size > 0) {
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
                throw new Error('Error al subir la imagen');
            }
            
            const uploadResult = await uploadResponse.json();
            updateData.image = uploadResult.imagePath;
        }
        
        const response = await fetch(`/api/flavours/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(updateData)
        });
        
        // Clonar la respuesta antes de leerla
        const responseClone = response.clone();
        
        if (response.ok) {
            alert('Sabor actualizado correctamente');
            closeEditModal();
            location.reload();
        } else {
            submitButton.disabled = false;
            submitButton.textContent = 'Guardar Cambios';
            
            let errorMessage = 'No se pudo actualizar el sabor';
            
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (jsonError) {
                try {
                    const errorText = await responseClone.text();
                    errorMessage = errorText || errorMessage;
                } catch (textError) {
                    console.error('Error al leer la respuesta:', textError);
                }
            }
            
            alert(`Error: ${errorMessage}`);
        }
    } catch (error) {
        console.error('Error al actualizar sabor:', error);
        alert('Error al actualizar el sabor: ' + error.message);
    }
}

// Función para cerrar el modal de edición
function closeEditModal() {
    const modal = document.getElementById('editFlavorModal');
    if (modal) {
        modal.remove();
    }
}

async function deleteFlavour(id) {
    if (localStorage.getItem('isAdmin') !== 'true') return;
    if (!confirm('¿Estás seguro de que quieres eliminar este sabor?')) return;

    try {
        const response = await fetch(`/api/flavours/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.ok) {
            location.reload();
        } else {
            const responseClone = response.clone();
            
            let errorMessage = 'Error al eliminar el sabor';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (jsonError) {
                try {
                    const errorText = await responseClone.text();
                    errorMessage = errorText || errorMessage;
                } catch (e) {}
            }
            
            alert(errorMessage);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar el sabor: ' + error.message);
    }
}

// Función para agregar al carrito
async function addToCart(flavour_id) {
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
                flavour_id,
                cantidad: 1
            })
        });

        const responseClone = response.clone();
        
        if (response.ok) {
            alert('Sabor agregado al carrito');
            updateCartCount();
        } else {
            let errorMessage = 'Error al agregar al carrito';
            try {
                const errorData = await response.json();
                errorMessage = errorData.error || errorMessage;
            } catch (jsonError) {
                try {
                    const errorText = await responseClone.text();
                    errorMessage = errorText || errorMessage;
                } catch (e) {}
            }
            
            alert(errorMessage);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al agregar al carrito: ' + error.message);
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
            cartCountElement.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Error al actualizar carrito:', error);
    }
}