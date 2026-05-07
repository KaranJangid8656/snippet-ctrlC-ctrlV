const mongoose = require('mongoose');

const snippetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    default: null // null means legacy/public snippet (backward compatible)
  },
  folder: {
    type: mongoose.Schema.ObjectId,
    ref: 'Folder',
    default: null
  },
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
  },
  tags: {
    type: [String],
    default: [],
  },
  favorite: {
    type: Boolean,
    default: false,
  },
  language: {
    type: String,
    default: 'javascript',
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

snippetSchema.index({ title: 1 });
snippetSchema.index({ tags: 1 });
snippetSchema.index({ language: 1 });
snippetSchema.index(
  { title: 'text', content: 'text', tags: 'text' },
  { language_override: 'dummy_text_language' } // Prevent conflict with our programming language field
);

module.exports = mongoose.model('Snippet', snippetSchema);
