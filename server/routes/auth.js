const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Sign up
router.post('/signup', async (req, res) => {
    try {
        const { username, email, password, displayName } = req.body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Username, email, and password are required' });
        }

        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.status(400).json({
                message: existingUser.email === email ? 'Email already in use' : 'Username already taken',
            });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({
            username,
            email,
            password: hashedPassword,
            displayName: displayName || username,
        });

        await user.save();

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.status(201).json({
            message: 'Account created successfully',
            token,
            user: user.toJSON(),
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ message: 'Server error during signup' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            message: 'Login successful',
            token,
            user: user.toJSON(),
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Server error during login' });
    }
});

// Google Auth Login/Signup
router.post('/google', async (req, res) => {
    try {
        const { accessToken } = req.body;
        if (!accessToken) return res.status(400).json({ message: 'No access token provided' });

        // Fetch user info from Google using the access token
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (!response.ok) {
            return res.status(401).json({ message: 'Invalid Google access token' });
        }

        const googleUser = await response.json();
        const { email, name, picture, sub: googleId } = googleUser;

        if (!email) {
            return res.status(400).json({ message: 'Could not retrieve email from Google' });
        }

        let user = await User.findOne({ email });

        if (!user) {
            user = new User({
                username: email.split('@')[0] + Math.floor(Math.random() * 10000),
                email,
                displayName: name || email.split('@')[0],
                profileImage: picture || '',
                googleId,
                authProvider: 'google',
            });
            await user.save();
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.json({
            message: 'Google login successful',
            token,
            user: user.toJSON(),
        });
    } catch (error) {
        console.error('Google Auth backend error:', error);
        res.status(500).json({ message: 'Failed to authenticate with Google' });
    }
});

// Get current user
router.get('/me', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ user: user.toJSON() });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update profile
router.put('/profile', auth, upload.single('profileImage'), async (req, res) => {
    try {
        const updates = {};
        if (req.body.displayName) updates.displayName = req.body.displayName;
        if (req.body.bio !== undefined) updates.bio = req.body.bio;
        if (req.file) {
            updates.profileImage = `/uploads/${req.file.filename}`;
        }

        const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
        res.json({ user: user.toJSON() });
    } catch (error) {
        res.status(500).json({ message: 'Error updating profile' });
    }
});

module.exports = router;