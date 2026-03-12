require('dotenv').config(); 

const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const oauth2Client = new google.auth.OAuth2(
  process.env.YT_CLIENT_ID,
  process.env.YT_CLIENT_SECRET,
  process.env.YT_REDIRECT_URI
);

const scopes = ['https://www.googleapis.com/auth/youtube.force-ssl'];

// Initiate YouTube OAuth
router.get('/auth/youtube', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });

  res.redirect(authUrl);
});

// OAuth callback handler
router.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;
  
  if (!code) {
    return res.status(400).send('❌ Missing authorization code from Google');
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const tokenPath = path.join(__dirname, '..', 'config', 'token.json');
    
    // Ensure config directory exists
    const configDir = path.dirname(tokenPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }

    fs.writeFile(tokenPath, JSON.stringify(tokens, null, 2), (err) => {
      if (err) {
        console.error('❌ Failed to save token:', err);
        return res.status(500).send('Token save failed');
      }

      console.log('✅ Token saved to', tokenPath);
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Authentication Successful</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            }
            .container {
              background: white;
              padding: 40px;
              border-radius: 10px;
              box-shadow: 0 10px 25px rgba(0,0,0,0.2);
              text-align: center;
            }
            h1 { color: #4CAF50; }
            p { color: #666; margin: 20px 0; }
            .emoji { font-size: 48px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="emoji">✅</div>
            <h1>Authentication Successful!</h1>
            <p>Your YouTube account has been connected.</p>
            <p>You can now close this window and start using the Social AI Agent.</p>
            <p><strong>Next steps:</strong></p>
            <ul style="text-align: left; display: inline-block;">
              <li>Use the API to fetch and process comments</li>
              <li>Enable auto-reply and auto-delete features</li>
              <li>View sentiment analytics dashboard</li>
            </ul>
          </div>
        </body>
        </html>
      `);
    });

  } catch (err) {
    console.error('❌ Error getting tokens:', err);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authentication Failed</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background: #f44336;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            text-align: center;
          }
          h1 { color: #f44336; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>❌ Authentication Failed</h1>
          <p>Please try again or check your API credentials.</p>
        </div>
      </body>
      </html>
    `);
  }
});

// Check authentication status
router.get('/auth/status', (req, res) => {
  const tokenPath = path.join(__dirname, '..', 'config', 'token.json');
  
  if (fs.existsSync(tokenPath)) {
    try {
      const tokens = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
      res.json({
        authenticated: true,
        hasAccessToken: !!tokens.access_token,
        hasRefreshToken: !!tokens.refresh_token
      });
    } catch (error) {
      res.json({ authenticated: false, error: 'Invalid token file' });
    }
  } else {
    res.json({ authenticated: false, message: 'No tokens found. Please authenticate first.' });
  }
});

module.exports = router;
