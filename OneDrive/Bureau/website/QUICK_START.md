# 🚀 Quick Start: GitHub Authentication Setup

Follow these steps to enable GitHub authentication for Word Wave.

## ⏱️ Total Time: ~15 minutes

---

## Step 1: Create GitHub OAuth App (5 min)

1. Go to https://github.com/settings/developers
2. Click **"OAuth Apps"** → **"New OAuth App"**
3. Fill in:
   - **Application name:** `Word Wave Game`
   - **Homepage URL:** `https://pyquar.github.io`
   - **Authorization callback URL:** `https://pyquar.github.io/game.html`
4. Click **"Register application"**
5. **Copy your Client ID** ✏️
6. Click **"Generate a new client secret"**
7. **Copy your Client Secret** ✏️ (save it somewhere safe!)

---

## Step 2: Deploy OAuth Proxy to Vercel (5 min)

```bash
# Navigate to proxy folder
cd vercel-proxy

# Install Vercel CLI (if not already installed)
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel
```

Follow the prompts:
- **Set up and deploy?** Y
- **Which scope?** (select your account)
- **Link to existing project?** N
- **Project name?** word-wave-auth-proxy
- **Directory?** ./ (press Enter)
- **Override settings?** N

After deployment completes:
1. Go to https://vercel.com/dashboard
2. Select your `word-wave-auth-proxy` project
3. Go to **Settings** → **Environment Variables**
4. Click **Add New**
   - **Name:** `GITHUB_CLIENT_SECRET`
   - **Value:** (paste your Client Secret from Step 1)
   - **Environment:** Production
5. Click **Save**
6. Go back to terminal and run:
   ```bash
   vercel --prod
   ```

**Copy your production URL** ✏️ (e.g., `https://word-wave-auth-proxy.vercel.app`)

---

## Step 3: Update Configuration (2 min)

Open `auth.js` and update:

```javascript
const AUTH_CONFIG = {
    CLIENT_ID: 'paste_your_client_id_here',
    REDIRECT_URI: window.location.origin + '/game.html',
    SCOPE: 'gist',
    GIST_FILENAME: 'word-wave-stats.json',
    PROXY_URL: 'https://your-proxy-url.vercel.app/api/token'
};
```

Replace:
- `paste_your_client_id_here` with your GitHub Client ID
- `your-proxy-url.vercel.app` with your Vercel proxy URL

---

## Step 4: Deploy to GitHub Pages (3 min)

```bash
# Add all files
git add .

# Commit changes
git commit -m "Add GitHub authentication system"

# Push to GitHub
git push origin master
```

Wait 1-2 minutes for GitHub Pages to deploy.

---

## Step 5: Test! 🎉

1. Go to https://pyquar.github.io/game.html
2. Click **"Login with GitHub"**
3. Authorize the application
4. You should see your GitHub avatar and username
5. Play a game
6. Check sync status shows "Synced" ✅

### Test Cross-Device Sync:

1. Open game on another device/browser
2. Login with same GitHub account
3. Stats should sync automatically!

---

## ✅ Success Checklist

- [ ] GitHub OAuth App created
- [ ] Client ID and Secret copied
- [ ] Vercel proxy deployed
- [ ] Environment variable set on Vercel
- [ ] `auth.js` updated with correct values
- [ ] Changes pushed to GitHub
- [ ] Login button appears on game page
- [ ] Can login successfully
- [ ] Profile shows after login
- [ ] Stats sync to GitHub Gists
- [ ] Sync status shows "Synced"
- [ ] Stats load on other devices

---

## 🐛 Troubleshooting

### "Login failed. Please try again."
- Check CLIENT_ID matches your GitHub OAuth App
- Check PROXY_URL is accessible
- Try clearing cache and cookies

### "Authorization callback URL mismatch"
- In GitHub OAuth App settings, ensure callback URL is exactly:
  `https://pyquar.github.io/game.html`

### Proxy returns 500 error
- Check `GITHUB_CLIENT_SECRET` is set in Vercel
- Redeploy after adding environment variable: `vercel --prod`
- Check Vercel function logs for errors

### "Sync Error" message
- Check browser console (F12) for errors
- Try logging out and back in
- Check GitHub token in localStorage

---

## 📁 What Was Added?

New files:
- ✅ `auth.js` - Authentication system
- ✅ `AUTH_README.md` - Documentation
- ✅ `GITHUB_AUTH_SETUP.md` - Detailed setup guide
- ✅ `QUICK_START.md` - This file
- ✅ `vercel-proxy/` - OAuth proxy server

Modified files:
- ✅ `game.html` - Added login UI
- ✅ `game.css` - Added auth styles
- ✅ `game.js` - Added sync functionality

---

## 🎯 What Users Can Do Now

✅ **Login with GitHub** - One-click authentication  
✅ **Sync Stats** - Never lose progress  
✅ **Cross-Device** - Play on any device  
✅ **Secure** - Stats stored in private Gists  
✅ **Offline Mode** - Works without login too  

---

## 📞 Need Help?

1. Check `GITHUB_AUTH_SETUP.md` for detailed instructions
2. Check `AUTH_README.md` for overview
3. Check browser console for error messages
4. Check Vercel function logs
5. GitHub OAuth Docs: https://docs.github.com/en/developers/apps

---

**Ready to go! 🚀**

Your Word Wave game now has professional-grade authentication and cloud sync!
