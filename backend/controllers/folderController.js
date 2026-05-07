const folderService = require('../services/folderService');
const asyncHandler = require('../middleware/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

exports.getFolders = asyncHandler(async (req, res, next) => {
    const folders = await folderService.getFolders(req.user.id);
    res.status(200).json(folders);
});

exports.createFolder = asyncHandler(async (req, res, next) => {
    const { name } = req.body;
    const folder = await folderService.createFolder(req.user.id, name);
    res.status(201).json(folder);
});

exports.deleteFolder = asyncHandler(async (req, res, next) => {
    const folder = await folderService.deleteFolder(req.user.id, req.params.id);
    if (!folder) {
        return next(new ErrorResponse('Folder not found', 404));
    }
    res.status(200).json({ message: 'Folder deleted' });
});
