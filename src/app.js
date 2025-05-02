const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3008;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
const authRoutes = require('./routes/auth');
const flavoursRoutes = require('./routes/flavours');
const cartRoutes = require('./routes/cart');
const usersRoutes = require('./routes/users');
const uploadRoutes = require('./routes/upload');
const ordersRoutes = require('./routes/orders');


// API routes
app.use('/api/auth', authRoutes);
app.use('/api/flavours', flavoursRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/orders', ordersRoutes);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

// Serve other HTML routes
app.get('/nosotros', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'about.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login.html'));
});

app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'register.html'));
});

app.get('/flavours', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'flavours.html'));
});

app.get('/flavours/:id', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'flavour-detail.html'));
});

app.get('/admin/users', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'users-admin.html'));
});

app.get('/cart', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'cart.html'));
});

// Ordenes
app.get('/orders', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'orders.html'));
});

// Ruta para mostrar la página de historial de pedidos
app.get('/my-orders', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'my-orders.html'));
});

// Manejar rutas no encontradas
app.use((req, res, next) => {
    res.status(404).sendFile(path.join(__dirname, 'views', '404.html'));
});



// Manejar errores del servidor
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});