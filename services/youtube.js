const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');

/**
 * YouTube Service - UPDATED FOR CHANNEL OWNER PERSPECTIVE
 * Manages YOUR channel's videos and comments
 */
class YouTubeService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.YT_CLIENT_ID,
      process.env.YT_CLIENT_SECRET,
      process.env.YT_REDIRECT_URI
    );
    this.youtube = null;
    this.tokenPath = path.join(__dirname, '..', 'config', 'token.json');
    this.channelInfo = null;
  }

  loadTokens() {
    try {
      if (fs.existsSync(this.tokenPath)) {
        const tokens = JSON.parse(fs.readFileSync(this.tokenPath, 'utf8'));
        this.oauth2Client.setCredentials(tokens);
        this.youtube = google.youtube({ version: 'v3', auth: this.oauth2Client });
        return true;
      }
      return false;
    } catch (error) {
      console.error('⚠️  Error loading tokens:', error.message);
      return false;
    }
  }

  ensureAuth() {
    if (!this.youtube) {
      const loaded = this.loadTokens();
      if (!loaded) {
        throw new Error('No authentication tokens found. Please authenticate first.');
      }
    }
  }

  /**
   * Get authenticated user's channel information
   * @returns {Object} - Channel details
   */
  async getMyChannel() {
    try {
      this.ensureAuth();

      if (this.channelInfo) {
        return this.channelInfo;
      }

      const response = await this.youtube.channels.list({
        part: 'id,snippet,statistics',
        mine: true
      });

      if (response.data.items.length === 0) {
        throw new Error('No channel found for authenticated user');
      }

      this.channelInfo = {
        id: response.data.items[0].id,
        title: response.data.items[0].snippet.title,
        description: response.data.items[0].snippet.description,
        subscriberCount: response.data.items[0].statistics.subscriberCount,
        videoCount: response.data.items[0].statistics.videoCount,
        viewCount: response.data.items[0].statistics.viewCount
      };

      console.log(`✅ Channel: ${this.channelInfo.title}`);
      return this.channelInfo;

    } catch (error) {
      console.error('❌ Error fetching channel:', error.message);
      throw error;
    }
  }

  /**
   * Get YOUR channel's videos
   * @param {number} maxResults - Maximum number of videos to fetch
   * @returns {Array} - Array of your video objects
   */
  async getMyVideos(maxResults = 50) {
    try {
      this.ensureAuth();

      const channel = await this.getMyChannel();

      const response = await this.youtube.search.list({
        part: 'id,snippet',
        channelId: channel.id,
        maxResults: Math.min(maxResults, 50),
        order: 'date',
        type: 'video'
      });

      const videos = response.data.items.map(item => ({
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        publishedAt: item.snippet.publishedAt,
        thumbnail: item.snippet.thumbnails.medium.url
      }));

      console.log(`✅ Found ${videos.length} videos on YOUR channel`);
      return videos;

    } catch (error) {
      console.error('❌ Error fetching YOUR videos:', error.message);
      throw error;
    }
  }

  /**
   * Verify if a video belongs to YOUR channel
   * @param {string} videoId - Video ID to check
   * @returns {boolean} - True if you own this video
   */
  async isMyVideo(videoId) {
    try {
      this.ensureAuth();
      
      const channel = await this.getMyChannel();
      
      const response = await this.youtube.videos.list({
        part: 'snippet',
        id: videoId
      });

      if (response.data.items.length === 0) {
        return false;
      }

      const videoChannelId = response.data.items[0].snippet.channelId;
      return videoChannelId === channel.id;

    } catch (error) {
      console.error('❌ Error checking video ownership:', error.message);
      return false;
    }
  }

  /**
   * Fetch comments from YOUR video
   * @param {string} videoId - YOUR video ID
   * @param {number} maxResults - Maximum comments to fetch
   * @returns {Array} - Array of comment objects
   */
  async fetchComments(videoId, maxResults = 100) {
    try {
      this.ensureAuth();

      // Verify this is YOUR video
      const isOwned = await this.isMyVideo(videoId);
      if (!isOwned) {
        console.warn(`⚠️  Warning: Video ${videoId} may not belong to your channel`);
      }

      const response = await this.youtube.commentThreads.list({
        part: 'snippet,replies',
        videoId: videoId,
        maxResults: Math.min(maxResults, 100),
        order: 'time'
      });

      const comments = [];
      response.data.items.forEach(item => {
        const comment = item.snippet.topLevelComment.snippet;
        comments.push({
          id: item.snippet.topLevelComment.id,
          videoId: videoId,
          author: comment.authorDisplayName,
          authorChannelId: comment.authorChannelId?.value,
          text: comment.textDisplay,
          textOriginal: comment.textOriginal,
          likeCount: comment.likeCount,
          publishedAt: comment.publishedAt,
          updatedAt: comment.updatedAt,
          canReply: item.snippet.canReply,
          totalReplyCount: item.snippet.totalReplyCount,
          isPublic: item.snippet.isPublic
        });

        // Add replies
        if (item.replies) {
          item.replies.comments.forEach(reply => {
            const replySnippet = reply.snippet;
            comments.push({
              id: reply.id,
              videoId: videoId,
              author: replySnippet.authorDisplayName,
              authorChannelId: replySnippet.authorChannelId?.value,
              text: replySnippet.textDisplay,
              textOriginal: replySnippet.textOriginal,
              likeCount: replySnippet.likeCount,
              publishedAt: replySnippet.publishedAt,
              updatedAt: replySnippet.updatedAt,
              parentId: replySnippet.parentId,
              isReply: true
            });
          });
        }
      });

      console.log(`✅ Fetched ${comments.length} comments from YOUR video ${videoId}`);
      return comments;

    } catch (error) {
      console.error('❌ Error fetching comments:', error.message);
      throw new Error(`Failed to fetch comments: ${error.message}`);
    }
  }

  /**
   * Reply to a comment on YOUR video
   * @param {string} commentId - Parent comment ID
   * @param {string} replyText - Reply text
   * @returns {Object} - Reply result
   */
  async replyToComment(commentId, replyText) {
    try {
      this.ensureAuth();

      const response = await this.youtube.comments.insert({
        part: 'snippet',
        requestBody: {
          snippet: {
            parentId: commentId,
            textOriginal: replyText
          }
        }
      });

      console.log(`✅ Replied to comment ${commentId} on YOUR video`);
      return {
        success: true,
        commentId: commentId,
        replyId: response.data.id,
        replyText: replyText
      };

    } catch (error) {
      console.error(`❌ Error replying to comment:`, error.message);
      return {
        success: false,
        commentId: commentId,
        error: error.message
      };
    }
  }

  /**
   * Delete a comment from YOUR video (only works for YOUR OWN comments)
   * @param {string} commentId - Comment ID to delete
   * @returns {Object} - Deletion result
   */
  async deleteComment(commentId) {
    try {
      this.ensureAuth();

      await this.youtube.comments.delete({
        id: commentId
      });

      console.log(`✅ Deleted comment ${commentId} from YOUR video`);
      return {
        success: true,
        commentId: commentId,
        action: 'deleted'
      };

    } catch (error) {
      console.error(`❌ Error deleting comment:`, error.message);
      return {
        success: false,
        commentId: commentId,
        error: error.message
      };
    }
  }

  /**
   * Set moderation status for a comment on YOUR video
   * This works for ANY comment on your video (not just your own)
   * @param {string} commentId - Comment ID
   * @param {string} status - 'heldForReview', 'published', or 'rejected'
   * @param {boolean} banAuthor - Whether to ban the comment author (default: false)
   * @returns {Object} - Moderation result
   */
  async setCommentModerationStatus(commentId, status = 'rejected', banAuthor = false) {
    try {
      this.ensureAuth();

      await this.youtube.comments.setModerationStatus({
        id: commentId,
        moderationStatus: status,
        banAuthor: banAuthor
      });

      const action = status === 'rejected' ? 'hidden/rejected' : 
                     status === 'heldForReview' ? 'held for review' : 'published';
      
      console.log(`✅ Set comment ${commentId} to: ${action}${banAuthor ? ' (author banned)' : ''}`);
      
      return {
        success: true,
        commentId: commentId,
        action: action,
        moderationStatus: status,
        authorBanned: banAuthor
      };

    } catch (error) {
      console.error(`❌ Error setting moderation status:`, error.message);
      return {
        success: false,
        commentId: commentId,
        error: error.message
      };
    }
  }

  /**
   * Hide spam comment (marks as rejected)
   * @param {string} commentId - Comment ID
   * @param {boolean} banAuthor - Whether to ban the spammer (default: true for spam)
   * @returns {Object} - Moderation result
   */
  async hideSpamComment(commentId, banAuthor = true) {
    return await this.setCommentModerationStatus(commentId, 'rejected', banAuthor);
  }

  /**
   * Get video statistics
   * @param {string} videoId - Video ID
   * @returns {Object} - Video stats
   */
  async getVideoStats(videoId) {
    try {
      this.ensureAuth();

      const response = await this.youtube.videos.list({
        part: 'snippet,statistics',
        id: videoId
      });

      if (response.data.items.length === 0) {
        throw new Error('Video not found');
      }

      const video = response.data.items[0];
      return {
        id: videoId,
        title: video.snippet.title,
        channelTitle: video.snippet.channelTitle,
        publishedAt: video.snippet.publishedAt,
        viewCount: parseInt(video.statistics.viewCount),
        likeCount: parseInt(video.statistics.likeCount || 0),
        commentCount: parseInt(video.statistics.commentCount || 0)
      };

    } catch (error) {
      console.error('❌ Error fetching video stats:', error.message);
      throw error;
    }
  }

  hasValidTokens() {
    try {
      if (!fs.existsSync(this.tokenPath)) {
        return false;
      }
      const tokens = JSON.parse(fs.readFileSync(this.tokenPath, 'utf8'));
      return tokens && tokens.access_token;
    } catch {
      return false;
    }
  }
}

module.exports = new YouTubeService();