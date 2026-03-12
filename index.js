// Lines 1-8: Requires
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const commentRoutes = require('./routes/commentRoutes');
const authRoutes = require('./routes/authRoutes');
const channelRoutes = require('./routes/channelRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');

// Line 10: Load environment
dotenv.config();

// Lines 12-14: Initialize
const app = express();
const PORT = process.env.PORT || 5000;

// Line 17: Connect DB
connectDB();

// Lines 19-22: Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Lines 24-28: Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Lines 30-34: Routes (ALL ROUTES GO HERE!)
app.use('/api', authRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/channel', channelRoutes);
app.use('/api/analytics', analyticsRoutes);  // ← CORRECT POSITION

// Health check
app.get('/', (req, res) => {
  res.json({
    message: '🚀 Social AI Agent Backend is Live!',
    version: '1.0.0',
    status: 'operational',
    endpoints: {
      auth: {
        login: 'GET /api/auth/youtube',
        callback: 'GET /api/oauth2callback',
        status: 'GET /api/auth/status'
      },
      comments: {
        fetch: 'GET /api/comments/youtube/:videoId',
        process: 'POST /api/comments/process',
        sentiment: 'GET /api/comments/sentiment/:videoId',
        actions: 'GET /api/comments/actions/:videoId',
        processed: 'GET /api/comments/processed/:videoId',
        reply: 'POST /api/comments/reply',
        delete: 'DELETE /api/comments/:commentId',
        generateReply: 'POST /api/comments/generate-reply'
      }
    },
    documentation: 'See README.md for full API documentation'
  });
});

// API documentation endpoint
app.get('/api/docs', (req, res) => {
  res.json({
    title: 'Social AI Agent API Documentation',
    version: '1.0.0',
    baseURL: `http://localhost:${PORT}/api`,
    authentication: {
      type: 'OAuth 2.0',
      flow: 'Authorization Code',
      steps: [
        '1. Visit GET /api/auth/youtube to initiate OAuth',
        '2. Authorize the application with your YouTube account',
        '3. You will be redirected to /api/oauth2callback',
        '4. Tokens will be saved and you can start using the API'
      ]
    },
    endpoints: [
      {
        method: 'GET',
        path: '/api/comments/youtube/:videoId',
        description: 'Fetch comments from a YouTube video',
        parameters: {
          videoId: 'YouTube video ID (path parameter)',
          maxResults: 'Maximum number of comments (query parameter, default: 50)'
        },
        example: '/api/comments/youtube/dQw4w9WgXcQ?maxResults=100'
      },
      {
        method: 'POST',
        path: '/api/comments/process',
        description: 'Process comments with AI analysis and optionally execute actions',
        body: {
          videoId: 'YouTube video ID (required)',
          autoExecute: 'Whether to execute actions automatically (boolean, default: false)'
        },
        response: 'Returns sentiment analysis, decisions, and execution results'
      },
      {
        method: 'GET',
        path: '/api/comments/sentiment/:videoId',
        description: 'Get sentiment summary for a video',
        response: 'Breakdown of positive, neutral, and negative comments'
      },
      {
        method: 'POST',
        path: '/api/comments/reply',
        description: 'Reply to a comment manually',
        body: {
          commentId: 'Comment ID to reply to',
          replyText: 'Text of the reply'
        }
      },
      {
        method: 'DELETE',
        path: '/api/comments/:commentId',
        description: 'Delete a comment'
      },
      {
        method: 'POST',
        path: '/api/comments/generate-reply',
        description: 'Generate AI reply without posting (preview)',
        body: {
          commentText: 'The comment to generate a reply for',
          sentiment: 'Optional sentiment override'
        }
      }
    ],
    features: [
      '✅ OAuth 2.0 Authentication with YouTube',
      '✅ AI-Powered Sentiment Analysis (Azure Text Analytics)',
      '✅ Automated Reply Generation (Azure OpenAI GPT-4)',
      '✅ Keyword-Based Content Filtering',
      '✅ Auto-Delete Inappropriate Comments',
      '✅ Decision Engine with Configurable Rules',
      '✅ MongoDB Storage for Analytics',
      '✅ Comprehensive Action Logging'
    ]
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.path,
    suggestion: 'Visit GET / for available endpoints or GET /api/docs for documentation'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Social AI Agent Backend Server Started');
  console.log('='.repeat(60));
  console.log(`📍 Server URL: http://localhost:${PORT}`);
  console.log(`📚 API Docs: http://localhost:${PORT}/api/docs`);
  console.log(`🔐 Auth: http://localhost:${PORT}/api/auth/youtube`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('='.repeat(60) + '\n');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Promise Rejection:', err);
  // Close server and exit
  process.exit(1);
});

module.exports = app;

