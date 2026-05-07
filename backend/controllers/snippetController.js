const snippetService = require('../services/snippetService');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @desc    Get all snippets (user-scoped if authenticated)
 * @route   GET /snippets
 * @access  Public (shows public) / Private (shows user's + public)
 */
exports.getSnippets = asyncHandler(async (req, res, next) => {
    const userId = req.user ? req.user._id : null;
    const result = await snippetService.getAllSnippets(req.query, userId);
    res.status(200).json(result);
});

/**
 * @desc    Get snippets stats
 * @route   GET /snippets/stats
 * @access  Public / Private
 */
exports.getStats = asyncHandler(async (req, res, next) => {
    const userId = req.user ? req.user._id : null;
    const stats = await snippetService.getSnippetStats(userId);
    res.status(200).json(stats);
});

/**
 * @desc    Create new snippet
 * @route   POST /snippets
 * @access  Public (legacy) / Private (owned snippet)
 */
exports.createSnippet = asyncHandler(async (req, res, next) => {
    const userId = req.user ? req.user._id : null;
    const snippet = await snippetService.createSnippet(req.body, userId);
    res.status(201).json(snippet);
});

/**
 * @desc    Search snippets
 * @route   GET /snippets/search
 * @access  Public / Private
 */
exports.searchSnippets = asyncHandler(async (req, res, next) => {
    const userId = req.user ? req.user._id : null;
    const snippets = await snippetService.searchSnippets(req.query.q, userId);
    res.status(200).json(snippets);
});

/**
 * @desc    Toggle favorite
 * @route   PATCH /snippets/:id/favorite
 * @access  Public / Private
 */
exports.toggleFavorite = asyncHandler(async (req, res, next) => {
    const userId = req.user ? req.user._id : null;
    const snippet = await snippetService.toggleFavorite(req.params.id, userId);

    if (!snippet) {
        return next(new ErrorResponse(`Snippet not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json(snippet);
});

/**
 * @desc    Delete snippet
 * @route   DELETE /snippets/:id
 * @access  Public / Private
 */
exports.deleteSnippet = asyncHandler(async (req, res, next) => {
    const userId = req.user ? req.user._id : null;
    const snippet = await snippetService.deleteSnippet(req.params.id, userId);

    if (!snippet) {
        return next(new ErrorResponse(`Snippet not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({ message: 'Snippet deleted successfully' });
});
