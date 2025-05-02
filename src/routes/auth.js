const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Ruta de registro
router.post('/register', async (req, res) => {
    try {
        console.log('Datos recibidos:', req.body); // Debug log
        const { name, email, password } = req.body;

        // Verificar si el usuario ya existe
        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                console.error('Error al buscar usuario:', err);
                return res.status(500).json({ error: 'Error en el servidor' });
            }

            if (user) {
                return res.status(400).json({ error: 'El email ya está registrado' });
            }

            try {
                // Encriptar contraseña
                const hashedPassword = await bcrypt.hash(password, 10);

                // Insertar nuevo usuario
                db.run(
                    'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
                    [name, email, hashedPassword],
                    function(err) {
                        if (err) {
                            console.error('Error al insertar usuario:', err);
                            return res.status(500).json({ error: 'Error al crear usuario' });
                        }
                        res.status(201).json({ 
                            message: 'Usuario registrado exitosamente',
                            user_id: this.lastID 
                        });
                    }
                );
            } catch (error) {
                console.error('Error al hashear password:', error);
                res.status(500).json({ error: 'Error al procesar el registro' });
            }
        });
    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

// Ruta de login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                console.error('Error al buscar usuario:', err);
                return res.status(500).json({ error: 'Error en el servidor' });
            }

            if (!user) {
                console.log('Usuario no encontrado:', email); // Debug log
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }

            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                console.log('Contraseña inválida para el usuario:', email); // Debug log
                return res.status(401).json({ error: 'Credenciales inválidas' });
            }

            const token = jwt.sign(
                { user_id: user.id, isAdmin: user.is_admin },
                'tu_secret_key', // En producción usar variable de entorno
                { expiresIn: '24h' }
            );

            console.log('Inicio de sesión exitoso para el usuario:', email); // Debug log
            res.json({ token, isAdmin: user.is_admin });
        });
    } catch (error) {
        console.error('Error en el proceso de inicio de sesión:', error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
});

module.exports = router;