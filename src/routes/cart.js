const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const Cart = require('../models/Cart'); 

// Obtener carrito del usuario
router.get('/', authMiddleware, async (req, res) => {
    try {
        console.log('🔎 Buscando carrito para usuario:', req.user.user_id);

        if (!req.user || !req.user.user_id) {
            console.error("⚠️ Error: Usuario no autenticado o user_id no definido");
            return res.status(401).json({ error: "Usuario no autenticado" });
        }

        const items = await Cart.findByUserId(req.user.user_id);

        console.log('📦 Datos del carrito antes de enviarlos al frontend:', items);
        res.json(items);
    } catch (error) {
        console.error('❌ Error al obtener el carrito:', error);
        res.status(500).json({ error: 'Error al obtener el carrito' });
    }
});

// Agregar item al carrito
router.post('/items', authMiddleware, async (req, res) => {
    try {
        console.log('📝 Datos completos recibidos:', req.body);

        // Intentar extraer los valores
        let { flavour_id, cantidad } = req.body;
        
        // Convertir a número si son cadenas
        flavour_id = parseInt(flavour_id);
        cantidad = parseInt(cantidad);
        
        console.log('🔢 Valores procesados:', { flavour_id, cantidad });

        if (!flavour_id || !cantidad) {
            console.log('⚠️ Error: flavour_id o cantidad es undefined o null');
            return res.status(400).json({ error: 'flavour_id y cantidad son requeridos' });
        }

        const item = await Cart.addItem(req.user.user_id, flavour_id, cantidad);
        console.log('🔎 Item agregado al carrito:', item);
        console.log('🖼️ Imagen del item:', item.image);
        res.status(201).json(item);
    } catch (error) {
        console.error('❌ Error adding item to cart:', error);
        res.status(500).json({ error: 'Error al agregar item al carrito' });
    }
});

// Actualizar cantidad de un item
router.put('/items/:itemId', authMiddleware, async (req, res) => {
    try {
        const { itemId } = req.params;
        const { cantidad } = req.body;
        console.log('🔄 Updating item quantity:', { itemId, cantidad });
        
        if (!cantidad && cantidad !== 0) {
            return res.status(400).json({ error: 'La cantidad es requerida' });
        }
        
        await Cart.updateQuantity(itemId, cantidad);
        res.json({ mensaje: 'Cantidad actualizada' });
    } catch (error) {
        console.error('❌ Error updating item quantity:', error);
        res.status(500).json({ error: 'Error al actualizar cantidad' });
    }
});

// Eliminar item del carrito
router.delete('/items/:itemId', authMiddleware, async (req, res) => {
    try {
        const { itemId } = req.params;
        console.log('🗑️ Removing item from cart:', itemId);
        await Cart.removeItem(itemId);
        res.json({ mensaje: 'Item eliminado del carrito' });
    } catch (error) {
        console.error('❌ Error removing item from cart:', error);
        res.status(500).json({ error: 'Error al eliminar item' });
    }
});

// Vaciar carrito
router.delete('/', authMiddleware, async (req, res) => {
    try {
        console.log('🧹 Clearing cart for user:', req.user.user_id);
        await Cart.clear(req.user.user_id);
        res.json({ mensaje: 'Carrito vaciado' });
    } catch (error) {
        console.error('❌ Error clearing cart:', error);
        res.status(500).json({ error: 'Error al vaciar el carrito' });
    }
});

module.exports = router;