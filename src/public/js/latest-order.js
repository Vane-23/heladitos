document.addEventListener('DOMContentLoaded', function() {
    try {
        console.log('🎉 Mostrando página de compra finalizada');
        
      
        const orderSummary = document.getElementById('orderSummary');
        if (orderSummary) {
            orderSummary.innerHTML = `
                <div class="text-center py-4">
                    <p class="text-xl font-semibold text-gray-800 mb-2">Tu pedido ha sido recibido</p>
                    <p class="text-gray-600">Recibirás una confirmación por correo electrónico.</p>
                </div>
            `;
        }
        
        
        localStorage.removeItem('lastOrder');
        
    } catch (error) {
        console.error('❌ Error al mostrar la página de éxito:', error);
        
    }
});