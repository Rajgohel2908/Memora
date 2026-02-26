const mongoose = require('mongoose');

const memorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    collaborators: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    title: {
        type: String,
        trim: true,
        maxlength: 200,
        default: '',
    },
    content: {
        type: String,
        maxlength: 5000,
        default: '',
    },
    photos: [{
        type: String, // file paths
    }],
    audioUrl: {
        type: String,
        default: '',
    },
    location: {
        lat: { type: Number, default: null },
        lng: { type: Number, default: null }
    },
    memoryDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    tags: [{
        type: String,
        trim: true,
        lowercase: true,
    }],
    mood: {
        type: String,
        enum: ['happy', 'nostalgic', 'peaceful', 'excited', 'grateful', 'reflective', 'bittersweet', 'adventurous', ''],
        default: '',
    },
    isTextOnly: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

memorySchema.index({ user: 1, memoryDate: -1 });
memorySchema.index({ memoryDate: 1 });
memorySchema.index({ tags: 1 });

memorySchema.pre('save', function () {
    this.updatedAt = Date.now();

    if (!this.photos || this.photos.length === 0) {
        this.isTextOnly = true;
    } else {
        this.isTextOnly = false;
    }
});

module.exports = mongoose.model('Memory', memorySchema);
