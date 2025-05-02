const db = require('../config/database');

class Order {
    // Crear una nueva orden
    static create(userId, totalAmount, items) {
        return new Promise((resolve, reject) => {
            // Iniciar transacción
            db.run('BEGIN TRANSACTION', (err) => {
                if (err) {
                    console.error('❌ Error iniciando transacción:', err);
                    return reject(err);
                }

                // Insertar orden principal
                const orderQuery = `
                    INSERT INTO orders (user_id, total_amount, status) 
                    VALUES (?, ?, 'pendiente')
                `;

                db.run(orderQuery, [userId, totalAmount], function(err) {
                    if (err) {
                        console.error('❌ Error creando orden:', err);
                        return db.run('ROLLBACK', () => reject(err));
                    }

                    const orderId = this.lastID;
                    
                    // Preparar inserción de items
                    const itemQuery = `
                        INSERT INTO order_items (order_id, flavour_id, quantity, price) 
                        VALUES (?, ?, ?, ?)
                    `;

                    // Insertar cada item de la orden
                    const insertPromises = items.map(item => {
                        return new Promise((resolveItem, rejectItem) => {
                            db.run(
                                itemQuery, 
                                [orderId, item.flavour_id, item.quantity, item.price], 
                                (err) => {
                                    if (err) {
                                        console.error('❌ Error insertando item de orden:', err);
                                        rejectItem(err);
                                    } else {
                                        resolveItem();
                                    }
                                }
                            );
                        });
                    });

                    // Ejecutar todas las inserciones de items
                    Promise.all(insertPromises)
                        .then(() => {
                            // Confirmar transacción
                            db.run('COMMIT', (err) => {
                                if (err) {
                                    console.error('❌ Error confirmando transacción:', err);
                                    return reject(err);
                                }
                                resolve({ 
                                    orderId: orderId, 
                                    message: 'Orden creada exitosamente' 
                                });
                            });
                        })
                        .catch(err => {
                            // Revertir transacción si hay error
                            db.run('ROLLBACK', () => reject(err));
                        });
                });
            });
        });
    }

    // Obtener órdenes de un usuario
    static findAllByUserId(userId) {
        return new Promise((resolve, reject) => {
            console.log(`🔍 Buscando todas las órdenes para user_id: ${userId}`);
    
            if (!userId) {
                console.error("⚠️ Error: userId no está definido");
                return reject(new Error("Usuario no válido"));
            }
    
            const query = `
                SELECT 
                    o.id, 
                    o.total_amount, 
                    o.status, 
                    o.created_at
                FROM orders o
                WHERE o.user_id = ?
                ORDER BY o.created_at DESC
            `;
    
            db.all(query, [userId], (err, orderRows) => {
                if (err) {
                    console.error('❌ Error en la consulta de órdenes:', err.message);
                    return reject(new Error(`Error en la base de datos: ${err.message}`));
                }
    
                if (!orderRows || orderRows.length === 0) {
                    console.warn("⚠️ No se encontraron órdenes para este usuario.");
                    return resolve([]);
                }
    
                // Para cada orden, obtener sus items
                const orderPromises = orderRows.map(order => {
                    return new Promise((resolveOrder, rejectOrder) => {
                        const itemsQuery = `
                            SELECT 
                                oi.flavour_id,
                                f.name AS flavour_name,
                                f.image AS flavour_image,
                                oi.quantity,
                                oi.price
                            FROM order_items oi
                            LEFT JOIN flavours f ON oi.flavour_id = f.id
                            WHERE oi.order_id = ?
                        `;
    
                        db.all(itemsQuery, [order.id], (err, itemRows) => {
                            if (err) {
                                console.error(`❌ Error obteniendo items para orden ${order.id}:`, err.message);
                                return rejectOrder(err);
                            }
    
                            // Crear objeto completo de orden con sus items
                            const orderData = {
                                id: order.id,
                                total_amount: order.total_amount || 0,
                                status: order.status,
                                created_at: order.created_at,
                                items: itemRows.map(item => ({
                                    flavour_id: item.flavour_id,
                                    flavour_name: item.flavour_name || 'Sabor Desconocido',
                                    flavour_image: item.flavour_image || '/images/uploads/default-flavor.png',
                                    quantity: item.quantity,
                                    price: item.price
                                }))
                            };
    
                            resolveOrder(orderData);
                        });
                    });
                });
    
                // Resolver todas las órdenes con sus items
                Promise.all(orderPromises)
                    .then(results => {
                        console.log(`✅ Se encontraron ${results.length} órdenes para el usuario`);
                        resolve(results);
                    })
                    .catch(err => {
                        console.error('❌ Error procesando órdenes:', err);
                        reject(err);
                    });
            });
        });
    }

    // Obtener detalles de una orden específica
    static findById(orderId, userId) {
        return new Promise((resolve, reject) => {
            console.log(`🔍 Buscando orden ID: ${orderId} para user_id: ${userId}`);
    
            const query = `
                SELECT 
                    o.id, 
                    o.total_amount, 
                    o.status, 
                    o.created_at,
                    COALESCE(oi.flavour_id, NULL) AS flavour_id,
                    COALESCE(f.name, 'Sabor Desconocido') AS flavour_name,
                    COALESCE(f.image, '/images/uploads/default-flavor.png') AS flavour_image,
                    COALESCE(oi.quantity, 0) AS quantity,
                    COALESCE(oi.price, 0) AS price
                FROM orders o
                LEFT JOIN order_items oi ON o.id = oi.order_id
                LEFT JOIN flavours f ON oi.flavour_id = f.id
                WHERE o.id = ? AND o.user_id = ?
            `;
    
            db.all(query, [orderId, userId], (err, rows) => {
                if (err) {
                    console.error('❌ Error obteniendo detalles de orden:', err);
                    return reject(new Error('Error en la base de datos'));
                }
    
                console.log("🔎 Datos obtenidos de la BD:", rows);
    
                if (!rows || rows.length === 0 || rows[0].id === null) {
                    console.warn("⚠️ No se encontró la orden en la base de datos.");
                    return reject(new Error('Orden no encontrada'));
                }
    
                // Estructurar los datos de la orden
                const orderDetails = {
                    id: rows[0].id,
                    total_amount: rows[0].total_amount || 0,
                    status: rows[0].status,
                    created_at: rows[0].created_at,
                    items: rows
                        .filter(row => row.flavour_id !== null)
                        .map(row => ({
                            flavour_id: row.flavour_id,
                            flavour_name: row.flavour_name,
                            flavour_image: row.flavour_image,
                            quantity: row.quantity,
                            price: row.price
                        }))
                };
    
                console.log("✅ Orden encontrada:", JSON.stringify(orderDetails, null, 2));
                resolve(orderDetails);
            });
        });
    }

    // Actualizar estado de la orden
    static updateStatus(orderId, status) {
        return new Promise((resolve, reject) => {
            const query = 'UPDATE orders SET status = ? WHERE id = ?';
            
            db.run(query, [status, orderId], (err) => {
                if (err) {
                    console.error('❌ Error actualizando estado de orden:', err);
                    return reject(err);
                }
                resolve({ message: 'Estado de orden actualizado' });
            });
        });
    }
}

module.exports = Order;