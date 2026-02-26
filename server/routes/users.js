const express = require('express');
const User = require('../models/User');
const Memory = require('../models/Memory');
const auth = require('../middleware/auth');

const router = express.Router();

// Search users by username or displayName
router.get('/search', auth, async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 2) {
            return res.json({ users: [] });
        }

        const users = await User.find({
            $or: [
                { username: { $regex: q, $options: 'i' } },
                { displayName: { $regex: q, $options: 'i' } }
            ],
            _id: { $ne: req.user.id }
        }).select('username displayName profileImage isPublic _id').limit(10);

        res.json({ users });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ message: 'Error searching users' });
    }
});


// Update Privacy Settings
router.put('/privacy', auth, async (req, res) => {
    try {
        const { isPublic } = req.body;

        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        user.isPublic = isPublic;
        await user.save();

        res.json({ message: 'Privacy settings updated successfully', isPublic: user.isPublic });
    } catch (error) {
        console.error('Error updating privacy settings:', error);
        res.status(500).json({ message: 'Error updating privacy settings' });
    }
});

// --- Friendship Logic ---

// Get current user's friends List
router.get('/friends', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).populate('friends.user', 'username displayName profileImage');
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ friends: user.friends });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching friends' });
    }
});

// Send Friend Request
router.post('/friends/request/:targetId', auth, async (req, res) => {
    try {
        if (req.user.id === req.params.targetId) {
            return res.status(400).json({ message: 'Cannot friend yourself' });
        }

        const targetUser = await User.findById(req.params.targetId);
        const currentUser = await User.findById(req.user.id);

        if (!targetUser || !currentUser) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if already friends or pending
        const existingConnection = currentUser.friends.find(f => f.user.toString() === req.params.targetId);
        if (existingConnection) {
            return res.status(400).json({ message: `Connection already exists: ${existingConnection.status}` });
        }

        const senderId = currentUser._id;

        // Add pending to current user (sender)
        currentUser.friends.push({ user: targetUser._id, status: 'pending', sentBy: senderId });
        await currentUser.save();

        // Add pending to target user (receiver)
        targetUser.friends.push({ user: currentUser._id, status: 'pending', sentBy: senderId });
        await targetUser.save();

        res.json({ message: 'Friend request sent successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error sending friend request' });
    }
});

// Accept Friend Request
router.post('/friends/accept/:targetId', auth, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        const targetUser = await User.findById(req.params.targetId);

        if (!targetUser || !currentUser) return res.status(404).json({ message: 'User not found' });

        // Update current user's array
        const myConnection = currentUser.friends.find(f => f.user.toString() === req.params.targetId);
        if (!myConnection || myConnection.status !== 'pending') {
            return res.status(400).json({ message: 'No pending request found' });
        }
        myConnection.status = 'accepted';
        await currentUser.save();

        // Update target user's array
        const theirConnection = targetUser.friends.find(f => f.user.toString() === req.user.id);
        if (theirConnection) {
            theirConnection.status = 'accepted';
            await targetUser.save();
        }

        res.json({ message: 'Friend request accepted' });
    } catch (error) {
        res.status(500).json({ message: 'Error accepting friend request' });
    }
});

// Reject/Remove Friend
router.post('/friends/reject/:targetId', auth, async (req, res) => {
    try {
        const currentUser = await User.findById(req.user.id);
        const targetUser = await User.findById(req.params.targetId);

        if (currentUser) {
            currentUser.friends = currentUser.friends.filter(f => f.user.toString() !== req.params.targetId);
            await currentUser.save();
        }

        if (targetUser) {
            targetUser.friends = targetUser.friends.filter(f => f.user.toString() !== req.user.id);
            await targetUser.save();
        }

        res.json({ message: 'Connection removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error removing connection' });
    }
});

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
