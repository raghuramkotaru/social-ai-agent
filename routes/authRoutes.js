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

router.get('/auth/youtube', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    prompt: 'consent',
  });

  res.redirect(authUrl);
});

router.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const tokenPath = path.join(__dirname, '..', 'config', 'token.json');
    fs.writeFile(tokenPath, JSON.stringify(tokens, null, 2), (err) => {
      if (err) {
        console.error('❌ Failed to save token:', err);
        return res.status(500).send('Token save failed');
      }

      console.log('✅ Token saved to', tokenPath);
      res.send('✅ Authentication successful! Tokens saved. You can now reply/delete YouTube comments.');
    });

  } catch (err) {
    console.error('❌ Error getting tokens:', err);
    res.status(500).send('Auth failed');
  }
});

module.exports = router;