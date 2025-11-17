const express = require('express');
const axios = require('axios');
require('dotenv').config();

const router = express.Router();

router.get('/youtube/:videoId', async (req, res) => {
  const videoId = req.params.videoId;
  const apiKey = process.env.YT_API_KEY;

  const url = `https://www.googleapis.com/youtube/v3/commentThreads?part=snippet&videoId=${videoId}&maxResults=20&key=${apiKey}`;

  try {
    const response = await axios.get(url);
    const comments = response.data.items.map((item) => ({
      author: item.snippet.topLevelComment.snippet.authorDisplayName,
      comment: item.snippet.topLevelComment.snippet.textDisplay,
      publishedAt: item.snippet.topLevelComment.snippet.publishedAt,
      likeCount: item.snippet.topLevelComment.snippet.likeCount,
    }));

    res.json({ videoId, comments });
  } catch (err) {
    console.error('Error fetching YouTube comments:', err.message);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

module.exports = router;