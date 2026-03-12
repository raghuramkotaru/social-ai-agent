const Comment = require('../models/Comment');
const youtubeService = require('../services/youtube');

/**
 * Analytics Controller
 * Provides dashboard and reporting endpoints
 */

/**
 * Get comprehensive analytics overview
 * GET /api/analytics/overview
 */
exports.getOverview = async (req, res) => {
  try {
    const channel = await youtubeService.getMyChannel();
    
    // Get all processed comments for the channel
    const totalComments = await Comment.countDocuments({ processed: true });
    
    // Get action breakdown
    const actionStats = await Comment.aggregate([
      { $match: { processed: true } },
      {
        $group: {
          _id: '$actionTaken',
          count: { $sum: 1 }
        }
      }
    ]);
    
    // Get sentiment breakdown
    const sentimentStats = await Comment.aggregate([
      { $match: { processed: true } },
      {
        $group: {
          _id: '$sentiment',
          count: { $sum: 1 },
          avgScore: { $avg: '$sentimentScore' }
        }
      }
    ]);
    
    // Get videos with most comments
    const topVideos = await Comment.aggregate([
      { $match: { processed: true } },
      {
        $group: {
          _id: '$postId',
          commentCount: { $sum: 1 },
          spamCount: {
            $sum: { $cond: [{ $eq: ['$decision.action', 'DELETE'] }, 1, 0] }
          }
        }
      },
      { $sort: { commentCount: -1 } },
      { $limit: 5 }
    ]);

    res.json({
      success: true,
      channel: {
        name: channel.title,
        id: channel.id
      },
      overview: {
        totalComments,
        actionStats,
        sentimentStats,
        topVideos
      }
    });

  } catch (error) {
    console.error('❌ Error getting overview:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get detailed analytics for a specific video
 * GET /api/analytics/video/:videoId
 */
exports.getVideoAnalytics = async (req, res) => {
  try {
    const { videoId } = req.params;
    
    // Verify ownership
    const isMyVideo = await youtubeService.isMyVideo(videoId);
    if (!isMyVideo) {
      return res.status(403).json({
        success: false,
        error: 'Not your video'
      });
    }
    
    // Get video info
    const videoInfo = await youtubeService.getVideoStats(videoId);
    
    // Get comprehensive analytics
    const analytics = await Comment.getVideoAnalytics(videoId);
    
    // Get moderation summary
    const moderationSummary = await Comment.getModerationSummary(videoId);
    
    // Get spam stats
    const spamStats = await Comment.getSpamStats(videoId);
    
    // Get engagement metrics
    const engagementMetrics = await Comment.getEngagementMetrics(videoId);

    res.json({
      success: true,
      video: videoInfo,
      analytics,
      moderationSummary,
      spamStats,
      engagementMetrics
    });

  } catch (error) {
    console.error('❌ Error getting video analytics:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get sentiment timeline for a video
 * GET /api/analytics/timeline/:videoId?granularity=hour
 */
exports.getSentimentTimeline = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { granularity = 'hour' } = req.query;
    
    const timeline = await Comment.getSentimentTimeline(videoId, granularity);
    
    res.json({
      success: true,
      videoId,
      granularity,
      timeline
    });

  } catch (error) {
    console.error('❌ Error getting timeline:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get top issues for a video
 * GET /api/analytics/issues/:videoId?limit=10
 */
exports.getTopIssues = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { limit = 10 } = req.query;
    
    const issues = await Comment.getTopIssues(videoId, parseInt(limit));
    
    res.json({
      success: true,
      videoId,
      totalIssues: issues.length,
      issues
    });

  } catch (error) {
    console.error('❌ Error getting issues:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get dashboard summary (optimized for terminal display)
 * GET /api/analytics/dashboard/:videoId
 */
exports.getDashboardSummary = async (req, res) => {
  try {
    const { videoId } = req.params;
    
    const [videoInfo, moderationSummary, topIssues] = await Promise.all([
      youtubeService.getVideoStats(videoId),
      Comment.getModerationSummary(videoId),
      Comment.getTopIssues(videoId, 5)
    ]);
    
    // Format for dashboard
    const stats = moderationSummary.stats;
    const total = stats.total[0]?.count || 0;
    
    const byAction = {};
    stats.byAction.forEach(item => {
      byAction[item._id || 'pending'] = item.count;
    });
    
    const bySentiment = {};
    stats.bySentiment.forEach(item => {
      bySentiment[item._id || 'unknown'] = {
        count: item.count,
        percentage: ((item.count / total) * 100).toFixed(1),
        avgScore: item.avgScore?.toFixed(3)
      };
    });

    res.json({
      success: true,
      video: {
        id: videoId,
        title: videoInfo.title,
        viewCount: videoInfo.viewCount,
        likeCount: videoInfo.likeCount
      },
      summary: {
        total,
        actions: {
          hidden: byAction.deleted || 0,
          replied: byAction.replied || 0,
          flagged: byAction.flagged || 0,
          ignored: byAction.ignored || 0,
          pending: byAction.pending || 0
        },
        sentiment: bySentiment,
        topIssues: topIssues.map(issue => ({
          author: issue.author,
          text: issue.text.substring(0, 80) + '...',
          sentiment: issue.sentiment,
          score: issue.sentimentScore?.toFixed(2),
          keywords: issue.matchedKeywords
        }))
      },
      recentActions: moderationSummary.recentActions.slice(0, 10)
    });

  } catch (error) {
    console.error('❌ Error getting dashboard:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

module.exports = exports;

/**
 * Generate HTML Report
 * Add this to analyticsController.js
 */

exports.generateHTMLReport = async (req, res) => {
  try {
    const { videoId } = req.params;
    
    const [videoInfo, moderationSummary, timeline, issues] = await Promise.all([
      youtubeService.getVideoStats(videoId),
      Comment.getModerationSummary(videoId),
      Comment.getSentimentTimeline(videoId, 'day'),
      Comment.getTopIssues(videoId, 10)
    ]);
    
    const stats = moderationSummary.stats;
    const total = stats.total[0]?.count || 0;
    
    const byAction = {};
    stats.byAction.forEach(item => {
      byAction[item._id || 'pending'] = item.count;
    });
    
    const bySentiment = {};
    stats.bySentiment.forEach(item => {
      bySentiment[item._id] = {
        count: item.count,
        percentage: ((item.count / total) * 100).toFixed(1)
      };
    });

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Social AI Agent Report - ${videoInfo.title}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 20px;
            color: #333;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            overflow: hidden;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        .header h1 { font-size: 2.5em; margin-bottom: 10px; }
        .header p { opacity: 0.9; font-size: 1.1em; }
        .section {
            padding: 30px 40px;
            border-bottom: 1px solid #eee;
        }
        .section:last-child { border-bottom: none; }
        .section h2 {
            color: #667eea;
            margin-bottom: 20px;
            font-size: 1.8em;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .stat-card {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 12px;
            border-left: 4px solid #667eea;
        }
        .stat-card h3 {
            color: #666;
            font-size: 0.9em;
            margin-bottom: 10px;
            text-transform: uppercase;
        }
        .stat-card .value {
            font-size: 2em;
            font-weight: bold;
            color: #333;
        }
        .progress-bar {
            background: #e9ecef;
            height: 30px;
            border-radius: 15px;
            overflow: hidden;
            margin: 10px 0;
            position: relative;
        }
        .progress-fill {
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
            transition: width 0.3s ease;
        }
        .positive { background: #28a745; }
        .neutral { background: #ffc107; }
        .negative { background: #dc3545; }
        .issue-card {
            background: #fff3cd;
            border-left: 4px solid #ffc107;
            padding: 15px;
            margin: 10px 0;
            border-radius: 8px;
        }
        .issue-card.high { background: #f8d7da; border-color: #dc3545; }
        .timestamp {
            color: #6c757d;
            font-size: 0.9em;
            margin-top: 20px;
        }
        .footer {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            color: #666;
        }
        @media print {
            body { background: white; padding: 0; }
            .container { box-shadow: none; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🤖 Social AI Agent Report</h1>
            <p>Intelligent Comment Management & Analytics</p>
        </div>

        <div class="section">
            <h2>📹 Video Information</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>Video Title</h3>
                    <div class="value" style="font-size: 1.2em;">${videoInfo.title}</div>
                </div>
                <div class="stat-card">
                    <h3>Video ID</h3>
                    <div class="value" style="font-size: 1em;">${videoId}</div>
                </div>
                <div class="stat-card">
                    <h3>Views</h3>
                    <div class="value">${videoInfo.viewCount?.toLocaleString()}</div>
                </div>
                <div class="stat-card">
                    <h3>Likes</h3>
                    <div class="value">${videoInfo.likeCount?.toLocaleString()}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>💬 Comments Summary</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>Total Comments</h3>
                    <div class="value">${total}</div>
                </div>
                <div class="stat-card" style="border-color: #dc3545;">
                    <h3>🗑️ Hidden (Spam)</h3>
                    <div class="value" style="color: #dc3545;">${byAction.deleted || 0}</div>
                </div>
                <div class="stat-card" style="border-color: #28a745;">
                    <h3>💬 Replied</h3>
                    <div class="value" style="color: #28a745;">${byAction.replied || 0}</div>
                </div>
                <div class="stat-card" style="border-color: #ffc107;">
                    <h3>🚩 Flagged</h3>
                    <div class="value" style="color: #ffc107;">${byAction.flagged || 0}</div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>📊 Sentiment Analysis</h2>
            ${bySentiment.positive ? `
            <div>
                <strong>😊 Positive</strong>
                <div class="progress-bar">
                    <div class="progress-fill positive" style="width: ${bySentiment.positive.percentage}%">
                        ${bySentiment.positive.count} (${bySentiment.positive.percentage}%)
                    </div>
                </div>
            </div>
            ` : ''}
            ${bySentiment.neutral ? `
            <div>
                <strong>😐 Neutral</strong>
                <div class="progress-bar">
                    <div class="progress-fill neutral" style="width: ${bySentiment.neutral.percentage}%">
                        ${bySentiment.neutral.count} (${bySentiment.neutral.percentage}%)
                    </div>
                </div>
            </div>
            ` : ''}
            ${bySentiment.negative ? `
            <div>
                <strong>😞 Negative</strong>
                <div class="progress-bar">
                    <div class="progress-fill negative" style="width: ${bySentiment.negative.percentage}%">
                        ${bySentiment.negative.count} (${bySentiment.negative.percentage}%)
                    </div>
                </div>
            </div>
            ` : ''}
        </div>

        <div class="section">
            <h2>⚠️ Top Issues</h2>
            ${issues.length === 0 ? 
                '<p style="color: #28a745;">✓ No issues detected! Your comment section is clean.</p>' :
                issues.map((issue, i) => `
                <div class="issue-card ${issue.decision?.priority === 'HIGH' ? 'high' : ''}">
                    <strong>${i + 1}. ${issue.author}</strong>
                    <p style="margin: 10px 0;">${issue.text}</p>
                    <div style="font-size: 0.9em; color: #666;">
                        Sentiment: ${issue.sentiment} | Score: ${issue.sentimentScore?.toFixed(2)}
                        ${issue.matchedKeywords?.length ? 
                            ` | Keywords: ${issue.matchedKeywords.join(', ')}` : ''}
                    </div>
                </div>
                `).join('')
            }
        </div>

        <div class="footer">
            <p class="timestamp">Generated: ${new Date().toLocaleString()}</p>
            <p>Powered by Social AI Agent | YouTube Comment Management System</p>
        </div>
    </div>
</body>
</html>
    `;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);

  } catch (error) {
    console.error('❌ Error generating report:', error);
    res.status(500).send('<h1>Error generating report</h1><p>' + error.message + '</p>');
  }
};