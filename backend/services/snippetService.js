const Snippet = require('../models/Snippet');

/**
 * Service to handle all Snippet database operations
 */
const snippetService = {
    /**
     * Fetch all snippets with sorting and pagination
     */
    async getAllSnippets(query) {
        const { sortBy = 'createdAt', order = 'desc', limit = 100, page = 1 } = query;
        const sortOptions = {};
        sortOptions[sortBy] = order === 'desc' ? -1 : 1;

        return await Snippet.find()
            .sort(sortOptions)
            .limit(Number(limit))
            .skip((Number(page) - 1) * Number(limit));
    },

    /**
     * Get advanced stats using aggregation pipeline
     */
    async getSnippetStats() {
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
        return stats[0];
    },

    /**
     * Create a new snippet
     */
    async createSnippet(snippetData) {
        const { title, content, tags, language } = snippetData;
        const snippet = new Snippet({
            title,
            content,
            tags: Array.isArray(tags) ? tags : [],
            language: language || 'javascript'
        });
        return await snippet.save();
    },

    /**
     * Search snippets by keyword
     */
    async searchSnippets(searchQuery) {
        const q = searchQuery || '';
        const regex = new RegExp(q, 'i');
        return await Snippet.find({
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
    async toggleFavorite(id) {
        const snippet = await Snippet.findById(id);
        if (!snippet) return null;
        snippet.favorite = !snippet.favorite;
        return await snippet.save();
    },

    /**
     * Delete a snippet
     */
    async deleteSnippet(id) {
        return await Snippet.findByIdAndDelete(id);
    }
};

module.exports = snippetService;
