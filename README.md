# Social AI Agent – YouTube Comment Management Backend

This project is a Node.js backend built to authenticate with Google using OAuth2.0 and perform YouTube comment operations like fetching, replying, and deleting comments. It’s a part of a larger system designed to handle social media interactions intelligently.

## Features

- Google OAuth 2.0 login integration
- Secure access token and refresh token handling
- YouTube comment fetch, reply, and delete functionality
- Modular Express.js structure
- Stores access tokens locally in a JSON file

## Tech Stack

- Node.js
- Express.js
- Google APIs (`googleapis`)
- dotenv for environment variable handling
- MongoDB (optional for storing comment data)
- YouTube Data API v3

## Project Structure

social-ai-agent/
│
├── config/
│   ├── db.js
│   └── token.json         # auto-created after OAuth login
│
├── controllers/
│   ├── authController.js
│   └── commentController.js
│
├── models/
│   └── Comment.js
│
├── routes/
│   ├── authRoutes.js      # Handles Google login and callback
│   └── commentRoutes.js   # Comment API handlers
│
├── .env                   # contains secrets and config
├── index.js               # main server file
└── README.md

## Environment Variables

Create a `.env` file in the root folder with the following keys:

PORT=5000
MONGODB_URI=mongodb://localhost:27017/social-ai-agent
YT_API_KEY=your_youtube_api_key
YT_CLIENT_ID=your_google_client_id
YT_CLIENT_SECRET=your_google_client_secret
YT_REDIRECT_URI=http://localhost:5000/api/oauth2callback

## How to Run

1. Install the required packages:

```bash
npm install

2. Start server:

node index.js

3.	Open this link in your browser to begin Google OAuth:
http://localhost:5000/api/auth/youtube

4.	After successful login, the app will store the token in config/token.json.

Things to Do (Future Work)
    .   Fetch comments form videos, Delete them, Reply to them
	•	Add database logging for all comment actions
	•	Integrate toxicity and sentiment analysis before replying
	•	Build a small dashboard for monitoring comment sentiment
	•	Add token auto-refresh logic
	•	Deploy the service with domain and SSL

Author

Raghu Ram Kotaru
Stony Brook University – Data Science Graduate Student