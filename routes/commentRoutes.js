const express = require('express');
const router = express.Router();
const commentController = require('../controllers/commentController');

/**
 * YouTube Comment Routes
 */

// Fetch comments from YouTube video
router.get('/youtube/:videoId', commentController.fetchYouTubeComments);

// Process comments with AI analysis
router.post('/process', commentController.processComments);

// Get sentiment summary for a video
router.get('/sentiment/:videoId', commentController.getSentimentSummary);

// Get action statistics
router.get('/actions/:videoId', commentController.getActionStats);

// Get processed comments
router.get('/processed/:videoId', commentController.getProcessedComments);

// Reply to a comment manually
router.post('/reply', commentController.replyToComment);

// Delete a comment
router.delete('/:commentId', commentController.deleteComment);

// Generate AI reply (preview)
router.post('/generate-reply', commentController.generateReply);

module.exports = router;
