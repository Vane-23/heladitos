const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const adminMiddleware = require('../middlewares/admin');
const Flavour = require('../models/Flavours');

// Get all flavours
router.get('/', async (req, res) => {
    try {
        const flavours = await Flavour.findAll();
        res.json(flavours);
    } catch (error) {
        console.error('Error getting flavours:', error);
        res.status(500).json({ error: 'Error fetching flavours' });
    }
});

// Get single flavour by ID
router.get('/:id', async (req, res) => {
    try {
        const flavour = await Flavour.findById(req.params.id);
        if (!flavour) {
            return res.status(404).json({ error: 'Flavour not found' });
        }
        res.json(flavour);
    } catch (error) {
        console.error('Error getting flavour:', error);
        res.status(500).json({ error: 'Error fetching flavour' });
    }
});

// Create new flavour (admin only)
router.post('/', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        const { name, description, price, image } = req.body;
        
        if (!name || !price) {
            return res.status(400).json({ error: 'Name and price are required' });
        }

        const newFlavourId = await Flavour.create({
            name,
            description,
            price,
            image
        });

        const newFlavour = await Flavour.findById(newFlavourId);
        res.status(201).json(newFlavour);
    } catch (error) {
        console.error('Error creating flavour:', error);
        res.status(500).json({ error: 'Error creating flavour' });
    }
});

// Update flavour (admin only)
router.put('/:id', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, price, image } = req.body;

        const existingFlavour = await Flavour.findById(id);
        if (!existingFlavour) {
            return res.status(404).json({ error: 'Flavour not found' });
        }

        await Flavour.update(id, {
            name: name || existingFlavour.name,
            description: description || existingFlavour.description,
            price: price || existingFlavour.price,
            image: image || existingFlavour.image
        });

        const updatedFlavour = await Flavour.findById(id);
        res.json(updatedFlavour);
    } catch (error) {
        console.error('Error updating flavour:', error);
        res.status(500).json({ error: 'Error updating flavour' });
    }
});

// Delete flavour (admin only)
router.delete('/:id', [authMiddleware, adminMiddleware], async (req, res) => {
    try {
        const { id } = req.params;

        const existingFlavour = await Flavour.findById(id);
        if (!existingFlavour) {
            return res.status(404).json({ error: 'Flavour not found' });
        }

        await Flavour.delete(id);
        res.json({ message: 'Flavour deleted successfully' });
    } catch (error) {
        console.error('Error deleting flavour:', error);
        res.status(500).json({ error: 'Error deleting flavour' });
    }
});

module.exports = router;