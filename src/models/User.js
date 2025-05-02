const db = require('../config/database');

class User {
    static findByEmail(email) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE email = ?', [email], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
    }

    static create(userData) {
        const { name, email, password } = userData;
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
                [name, email, password],
                function(err) {
                    if (err) reject(err);
                    resolve(this.lastID);
                }
            );
        });
    }


// Método para obtener la última orden de un usuario
static findLatestByUserId(userId) {
    return new Promise((resolve, reject) => {
        const query = `
            SELECT 
                o.id, 
                o.total_amount, 
                o.status, 
                o.created_at,
                oi.flavour_id,
                f.name as flavour_name,
                f.image as flavour_image,
                oi.quantity,
                oi.price
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            JOIN flavours f ON oi.flavour_id = f.id
            WHERE o.user_id = ?
            ORDER BY o.created_at DESC
            LIMIT 1
        `;

        db.all(query, [userId], (err, rows) => {
            if (err) {
                console.error('❌ Error obteniendo última orden:', err);
                return reject(err);
            }

            if (rows.length === 0) {
                return reject(new Error('No se encontró ninguna orden'));
            }

// Estructurar los datos de la orden
const orderDetails = {
    id: rows[0].id,
    total_amount: rows[0].total_amount,
    status: rows[0].status,
    created_at: rows[0].created_at,
    items: rows.map(row => ({
        flavour_id: row.flavour_id,
        flavour_name: row.flavour_name,
        flavour_image: row.flavour_image,
        quantity: row.quantity,
        price: row.price
    }))
};

resolve(orderDetails);
});
});
}
}
module.exports = User;