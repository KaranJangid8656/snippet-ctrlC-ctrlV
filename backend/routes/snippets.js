const express = require('express');
const router = express.Router();
const Snippet = require('../models/Snippet');

// POST /snippets — Add a new snippet
router.post('/', async (req, res) => {
    try {
        const { title, content, tags } = req.body;
        const snippet = new Snippet({
            title,
            content,
            tags: Array.isArray(tags) ? tags : [],
        });
        await snippet.save();
        res.status(201).json(snippet);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET /snippets — Fetch all snippets (newest first)
router.get('/', async (req, res) => {
    try {
        const snippets = await Snippet.find().sort({ createdAt: -1 });
        res.json(snippets);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /snippets/search?q=keyword — Search by title or tags
router.get('/search', async (req, res) => {
    try {
        const q = req.query.q || '';
        const regex = new RegExp(q, 'i');
        const snippets = await Snippet.find({
            $or: [{ title: regex }, { tags: { $elemMatch: { $regex: regex } } }],
        }).sort({ createdAt: -1 });
        res.json(snippets);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /snippets/:id/favorite — Toggle favorite
router.patch('/:id/favorite', async (req, res) => {
    try {
        const snippet = await Snippet.findById(req.params.id);
        if (!snippet) return res.status(404).json({ error: 'Snippet not found' });
        snippet.favorite = !snippet.favorite;
        await snippet.save();
        res.json(snippet);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// DELETE /snippets/:id — Delete a snippet
router.delete('/:id', async (req, res) => {
    try {
        const snippet = await Snippet.findByIdAndDelete(req.params.id);
        if (!snippet) return res.status(404).json({ error: 'Snippet not found' });
        res.json({ message: 'Snippet deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
