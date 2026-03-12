# Testing Guide - Social AI Agent

This guide will help you test all features of the Social AI Agent step by step.

## Prerequisites

✅ Server is running: `npm start`
✅ MongoDB is connected
✅ YouTube OAuth is completed
✅ Azure API keys are configured

## 🧪 Test Scenarios

### Test 1: Health Check

**Purpose:** Verify server is running

```bash
curl http://localhost:5000/
```

**Expected Response:**
```json
{
  "message": "🚀 Social AI Agent Backend is Live!",
  "version": "1.0.0",
  "status": "operational"
}
```

---

### Test 2: Authentication Status

**Purpose:** Verify YouTube authentication

```bash
curl http://localhost:5000/api/auth/status
```

**Expected Response:**
```json
{
  "authenticated": true,
  "hasAccessToken": true,
  "hasRefreshToken": true
}
```

---

### Test 3: Fetch Comments (No AI Processing)

**Purpose:** Test YouTube API integration

**Find a video ID:**
- Go to any YouTube video
- Example: `https://www.youtube.com/watch?v=dQw4w9WgXcQ`
- Video ID is: `dQw4w9WgXcQ`

**Test Command:**
```bash
curl "http://localhost:5000/api/comments/youtube/dQw4w9WgXcQ?maxResults=20"
```

**What to Check:**
- ✅ Returns list of comments
- ✅ Each comment has: id, author, text, likeCount
- ✅ No errors in console

---

### Test 4: AI Sentiment Analysis (Preview Mode)

**Purpose:** Test AI processing without taking action

```bash
curl -X POST http://localhost:5000/api/comments/process \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "dQw4w9WgXcQ",
    "autoExecute": false
  }'
```

**What to Check:**
- ✅ Returns sentiment analysis for each comment
- ✅ Shows decision (DELETE/REPLY/FLAG/IGNORE)
- ✅ Provides summary statistics
- ✅ No actual actions taken (autoExecute: false)

**Console Logs to Watch:**
```
🤖 Processing comments for video: dQw4w9WgXcQ
📊 Fetched 20 comments
🔍 Analyzing: "Great video..."
✅ Processed: UgzxX... - REPLY
```

---

### Test 5: Generate AI Reply Preview

**Purpose:** Test OpenAI reply generation

```bash
curl -X POST http://localhost:5000/api/comments/generate-reply \
  -H "Content-Type: application/json" \
  -d '{
    "commentText": "This is the best video I have ever seen!",
    "sentiment": "positive"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "commentText": "This is the best video I have ever seen!",
  "sentiment": "positive",
  "generatedReply": "Thank you so much! We're thrilled you enjoyed it! 😊"
}
```

**Try Different Sentiments:**

Positive:
```bash
curl -X POST http://localhost:5000/api/comments/generate-reply \
  -H "Content-Type: application/json" \
  -d '{"commentText": "Amazing content!", "sentiment": "positive"}'
```

Negative:
```bash
curl -X POST http://localhost:5000/api/comments/generate-reply \
  -H "Content-Type: application/json" \
  -d '{"commentText": "This does not work properly", "sentiment": "negative"}'
```

---

### Test 6: Keyword Filtering

**Purpose:** Verify banned keyword detection

Create a test script to check keyword filtering:

```bash
curl -X POST http://localhost:5000/api/comments/generate-reply \
  -H "Content-Type: application/json" \
  -d '{
    "commentText": "This is a scam! Do not trust these fake promises!",
    "sentiment": "negative"
  }'
```

**Expected Behavior:**
- When processed with `/process`, this should be flagged for deletion
- Keywords matched: ["scam", "fake"]
- Severity: HIGH

---

### Test 7: View Sentiment Summary

**Purpose:** Check database storage and analytics

```bash
curl http://localhost:5000/api/comments/sentiment/dQw4w9WgXcQ
```

**Expected Response:**
```json
{
  "success": true,
  "videoId": "dQw4w9WgXcQ",
  "totalComments": 20,
  "breakdown": [
    { "_id": "positive", "count": 12, "avgScore": 0.85 },
    { "_id": "neutral", "count": 5, "avgScore": 0.5 },
    { "_id": "negative", "count": 3, "avgScore": 0.25 }
  ]
}
```

---

### Test 8: View Processed Comments

**Purpose:** Query stored comments from database

```bash
# Get all processed comments
curl "http://localhost:5000/api/comments/processed/dQw4w9WgXcQ?limit=10"

# Filter by positive sentiment
curl "http://localhost:5000/api/comments/processed/dQw4w9WgXcQ?sentiment=positive&limit=5"

# Filter by action taken
curl "http://localhost:5000/api/comments/processed/dQw4w9WgXcQ?action=replied&limit=5"
```

---

### Test 9: Manual Reply (Use With Caution!)

**Purpose:** Test manual reply functionality

⚠️ **Warning:** This will actually post a reply to YouTube!

```bash
curl -X POST http://localhost:5000/api/comments/reply \
  -H "Content-Type: application/json" \
  -d '{
    "commentId": "UgzxX_REAL_COMMENT_ID_HERE",
    "replyText": "Thank you for your feedback!"
  }'
```

**Before Running:**
1. Get a real comment ID from Test 3
2. Make sure you want to reply to that comment
3. The reply will be public!

---

### Test 10: Automated Processing (LIVE MODE)

**Purpose:** Full automation test

⚠️ **DANGER ZONE:** This will actually delete/reply to comments!

**Recommended Approach:**
1. Use a test video with few comments
2. Or use your own video where you control comments

```bash
curl -X POST http://localhost:5000/api/comments/process \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "YOUR_TEST_VIDEO_ID",
    "autoExecute": true
  }'
```

**What Will Happen:**
- Comments with banned keywords → DELETED
- Positive comments → REPLIED with thank you message
- Negative comments → REPLIED with support message
- Suspicious comments → FLAGGED (not deleted)

---

## 🎯 Demo Workflow

### Complete Demo Script

```bash
# 1. Check if everything is running
curl http://localhost:5000/
curl http://localhost:5000/api/auth/status

# 2. Fetch comments from a popular video
VIDEO_ID="dQw4w9WgXcQ"
curl "http://localhost:5000/api/comments/youtube/$VIDEO_ID?maxResults=10"

# 3. Process with AI (preview only)
curl -X POST http://localhost:5000/api/comments/process \
  -H "Content-Type: application/json" \
  -d "{\"videoId\": \"$VIDEO_ID\", \"autoExecute\": false}"

# 4. View sentiment summary
curl "http://localhost:5000/api/comments/sentiment/$VIDEO_ID"

# 5. Test AI reply generation
curl -X POST http://localhost:5000/api/comments/generate-reply \
  -H "Content-Type: application/json" \
  -d '{"commentText": "Great video!", "sentiment": "positive"}'

# 6. View processed comments
curl "http://localhost:5000/api/comments/processed/$VIDEO_ID?limit=5"
```

---

## 📊 Expected Results Summary

| Test | Feature | Expected Outcome |
|------|---------|------------------|
| 1 | Health Check | Server responds with status |
| 2 | Auth Status | Shows authenticated: true |
| 3 | Fetch Comments | Returns list from YouTube |
| 4 | AI Analysis | Sentiment + decisions returned |
| 5 | Generate Reply | AI-generated response |
| 6 | Keyword Filter | Detects banned words |
| 7 | Sentiment Summary | Database statistics |
| 8 | Processed Comments | Query stored data |
| 9 | Manual Reply | Posts to YouTube |
| 10 | Auto Execute | Full automation works |

---

## 🐛 Troubleshooting Tests

### Test Fails: "Authentication required"
**Solution:** Run OAuth flow again at `/api/auth/youtube`

### Test Fails: "Video not found"
**Solution:** Use a different video ID or check if video has comments enabled

### Test Fails: "Quota exceeded"
**Solution:** YouTube API has daily quota limits. Wait 24 hours or use different account.

### Test Fails: Azure API errors
**Solution:** Check your API keys and endpoints in `.env`

### Test Fails: MongoDB errors
**Solution:** Ensure MongoDB is running: `mongod`

---

## 💡 Testing Tips

1. **Start Small:** Test with 5-10 comments before processing 100s
2. **Use Test Videos:** Don't test on important videos initially
3. **Monitor Logs:** Watch console output for errors
4. **Check Database:** Use MongoDB Compass to view stored data
5. **Rate Limits:** Be aware of YouTube API quotas

---

## 🎓 Demo Presentation Tips

When presenting this project:

1. **Show Architecture:** Explain the flow diagram
2. **Live API Test:** Run Test 4 (AI Analysis) live
3. **Show Database:** Display MongoDB stored comments
4. **Demonstrate AI:** Show reply generation with different sentiments
5. **Explain Decisions:** Walk through the decision engine logic
6. **Show Safety:** Explain keyword filtering and flagging

---

## ✅ Final Checklist Before Demo

- [ ] MongoDB is running
- [ ] Server starts without errors
- [ ] OAuth authentication complete
- [ ] Can fetch comments from YouTube
- [ ] AI sentiment analysis works
- [ ] Reply generation produces results
- [ ] Database stores comments correctly
- [ ] All environment variables set
- [ ] Tested on at least 2 different videos

---

**Ready to Demo!** 🚀
