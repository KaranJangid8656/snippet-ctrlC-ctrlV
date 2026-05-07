const express = require('express');
const router = express.Router();
const {
    getSnippets,
    getStats,
    createSnippet,
    searchSnippets,
    toggleFavorite,
    deleteSnippet
} = require('../controllers/snippetController');

// All routes are prepended with /snippets in server.js
router
    .route('/')
    .get(getSnippets)
    .post(createSnippet);

router.get('/stats', getStats);
router.get('/search', searchSnippets);

router.patch('/:id/favorite', toggleFavorite);
router.delete('/:id', deleteSnippet);

module.exports = router;
