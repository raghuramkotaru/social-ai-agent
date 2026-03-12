/**
 * Decision Engine Service - IMPROVED VERSION
 * Better handling of negative feedback vs toxic comments
 */
class DecisionEngine {
  constructor() {
    // Configurable thresholds
    this.config = {
      // Sentiment thresholds (0-1 scale)
      positiveThreshold: 0.6,
      negativeThreshold: 0.4,
      veryNegativeThreshold: 0.15,  // Only VERY extreme negativity
      
      // Confidence threshold for AI decisions
      minConfidence: 0.6,  // Lowered to reduce false flags
      
      // Reply strategy
      replyToPositive: true,
      replyToNegative: true,
      replyToNeutral: false
    };
    
    // Sarcasm indicators
    this.sarcasmIndicators = [
      'yeah right',
      'sure thing',
      'totally',
      'absolutely',
      'obviously',
      'clearly',
      'of course'
    ];
  }

  /**
   * Decide action for a comment
   * @param {Object} sentiment - Sentiment analysis result
   * @param {Object} keywordAnalysis - Keyword filter result
   * @param {string} commentText - Original comment
   * @returns {Object} - Decision result
   */
  decide(sentiment, keywordAnalysis, commentText) {
    // Priority 1: Delete if contains banned keywords (spam/hate speech)
    if (keywordAnalysis.shouldDelete) {
      return {
        action: 'DELETE',
        reason: 'Contains banned keywords',
        priority: 'HIGH',
        keywords: keywordAnalysis.details.keywords.matchedKeywords,
        shouldReply: false
      };
    }

    // Priority 2: Check for sarcasm (flag for manual review)
    if (this.detectSarcasm(commentText, sentiment)) {
      return {
        action: 'FLAG',
        reason: 'Possible sarcasm detected',
        priority: 'MEDIUM',
        shouldReply: false,
        requiresManualReview: true
      };
    }

    // Priority 3: Flag if suspicious keywords (not delete-worthy but concerning)
    if (keywordAnalysis.shouldFlag) {
      return {
        action: 'FLAG',
        reason: 'Suspicious content detected',
        priority: 'MEDIUM',
        shouldReply: false,
        requiresManualReview: true
      };
    }

    // Priority 4: Determine reply strategy based on sentiment
    // (Low confidence check is now INSIDE decideBySentiment to handle constructive criticism better)
    const sentimentDecision = this.decideBySentiment(sentiment, commentText);
    
    return sentimentDecision;
  }

  /**
   * Detect sarcasm (contradictory sentiment + sarcasm words)
   * @param {string} text - Comment text
   * @param {Object} sentiment - Sentiment analysis
   * @returns {boolean}
   */
  detectSarcasm(text, sentiment) {
    const lowerText = text.toLowerCase();
    
    // Strong sarcasm phrases (always sarcastic)
    const strongSarcasmPhrases = [
      'yeah right',
      'sure thing buddy',
      'oh yeah',
      'great advice buddy',
      'totally helpful',
      'real helpful',
      'so helpful'
    ];
    
    // Check for strong sarcasm phrases first
    if (strongSarcasmPhrases.some(phrase => lowerText.includes(phrase))) {
      return true;
    }
    
    // Check for sarcasm indicators
    const hasSarcasmWord = this.sarcasmIndicators.some(word => 
      lowerText.includes(word)
    );
    
    // If positive sentiment but has sarcasm word = likely sarcastic
    if (hasSarcasmWord && sentiment.sentiment === 'positive') {
      // Don't require negative words - just sarcasm word + positive = suspicious
      return true;
    }
    
    return false;
  }

  /**
   * Decide action based on sentiment
   * @param {Object} sentiment - Sentiment analysis
   * @param {string} commentText - Comment text
   * @returns {Object} - Decision
   */
  decideBySentiment(sentiment, commentText) {
    const score = sentiment.overallScore;
    const isQuestion = this.isQuestion(commentText);
    const isConstructive = this.isConstructiveCriticism(commentText);

    // ONLY extremely toxic negativity gets flagged (< 0.15)
    if (score < this.config.veryNegativeThreshold) {
      // Check if it's constructive criticism or pure toxicity
      
      if (isConstructive) {
        // Even very negative but constructive = reply with support
        return {
          action: 'REPLY',
          reason: 'Negative but constructive feedback',
          priority: 'HIGH',
          shouldReply: true,
          replyType: 'APOLOGETIC',
          sentiment: 'very_negative'
        };
      } else {
        // Pure toxicity without constructive elements = flag
        return {
          action: 'FLAG',
          reason: 'Extremely negative and non-constructive',
          priority: 'HIGH',
          shouldReply: false,
          sentiment: 'very_negative'
        };
      }
    }

    // Regular negative (0.15 - 0.4)
    if (score < this.config.negativeThreshold) {
      // If constructive OR high confidence = reply
      if (isConstructive || sentiment.confidence >= this.config.minConfidence) {
        return {
          action: 'REPLY',
          reason: 'Negative feedback - customer service needed',
          priority: 'MEDIUM',
          shouldReply: true,
          replyType: 'SUPPORTIVE',
          sentiment: 'negative'
        };
      } else {
        // Low confidence AND not constructive = flag
        return {
          action: 'FLAG',
          reason: 'Low confidence in sentiment analysis',
          priority: 'LOW',
          shouldReply: false,
          requiresManualReview: true
        };
      }
    }

    // Positive - thank and engage
    if (score >= this.config.positiveThreshold) {
      return {
        action: 'REPLY',
        reason: 'Positive engagement opportunity',
        priority: 'LOW',
        shouldReply: true,
        replyType: 'GRATEFUL',
        sentiment: 'positive'
      };
    }

    // Neutral
    if (isQuestion) {
      // Neutral questions should get replies
      return {
        action: 'REPLY',
        reason: 'Neutral question - needs answer',
        priority: 'MEDIUM',
        shouldReply: true,
        replyType: 'INFORMATIVE',
        sentiment: 'neutral'
      };
    }

    // Neutral non-questions - ignore
    return {
      action: 'IGNORE',
      reason: 'Neutral sentiment - no action needed',
      priority: 'LOW',
      shouldReply: false,
      sentiment: 'neutral'
    };
  }

  /**
   * Check if negative comment is constructive criticism
   * @param {string} text - Comment text
   * @returns {boolean}
   */
  isConstructiveCriticism(text) {
    const lowerText = text.toLowerCase();
    
    // Constructive indicators
    const constructiveWords = [
      'could', 'should', 'would', 'suggest', 'recommend',
      'better', 'improve', 'try', 'consider', 'maybe',
      'bit', 'little', 'somewhat', 'kinda', 'kind of',
      'too', 'needs', 'helpful if', 'wish'
    ];
    
    // Check if contains constructive language
    return constructiveWords.some(word => lowerText.includes(word));
  }

  /**
   * Check if comment is a question (should be prioritized)
   * @param {string} text - Comment text
   * @returns {boolean}
   */
  isQuestion(text) {
    return text.includes('?') || 
           text.toLowerCase().startsWith('how') ||
           text.toLowerCase().startsWith('what') ||
           text.toLowerCase().startsWith('when') ||
           text.toLowerCase().startsWith('where') ||
           text.toLowerCase().startsWith('why') ||
           text.toLowerCase().startsWith('can you') ||
           text.toLowerCase().startsWith('could you');
  }

  /**
   * Determine if comment needs urgent attention
   * @param {Object} decision - Decision result
   * @returns {boolean}
   */
  isUrgent(decision) {
    return decision.priority === 'HIGH' || 
           decision.action === 'DELETE' ||
           decision.requiresManualReview;
  }

  /**
   * Update configuration
   * @param {Object} newConfig - New configuration values
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * Get current configuration
   * @returns {Object} - Current config
   */
  getConfig() {
    return { ...this.config };
  }

  /**
   * Generate summary of decisions for multiple comments
   * @param {Array} decisions - Array of decision objects
   * @returns {Object} - Summary statistics
   */
  summarizeDecisions(decisions) {
    const summary = {
      total: decisions.length,
      toDelete: 0,
      toReply: 0,
      toFlag: 0,
      toIgnore: 0,
      byPriority: {
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0
      },
      bySentiment: {
        positive: 0,
        neutral: 0,
        negative: 0,
        very_negative: 0
      }
    };

    decisions.forEach(decision => {
      // Count actions
      if (decision.action === 'DELETE') summary.toDelete++;
      if (decision.action === 'REPLY') summary.toReply++;
      if (decision.action === 'FLAG') summary.toFlag++;
      if (decision.action === 'IGNORE') summary.toIgnore++;

      // Count priorities
      summary.byPriority[decision.priority]++;

      // Count sentiments
      if (decision.sentiment) {
        summary.bySentiment[decision.sentiment]++;
      }
    });

    return summary;
  }
}

module.exports = new DecisionEngine();