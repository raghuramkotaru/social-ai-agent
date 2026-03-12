# 🚀 Quick Start Guide

Get your Social AI Agent running in 5 minutes!

## Step 1: Install Dependencies (1 min)

```bash
npm install
```

## Step 2: Configure Environment (2 min)

Create `.env` file:

```env
# Server
PORT=5000

# MongoDB (use one of these)
MONGODB_URI=mongodb://localhost:27017/social_ai_agent
# OR for MongoDB Atlas:
# MONGODB_URI="mongodb://localhost:27017/social_ai_agent"

# YouTube (get from Google Cloud Console)
YT_CLIENT_ID=your_client_id
YT_CLIENT_SECRET=your_client_secret
YT_REDIRECT_URI=http://localhost:5000/api/oauth2callback

# Azure Text Analytics (already configured for you)
AZURE_TEXT_ANALYTICS_ENDPOINT=https://socialmedia.cognitiveservices.azure.com/
AZURE_TEXT_ANALYTICS_KEY=your_azure_text_analytics_key_here

# Azure OpenAI (already configured for you)
AZURE_OPENAI_ENDPOINT=https://socialmediahandle-resource.openai.azure.com/
AZURE_OPENAI_KEY=your_azure_openai_key_here
AZURE_OPENAI_DEPLOYMENT=gpt-4
```

## Step 3: Start Services (30 sec)

```bash
# Terminal 1: Start MongoDB (if using local)
mongod

# Terminal 2: Start the server
npm start
```

## Step 4: Authenticate (1 min)

Visit in your browser:
```
http://localhost:5000/api/auth/youtube
```

Sign in and authorize.

## Step 5: Test! (30 sec)

```bash
# Test 1: Health check
curl http://localhost:5000/

# Test 2: Fetch comments
curl "http://localhost:5000/api/comments/youtube/dQw4w9WgXcQ?maxResults=10"

# Test 3: AI Analysis
curl -X POST http://localhost:5000/api/comments/process \
  -H "Content-Type: application/json" \
  -d '{"videoId": "dQw4w9WgXcQ", "autoExecute": false}'
```

## 🎉 You're Done!

Your AI agent is now:
- ✅ Fetching YouTube comments
- ✅ Analyzing sentiment with Azure AI
- ✅ Generating replies with GPT-4
- ✅ Filtering toxic content
- ✅ Storing everything in MongoDB

## What's Next?

- Read `README.md` for complete documentation
- Check `TESTING_GUIDE.md` for all test scenarios
- Review `Flow.pdf` for system architecture

## Need Help?

Common issues:

**MongoDB not connecting?**
- Install MongoDB: https://www.mongodb.com/try/download/community
- Or use MongoDB Atlas (free tier): https://www.mongodb.com/cloud/atlas

**YouTube auth not working?**
- Check your OAuth credentials
- Make sure redirect URI is exactly: `http://localhost:5000/api/oauth2callback`

**Azure API errors?**
- Verify endpoints and keys in `.env`
- Check if services are active in Azure Portal

---

**Documentation:**
- Full API Docs: `http://localhost:5000/api/docs`
- README: `README.md`
- Testing: `TESTING_GUIDE.md`
