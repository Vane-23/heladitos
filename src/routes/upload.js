const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const authMiddleware = require('../middlewares/auth');
const adminMiddleware = require('../middlewares/admin');

// Configurar multer para almacenar archivos
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadDir = path.join(__dirname, '../public/images/uploads');
        
        // Crear el directorio si no existe
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        // Usar timestamp + nombre original para evitar colisiones
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'flavor-' + uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
    fileFilter: function(req, file, cb) {
        // Solo permitir imágenes
        if (!file.mimetype.startsWith('image/')) {
            return cb(new Error('Solo se permiten archivos de imagen'), false);
        }
        cb(null, true);
    }
});

// Ruta para subir imagen (solo admin)
router.post('/', [authMiddleware, adminMiddleware, upload.single('image')], (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No se ha proporcionado ninguna imagen' });
        }
        
        // Devolver la ruta relativa para acceder a la imagen
        const imagePath = `/images/uploads/${req.file.filename}`;
        
        res.json({ imagePath });
    } catch (error) {
        console.error('Error al subir imagen:', error);
        res.status(500).json({ error: 'Error al subir la imagen' });
    }
});

module.exports = router;