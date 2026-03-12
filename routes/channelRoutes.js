/**
 * Channel Management Routes
 * Add these to your index.js
 * 
 * Usage:
 * const channelRoutes = require('./routes/channelRoutes');
 * app.use('/api/channel', channelRoutes);
 */

const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');

// Get YOUR channel information
router.get('/info', commentController.getMyChannel);

// Get YOUR videos list
router.get('/videos', commentController.getMyVideos);

// Get comments from YOUR specific video
router.get('/video/:videoId/comments', commentController.getMyVideoComments);

// Moderate YOUR video (AI analysis + optional auto-execute)
router.post('/video/:videoId/moderate', commentController.moderateMyVideo);

module.exports = router;