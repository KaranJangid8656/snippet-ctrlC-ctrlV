const express = require('express');
const router = express.Router();
const Snippet = require('../models/Snippet');

// GET /snippets - Fetch snippets with sorting and pagination
router.get('/', async (req, res) => {
    try {
        const { sortBy = 'createdAt', order = 'desc', limit = 100, page = 1 } = req.query;
        const sortOptions = {};
        sortOptions[sortBy] = order === 'desc' ? -1 : 1;

        const snippets = await Snippet.find()
            .sort(sortOptions)
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));

        res.json(snippets);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /snippets/stats - Advanced Aggregation Pipeline
router.get('/stats', async (req, res) => {
    try {
        const stats = await Snippet.aggregate([
            {
                $facet: {
                    totalCount: [{ $count: 'count' }],
                    tagClouds: [
                        { $unwind: '$tags' },
                        { $group: { _id: '$tags', count: { $sum: 1 } } },
                        { $sort: { count: -1 } },
                        { $limit: 10 }
                    ],
                    languageStats: [
                        { $group: { _id: '$language', count: { $sum: 1 } } },
                        { $sort: { count: -1 } }
                    ],
                    favoriteStats: [
                        { $group: { _id: '$favorite', count: { $sum: 1 } } }
                    ],
                    lastSevenDays: [
                        {
                            $match: {
                                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
                            }
                        },
                        {
                            $group: {
                                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { _id: 1 } }
                    ]
                }
            }
        ]);
        res.json(stats[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /snippets — Add a new snippet
router.post('/', async (req, res) => {
    try {
        const { title, content, tags, language } = req.body;
        const snippet = new Snippet({
            title,
            content,
            tags: Array.isArray(tags) ? tags : [],
            language: language || 'javascript'
        });
        await snippet.save();
        res.status(201).json(snippet);
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// GET /snippets/search?q=keyword — Search by title, tags or language
router.get('/search', async (req, res) => {
    try {
        const q = req.query.q || '';
        const regex = new RegExp(q, 'i');
        const snippets = await Snippet.find({
            $or: [
                { title: regex },
                { tags: { $elemMatch: { $regex: regex } } },
                { language: regex }
            ],
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
