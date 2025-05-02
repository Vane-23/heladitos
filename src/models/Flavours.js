const db = require('../config/database');

class Flavour {
    // Get all flavours
    static findAll() {
        return new Promise((resolve, reject) => {
            db.all('SELECT * FROM flavours', [], (err, rows) => {
                if (err) reject(err);
                resolve(rows);
            });
        });
    }

    // Get flavour by ID
    static findById(id) {
        return new Promise((resolve, reject) => {
            db.get('SELECT * FROM flavours WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                resolve(row);
            });
        });
    }

    // Create new flavour
    static create(flavourData) {
        const { name, description, price, image } = flavourData;
        return new Promise((resolve, reject) => {
            db.run(
                'INSERT INTO flavours (name, description, price, image) VALUES (?, ?, ?, ?)',
                [name, description, price, image],
                function(err) {
                    if (err) reject(err);
                    resolve(this.lastID);
                }
            );
        });
    }

    // Update flavour
    static update(id, flavourData) {
        const { name, description, price, image } = flavourData;
        return new Promise((resolve, reject) => {
            db.run(
                'UPDATE flavours SET name = ?, description = ?, price = ?, image = ? WHERE id = ?',
                [name, description, price, image, id],
                (err) => {
                    if (err) reject(err);
                    resolve();
                }
            );
        });
    }

    // Delete flavour
    static delete(id) {
        return new Promise((resolve, reject) => {
            db.run('DELETE FROM flavours WHERE id = ?', [id], (err) => {
                if (err) reject(err);
                resolve();
            });
        });
    }
}

module.exports = Flavour;