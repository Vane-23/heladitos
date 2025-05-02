const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado' });
    }

    try {
        const decoded = jwt.verify(token, 'tu_secret_key');
        req.user = {
            user_id: decoded.user_id,
            isAdmin: decoded.isAdmin
        };
        next();
    } catch (error) {
        console.error('Error al verificar el token:', error);
        res.status(401).json({ error: 'Token inválido' });
    }
};