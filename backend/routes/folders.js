const express = require('express');
const router = express.Router();
const { getFolders, createFolder, deleteFolder } = require('../controllers/folderController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect); // All folder routes protected

router.route('/')
    .get(getFolders)
    .post(createFolder);

router.delete('/:id', deleteFolder);

module.exports = router;
