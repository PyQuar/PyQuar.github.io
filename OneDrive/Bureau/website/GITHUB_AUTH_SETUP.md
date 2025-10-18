# GitHub OAuth Setup Guide for Word Wave

This guide will help you set up GitHub authentication for Word Wave so users can sync their game statistics across devices.

## 🔧 Step 1: Create a GitHub OAuth App

1. **Go to GitHub Developer Settings:**
   - Visit: https://github.com/settings/developers
   - Click on "OAuth Apps"
   - Click "New OAuth App"

2. **Fill in the Application Details:**
   ```
   Application name: Word Wave Game
   Homepage URL: https://pyquar.github.io
   Application description: Word Wave - Daily word guessing game
   Authorization callback URL: https://pyquar.github.io/game.html
   ```

3. **Register the Application**
   - Click "Register application"
   - You'll see your **Client ID** - Copy this!
   - Click "Generate a new client secret"
   - Copy the **Client Secret** (you won't see it again!)

## 🔐 Step 2: Set up OAuth Proxy (Required!)

GitHub OAuth requires a server-side proxy because the Client Secret cannot be exposed in client-side code.

### Option A: Use Vercel (Recommended - Free & Easy)

1. **Create a new repository for the proxy:**
   ```bash
   mkdir word-wave-auth-proxy
   cd word-wave-auth-proxy
   npm init -y
   ```

2. **Install dependencies:**
   ```bash
   npm install node-fetch
   ```

3. **Create `api/token.js`:**
   ```javascript
   module.exports = async (req, res) => {
     // Enable CORS
     res.setHeader('Access-Control-Allow-Origin', '*');
     res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
     res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

     if (req.method === 'OPTIONS') {
       return res.status(200).end();
     }

     if (req.method !== 'POST') {
       return res.status(405).json({ error: 'Method not allowed' });
     }

     try {
       const { code, client_id, redirect_uri } = req.body;

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
       return res.status(200).json(data);
     } catch (error) {
       console.error('Error:', error);
       return res.status(500).json({ error: 'Internal server error' });
     }
   };
   ```

4. **Create `vercel.json`:**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "api/token.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/api/token",
         "dest": "/api/token.js"
       }
     ]
   }
   ```

5. **Deploy to Vercel:**
   ```bash
   npm install -g vercel
   vercel login
   vercel
   ```

6. **Add Environment Variable:**
   - Go to your Vercel dashboard
   - Select your project
   - Go to Settings > Environment Variables
   - Add: `GITHUB_CLIENT_SECRET` with your Client Secret value
   - Redeploy: `vercel --prod`

7. **Get your proxy URL:**
   - Example: `https://your-project.vercel.app/api/token`

### Option B: Use GitHub Pages with Worker (Advanced)

Use Cloudflare Workers or similar edge function service.

## 📝 Step 3: Update Your Code

1. **Open `auth.js`**

2. **Update the AUTH_CONFIG:**
   ```javascript
   const AUTH_CONFIG = {
       CLIENT_ID: 'your_github_client_id_here', // From Step 1
       REDIRECT_URI: 'https://pyquar.github.io/game.html',
       SCOPE: 'gist',
       GIST_FILENAME: 'word-wave-stats.json',
       PROXY_URL: 'https://your-vercel-app.vercel.app/api/token' // From Step 2
   };
   ```

3. **Update the fetch call in `handleCallback` method:**
   ```javascript
   const response = await fetch(AUTH_CONFIG.PROXY_URL, {
       method: 'POST',
       headers: {
           'Content-Type': 'application/json',
       },
       body: JSON.stringify({
           code: code,
           client_id: AUTH_CONFIG.CLIENT_ID,
           redirect_uri: AUTH_CONFIG.REDIRECT_URI
       })
   });
   ```

## ✅ Step 4: Test the Integration

1. **Push your changes to GitHub:**
   ```bash
   git add .
   git commit -m "Add GitHub OAuth authentication"
   git push origin master
   ```

2. **Wait for GitHub Pages to deploy** (usually 1-2 minutes)

3. **Test the login flow:**
   - Go to https://pyquar.github.io/game.html
   - Click "Login with GitHub"
   - Authorize the application
   - You should be redirected back and see your profile
   - Play a game and check if stats sync

4. **Test cross-device sync:**
   - Login on another device/browser
   - Stats should load from GitHub Gists

## 🔍 Troubleshooting

### Issue: "Login failed. Please try again."
- **Check:** Is your Client ID correct in `auth.js`?
- **Check:** Is your proxy URL accessible?
- **Check:** Is the callback URL in GitHub OAuth App settings correct?

### Issue: "Failed to save to Gist"
- **Check:** Did you authorize the `gist` scope?
- **Check:** Is your GitHub token valid? (Try logging out and back in)
- **Check:** Check browser console for error messages

### Issue: Proxy returns 500 error
- **Check:** Is `GITHUB_CLIENT_SECRET` environment variable set in Vercel?
- **Check:** Did you redeploy after adding the environment variable?
- **Check:** Check Vercel function logs for errors

### Testing Locally
You can't test OAuth locally without HTTPS. Options:
1. Use ngrok: `ngrok http 3000`
2. Deploy to GitHub Pages for testing
3. Use Vercel's dev server: `vercel dev`

## 🎉 You're Done!

Users can now:
- ✅ Login with GitHub
- ✅ Sync stats across devices
- ✅ Never lose their progress
- ✅ Stats stored privately in their GitHub Gists

## 📊 How It Works

1. User clicks "Login with GitHub"
2. Redirected to GitHub OAuth authorization page
3. User authorizes the app
4. GitHub redirects back with a code
5. Your proxy exchanges code for access token
6. Token stored in browser localStorage
7. Stats saved to private GitHub Gist
8. Stats loaded from Gist on other devices

## 🔒 Security Notes

- ✅ Client Secret never exposed to client
- ✅ Stats stored in private Gists (only user can see)
- ✅ Token stored in localStorage (cleared on logout)
- ✅ Minimal scope (only `gist` permission)

## 💡 Optional Enhancements

### Add Leaderboard (Future)
- Create a public Gist or database
- Store anonymous rankings
- Display top scores

### Add More OAuth Providers
- Google OAuth
- Twitter OAuth
- Email/Password authentication

### Backup Stats
- Export stats as JSON
- Import stats from file
- Email stats backup

---

**Need Help?**
- GitHub OAuth Docs: https://docs.github.com/en/developers/apps/building-oauth-apps
- Vercel Docs: https://vercel.com/docs
- GitHub Gists API: https://docs.github.com/en/rest/gists
