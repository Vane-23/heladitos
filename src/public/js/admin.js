class AdminService {
    static async getFlavours() {
        try {
            const response = await fetch('/api/flavours', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Error al obtener sabores:', error);
            throw error;
        }
    }

    static async createFlavour(flavourData) {
        try {
            const response = await fetch('/api/flavours', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(flavourData)
            });
            return await response.json();
        } catch (error) {
            console.error('Error al crear sabor:', error);
            throw error;
        }
    }

    static async updateFlavour(id, flavourData) {
        try {
            const response = await fetch(`/api/flavours/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(flavourData)
            });
            return await response.json();
        } catch (error) {
            console.error('Error al actualizar sabor:', error);
            throw error;
        }
    }

    static async deleteFlavour(id) {
        try {
            const response = await fetch(`/api/flavours/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            return await response.json();
        } catch (error) {
            console.error('Error al eliminar sabor:', error);
            throw error;
        }
    }
}

// Verificar si el usuario es admin
document.addEventListener('DOMContentLoaded', function() {
    if (!localStorage.getItem('token') || !localStorage.getItem('isAdmin')) {
        window.location.href = '/login';
    }
});