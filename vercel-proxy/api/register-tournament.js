// Tournament Registration Proxy
// This endpoint manages tournament registrations in a Gist using PyQuar's token

export default async function handler(req, res) {
  // Enable CORS for all origins (or specify your domain)
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

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const GIST_ID = '403a285df15c8e9d8b33058a63ae9c20';
  const FILENAME = 'essai-league-registrations.json';
  const ADMIN_TOKEN = process.env.GITHUB_ADMIN_TOKEN;

  if (!ADMIN_TOKEN) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  // GET - Retrieve participants
  if (req.method === 'GET') {
    try {
      const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        headers: {
          'Authorization': `token ${ADMIN_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch gist');
      }

      const gist = await response.json();
      const content = gist.files[FILENAME]?.content || '[]';
      const participants = JSON.parse(content);

      return res.status(200).json({ 
        success: true, 
        participants 
      });
    } catch (error) {
      console.error('Error fetching participants:', error);
      return res.status(500).json({ 
        error: 'Failed to fetch participants',
        participants: []
      });
    }
  }

  // POST - Add new participant
  if (req.method === 'POST') {
    try {
      const newParticipant = req.body;

      // Validate required fields
      if (!newParticipant.firstName || !newParticipant.lastName || !newParticipant.idCard) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      // Get current participants
      const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        headers: {
          'Authorization': `token ${ADMIN_TOKEN}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch gist');
      }

      const gist = await response.json();
      const content = gist.files[FILENAME]?.content || '[]';
      let participants = JSON.parse(content);

      // Check for duplicate ID card
      const existingParticipant = participants.find(p => p.idCard === newParticipant.idCard);
      if (existingParticipant) {
        return res.status(409).json({ 
          error: 'Cette carte d\'identité est déjà enregistrée.',
          duplicate: true
        });
      }

      // Add new participant
      participants.push(newParticipant);

      // Update gist
      const updateResponse = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `token ${ADMIN_TOKEN}`,
          'Content-Type': 'application/json',
          'Accept': 'application/vnd.github.v3+json'
        },
        body: JSON.stringify({
          files: {
            [FILENAME]: {
              content: JSON.stringify(participants, null, 2)
            }
          }
        })
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update gist');
      }

      return res.status(200).json({ 
        success: true, 
        participants,
        message: 'Inscription réussie !'
      });

    } catch (error) {
      console.error('Error registering participant:', error);
      return res.status(500).json({ 
        error: 'Erreur lors de l\'inscription',
        details: error.message
      });
    }
  }

  // Method not allowed
  return res.status(405).json({ error: 'Method not allowed' });
}
