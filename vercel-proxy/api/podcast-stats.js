// Podcast stats API: likes & views
// Uses GitHub Gist for storage

const GITHUB_TOKEN = process.env.PYQUAR_GITHUB_TOKEN || process.env.GITHUB_ADMIN_TOKEN || process.env.GITHUB_TOKEN;
const GIST_ID = '403a285df15c8e9d8b33058a63ae9c20';
const GIST_FILENAME = 'podcast_stats.json';
const GIST_API = `https://api.github.com/gists/${GIST_ID}`;

const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // Enable CORS for all origins
  const allowedOrigins = [
    'https://pyquar.github.io',
    'https://wavyessai.me',
    'http://localhost:5500',
    'http://localhost:3000',
    'http://127.0.0.1:5500'
  ];
  
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (!GITHUB_TOKEN) {
    res.status(500).json({ error: 'Missing GitHub token' });
    return;
  }

  // GET: return stats
  if (req.method === 'GET') {
    try {
      const gistRes = await fetch(GIST_API, {
        headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
      });
      const gist = await gistRes.json();
      const file = gist.files[GIST_FILENAME];
      const stats = file ? JSON.parse(file.content) : {};
      res.status(200).json(stats);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch stats', details: err });
    }
    return;
  }

  // POST: update stats
  if (req.method === 'POST') {
    try {
      const { episodeId, action } = req.body;
      if (!episodeId || !['like','view'].includes(action)) {
        res.status(400).json({ error: 'Invalid request' });
        return;
      }
      // Get current stats
      const gistRes = await fetch(GIST_API, {
        headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
      });
      const gist = await gistRes.json();
      const file = gist.files[GIST_FILENAME];
      let stats = file ? JSON.parse(file.content) : {};
      if (!stats[episodeId]) stats[episodeId] = { likes: 0, views: 0 };
      if (action === 'like') stats[episodeId].likes++;
      if (action === 'view') stats[episodeId].views++;
      // Update Gist
      const updateRes = await fetch(GIST_API, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${GITHUB_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          files: {
            [GIST_FILENAME]: {
              content: JSON.stringify(stats, null, 2)
            }
          }
        })
      });
      if (!updateRes.ok) throw new Error('Failed to update gist');
      res.status(200).json(stats[episodeId]);
    } catch (err) {
      res.status(500).json({ error: 'Failed to update stats', details: err });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
