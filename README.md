# Social AI Agent – YouTube Comment Management Backend

A Node.js backend service for managing YouTube comments using Google OAuth 2.0 authentication. This project enables automated comment operations including fetching, replying, and deleting comments through the YouTube Data API v3.

## Features

- **Google OAuth 2.0 Integration** – Secure authentication with YouTube API
- **Token Management** – Automatic storage and handling of access and refresh tokens
- **Comment Operations** – Fetch, reply to, and delete YouTube comments
- **Modular Architecture** – Clean Express.js structure with separation of concerns
- **Local Token Storage** – Persistent token storage in JSON format

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **APIs:** Google APIs (`googleapis`)
- **Database:** MongoDB (optional)
- **Environment Config:** dotenv
- **API:** YouTube Data API v3

## Project Structure

```
social-ai-agent/
│
├── config/
│   ├── db.js                    # Database configuration
│   └── token.json               # OAuth tokens (auto-generated)
│
├── controllers/
│   ├── authController.js        # Authentication logic
│   └── commentController.js     # Comment management logic
│
├── models/
│   └── Comment.js               # Comment data model
│
├── routes/
│   ├── authRoutes.js            # OAuth routes
│   └── commentRoutes.js         # Comment API endpoints
│
├── .env                         # Environment variables
├── index.js                     # Main server entry point
├── package.json
└── README.md
```

## Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (optional, for comment logging)
- Google Cloud Console project with YouTube Data API v3 enabled

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd social-ai-agent
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/social-ai-agent
   YT_API_KEY=your_youtube_api_key
   YT_CLIENT_ID=your_google_client_id
   YT_CLIENT_SECRET=your_google_client_secret
   YT_REDIRECT_URI=http://localhost:5000/api/oauth2callback
   ```

4. **Start the server**
   ```bash
   node index.js
   ```

5. **Authenticate with Google**
   
   Navigate to the following URL in your browser:
   ```
   http://localhost:5000/api/auth/youtube
   ```
   
   After successful authentication, tokens will be stored in `config/token.json`.

## API Endpoints

### Authentication
- `GET /api/auth/youtube` – Initialize OAuth flow
- `GET /api/oauth2callback` – OAuth callback handler

### Comment Management
- `GET /api/comments` – Fetch comments from a video
- `POST /api/comments/reply` – Reply to a comment
- `DELETE /api/comments/:id` – Delete a comment

## Roadmap

### Planned Features

- [ ] Complete comment CRUD operations (fetch, delete, reply)
- [ ] Database logging for all comment actions
- [ ] Sentiment and toxicity analysis integration
- [ ] Automated comment moderation
- [ ] Token auto-refresh mechanism
- [ ] Admin dashboard for monitoring
- [ ] Rate limiting and error handling
- [ ] Production deployment with SSL

### Future Enhancements

- AI-powered response generation
- Multi-platform support (Twitter, Instagram)
- Comment analytics and reporting
- Webhook integration for real-time notifications

## Configuration Notes

### Google Cloud Console Setup

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable YouTube Data API v3
3. Create OAuth 2.0 credentials
4. Add authorized redirect URI: `http://localhost:5000/api/oauth2callback`
5. Copy Client ID and Client Secret to `.env` file

### Token Storage

The application stores OAuth tokens in `config/token.json`. This file is auto-generated after the first successful authentication and should be added to `.gitignore`.

## Security Considerations

- Never commit `.env` or `token.json` to version control
- Use environment variables for all sensitive data
- Implement rate limiting in production
- Use HTTPS in production environments
- Regularly rotate API keys and secrets


## Author

**Raghu Ram Kotaru**  
Data Science Graduate Student  
Stony Brook University
