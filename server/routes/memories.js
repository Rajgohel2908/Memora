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
        const memories = await Memory.find({ user: req.user.id })
            .sort({ memoryDate: 1 })
            .populate('user', 'username displayName profileImage')
            .populate('collaborators', 'username displayName profileImage');

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
        const memories = await Memory.find({ user: req.user.id })
            .sort(sort)
            .skip((page - 1) * limit)
            .limit(parseInt(limit))
            .populate('user', 'username displayName profileImage')
            .populate('collaborators', 'username displayName profileImage');

        const total = await Memory.countDocuments({ user: req.user.id });

        res.json({ memories, total, page: parseInt(page), pages: Math.ceil(total / limit) });
    } catch (error) {
        console.error('Fetch memories error:', error);
        res.status(500).json({ message: 'Error fetching memories' });
    }
});

// Create memory
router.post('/', auth, upload.fields([{ name: 'photos', maxCount: 10 }, { name: 'audio', maxCount: 1 }]), processImages, async (req, res) => {
    try {
        const { title, content, memoryDate, tags, mood, lat, lng, collaborators } = req.body;

        const photos = req.files && req.files.photos ? req.files.photos.map((f) => `/uploads/${f.filename}`) : [];
        // Also check processed image files on req.files array (from processImages)
        const processedPhotos = Array.isArray(req.files) ? req.files.map(f => `/uploads/${f.filename}`) : [];
        const allPhotos = photos.length > 0 ? photos : processedPhotos;

        // Audio from processImages middleware
        const audioUrl = req.audioFile ? `/uploads/${req.audioFile.filename}` : '';

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
            user: req.user.id,
            title: title || '',
            content: content || '',
            photos: allPhotos,
            audioUrl,
            memoryDate: memoryDate ? new Date(memoryDate) : new Date(),
            tags: parsedTags,
            mood: mood && mood.trim() !== '' ? mood : undefined,
            location: {
                lat: lat ? parseFloat(lat) : null,
                lng: lng ? parseFloat(lng) : null,
            },
            collaborators: collaborators ? JSON.parse(collaborators) : [],
        });

        await memory.save();
        await memory.populate('user', 'username displayName profileImage');
        await memory.populate('collaborators', 'username displayName profileImage');

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
            .populate('user', 'username displayName profileImage')
            .populate('collaborators', 'username displayName profileImage');

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
router.put('/:id', auth, upload.fields([{ name: 'photos', maxCount: 10 }, { name: 'audio', maxCount: 1 }]), processImages, async (req, res) => {
    try {
        const memory = await Memory.findById(req.params.id);

        if (!memory) {
            return res.status(404).json({ message: 'Memory not found' });
        }

        if (memory.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        const { title, content, memoryDate, tags, mood, existingPhotos, lat, lng, collaborators } = req.body;

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
        if (lat !== undefined || lng !== undefined) {
            memory.location = {
                lat: lat ? parseFloat(lat) : memory.location?.lat || null,
                lng: lng ? parseFloat(lng) : memory.location?.lng || null,
            };
        }
        if (collaborators) {
            try {
                memory.collaborators = typeof collaborators === 'string' ? JSON.parse(collaborators) : collaborators;
            } catch {
                memory.collaborators = [];
            }
        }

        // Handle photos: keep existing + add new
        let photos = memory.photos;
        if (existingPhotos) {
            try {
                photos = typeof existingPhotos === 'string' ? JSON.parse(existingPhotos) : existingPhotos;
            } catch {
                photos = memory.photos;
            }
        }
        // Check both array format and fields format for processed images
        const newPhotos = Array.isArray(req.files)
            ? req.files.map(f => `/uploads/${f.filename}`)
            : (req.files && req.files.photos ? req.files.photos.map(f => `/uploads/${f.filename}`) : []);
        if (newPhotos.length > 0) {
            photos = [...photos, ...newPhotos];
        }
        memory.photos = photos;

        // Handle audio
        if (req.audioFile) {
            memory.audioUrl = `/uploads/${req.audioFile.filename}`;
        }

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

        if (memory.user.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        await Memory.findByIdAndDelete(req.params.id);
        res.json({ message: 'Memory deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting memory' });
    }
});

module.exports = router;
