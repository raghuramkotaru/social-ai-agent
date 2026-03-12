const youtubeService = require('../services/youtube');
const azureAI = require('../services/azureAI');
const keywordFilter = require('../services/keywordFilter');
const decisionEngine = require('../services/decisionEngine');
const Comment = require('../models/Comment');

/**
 * Comment Controller
 * Handles all comment-related operations with AI processing
 */

/**
 * Fetch comments from a YouTube video
 * GET /api/comments/youtube/:videoId
 */
exports.fetchYouTubeComments = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { maxResults = 50 } = req.query;

    console.log(`📥 Fetching comments for video: ${videoId}`);

    // Fetch comments from YouTube
    const comments = await youtubeService.fetchComments(videoId, parseInt(maxResults));

    res.json({
      success: true,
      videoId: videoId,
      totalComments: comments.length,
      comments: comments
    });

  } catch (error) {
    console.error('❌ Error fetching comments:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Process comments with AI analysis
 * POST /api/comments/process
 * Body: { videoId: string, autoExecute: boolean }
 */
exports.processComments = async (req, res) => {
  try {
    const { videoId, autoExecute = false } = req.body;

    if (!videoId) {
      return res.status(400).json({
        success: false,
        error: 'Video ID is required'
      });
    }

    console.log(`🤖 Processing comments for video: ${videoId}`);

    // Step 1: Fetch comments
    const comments = await youtubeService.fetchComments(videoId);
    console.log(`📊 Fetched ${comments.length} comments`);

    // Step 2: Process each comment
    const results = [];
    const errors = [];

    for (const comment of comments) {
      try {
        // Check if already processed
        const existing = await Comment.findOne({ commentId: comment.id });
        if (existing && existing.processed) {
          console.log(`⏭️  Skipping already processed comment: ${comment.id}`);
          continue;
        }

        // Analyze sentiment
        console.log(`🔍 Analyzing: "${comment.text.substring(0, 50)}..."`);
        const sentiment = await azureAI.analyzeSentiment(comment.text);

        // Check keywords
        const keywordAnalysis = keywordFilter.analyzeContent(comment.text);

        // Make decision
        const decision = decisionEngine.decide(
          sentiment,
          keywordAnalysis,
          comment.text
        );

        // Save to database
        const commentDoc = await Comment.findOneAndUpdate(
          { commentId: comment.id },
          {
            commentId: comment.id,
            platform: 'youtube',
            postId: videoId,
            author: comment.author,
            authorId: comment.authorChannelId,
            text: comment.text,
            textOriginal: comment.textOriginal,
            sentiment: sentiment.sentiment,
            sentimentScore: sentiment.overallScore,
            sentimentScores: {
              positive: sentiment.positiveScore,
              neutral: sentiment.neutralScore,
              negative: sentiment.negativeScore
            },
            confidence: sentiment.confidence,
            containsKeywords: keywordAnalysis.details.keywords.containsBanned,
            matchedKeywords: keywordAnalysis.details.keywords.matchedKeywords,
            keywordSeverity: keywordAnalysis.details.keywords.severity,
            decision: decision,
            processed: true,
            likeCount: comment.likeCount,
            isReply: comment.isReply || false,
            parentId: comment.parentId,
            publishedAt: comment.publishedAt
          },
          { upsert: true, new: true }
        );

        const result = {
          commentId: comment.id,
          text: comment.text.substring(0, 100),
          sentiment: sentiment.sentiment,
          sentimentScore: sentiment.overallScore,
          decision: decision,
          keywordIssues: keywordAnalysis.details.keywords.matchedKeywords
        };

        // Step 3: Execute actions if autoExecute is true
        if (autoExecute) {
          if (decision.action === 'DELETE') {
            const deleteResult = await youtubeService.deleteComment(comment.id);
            if (deleteResult.success) {
              await commentDoc.recordAction('deleted');
              result.executed = 'DELETED ✅';
              console.log(`🗑️ DELETED comment from ${comment.author}`);
            } else {
              result.executed = 'DELETE FAILED ❌';
              result.error = deleteResult.error;
              console.log(`❌ Failed to delete: ${deleteResult.error}`);
            }
          } else if (decision.action === 'REPLY' && decision.shouldReply) {
            const replyText = await azureAI.generateReply(
              comment.text,
              sentiment.sentiment
            );
            const replyResult = await youtubeService.replyToComment(
              comment.id,
              replyText
            );
            if (replyResult.success) {
              await commentDoc.recordAction('replied', {
                replyText: replyText,
                replyId: replyResult.replyId
              });
              result.executed = 'REPLIED ✅';
              result.replyText = replyText;
              console.log(`💬 REPLIED to ${comment.author}: "${replyText}"`);
            } else {
              result.executed = 'REPLY FAILED ❌';
              result.error = replyResult.error;
              console.log(`❌ Failed to reply: ${replyResult.error}`);
            }
          } else if (decision.action === 'FLAG') {
            await commentDoc.recordAction('flagged');
            result.executed = 'FLAGGED 🚩';
          }
        }

        results.push(result);
        console.log(`✅ Processed: ${comment.id} - ${decision.action}`);

      } catch (error) {
        console.error(`❌ Error processing comment ${comment.id}:`, error);
        errors.push({
          commentId: comment.id,
          error: error.message
        });
      }
    }

    // Step 4: Generate summary
    const summary = decisionEngine.summarizeDecisions(
      results.map(r => r.decision)
    );

    res.json({
      success: true,
      videoId: videoId,
      summary: summary,
      results: results,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('❌ Error processing comments:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get sentiment summary for a video
 * GET /api/comments/sentiment/:videoId
 */
exports.getSentimentSummary = async (req, res) => {
  try {
    const { videoId } = req.params;

    const summary = await Comment.getSentimentSummary(videoId);
    const total = await Comment.countDocuments({ postId: videoId, processed: true });

    res.json({
      success: true,
      videoId: videoId,
      totalComments: total,
      breakdown: summary
    });

  } catch (error) {
    console.error('❌ Error getting sentiment summary:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get action statistics for a video
 * GET /api/comments/actions/:videoId
 */
exports.getActionStats = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    const stats = await Comment.getActionStats(videoId, start, end);

    res.json({
      success: true,
      videoId: videoId,
      dateRange: { start, end },
      stats: stats
    });

  } catch (error) {
    console.error('❌ Error getting action stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get all processed comments for a video
 * GET /api/comments/processed/:videoId
 */
exports.getProcessedComments = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { 
      sentiment, 
      action, 
      limit = 50, 
      skip = 0 
    } = req.query;

    const query = { 
      postId: videoId, 
      processed: true 
    };

    if (sentiment) query.sentiment = sentiment;
    if (action) query.actionTaken = action;

    const comments = await Comment.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Comment.countDocuments(query);

    res.json({
      success: true,
      videoId: videoId,
      total: total,
      comments: comments
    });

  } catch (error) {
    console.error('❌ Error getting processed comments:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Reply to a specific comment manually
 * POST /api/comments/reply
 * Body: { commentId: string, replyText: string }
 */
exports.replyToComment = async (req, res) => {
  try {
    const { commentId, replyText } = req.body;

    if (!commentId || !replyText) {
      return res.status(400).json({
        success: false,
        error: 'Comment ID and reply text are required'
      });
    }

    const result = await youtubeService.replyToComment(commentId, replyText);

    if (result.success) {
      const comment = await Comment.findOne({ commentId });
      if (comment) {
        await comment.recordAction('replied', {
          replyText: replyText,
          replyId: result.replyId
        });
      }
    }

    res.json(result);

  } catch (error) {
    console.error('❌ Error replying to comment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Delete a specific comment manually
 * DELETE /api/comments/:commentId
 */
exports.deleteComment = async (req, res) => {
  try {
    const { commentId } = req.params;

    const result = await youtubeService.deleteComment(commentId);

    if (result.success) {
      const comment = await Comment.findOne({ commentId });
      if (comment) {
        await comment.recordAction('deleted');
      }
    }

    res.json(result);

  } catch (error) {
    console.error('❌ Error deleting comment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Generate AI reply for a comment (preview without posting)
 * POST /api/comments/generate-reply
 * Body: { commentText: string, sentiment: string }
 */
exports.generateReply = async (req, res) => {
  try {
    const { commentText, sentiment } = req.body;

    if (!commentText) {
      return res.status(400).json({
        success: false,
        error: 'Comment text is required'
      });
    }

    // Analyze sentiment if not provided
    let sentimentResult = sentiment;
    if (!sentimentResult) {
      const analysis = await azureAI.analyzeSentiment(commentText);
      sentimentResult = analysis.sentiment;
    }

    const replyText = await azureAI.generateReply(commentText, sentimentResult);

    res.json({
      success: true,
      commentText: commentText,
      sentiment: sentimentResult,
      generatedReply: replyText
    });

  } catch (error) {
    console.error('❌ Error generating reply:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// ============================================
// CHANNEL MANAGEMENT ENDPOINTS
// ============================================

/**
 * Get YOUR channel information
 * GET /api/channel/info
 */
exports.getMyChannel = async (req, res) => {
  try {
    const channel = await youtubeService.getMyChannel();
    
    res.json({
      success: true,
      channel: channel
    });

  } catch (error) {
    console.error('❌ Error fetching channel:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get YOUR videos
 * GET /api/channel/videos
 */
exports.getMyVideos = async (req, res) => {
  try {
    const { maxResults = 25 } = req.query;
    
    const videos = await youtubeService.getMyVideos(parseInt(maxResults));
    
    res.json({
      success: true,
      totalVideos: videos.length,
      videos: videos
    });

  } catch (error) {
    console.error('❌ Error fetching videos:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

/**
 * Get comments from YOUR specific video
 * GET /api/channel/video/:videoId/comments
 */
exports.getMyVideoComments = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { maxResults = 50 } = req.query;

    // Verify it's your video
    const isMyVideo = await youtubeService.isMyVideo(videoId);
    if (!isMyVideo) {
      return res.status(403).json({
        success: false,
        error: 'This video does not belong to your channel. You can only manage comments on YOUR videos.'
      });
    }

    const comments = await youtubeService.fetchComments(videoId, parseInt(maxResults));
    
    res.json({
      success: true,
      videoId: videoId,
      isYourVideo: true,
      totalComments: comments.length,
      comments: comments
    });

  } catch (error) {
    console.error('❌ Error fetching video comments:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};


// IMPROVED VERSION - Prevents duplicate replies
// Replace moderateMyVideo function with this


exports.moderateMyVideo = async (req, res) => {
  try {
    const { videoId } = req.params;
    const { autoExecute = false } = req.body;

    const isMyVideo = await youtubeService.isMyVideo(videoId);
    if (!isMyVideo) {
      return res.status(403).json({
        success: false,
        error: 'Access Denied: You can only moderate YOUR OWN videos.'
      });
    }

    console.log(`🛡️  Moderating YOUR video: ${videoId}`);
    console.log(`⚙️  Auto-execute: ${autoExecute ? 'ENABLED' : 'DISABLED (preview only)'}`);

    const channel = await youtubeService.getMyChannel();
    const myChannelId = channel.id;

    const comments = await youtubeService.fetchComments(videoId);
    console.log(`📊 Found ${comments.length} comments`);

    const results = {
      videoId: videoId,
      totalProcessed: 0,
      actionsExecuted: {
        hidden: 0,
        replied: 0,
        flagged: 0,
        ignored: 0,
        skipped: 0,
        alreadyProcessed: 0
      },
      details: []
    };

    for (const comment of comments) {
      try {
        // Skip own comments
        if (comment.authorChannelId === myChannelId) {
          console.log(`⏭️  Skipping own comment: ${comment.id}`);
          results.actionsExecuted.skipped++;
          continue;
        }

        // ✅ NEW: Check if already processed
        const existingComment = await Comment.findOne({ 
        commentId: comment.id
        });

        if (existingComment) {
          console.log(`⏭️  Already processed: ${comment.id}`);
          results.actionsExecuted.alreadyProcessed++;
          continue;
        }

        // Analyze
        console.log(`🔍 Analyzing: "${comment.text.substring(0, 50)}..."`);
        const sentiment = await azureAI.analyzeSentiment(comment.text);
        const keywordAnalysis = keywordFilter.analyzeContent(comment.text);
        const decision = decisionEngine.decide(sentiment, keywordAnalysis, comment.text);

        const detail = {
          commentId: comment.id,
          author: comment.author,
          text: comment.text.substring(0, 100),
          sentiment: sentiment.sentiment,
          decision: decision.action,
          reason: decision.reason
        };

        // Generate reply text for PREVIEW
        if (decision.action === 'REPLY' && decision.shouldReply) {
          try {
            const replyText = await azureAI.generateReply(comment.text, sentiment.sentiment);
            detail.replyText = replyText;
            
            // If autoExecute, actually post it
            if (autoExecute) {
              const replyResult = await youtubeService.replyToComment(comment.id, replyText);
              if (replyResult.success) {
                results.actionsExecuted.replied++;
                detail.executed = 'REPLIED ✅';
                console.log(`💬 REPLIED to ${comment.author}`);

                // ✅ NEW: Save to MongoDB
                await Comment.create({
                  commentId: comment.id,
                  postId: videoId,
                  platform: 'youtube',
                  author: comment.author,
                  authorId: comment.authorChannelId,
                  text: comment.text,
                  sentiment: sentiment.sentiment,
                  sentimentScore: sentiment.overallScore,
                  confidenceScore: sentiment.confidence,
                  containsKeywords: keywordAnalysis.shouldDelete || keywordAnalysis.shouldFlag,
                  keywordsMatched: keywordAnalysis.details?.keywords?.matchedKeywords || [],
                  processed: true,
                  action: 'REPLY',
                  replyText: replyText
                });

              } else {
                detail.executed = 'REPLY FAILED ❌';
                detail.error = replyResult.error;
              }
            } else {
              detail.executed = 'PREVIEW ONLY - Will reply with above text';
            }
          } catch (error) {
            console.error(`❌ Error generating reply: ${error.message}`);
            detail.replyText = 'Error generating reply';
            detail.error = error.message;
          }
        }
        // Execute other actions if autoExecute
        else if (autoExecute) {
          if (decision.action === 'DELETE') {
            const hideResult = await youtubeService.hideSpamComment(comment.id, true);
            if (hideResult.success) {
              results.actionsExecuted.hidden++;
              detail.executed = 'HIDDEN ✅';
              console.log(`🗑️  HIDDEN spam from ${comment.author}`);

              // ✅ NEW: Save to MongoDB
              await Comment.create({
                commentId: comment.id,
                postId: videoId,
                platform: 'youtube',
                author: comment.author,
                authorId: comment.authorChannelId,
                text: comment.text,
                sentiment: sentiment.sentiment,
                sentimentScore: sentiment.overallScore,
                confidenceScore: sentiment.confidence,
                containsKeywords: true,
                keywordsMatched: keywordAnalysis.details?.keywords?.matchedKeywords || [],
                processed: true,
                action: 'HIDDEN'
              });

            } else {
              detail.executed = 'HIDE FAILED ❌';
              detail.error = hideResult.error;
            }
          } else if (decision.action === 'FLAG') {
            results.actionsExecuted.flagged++;
            detail.executed = 'FLAGGED 🚩';

            // ✅ NEW: Save to MongoDB
            await Comment.create({
              commentId: comment.id,
              postId: videoId,
              platform: 'youtube',
              author: comment.author,
              authorId: comment.authorChannelId,
              text: comment.text,
              sentiment: sentiment.sentiment,
              sentimentScore: sentiment.overallScore,
              confidenceScore: sentiment.confidence,
              containsKeywords: keywordAnalysis.shouldFlag,
              keywordsMatched: keywordAnalysis.details?.keywords?.matchedKeywords || [],
              processed: true,
              action: 'FLAGGED',
              flagReason: decision.reason
            });

          } else {
            results.actionsExecuted.ignored++;
            detail.executed = 'IGNORED ⏭️';

            // ✅ NEW: Save to MongoDB
            await Comment.create({
              commentId: comment.id,
              postId: videoId,
              platform: 'youtube',
              author: comment.author,
              authorId: comment.authorChannelId,
              text: comment.text,
              sentiment: sentiment.sentiment,
              sentimentScore: sentiment.overallScore,
              confidenceScore: sentiment.confidence,
              processed: true,
              action: 'IGNORED'
            });
          }
        } else {
          // Preview mode for non-reply actions
          detail.executed = 'PREVIEW ONLY';
        }

        results.details.push(detail);
        results.totalProcessed++;

      } catch (error) {
        console.error(`❌ Error processing comment ${comment.id}:`, error.message);
      }
    }

    res.json({
      success: true,
      message: autoExecute ? 
        `✅ Moderation completed! ${results.actionsExecuted.alreadyProcessed} already processed, ${results.totalProcessed} newly processed.` : 
        '👁️  Preview mode - showing what WILL happen (replies generated but not posted)',
      results: results
    });

  } catch (error) {
    console.error('❌ Error moderating:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};