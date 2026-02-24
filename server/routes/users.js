const express = require('express');
const User = require('../models/User');
const Memory = require('../models/Memory');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user profile by username
router.get('/:username', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const memoryCount = await Memory.countDocuments({ user: user._id });

        res.json({
            user: user.toJSON(),
            memoryCount,
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user' });
    }
});

module.exports = router;
