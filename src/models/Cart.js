const db = require('../db'); // Asegúrate de que la conexión a la base de datos esté configurada correctamente

class Cart {
    static async findByUserId(userId) {
        return new Promise((resolve, reject) => {
            console.log(`🔍 Buscando carrito para usuario: ${userId}`);
            
            // Consulta optimizada con JOIN para obtener los datos del carrito y los sabores
            const query = `
                SELECT 
                    cart_items.id, 
                    cart_items.user_id, 
                    cart_items.flavour_id, 
                    cart_items.quantity, 
                    flavours.name, 
                    flavours.description,
                    flavours.image AS flavour_image, 
                    flavours.price
                FROM cart_items
                LEFT JOIN flavours ON cart_items.flavour_id = flavours.id
                WHERE cart_items.user_id = ?
            `;
            
            db.all(query, [userId], (err, results) => {
                if (err) {
                    console.error('❌ Error en consulta JOIN:', err);
                    return reject(err);
                }
                
                // Depurar las imágenes en los resultados
                console.log('🖼️ Resultados con imágenes:', results.map(item => ({
                    id: item.id,
                    name: item.name,
                    image: item.flavour_image
                })));
                
                resolve(results);
            });
        });
    }

    static async addItem(userId, flavour_id, cantidad) {
        return new Promise((resolve, reject) => {
            // Log para depuración
            console.log('🛒 Intentando agregar item al carrito:', { 
                userId, 
                flavour_id, 
                cantidad 
            });
    
            // Primero verificamos si ya existe el item en el carrito
            const checkQuery = 'SELECT id, quantity FROM cart_items WHERE user_id = ? AND flavour_id = ?';
            
            db.get(checkQuery, [userId, flavour_id], (err, row) => {
                if (err) {
                    console.error('❌ Error verificando item existente:', err);
                    return reject(err);
                }
                
                if (row) {
                    // Si ya existe, actualizamos la cantidad
                    const newQuantity = row.quantity + cantidad;
                    
                    db.run(
                        'UPDATE cart_items SET quantity = ? WHERE id = ?',
                        [newQuantity, row.id],
                        function(err) {
                            if (err) {
                                console.error('❌ Error actualizando cantidad:', err);
                                return reject(err);
                            }
                            
                            console.log('✅ Cantidad de item actualizada:', { 
                                id: row.id, 
                                quantity: newQuantity 
                            });
    
                            // Obtener el item actualizado con JOIN para incluir los datos del sabor
                            db.get(
                                `SELECT 
                                    cart_items.id, 
                                    cart_items.user_id, 
                                    cart_items.flavour_id, 
                                    cart_items.quantity, 
                                    flavours.name, 
                                    flavours.description, 
                                    flavours.image AS flavour_image, 
                                    flavours.price 
                                FROM cart_items 
                                LEFT JOIN flavours ON cart_items.flavour_id = flavours.id 
                                WHERE cart_items.id = ?`, 
                                [row.id], 
                                (err, updatedItem) => {
                                    if (err) {
                                        console.error('❌ Error obteniendo item actualizado:', err);
                                        return reject(err);
                                    }
                                    console.log('🔄 Item actualizado:', updatedItem);
                                    resolve(updatedItem);
                                }
                            );
                        }
                    );
                } else {
                    // Si no existe, creamos un nuevo item
                    db.run(
                        'INSERT INTO cart_items (user_id, flavour_id, quantity) VALUES (?, ?, ?)',
                        [userId, flavour_id, cantidad],
                        function(err) {
                            if (err) {
                                console.error('❌ Error agregando item al carrito:', err);
                                return reject(err);
                            }
                            
                            console.log('✅ Item agregado al carrito:', { 
                                id: this.lastID, 
                                user_id: userId, 
                                flavour_id, 
                                quantity: cantidad 
                            });
    
                            // Obtener el nuevo item con JOIN para incluir los datos del sabor
                            db.get(
                                `SELECT 
                                    cart_items.id, 
                                    cart_items.user_id, 
                                    cart_items.flavour_id, 
                                    cart_items.quantity, 
                                    flavours.name, 
                                    flavours.description, 
                                    flavours.image AS flavour_image, 
                                    flavours.price 
                                FROM cart_items 
                                LEFT JOIN flavours ON cart_items.flavour_id = flavours.id 
                                WHERE cart_items.id = ?`, 
                                [this.lastID], 
                                (err, newItem) => {
                                    if (err) {
                                        console.error('❌ Error obteniendo nuevo item:', err);
                                        return reject(err);
                                    }
                                    console.log('🔄 Nuevo item:', newItem);
                                    resolve(newItem);
                                }
                            );
                        }
                    );
                }
            });
        });
    }

    static async updateQuantity(itemId, cantidad) {
        return new Promise((resolve, reject) => {
            db.run('UPDATE cart_items SET quantity = ? WHERE id = ?', [cantidad, itemId], (err) => {
                if (err) {
                    console.error('Error updating item quantity:', err);
                    return reject(err);
                }
                
                // Obtener el item actualizado con JOIN para incluir los datos del sabor
                db.get(
                    `SELECT 
                        cart_items.id, 
                        cart_items.user_id, 
                        cart_items.flavour_id, 
                        cart_items.quantity, 
                        flavours.name, 
                        flavours.description, 
                        flavours.image AS flavour_image, 
                        flavours.price 
                    FROM cart_items 
                    LEFT JOIN flavours ON cart_items.flavour_id = flavours.id 
                    WHERE cart_items.id = ?`, 
                    [itemId], 
                    (err, updatedItem) => {
                        if (err) {
                            console.error('❌ Error obteniendo item actualizado:', err);
                            return reject(err);
                        }
                        resolve(updatedItem);
                    }
                );
            });
        });
    }

    static async removeItem(itemId) {
        return new Promise((resolve, reject) => {
            // Obtener el item antes de eliminarlo para la respuesta
            db.get(
                `SELECT 
                    cart_items.id, 
                    cart_items.user_id, 
                    cart_items.flavour_id 
                FROM cart_items 
                WHERE cart_items.id = ?`, 
                [itemId], 
                (err, item) => {
                    if (err) {
                        console.error('❌ Error obteniendo item para eliminar:', err);
                        return reject(err);
                    }
                    
                    // Eliminar el item
                    db.run('DELETE FROM cart_items WHERE id = ?', [itemId], (err) => {
                        if (err) {
                            console.error('Error removing item from cart:', err);
                            return reject(err);
                        }
                        resolve({
                            mensaje: 'Item eliminado del carrito',
                            itemId: itemId,
                            user_id: item ? item.user_id : null,
                            flavour_id: item ? item.flavour_id : null
                        });
                    });
                }
            );
        });
    }

    static async clear(user_id) {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM cart_items WHERE user_id = ?', [user_id], (err) => {
                if (err) {
                    console.error('Error clearing cart:', err); 
                    return reject(err);
                }
                resolve({ mensaje: 'Carrito vaciado' });
            });
        });
    }

}

module.exports = Cart;