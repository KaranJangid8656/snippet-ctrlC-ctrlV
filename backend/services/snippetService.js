const Snippet = require('../models/Snippet');

/**
 * Service to handle all Snippet database operations.
 * Supports multi-tenant (user-scoped) and public (legacy) access.
 */
const snippetService = {
    /**
     * Build a filter for user-scoped or public queries
     */
    _buildUserFilter(userId) {
        // If a user is logged in, show their snippets + legacy public snippets
        if (userId) {
            return { $or: [{ user: userId }, { user: null }] };
        }
        // If no user (unauthenticated), show only legacy public snippets
        return { user: null };
    },

    /**
     * Fetch all snippets with sorting and pagination
     */
    async getAllSnippets(query, userId = null) {
        const { sortBy = 'createdAt', order = 'desc', limit = 100, page = 1, folderId } = query;
        const sortOptions = {};
        sortOptions[sortBy] = order === 'desc' ? -1 : 1;

        const filter = this._buildUserFilter(userId);
        if (folderId) {
            filter.folder = folderId;
        }

        const total = await Snippet.countDocuments(filter);
        const snippets = await Snippet.find(filter)
            .sort(sortOptions)
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));

        return {
            snippets,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                pages: Math.ceil(total / Number(limit))
            }
        };
    },

    /**
     * Get advanced stats using aggregation pipeline
     */
    async getSnippetStats(userId = null) {
        const matchStage = userId
            ? { $match: { $or: [{ user: userId }, { user: null }] } }
            : { $match: { user: null } };

        const stats = await Snippet.aggregate([
            matchStage,
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
        return stats[0];
    },

    /**
     * Create a new snippet (owned by a user if logged in)
     */
    async createSnippet(snippetData, userId = null) {
        const { title, content, tags, language, folderId } = snippetData;
        const snippet = new Snippet({
            title,
            content,
            tags: Array.isArray(tags) ? tags : [],
            language: language || 'javascript',
            user: userId || null,
            folder: folderId || null
        });
        return await snippet.save();
    },

    /**
     * Search snippets by keyword
     */
    async searchSnippets(searchQuery, userId = null) {
        const q = searchQuery || '';
        const regex = new RegExp(q, 'i');
        const userFilter = this._buildUserFilter(userId);

        return await Snippet.find({
            ...userFilter,
            $or: [
                { title: regex },
                { tags: { $elemMatch: { $regex: regex } } },
                { language: regex }
            ],
        }).sort({ createdAt: -1 });
    },

    /**
     * Toggle favorite status
     */
    async toggleFavorite(id, userId = null) {
        const snippet = await Snippet.findById(id);
        if (!snippet) return null;

        // Only allow toggling own snippets or legacy public ones
        if (userId && snippet.user && snippet.user.toString() !== userId.toString()) {
            return null;
        }

        snippet.favorite = !snippet.favorite;
        return await snippet.save();
    },

    /**
     * Delete a snippet
     */
    async deleteSnippet(id, userId = null) {
        const snippet = await Snippet.findById(id);
        if (!snippet) return null;

        // Only allow deleting own snippets or legacy public ones
        if (userId && snippet.user && snippet.user.toString() !== userId.toString()) {
            return null;
        }

        await Snippet.findByIdAndDelete(id);
        return snippet;
    }
};

module.exports = snippetService;
