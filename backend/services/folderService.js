const Folder = require('../models/Folder');
const Snippet = require('../models/Snippet');

const folderService = {
    async getFolders(userId) {
        return await Folder.find({ user: userId }).sort({ name: 1 });
    },

    async createFolder(userId, name) {
        return await Folder.create({ user: userId, name });
    },

    async deleteFolder(userId, folderId) {
        // Find folder and ensure ownership
        const folder = await Folder.findOne({ _id: folderId, user: userId });
        if (!folder) return null;

        // Move snippets in this folder to "no folder" (null)
        await Snippet.updateMany({ folder: folderId }, { folder: null });

        await Folder.findByIdAndDelete(folderId);
        return folder;
    }
};

module.exports = folderService;
