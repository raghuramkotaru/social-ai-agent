# ✅ Setup Checklist - Social AI Agent

Follow this checklist to get your project running. Check off each step as you complete it!

---

## 📋 Pre-Setup Checklist

- [ ] Node.js installed (v18 or higher) - Run: `node --version`
- [ ] npm installed - Run: `npm --version`
- [ ] MongoDB installed OR MongoDB Atlas account created
- [ ] YouTube OAuth credentials ready (from Google Cloud Console)
- [ ] Text editor/IDE installed (VS Code recommended)

---

## 🚀 Installation Steps

### Step 1: Download Project
- [ ] Downloaded project files from outputs folder
- [ ] Extracted to your working directory
- [ ] Opened terminal/command prompt in project folder

### Step 2: Install Dependencies
```bash
npm install
```
- [ ] Command completed successfully
- [ ] No error messages
- [ ] `node_modules` folder created

### Step 3: Configure Environment
```bash
cp .env.example .env
nano .env  # or open with your editor
```

**Update these values:**
- [ ] `MONGODB_URI` - Set to your MongoDB connection string
- [ ] `YT_CLIENT_ID` - Your YouTube OAuth client ID
- [ ] `YT_CLIENT_SECRET` - Your YouTube OAuth client secret
- [ ] `YT_REDIRECT_URI` - Should be: `http://localhost:5000/api/oauth2callback`
- [ ] Azure keys are already filled in ✅

### Step 4: Start MongoDB
Choose one:

**Option A: Local MongoDB**
```bash
mongod
```
- [ ] MongoDB started successfully
- [ ] Shows "Waiting for connections"

**Option B: MongoDB Atlas**
- [ ] Created cluster in MongoDB Atlas
- [ ] Copied connection string
- [ ] Updated `MONGODB_URI` in `.env`
- [ ] Whitelisted your IP address

### Step 5: Start the Server
```bash
npm start
```

**Check for:**
- [ ] "✅ MongoDB connected" message
- [ ] "🚀 Social AI Agent Backend Server Started"
- [ ] Server running at `http://localhost:5000`
- [ ] No error messages

---

## 🔐 Authentication Setup

### Step 6: YouTube OAuth
1. Open browser: `http://localhost:5000/api/auth/youtube`
   - [ ] Page loaded successfully
   
2. Google sign-in page appears
   - [ ] Signed in with Google account
   
3. Authorization screen
   - [ ] Clicked "Allow" to authorize
   
4. Redirected back
   - [ ] Saw success message
   - [ ] Token saved confirmation in console

5. Verify authentication
```bash
curl http://localhost:5000/api/auth/status
```
   - [ ] Response shows `"authenticated": true`

---

## 🧪 Testing

### Step 7: Basic Tests

**Test 1: Health Check**
```bash
curl http://localhost:5000/
```
- [ ] Returns JSON with "Social AI Agent Backend is Live!"

**Test 2: Fetch Comments**
```bash
curl "http://localhost:5000/api/comments/youtube/dQw4w9WgXcQ?maxResults=5"
```
- [ ] Returns array of comments
- [ ] Each comment has: id, author, text
- [ ] No errors in response

**Test 3: AI Analysis (Preview)**
```bash
curl -X POST http://localhost:5000/api/comments/process \
  -H "Content-Type: application/json" \
  -d '{"videoId": "dQw4w9WgXcQ", "autoExecute": false}'
```
- [ ] Returns sentiment analysis results
- [ ] Shows decisions (DELETE/REPLY/FLAG/IGNORE)
- [ ] Includes summary statistics
- [ ] Console shows "🔍 Analyzing" messages

**Test 4: Generate AI Reply**
```bash
curl -X POST http://localhost:5000/api/comments/generate-reply \
  -H "Content-Type: application/json" \
  -d '{"commentText": "Great video!", "sentiment": "positive"}'
```
- [ ] Returns AI-generated reply
- [ ] Reply is relevant to the comment
- [ ] No Azure API errors

---

## 📊 Database Verification

### Step 8: Check MongoDB

**Option A: MongoDB Compass**
- [ ] Connected to database
- [ ] See `social-ai-agent` database
- [ ] See `comments` collection
- [ ] Documents appear after processing

**Option B: Command Line**
```bash
mongosh
use social-ai-agent
db.comments.find().limit(5).pretty()
```
- [ ] Shows stored comments
- [ ] Each has sentiment, decision fields

---

## 🎯 Advanced Testing

### Step 9: Test All Features

- [ ] Sentiment summary: `GET /api/comments/sentiment/:videoId`
- [ ] Action stats: `GET /api/comments/actions/:videoId`
- [ ] Processed comments: `GET /api/comments/processed/:videoId`
- [ ] Manual reply: `POST /api/comments/reply`
- [ ] Delete comment: `DELETE /api/comments/:commentId`

**See TESTING_GUIDE.md for detailed instructions on each test!**

---

## 📖 Documentation Review

### Step 10: Read Documentation

- [ ] Read `START_HERE.md` - Overall summary
- [ ] Read `QUICKSTART.md` - Quick setup (you just did this!)
- [ ] Skim `README.md` - Full documentation
- [ ] Bookmark `TESTING_GUIDE.md` - For testing scenarios
- [ ] Review `PROJECT_COMPLETION_REPORT.md` - For presentation

---

## 🎓 Demo Preparation

### Step 11: Prepare Your Demo

- [ ] Can explain system architecture
- [ ] Can demonstrate API calls live
- [ ] Can show MongoDB data
- [ ] Can explain AI decision process
- [ ] Have video with comments ready for demo
- [ ] Prepared presentation slides (use PROJECT_COMPLETION_REPORT.md as outline)

---

## 🐛 Troubleshooting

### Common Issues Checklist

**MongoDB Connection Error:**
- [ ] MongoDB is running
- [ ] Connection string is correct
- [ ] IP address whitelisted (if using Atlas)

**YouTube OAuth Failed:**
- [ ] OAuth credentials are correct
- [ ] Redirect URI matches exactly
- [ ] YouTube Data API v3 is enabled

**Azure API Errors:**
- [ ] API keys are copied correctly
- [ ] Endpoints don't have trailing slashes
- [ ] Services are active in Azure Portal

**Port Already in Use:**
- [ ] Change PORT in `.env` to different number (e.g., 5001)
- [ ] Restart server

---

## ✅ Project Ready Checklist

**Before Considering Complete:**

- [ ] Server starts without errors
- [ ] Can fetch YouTube comments
- [ ] AI sentiment analysis works
- [ ] Reply generation produces results
- [ ] MongoDB stores data correctly
- [ ] All API endpoints tested
- [ ] Documentation reviewed
- [ ] Demo prepared

---

## 🎉 Completion Status

Once all checkboxes are checked:

**✅ YOUR PROJECT IS FULLY OPERATIONAL!**

You're ready to:
- ✅ Demo the project
- ✅ Use it for real comment management
- ✅ Deploy to production
- ✅ Add to your portfolio

---

## 📞 Next Steps After Completion

1. **Test with your own videos:** Use videos from your channel
2. **Customize keywords:** Edit `services/keywordFilter.js`
3. **Adjust thresholds:** Modify `services/decisionEngine.js`
4. **Build frontend:** Create React dashboard using API endpoints
5. **Deploy:** Follow deployment guides for Azure/AWS

---

## 🎯 Success Criteria

You know it's working when:
- ✅ Server logs show "✅ MongoDB connected"
- ✅ Authentication returns `authenticated: true`
- ✅ Comments are fetched from YouTube
- ✅ AI generates sentiment scores
- ✅ Database contains processed comments
- ✅ All tests pass successfully

---

**Current Progress:** ___/50 checkboxes completed

**Keep this checklist handy as you set up your project!**

**Need help?** Refer to TESTING_GUIDE.md for detailed troubleshooting.
