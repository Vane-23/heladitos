const jwt = require('jsonwebtoken');

function adminMiddleware(req, res, next) {
    // Check if user exists (should be set by authMiddleware)
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user is admin
    if (!req.user.isAdmin) {
        return res.status(403).json({ error: 'Admin access required' });
    }

    next();
}

module.exports = adminMiddleware;