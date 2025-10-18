// GitHub OAuth Token Exchange Proxy
// Deploy this to Vercel to handle OAuth token exchange securely

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code, client_id, redirect_uri } = req.body;

    // Validate required parameters
    if (!code || !client_id || !redirect_uri) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Exchange code for access token
    const response = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: client_id,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code: code,
        redirect_uri: redirect_uri,
      }),
    });

    const data = await response.json();

    // Check for errors from GitHub
    if (data.error) {
      console.error('GitHub OAuth error:', data);
      return res.status(400).json({ error: data.error_description || data.error });
    }

    // Return the access token
    return res.status(200).json(data);

  } catch (error) {
    console.error('Token exchange error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
