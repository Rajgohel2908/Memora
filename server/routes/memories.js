const express = require('express');
const Memory = require('../models/Memory');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');
const processImages = require('../middleware/processImages');

const router = express.Router();

// IMPORTANT: Static routes MUST come before parameterized routes
// Get memories grouped by time (for timeline/network)
router.get('/timeline/grouped', auth, async (req, res) => {
    try {
        const memories = await Memory.find({ user: req.userId })
            .sort({ memoryDate: 1 })
            .populate('user', 'username displayName profileImage');

        // Group by year and month
        const grouped = {};
        memories.forEach((memory) => {
            const date = new Date(memory.memoryDate);
            const year = date.getFullYear();
            const month = date.getMonth() + 1;
            const key = `${year}`;
            const monthKey = `${year}-${String(month).padStart(2, '0')}`;

            if (!grouped[key]) grouped[key] = { year, months: {} };
            if (!grouped[key].months[monthKey]) grouped[key].months[monthKey] = { month, memories: [] };
            grouped[key].months[monthKey].memories.push(memory);
        });

        res.json({ grouped, total: memories.length });
    } catch (error) {
        console.error('Timeline error:', error);
        res.status(500).json({ message: 'Error fetching timeline' });
    }
});

// Get all memories for current user
router.get('/my', auth, async (req, res) => {
    try {
        const { page = 1, limit = 50, sort = '-memoryDate' } = req.query;
        const memories = await Memory.find({ user: req.userId })
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('user', 'username displayName profileImage');

        const total = await Memory.countDocuments({ user: req.userId });

        res.json({ memories, total, page: parseInt(page), pages: Math.ceil(total / limit) });
    } catch (error) {
        console.error('Fetch memories error:', error);
        res.status(500).json({ message: 'Error fetching memories' });
    }
});

// Create memory
router.post('/', auth, upload.array('photos', 10), processImages, async (req, res) => {
    try {
        const { title, content, memoryDate, tags, mood } = req.body;

        const photos = req.files ? req.files.map((f) => `/uploads/${f.filename}`) : [];

        // Parse tags safely
        let parsedTags = [];
        if (tags) {
            try {
                parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
            } catch {
                parsedTags = [];
            }
        }

        const memory = new Memory({
            user: req.userId,
            title: title || '',
            content: content || '',
            photos,
            memoryDate: memoryDate ? new Date(memoryDate) : new Date(),
            tags: parsedTags,
            mood: mood && mood.trim() !== '' ? mood : undefined,
        });

        await memory.save();
        await memory.populate('user', 'username displayName profileImage');

        res.status(201).json({ memory });
    } catch (error) {
        console.error('Create memory error:', error.message, error.stack);
        res.status(500).json({ message: 'Error creating memory' });
    }
});

// Get single memory (MUST be after /my and /timeline/grouped)
router.get('/:id', auth, async (req, res) => {
    try {
        const memory = await Memory.findById(req.params.id)
            .populate('user', 'username displayName profileImage');

        if (!memory) {
            return res.status(404).json({ message: 'Memory not found' });
        }

        res.json({ memory });
    } catch (error) {
        console.error('Fetch memory error:', error);
        res.status(500).json({ message: 'Error fetching memory' });
    }
});

// Update memory
router.put('/:id', auth, upload.array('photos', 10), processImages, async (req, res) => {
    try {
        const memory = await Memory.findById(req.params.id);

        if (!memory) {
            return res.status(404).json({ message: 'Memory not found' });
        }

        if (memory.user.toString() !== req.userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { title, content, memoryDate, tags, mood, existingPhotos } = req.body;

        if (title !== undefined) memory.title = title;
        if (content !== undefined) memory.content = content;
        if (memoryDate) memory.memoryDate = new Date(memoryDate);
        if (tags) {
            try {
                memory.tags = typeof tags === 'string' ? JSON.parse(tags) : tags;
            } catch {
                memory.tags = [];
            }
        }
        if (mood !== undefined) memory.mood = mood && mood.trim() !== '' ? mood : '';

        // Handle photos: keep existing + add new
        let photos = memory.photos;
        if (existingPhotos) {
            try {
                photos = typeof existingPhotos === 'string' ? JSON.parse(existingPhotos) : existingPhotos;
            } catch {
                photos = memory.photos;
            }
        }
        if (req.files && req.files.length > 0) {
            const newPhotos = req.files.map((f) => `/uploads/${f.filename}`);
            photos = [...photos, ...newPhotos];
        }
        memory.photos = photos;

        await memory.save();
        await memory.populate('user', 'username displayName profileImage');

        res.json({ memory });
    } catch (error) {
        console.error('Update memory error:', error);
        res.status(500).json({ message: 'Error updating memory' });
    }
});

// Delete memory
router.delete('/:id', auth, async (req, res) => {
    try {
        const memory = await Memory.findById(req.params.id);

        if (!memory) {
            return res.status(404).json({ message: 'Memory not found' });
        }

        if (memory.user.toString() !== req.userId) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await Memory.findByIdAndDelete(req.params.id);
        res.json({ message: 'Memory deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting memory' });
    }
});

module.exports = router;
