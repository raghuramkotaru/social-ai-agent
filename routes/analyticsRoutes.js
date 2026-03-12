const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');

/**
 * Analytics Routes
 * Add to index.js:
 * const analyticsRoutes = require('./routes/analyticsRoutes');
 * app.use('/api/analytics', analyticsRoutes);
 */

// Overview analytics for all videos
router.get('/overview', analyticsController.getOverview);

// Video-specific analytics
router.get('/video/:videoId', analyticsController.getVideoAnalytics);

// Sentiment timeline
router.get('/timeline/:videoId', analyticsController.getSentimentTimeline);

// Top issues
router.get('/issues/:videoId', analyticsController.getTopIssues);

// Dashboard summary (optimized format)
router.get('/dashboard/:videoId', analyticsController.getDashboardSummary);
router.get('/report/:videoId', analyticsController.generateHTMLReport);

module.exports = router;

