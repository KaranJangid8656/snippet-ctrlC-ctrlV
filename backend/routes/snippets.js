const express = require('express');
const router = express.Router();
const {
    getSnippets,
    getStats,
    createSnippet,
    searchSnippets,
    toggleFavorite,
    updateSnippet,
    deleteSnippet
} = require('../controllers/snippetController');
const { optionalAuth } = require('../middleware/authMiddleware');

// All snippet routes use optionalAuth — works for both logged-in and anonymous users
router.use(optionalAuth);

router
    .route('/')
    .get(getSnippets)
    .post(createSnippet);

router.get('/stats', getStats);
router.get('/search', searchSnippets);

router.patch('/:id/favorite', toggleFavorite);
router.patch('/:id', updateSnippet);
router.delete('/:id', deleteSnippet);

module.exports = router;
