// Music suggestions API: save/load from GitHub Gist

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GIST_ID = '403a285df15c8e9d8b33058a63ae9c20';
const GIST_FILENAME = 'music_suggestions.json';
const GIST_API = `https://api.github.com/gists/${GIST_ID}`;

const fetch = require('node-fetch');

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (!GITHUB_TOKEN) {
    res.status(500).json({ error: 'Missing GitHub token' });
    return;
  }

  // GET: return all suggestions
  if (req.method === 'GET') {
    try {
      const gistRes = await fetch(GIST_API, {
        headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
      });
      const gist = await gistRes.json();
      const file = gist.files[GIST_FILENAME];
      const suggestions = file ? JSON.parse(file.content) : [];
      res.status(200).json(suggestions);
    } catch (err) {
      console.error('GET error:', err);
      res.status(500).json({ error: 'Failed to fetch suggestions', details: err.message });
    }
    return;
  }

  // POST: add new suggestion
  if (req.method === 'POST') {
    try {
      const { songTitle, artistName, spotifyLink, suggestedBy, timestamp, date } = req.body;
      
      if (!songTitle || !artistName || !suggestedBy) {
        res.status(400).json({ error: 'Missing required fields' });
        return;
      }

      // Get current suggestions
      const gistRes = await fetch(GIST_API, {
        headers: { 'Authorization': `token ${GITHUB_TOKEN}` }
      });
      const gist = await gistRes.json();
      const file = gist.files[GIST_FILENAME];
      let suggestions = file ? JSON.parse(file.content) : [];

      // Add new suggestion
      const newSuggestion = {
        id: Date.now(),
        songTitle,
        artistName,
        spotifyLink: spotifyLink || null,
        suggestedBy,
        timestamp: timestamp || Date.now(),
        date: date || new Date().toISOString()
      };

      suggestions.unshift(newSuggestion); // Add to beginning

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
              content: JSON.stringify(suggestions, null, 2)
            }
          }
        })
      });

      if (!updateRes.ok) {
        const errorData = await updateRes.json();
        throw new Error(`Failed to update gist: ${JSON.stringify(errorData)}`);
      }

      res.status(200).json({ success: true, suggestion: newSuggestion });
    } catch (err) {
      console.error('POST error:', err);
      res.status(500).json({ error: 'Failed to add suggestion', details: err.message });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
