const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middlewares/auth');
const adminMiddleware = require('../middlewares/admin');

// Obtener todos los usuarios (solo admin)
router.get('/', [authMiddleware, adminMiddleware], (req, res) => {
    db.all('SELECT id, name, email, is_admin, created_at FROM users', [], (err, users) => {
        if (err) {
            console.error('Error al obtener usuarios:', err);
            return res.status(500).json({ error: 'Error al obtener usuarios' });
        }
        res.json(users);
    });
});

// Obtener usuario por ID (solo admin)
router.get('/:id', [authMiddleware, adminMiddleware], (req, res) => {
    const { id } = req.params;
    
    db.get('SELECT id, name, email, is_admin, created_at FROM users WHERE id = ?', [id], (err, user) => {
        if (err) {
            console.error('Error al obtener usuario:', err);
            return res.status(500).json({ error: 'Error al obtener usuario' });
        }
        
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        res.json(user);
    });
});

// Crear usuario (solo admin)
router.post('/', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        const { name, email, password, is_admin } = req.body;
        
        // Verificar si el usuario ya existe
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, existingUser) => {
            if (err) {
                console.error('Error al verificar usuario:', err);
                return res.status(500).json({ error: 'Error al crear usuario' });
            }
            
            if (existingUser) {
                return res.status(400).json({ error: 'El email ya está registrado' });
            }
            
            const hashedPassword = await bcrypt.hash(password, 10);
            
            // Insertar usuario
            db.run(
                'INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, ?)',
                [name, email, hashedPassword, is_admin ? 1 : 0],
                function(err) {
                    if (err) {
                        console.error('Error al insertar usuario:', err);
                        return res.status(500).json({ error: 'Error al crear usuario' });
                    }
                    
                    res.status(201).json({ id: this.lastID, name, email, is_admin });
                }
            );
        });
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({ error: 'Error al crear usuario' });
    }
});

// Actualizar usuario (solo admin)
router.put('/:id', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, password, is_admin } = req.body;
        
        // Verificar si el usuario existe
        db.get('SELECT * FROM users WHERE id = ?', [id], async (err, user) => {
            if (err) {
                console.error('Error al verificar usuario:', err);
                return res.status(500).json({ error: 'Error al actualizar usuario' });
            }
            
            if (!user) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }
            
            // Si se proporciona contraseña, encriptarla
            let hashedPassword = user.password;
            if (password) {
                hashedPassword = await bcrypt.hash(password, 10);
            }
            
            // Actualizar usuario
            db.run(
                'UPDATE users SET name = ?, email = ?, password = ?, is_admin = ? WHERE id = ?',
                [name, email, hashedPassword, is_admin ? 1 : 0, id],
                function(err) {
                    if (err) {
                        console.error('Error al actualizar usuario:', err);
                        return res.status(500).json({ error: 'Error al actualizar usuario' });
                    }
                    
                    res.json({ id, name, email, is_admin });
                }
            );
        });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({ error: 'Error al actualizar usuario' });
    }
});

// Eliminar usuario (solo admin)
router.delete('/:id', [authMiddleware, adminMiddleware], (req, res) => {
    const { id } = req.params;
    
    // No permitir eliminar al propio usuario
    if (id == req.user.userId) {
        return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
    }
    
    db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
        if (err) {
            console.error('Error al eliminar usuario:', err);
            return res.status(500).json({ error: 'Error al eliminar usuario' });
        }
        
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        
        res.json({ message: 'Usuario eliminado exitosamente' });
    });
});

module.exports = router;