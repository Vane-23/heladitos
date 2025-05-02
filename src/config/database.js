const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const db = new sqlite3.Database(path.join(__dirname, '../database.sqlite'), (err) => {
    if (err) {
        console.error('Error connecting to database:', err);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

function initializeDatabase() {
    db.serialize(() => {
        // Tabla de usuarios
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            is_admin BOOLEAN DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Tabla de sabores
        db.run(`CREATE TABLE IF NOT EXISTS flavours (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            description TEXT,
            price DECIMAL(10,2) NOT NULL,
            image TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Tabla de carrito (temporal)
        db.run(`CREATE TABLE IF NOT EXISTS cart_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            flavour_id INTEGER,
            quantity INTEGER DEFAULT 1,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (flavour_id) REFERENCES flavours (id)
        )`);

        // Tabla de órdenes
        db.run(`CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            total_amount DECIMAL(10,2) NOT NULL,
            status TEXT DEFAULT 'pendiente',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`);

        // Tabla de items de órdenes
        db.run(`CREATE TABLE IF NOT EXISTS order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER,
            flavour_id INTEGER,
            quantity INTEGER NOT NULL,
            price DECIMAL(10,2) NOT NULL,
            FOREIGN KEY (order_id) REFERENCES orders (id),
            FOREIGN KEY (flavour_id) REFERENCES flavours (id)
        )`);

        // Insertar usuario administrador por defecto si no existe
        const adminEmail = 'helados@net.com';
        const adminPassword = 'Helados.1234';
        const adminName = 'Admin';
        const hashedPassword = bcrypt.hashSync(adminPassword, 10);

        db.get('SELECT * FROM users WHERE email = ?', [adminEmail], (err, user) => {
            if (err) {
                console.error('Error checking for admin user:', err);
            } else if (!user) {
                db.run(
                    'INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, ?)',
                    [adminName, adminEmail, hashedPassword, 1],
                    (err) => {
                        if (err) {
                            console.error('Error inserting admin user:', err);
                        } else {
                            console.log('Admin user created successfully.');
                        }
                    }
                );
            } else {
                console.log('Admin user already exists.');
            }
        });
    });
}

module.exports = db;