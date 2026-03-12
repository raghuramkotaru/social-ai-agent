const axios = require('axios');
require('dotenv').config();

/**
 * Azure AI Service for Sentiment Analysis and Text Analytics
 */
class AzureAIService {
  constructor() {
    // Azure Text Analytics configuration
    this.analyticsEndpoint = process.env.AZURE_TEXT_ANALYTICS_ENDPOINT;
    this.analyticsKey = process.env.AZURE_TEXT_ANALYTICS_KEY;
    
    // Azure OpenAI configuration
    this.openaiEndpoint = process.env.AZURE_OPENAI_ENDPOINT;
    this.openaiKey = process.env.AZURE_OPENAI_KEY;
    this.openaiDeployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4';
  }

  /**
   * Analyze sentiment of a comment using Azure Text Analytics
   * @param {string} text - Comment text to analyze
   * @returns {Object} - Sentiment analysis result
   */
  async analyzeSentiment(text) {
    try {
      const url = `${this.analyticsEndpoint}/text/analytics/v3.1/sentiment`;
      
      const response = await axios.post(
        url,
        {
          documents: [
            {
              id: '1',
              language: 'en',
              text: text
            }
          ]
        },
        {
          headers: {
            'Ocp-Apim-Subscription-Key': this.analyticsKey,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = response.data.documents[0];
      const sentiment = result.sentiment; // positive, neutral, negative
      const scores = result.confidenceScores;

      return {
        sentiment: sentiment,
        positiveScore: scores.positive,
        neutralScore: scores.neutral,
        negativeScore: scores.negative,
        overallScore: this.calculateOverallScore(scores),
        confidence: Math.max(scores.positive, scores.neutral, scores.negative)
      };
    } catch (error) {
      console.error('❌ Azure Text Analytics Error:', error.response?.data || error.message);
      throw new Error('Sentiment analysis failed');
    }
  }

  /**
   * Calculate overall sentiment score (0-1 scale)
   * @param {Object} scores - Confidence scores
   * @returns {number} - Overall score
   */
  calculateOverallScore(scores) {
    // Convert to 0-1 scale where 1 is most positive
    return scores.positive * 1.0 + scores.neutral * 0.5 + scores.negative * 0.0;
  }

  /**
   * Generate automated reply using Azure OpenAI
   * @param {string} commentText - Original comment
   * @param {string} sentiment - Detected sentiment
   * @returns {string} - Generated reply
   */
  async generateReply(commentText, sentiment) {
    try {
      const prompt = this.buildReplyPrompt(commentText, sentiment);
      
      const url = `${this.openaiEndpoint}/openai/deployments/${this.openaiDeployment}/chat/completions?api-version=2024-02-15-preview`;
      
      const response = await axios.post(
        url,
        {
          messages: [
            {
              role: 'system',
              content: 'You are a friendly and professional social media manager. Generate short, natural responses to comments. Keep responses under 280 characters. Be helpful and empathetic.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 150,
          temperature: 0.7
        },
        {
          headers: {
            'api-key': this.openaiKey,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('❌ Azure OpenAI Error:', error.response?.data || error.message);
      
      // Fallback to template-based replies
      return this.getFallbackReply(sentiment);
    }
  }

  /**
   * Build prompt for reply generation
   * @param {string} commentText - Original comment
   * @param {string} sentiment - Detected sentiment
   * @returns {string} - Prompt for AI
   */
  buildReplyPrompt(commentText, sentiment) {
    const sentimentGuidance = {
      positive: 'The user is happy. Thank them warmly and encourage continued engagement.',
      neutral: 'The user is neutral. Provide helpful information and be friendly.',
      negative: 'The user is unhappy. Be empathetic, apologize if needed, and offer support.'
    };

    return `Comment Sentiment: ${sentiment}
Guidance: ${sentimentGuidance[sentiment]}

Comment: "${commentText}"

Generate a brief, natural response:`;
  }

  /**
   * Get fallback reply when AI generation fails
   * @param {string} sentiment - Detected sentiment
   * @returns {string} - Template reply
   */
  getFallbackReply(sentiment) {
    const templates = {
      positive: "Thank you so much! We're glad you enjoyed it! 😊",
      neutral: "Thanks for your comment! Let us know if you have any questions.",
      negative: "We're sorry to hear that. Please reach out to us so we can help resolve this."
    };

    return templates[sentiment] || "Thank you for your feedback!";
  }

  /**
   * Extract key phrases from text using Azure Text Analytics
   * @param {string} text - Text to analyze
   * @returns {Array} - Key phrases
   */
  async extractKeyPhrases(text) {
    try {
      const url = `${this.analyticsEndpoint}/text/analytics/v3.1/keyPhrases`;
      
      const response = await axios.post(
        url,
        {
          documents: [
            {
              id: '1',
              language: 'en',
              text: text
            }
          ]
        },
        {
          headers: {
            'Ocp-Apim-Subscription-Key': this.analyticsKey,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.documents[0].keyPhrases;
    } catch (error) {
      console.error('❌ Key Phrase Extraction Error:', error.message);
      return [];
    }
  }
}

module.exports = new AzureAIService();
