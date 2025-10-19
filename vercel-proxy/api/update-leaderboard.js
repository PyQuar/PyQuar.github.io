// Leaderboard Update Proxy
// This endpoint updates the central leaderboard Gist using PyQuar's personal token
// Deploy this to Vercel

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Validate user token from request
    const userToken = req.headers.authorization?.replace('Bearer ', '');
    if (!userToken) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    // Verify user is authenticated by checking their token
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${userToken}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!userResponse.ok) {
      return res.status(401).json({ error: 'Invalid user token' });
    }

    const userData = await userResponse.json();
    console.log('Authenticated user:', userData.login);

    // Get player data from request body
    const { playerData, gistId } = req.body;

    if (!playerData || !gistId) {
      return res.status(400).json({ error: 'Missing required data' });
    }

    // Validate gistId matches the expected leaderboard gist
    const EXPECTED_GIST_ID = '2acc97044fc86cb79c96b02a5bd1b5fb';
    if (gistId !== EXPECTED_GIST_ID) {
      return res.status(400).json({ error: 'Invalid gist ID' });
    }

    // Check if PyQuar's admin token is configured
    if (!process.env.PYQUAR_GITHUB_TOKEN) {
      console.error('PYQUAR_GITHUB_TOKEN environment variable is not set!');
      return res.status(500).json({ error: 'Server configuration error: Admin token not configured' });
    }

    console.log('Fetching current leaderboard...');

    // Fetch current leaderboard using PyQuar's token
    const getResponse = await fetch(`https://api.github.com/gists/${gistId}`, {
      headers: {
        'Authorization': `Bearer ${process.env.PYQUAR_GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!getResponse.ok) {
      console.error('Failed to fetch leaderboard:', getResponse.status);
      return res.status(getResponse.status).json({ error: 'Failed to fetch leaderboard' });
    }

    const gist = await getResponse.json();
    const fileContent = gist.files['wordwave-leaderboard.json']?.content;

    let leaderboard;
    if (fileContent) {
      leaderboard = JSON.parse(fileContent);
    } else {
      leaderboard = { players: {}, lastUpdated: null, version: '2.0' };
    }

    // Update player data in leaderboard
    leaderboard.players[userData.login] = {
      ...playerData,
      username: userData.login, // Ensure username matches authenticated user
      lastUpdated: new Date().toISOString()
    };
    leaderboard.lastUpdated = new Date().toISOString();

    console.log('Updating leaderboard for player:', userData.login);

    // Update the gist using PyQuar's token
    const updateResponse = await fetch(`https://api.github.com/gists/${gistId}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${process.env.PYQUAR_GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        description: 'Word Wave - Global Leaderboard',
        public: true,
        files: {
          'wordwave-leaderboard.json': {
            content: JSON.stringify(leaderboard, null, 2)
          }
        }
      })
    });

    if (!updateResponse.ok) {
      const errorText = await updateResponse.text();
      console.error('Failed to update leaderboard:', updateResponse.status, errorText);
      return res.status(updateResponse.status).json({ 
        error: 'Failed to update leaderboard',
        details: errorText 
      });
    }

    console.log('Leaderboard updated successfully for:', userData.login);

    return res.status(200).json({ 
      success: true,
      message: 'Leaderboard updated successfully',
      username: userData.login
    });

  } catch (error) {
    console.error('Error updating leaderboard:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
}
