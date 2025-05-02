const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const Order = require('../models/Order');
const Cart = require('../models/Cart');

// Crear una nueva orden
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { total_amount, items } = req.body;

        // Validar datos de entrada
        if (!total_amount || !items || !Array.isArray(items)) {
            return res.status(400).json({ error: 'Datos de orden inválidos' });
        }

        // Crear orden
        const result = await Order.create(req.user.user_id, total_amount, items);

        // Limpiar carrito después de crear la orden
        await Cart.clear(req.user.user_id);

        res.status(201).json(result);
    } catch (error) {
        console.error('❌ Error creando orden:', error);
        res.status(500).json({ error: 'Error al crear la orden' });
    }
});

// Obtener órdenes del usuario
router.get('/', authMiddleware, async (req, res) => {
    try {
        console.log('🔍 Obteniendo todas las órdenes para el usuario:', req.user.user_id);
        
        if (!req.user || !req.user.user_id) {
            console.error('⚠️ Error: Usuario no autenticado o `user_id` indefinido');
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }
        
        const orders = await Order.findAllByUserId(req.user.user_id);
        console.log(`📦 Se encontraron ${orders.length} órdenes`);
        
        res.json(orders);
    } catch (error) {
        console.error('❌ Error obteniendo órdenes:', error);
        res.status(500).json({ error: 'Error al obtener las órdenes' });
    }
});

router.get('/latest', authMiddleware, async (req, res) => {
    try {
        console.log('🔍 Intentando obtener la última orden para el usuario:', req.user);

        if (!req.user || !req.user.user_id) {
            console.error('⚠️ Error: Usuario no autenticado o `user_id` indefinido');
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }

        console.log(`📌 user_id recibido en /latest: ${req.user.user_id}`);

        const order = await Order.findByUserId(req.user.user_id);

        if (!order) {
            console.warn('⚠️ No se encontró la última orden para el usuario:', req.user.user_id);
            return res.status(404).json({ error: 'No hay órdenes disponibles' });
        }

        console.log('🛒 Última orden encontrada:', JSON.stringify(order, null, 2));
        res.json(order);
    } catch (error) {
        console.error('❌ Error obteniendo última orden:', error.message);

        if (error.message.includes('No se encontraron órdenes')) {
            return res.status(404).json({ error: 'No hay órdenes disponibles' });
        }

        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Obtener detalles de una orden específica
router.get('/:orderId', authMiddleware, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId, req.user.user_id);
        res.json(order);
    } catch (error) {
        console.error('❌ Error obteniendo detalles de orden:', error);
        res.status(500).json({ error: 'Error al obtener los detalles de la orden' });
    }
});



module.exports = router;