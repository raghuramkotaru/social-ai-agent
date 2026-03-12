const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  // Platform and identification
  commentId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  platform: {
    type: String,
    required: true,
    enum: ['youtube', 'instagram', 'facebook'],
    default: 'youtube'
  },
  
  postId: {
    type: String,
    required: true,
    index: true
  },
  
  // Author information
  author: {
    type: String,
    required: true
  },
  
  authorId: {
    type: String
  },
  
  // Comment content
  text: {
    type: String,
    required: true
  },
  
  textOriginal: {
    type: String
  },
  
  // Sentiment analysis results
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    index: true
  },
  
  sentimentScore: {
    type: Number,
    min: 0,
    max: 1
  },
  
  sentimentScores: {
    positive: Number,
    neutral: Number,
    negative: Number
  },
  
  confidence: {
    type: Number,
    min: 0,
    max: 1
  },
  
  // Keyword filtering
  containsKeywords: {
    type: Boolean,
    default: false
  },
  
  matchedKeywords: [{
    type: String
  }],
  
  keywordSeverity: {
    type: Number,
    min: 0,
    max: 5,
    default: 0
  },
  
  // Decision and action
  decision: {
    action: {
      type: String,
      enum: ['DELETE', 'REPLY', 'FLAG', 'IGNORE']
    },
    reason: String,
    priority: {
      type: String,
      enum: ['HIGH', 'MEDIUM', 'LOW']
    },
    shouldReply: Boolean,
    replyType: String
  },
  
  // Action tracking
  actionTaken: {
    type: String,
    enum: ['deleted', 'replied', 'flagged', 'ignored', 'pending']
  },
  
  replyText: {
    type: String
  },
  
  replyId: {
    type: String
  },
  
  repliedAt: {
    type: Date
  },
  
  deletedAt: {
    type: Date
  },
  
  flaggedAt: {
    type: Date
  },
  
  // Processing status
  processed: {
    type: Boolean,
    default: false,
    index: true
  },
  
  processingError: {
    type: String
  },
  
  // Metadata
  likeCount: {
    type: Number,
    default: 0
  },
  
  isReply: {
    type: Boolean,
    default: false
  },
  
  parentId: {
    type: String
  },
  
  publishedAt: {
    type: Date
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
commentSchema.index({ postId: 1, createdAt: -1 });
commentSchema.index({ sentiment: 1, processed: 1 });
commentSchema.index({ actionTaken: 1 });
commentSchema.index({ 'decision.action': 1 });

// Methods
commentSchema.methods.markAsProcessed = function() {
  this.processed = true;
  this.updatedAt = Date.now();
  return this.save();
};

commentSchema.methods.recordAction = function(action, details = {}) {
  this.actionTaken = action;
  
  if (action === 'replied') {
    this.replyText = details.replyText;
    this.replyId = details.replyId;
    this.repliedAt = Date.now();
  } else if (action === 'deleted') {
    this.deletedAt = Date.now();
  } else if (action === 'flagged') {
    this.flaggedAt = Date.now();
  }
  
  this.processed = true;
  this.updatedAt = Date.now();
  return this.save();
};

// Static methods
commentSchema.statics.getSentimentSummary = async function(postId) {
  const pipeline = [
    { $match: { postId: postId, processed: true } },
    {
      $group: {
        _id: '$sentiment',
        count: { $sum: 1 },
        avgScore: { $avg: '$sentimentScore' }
      }
    }
  ];
  
  return this.aggregate(pipeline);
};

commentSchema.statics.getActionStats = async function(postId, startDate, endDate) {
  const match = { postId: postId };
  
  if (startDate && endDate) {
    match.createdAt = { $gte: startDate, $lte: endDate };
  }
  
  const pipeline = [
    { $match: match },
    {
      $group: {
        _id: '$actionTaken',
        count: { $sum: 1 }
      }
    }
  ];
  
  return this.aggregate(pipeline);
};
// Add these static methods to your Comment model (models/Comment.js)
// Insert these BEFORE the line: const Comment = mongoose.model('Comment', commentSchema);

/**
 * Get comprehensive analytics for a video
 */
commentSchema.statics.getVideoAnalytics = async function(postId) {
  const results = await Promise.all([
    // Total counts
    this.countDocuments({ postId, processed: true }),
    
    // Sentiment breakdown
    this.aggregate([
      { $match: { postId, processed: true } },
      {
        $group: {
          _id: '$sentiment',
          count: { $sum: 1 },
          avgScore: { $avg: '$sentimentScore' }
        }
      }
    ]),
    
    // Action breakdown
    this.aggregate([
      { $match: { postId, processed: true } },
      {
        $group: {
          _id: '$actionTaken',
          count: { $sum: 1 }
        }
      }
    ]),
    
    // Keyword matches
    this.countDocuments({ postId, containsKeywords: true }),
    
    // High priority issues
    this.countDocuments({ postId, 'decision.priority': 'HIGH' })
  ]);

  return {
    totalComments: results[0],
    sentimentBreakdown: results[1],
    actionBreakdown: results[2],
    keywordMatches: results[3],
    highPriorityIssues: results[4]
  };
};

/**
 * Get sentiment timeline (hourly/daily trends)
 */
commentSchema.statics.getSentimentTimeline = async function(postId, granularity = 'hour') {
  const dateFormat = granularity === 'hour' 
    ? { $dateToString: { format: '%Y-%m-%d %H:00', date: '$createdAt' } }
    : { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };

  return this.aggregate([
    { $match: { postId, processed: true } },
    {
      $group: {
        _id: {
          time: dateFormat,
          sentiment: '$sentiment'
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.time': 1 } }
  ]);
};

/**
 * Get top issues (most severe spam/toxic comments)
 */
commentSchema.statics.getTopIssues = async function(postId, limit = 10) {
  return this.find({
    postId,
    processed: true,
    $or: [
      { containsKeywords: true },
      { 'decision.priority': 'HIGH' },
      { sentimentScore: { $lt: 0.2 } }
    ]
  })
  .sort({ keywordSeverity: -1, sentimentScore: 1 })
  .limit(limit)
  .select('author text sentiment sentimentScore matchedKeywords decision createdAt');
};

/**
 * Get moderation summary for dashboard
 */
commentSchema.statics.getModerationSummary = async function(postId) {
  const [stats, recentActions] = await Promise.all([
    this.aggregate([
      { $match: { postId, processed: true } },
      {
        $facet: {
          total: [{ $count: 'count' }],
          byAction: [
            {
              $group: {
                _id: '$actionTaken',
                count: { $sum: 1 }
              }
            }
          ],
          bySentiment: [
            {
              $group: {
                _id: '$sentiment',
                count: { $sum: 1 },
                avgScore: { $avg: '$sentimentScore' }
              }
            }
          ],
          byPriority: [
            {
              $group: {
                _id: '$decision.priority',
                count: { $sum: 1 }
              }
            }
          ]
        }
      }
    ]),
    
    // Recent moderation actions
    this.find({
      postId,
      processed: true,
      actionTaken: { $in: ['replied', 'deleted', 'flagged'] }
    })
    .sort({ updatedAt: -1 })
    .limit(20)
    .select('author text actionTaken sentiment updatedAt')
  ]);

  return {
    stats: stats[0],
    recentActions
  };
};

/**
 * Get spam detection effectiveness
 */
commentSchema.statics.getSpamStats = async function(postId) {
  return this.aggregate([
    { $match: { postId, processed: true } },
    {
      $group: {
        _id: null,
        totalComments: { $sum: 1 },
        spamDetected: {
          $sum: { $cond: [{ $eq: ['$decision.action', 'DELETE'] }, 1, 0] }
        },
        keywordMatches: {
          $sum: { $cond: ['$containsKeywords', 1, 0] }
        },
        avgSeverity: { $avg: '$keywordSeverity' }
      }
    }
  ]);
};

/**
 * Get engagement metrics
 */
commentSchema.statics.getEngagementMetrics = async function(postId) {
  return this.aggregate([
    { $match: { postId, processed: true } },
    {
      $group: {
        _id: null,
        totalComments: { $sum: 1 },
        totalLikes: { $sum: '$likeCount' },
        avgLikes: { $avg: '$likeCount' },
        repliesGenerated: {
          $sum: { $cond: ['$replyText', 1, 0] }
        },
        positiveEngagement: {
          $sum: { $cond: [{ $eq: ['$sentiment', 'positive'] }, 1, 0] }
        },
        negativeEngagement: {
          $sum: { $cond: [{ $eq: ['$sentiment', 'negative'] }, 1, 0] }
        }
      }
    }
  ]);
};
const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;