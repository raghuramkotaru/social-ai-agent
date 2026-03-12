/**
 * Keyword Filter Service
 * Scans comments for banned keywords, spam patterns, and inappropriate content
 */
class KeywordFilter {
  constructor() {
    // Banned keywords for auto-deletion
    this.bannedKeywords = [
      // Profanity
      'scam', 'scammer', 'fake', 'fraud', 'spam', 'bot',
      
      // Hate speech indicators (add more as needed)
      'hate', 'racist', 'sexist',
      
      // Spam patterns
      'click here', 'free money', 'get rich', 'work from home',
      'buy now', 'limited offer', 'act now',
      
      // Inappropriate content
      'violence', 'illegal', 'drugs'
    ];

    // Patterns that should flag for review (not auto-delete)
    this.suspiciousPatterns = [
      /\b\d{10,}\b/g, // Long numbers (possibly phone/credit card)
      /https?:\/\//gi, // URLs
      /@\w+/g, // Mentions (could be spam)
      /(.)\1{4,}/g // Repeated characters (aaaaaaa)
    ];
  }

  /**
   * Check if comment contains banned keywords
   * @param {string} text - Comment text
   * @returns {Object} - Filter result with matched keywords
   */
  checkBannedKeywords(text) {
    const lowerText = text.toLowerCase();
    const matchedKeywords = [];

    for (const keyword of this.bannedKeywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        matchedKeywords.push(keyword);
      }
    }

    return {
      containsBanned: matchedKeywords.length > 0,
      matchedKeywords: matchedKeywords,
      severity: this.calculateSeverity(matchedKeywords)
    };
  }

  /**
   * Check for suspicious patterns
   * @param {string} text - Comment text
   * @returns {Object} - Pattern detection result
   */
  checkSuspiciousPatterns(text) {
    const detectedPatterns = [];

    for (const pattern of this.suspiciousPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        detectedPatterns.push({
          pattern: pattern.toString(),
          matches: matches
        });
      }
    }

    return {
      hasSuspiciousContent: detectedPatterns.length > 0,
      patterns: detectedPatterns
    };
  }

  /**
   * Calculate severity of keyword violations
   * @param {Array} keywords - Matched keywords
   * @returns {number} - Severity score (1-5)
   */
  calculateSeverity(keywords) {
    if (keywords.length === 0) return 0;
    if (keywords.length >= 3) return 5;
    if (keywords.length === 2) return 4;
    
    // Check specific high-severity keywords
    const highSeverityWords = ['scam', 'fraud', 'hate', 'racist'];
    const hasHighSeverity = keywords.some(kw => 
      highSeverityWords.includes(kw.toLowerCase())
    );
    
    return hasHighSeverity ? 5 : 3;
  }

  /**
   * Comprehensive content check
   * @param {string} text - Comment text
   * @returns {Object} - Complete analysis
   */
  analyzeContent(text) {
    const keywordCheck = this.checkBannedKeywords(text);
    const patternCheck = this.checkSuspiciousPatterns(text);

    return {
      isSafe: !keywordCheck.containsBanned && !patternCheck.hasSuspiciousContent,
      shouldDelete: keywordCheck.containsBanned && keywordCheck.severity >= 4,
      shouldFlag: keywordCheck.severity >= 3 || patternCheck.hasSuspiciousContent,
      details: {
        keywords: keywordCheck,
        patterns: patternCheck
      }
    };
  }

  /**
   * Add custom keyword to banned list
   * @param {string} keyword - Keyword to add
   */
  addBannedKeyword(keyword) {
    if (!this.bannedKeywords.includes(keyword.toLowerCase())) {
      this.bannedKeywords.push(keyword.toLowerCase());
    }
  }

  /**
   * Remove keyword from banned list
   * @param {string} keyword - Keyword to remove
   */
  removeBannedKeyword(keyword) {
    this.bannedKeywords = this.bannedKeywords.filter(
      kw => kw.toLowerCase() !== keyword.toLowerCase()
    );
  }

  /**
   * Get current banned keywords list
   * @returns {Array} - Banned keywords
   */
  getBannedKeywords() {
    return [...this.bannedKeywords];
  }
}

module.exports = new KeywordFilter();
