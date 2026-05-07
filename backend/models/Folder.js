const mongoose = require('mongoose');

const folderSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Folder name is required'],
        trim: true,
        maxlength: [30, 'Folder name cannot exceed 30 characters']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Avoid duplicate folder names for the same user
folderSchema.index({ name: 1, user: 1 }, { unique: true });

module.exports = mongoose.model('Folder', folderSchema);
