const snippetService = require('../services/snippetService');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

/**
 * @desc    Get all snippets
 * @route   GET /snippets
 * @access  Public
 */
exports.getSnippets = asyncHandler(async (req, res, next) => {
    const snippets = await snippetService.getAllSnippets(req.query);
    res.status(200).json(snippets);
});

/**
 * @desc    Get snippets stats
 * @route   GET /snippets/stats
 * @access  Public
 */
exports.getStats = asyncHandler(async (req, res, next) => {
    const stats = await snippetService.getSnippetStats();
    res.status(200).json(stats);
});

/**
 * @desc    Create new snippet
 * @route   POST /snippets
 * @access  Public
 */
exports.createSnippet = asyncHandler(async (req, res, next) => {
    const snippet = await snippetService.createSnippet(req.body);
    res.status(201).json(snippet);
});

/**
 * @desc    Search snippets
 * @route   GET /snippets/search
 * @access  Public
 */
exports.searchSnippets = asyncHandler(async (req, res, next) => {
    const snippets = await snippetService.searchSnippets(req.query.q);
    res.status(200).json(snippets);
});

/**
 * @desc    Toggle favorite
 * @route   PATCH /snippets/:id/favorite
 * @access  Public
 */
exports.toggleFavorite = asyncHandler(async (req, res, next) => {
    const snippet = await snippetService.toggleFavorite(req.params.id);

    if (!snippet) {
        return next(new ErrorResponse(`Snippet not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json(snippet);
});

/**
 * @desc    Delete snippet
 * @route   DELETE /snippets/:id
 * @access  Public
 */
exports.deleteSnippet = asyncHandler(async (req, res, next) => {
    const snippet = await snippetService.deleteSnippet(req.params.id);

    if (!snippet) {
        return next(new ErrorResponse(`Snippet not found with id of ${req.params.id}`, 404));
    }

    res.status(200).json({ message: 'Snippet deleted successfully' });
});
