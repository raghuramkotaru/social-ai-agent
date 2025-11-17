const fs = require('fs');
const { google } = require('googleapis');

const tokens = JSON.parse(fs.readFileSync('./config/token.json'));
const oauth2Client = new google.auth.OAuth2(
  process.env.YT_CLIENT_ID,
  process.env.YT_CLIENT_SECRET,
  process.env.YT_REDIRECT_URI
);

oauth2Client.setCredentials(tokens);