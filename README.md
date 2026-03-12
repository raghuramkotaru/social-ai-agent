# Social AI Agent – YouTube Comment Management System

An AI-powered backend system for intelligent social media comment management with sentiment analysis, automated replies, and content moderation.

## 🚀 Features

- ✅ **OAuth 2.0 Authentication** with YouTube
- ✅ **AI Sentiment Analysis** using Azure Text Analytics
- ✅ **Automated Reply Generation** using Azure OpenAI GPT-4
- ✅ **Keyword-Based Content Filtering** for spam and inappropriate content
- ✅ **Auto-Delete Toxic Comments** based on configurable rules
- ✅ **Decision Engine** with priority-based action system
- ✅ **MongoDB Storage** for analytics and audit trails
- ✅ **Comprehensive API** for comment operations
- ✅ **Real-time Processing** with batch support

## 📋 Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- YouTube Data API credentials
- Azure Text Analytics API access
- Azure OpenAI API access

## 🛠️ Installation

### 1. Clone or Copy Project Files

```bash
# If you have the files locally
cd social-ai-agent
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/social_ai_agent

# YouTube API Configuration
YT_API_KEY=your_youtube_api_key
YT_CLIENT_ID=your_youtube_client_id
YT_CLIENT_SECRET=your_youtube_client_secret
YT_REDIRECT_URI=http://localhost:5000/api/oauth2callback

# Azure Text Analytics Configuration
AZURE_TEXT_ANALYTICS_ENDPOINT=https://socialmedia.cognitiveservices.azure.com/
AZURE_TEXT_ANALYTICS_KEY=your_azure_text_analytics_key_here

# Azure OpenAI Configuration
AZURE_OPENAI_ENDPOINT=https://socialmediahandle-resource.openai.azure.com/
AZURE_OPENAI_KEY=your_azure_openai_key_here
AZURE_OPENAI_DEPLOYMENT=gpt-4
```

### 4. Start MongoDB

```bash
# If using local MongoDB
mongod
```

Or use MongoDB Atlas (cloud) and update the `MONGODB_URI` accordingly.

### 5. Start the Server

```bash
npm start
```

For development with auto-reload:

```bash
npm run dev
```

## 🔐 Authentication Setup

### Step 1: Authenticate with YouTube

1. Visit: `http://localhost:5000/api/auth/youtube`
2. Sign in with your Google account
3. Authorize the application
4. You'll be redirected back with success message
5. Tokens are automatically saved in `config/token.json`

### Step 2: Verify Authentication

```bash
curl http://localhost:5000/api/auth/status
```

## 📚 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Available Endpoints

#### 1. Fetch Comments from YouTube Video

```bash
GET /api/comments/youtube/:videoId?maxResults=50
```

**Example:**
```bash
curl http://localhost:5000/api/comments/youtube/dQw4w9WgXcQ?maxResults=100
```

**Response:**
```json
{
  "success": true,
  "videoId": "dQw4w9WgXcQ",
  "totalComments": 85,
  "comments": [
    {
      "id": "UgzxX...",
      "author": "John Doe",
      "text": "Great video!",
      "likeCount": 12,
      "publishedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

#### 2. Process Comments with AI Analysis

```bash
POST /api/comments/process
Content-Type: application/json

{
  "videoId": "dQw4w9WgXcQ",
  "autoExecute": false
}
```

**Parameters:**
- `videoId` (required): YouTube video ID
- `autoExecute` (optional): Set to `true` to automatically execute delete/reply actions

**Response:**
```json
{
  "success": true,
  "videoId": "dQw4w9WgXcQ",
  "summary": {
    "total": 85,
    "toDelete": 5,
    "toReply": 40,
    "toFlag": 8,
    "toIgnore": 32,
    "bySentiment": {
      "positive": 45,
      "neutral": 25,
      "negative": 15
    }
  },
  "results": [...]
}
```

#### 3. Get Sentiment Summary

```bash
GET /api/comments/sentiment/:videoId
```

**Example:**
```bash
curl http://localhost:5000/api/comments/sentiment/dQw4w9WgXcQ
```

#### 4. Get Action Statistics

```bash
GET /api/comments/actions/:videoId?startDate=2024-01-01&endDate=2024-01-31
```

#### 5. Get Processed Comments

```bash
GET /api/comments/processed/:videoId?sentiment=positive&limit=50&skip=0
```

**Query Parameters:**
- `sentiment`: Filter by sentiment (positive/neutral/negative)
- `action`: Filter by action (deleted/replied/flagged/ignored)
- `limit`: Number of results (default: 50)
- `skip`: Number to skip for pagination

#### 6. Reply to Comment Manually

```bash
POST /api/comments/reply
Content-Type: application/json

{
  "commentId": "UgzxX...",
  "replyText": "Thank you for your feedback!"
}
```

#### 7. Delete Comment

```bash
DELETE /api/comments/:commentId
```

#### 8. Generate AI Reply (Preview)

```bash
POST /api/comments/generate-reply
Content-Type: application/json

{
  "commentText": "This product is amazing!",
  "sentiment": "positive"
}
```

**Response:**
```json
{
  "success": true,
  "commentText": "This product is amazing!",
  "sentiment": "positive",
  "generatedReply": "Thank you so much! We're thrilled you love it! 😊"
}
```

## 🎯 Usage Examples

### Example 1: Basic Comment Analysis

```bash
# 1. Fetch comments
curl http://localhost:5000/api/comments/youtube/VIDEO_ID

# 2. Process with AI (preview only)
curl -X POST http://localhost:5000/api/comments/process \
  -H "Content-Type: application/json" \
  -d '{"videoId": "VIDEO_ID", "autoExecute": false}'

# 3. View sentiment summary
curl http://localhost:5000/api/comments/sentiment/VIDEO_ID
```

### Example 2: Automated Comment Management

```bash
# Process and automatically execute actions
curl -X POST http://localhost:5000/api/comments/process \
  -H "Content-Type: application/json" \
  -d '{"videoId": "VIDEO_ID", "autoExecute": true}'
```

This will:
- Analyze all comments
- Delete comments with banned keywords
- Reply to positive/negative comments
- Flag suspicious content

### Example 3: Generate Custom Reply

```bash
curl -X POST http://localhost:5000/api/comments/generate-reply \
  -H "Content-Type: application/json" \
  -d '{
    "commentText": "I have a question about your product",
    "sentiment": "neutral"
  }'
```

## 🧠 AI Features Explained

### Sentiment Analysis

The system uses Azure Text Analytics to classify comments into:
- **Positive** (score ≥ 0.6): Thank and engage
- **Neutral** (score 0.4-0.6): Typically ignored
- **Negative** (score < 0.4): Offer support
- **Very Negative** (score < 0.2): Flag for review

### Keyword Filtering

Automatically detects and flags:
- Profanity and hate speech
- Spam patterns (URLs, repeated characters)
- Scam attempts
- Inappropriate content

**Configurable banned keywords list:**
- scam, fraud, fake, spam
- hate, racist, sexist
- And more (customizable)

### Decision Engine

Priority-based action system:

1. **HIGH Priority**: Delete if banned keywords detected
2. **MEDIUM Priority**: Flag if suspicious or low confidence
3. **LOW Priority**: Reply to positive/negative sentiment

### Auto-Reply Generation

Uses Azure OpenAI GPT-4 to generate:
- Grateful responses for positive comments
- Supportive responses for negative comments
- Helpful responses for questions

Fallback to template-based replies if AI fails.

## 📊 Database Schema

### Comments Collection

```javascript
{
  commentId: String (unique),
  platform: String,
  postId: String,
  author: String,
  text: String,
  sentiment: String,
  sentimentScore: Number,
  decision: {
    action: String,
    reason: String,
    priority: String
  },
  actionTaken: String,
  replyText: String,
  processed: Boolean,
  createdAt: Date
}
```

## 🔧 Configuration

### Customize Decision Engine

Edit `services/decisionEngine.js`:

```javascript
this.config = {
  positiveThreshold: 0.6,
  negativeThreshold: 0.4,
  veryNegativeThreshold: 0.2,
  minConfidence: 0.7,
  replyToPositive: true,
  replyToNegative: true,
  replyToNeutral: false
};
```

### Add Custom Keywords

Edit `services/keywordFilter.js`:

```javascript
this.bannedKeywords = [
  'scam', 'fraud', 'spam',
  // Add your keywords here
];
```

## 🐛 Troubleshooting

### MongoDB Connection Error

```bash
# Make sure MongoDB is running
mongod

# Or check your connection string
MONGODB_URI=mongodb://localhost:27017/social_ai_agent
```

### YouTube Authentication Failed

1. Check your OAuth credentials
2. Verify redirect URI matches: `http://localhost:5000/api/oauth2callback`
3. Enable YouTube Data API v3 in Google Cloud Console

### Azure API Errors

1. Verify your endpoints and API keys
2. Check quota limits in Azure Portal
3. Ensure Text Analytics and OpenAI services are active

## 📈 Next Steps

- [ ] Add Instagram and Facebook support
- [ ] Build React dashboard for visualization
- [ ] Implement webhook listeners for real-time processing
- [ ] Add advanced sarcasm detection
- [ ] Create scheduled job for periodic comment checks
- [ ] Deploy to Azure/AWS

## 👤 Author

**Raghu Ram Kotaru**
- Graduate Student, Data Science
- Stony Brook University

## 📄 License

ISC License

## 🙏 Acknowledgments

- Azure AI Services for sentiment analysis
- Google YouTube Data API
- OpenAI GPT-4 for reply generation

---

**Need Help?** Check the API docs at `http://localhost:5000/api/docs`
