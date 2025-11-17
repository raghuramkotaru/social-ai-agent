const { google } = require('googleapis');

const oauth2Client = new google.auth.OAuth2(
  process.env.CLIENT_ID,
  process.env.CLIENT_SECRET,
  process.env.REDIRECT_URI
);

exports.getAuthURL = (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/youtube.force-ssl'],
    prompt: 'consent',
  });

  res.redirect(authUrl);
};

exports.oauthCallback = async (req, res) => {
  const code = req.query.code;

  if (!code) return res.status(400).send('Missing code from Google');

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);


    res.status(200).send({
      message: '✅ OAuth Success',
      tokens,
    });
  } catch (err) {
    console.error('❌ Token exchange failed:', err);
    res.status(500).send('OAuth token exchange failed');
  }
};