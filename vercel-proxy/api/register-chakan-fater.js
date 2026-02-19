// Chakan Fater (Ramadan Iftar) Registration Proxy
// Stores registrations in the SAME Gist as the tournament, different file

export default async function handler(req, res) {
  // Enable CORS
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
    return res.status(200).end();
  }

  // Same Gist, different filename
  const GIST_ID = '403a285df15c8e9d8b33058a63ae9c20';
  const FILENAME = 'chakan-fater-registrations.json';
  const ADMIN_TOKEN = process.env.PYQUAR_GITHUB_TOKEN || process.env.GITHUB_ADMIN_TOKEN;

  if (!ADMIN_TOKEN) {
    return res.status(500).json({ error: 'Server configuration error: Missing GitHub token' });
  }

  // GET — Retrieve guests
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
      const rawGuests = JSON.parse(content);
      const guests = rawGuests.map(g => ({
        ...g,
        paid: g.paid !== undefined ? g.paid : 0
      }));

      // Persist normalization if any guest was missing the paid field
      const needsUpdate = rawGuests.some(g => g.paid === undefined);
      if (needsUpdate) {
        await fetch(`https://api.github.com/gists/${GIST_ID}`, {
          method: 'PATCH',
          headers: {
            'Authorization': `token ${ADMIN_TOKEN}`,
            'Content-Type': 'application/json',
            'Accept': 'application/vnd.github.v3+json'
          },
          body: JSON.stringify({
            files: {
              [FILENAME]: {
                content: JSON.stringify(guests, null, 2)
              }
            }
          })
        });
      }

      return res.status(200).json({
        success: true,
        guests
      });
    } catch (error) {
      console.error('Error fetching guests:', error);
      return res.status(500).json({
        error: 'Failed to fetch guests',
        guests: []
      });
    }
  }

  // POST — Add new guest
  if (req.method === 'POST') {
    try {
      const newGuest = req.body;

      // Validate required fields
      if (!newGuest.firstName || !newGuest.lastName || !newGuest.phone) {
        return res.status(400).json({ error: 'Champs obligatoires manquants (prénom, nom, téléphone)' });
      }

      // Get current guests
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
      let guests = JSON.parse(content);

      // Check for duplicate phone number
      const normalizedPhone = newGuest.phone.replace(/\s+/g, '');
      const existingGuest = guests.find(g => g.phone.replace(/\s+/g, '') === normalizedPhone);
      if (existingGuest) {
        return res.status(409).json({
          error: 'Ce numéro de téléphone est déjà enregistré.',
          duplicate: true
        });
      }

      // Capture IP address
      const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        || req.headers['x-real-ip']
        || req.socket?.remoteAddress
        || 'unknown';
      newGuest.ip = ip;

      // Default paid status to 0 (not paid)
      if (newGuest.paid === undefined) {
        newGuest.paid = 0;
      }

      // Add new guest
      guests.push(newGuest);

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
              content: JSON.stringify(guests, null, 2)
            }
          }
        })
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update gist');
      }

      return res.status(200).json({
        success: true,
        guests,
        message: 'Inscription réussie ! رمضان كريم'
      });

    } catch (error) {
      console.error('Error registering guest:', error);
      return res.status(500).json({
        error: 'Erreur lors de l\'inscription',
        details: error.message
      });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
