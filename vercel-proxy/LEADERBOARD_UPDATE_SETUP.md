# Leaderboard Update Endpoint Setup

## Overview
The `update-leaderboard.js` endpoint allows authenticated users to update the central leaderboard Gist through a secure proxy using PyQuar's admin token.

## Why This Is Needed
- The leaderboard is stored in a Gist owned by PyQuar
- Only the Gist owner can update it directly
- Other users need to go through this proxy which uses PyQuar's token

## Deployment Steps

### 1. Get Your Personal Access Token
1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Name it "Word Wave Leaderboard Update"
4. Select scopes: **gist** (full control)
5. Click "Generate token"
6. **IMPORTANT:** Copy the token immediately (you won't see it again!)

### 2. Add Token to Vercel
1. Go to your Vercel project: https://vercel.com/dashboard
2. Go to Settings → Environment Variables
3. Add a new variable:
   - Name: `PYQUAR_GITHUB_TOKEN`
   - Value: [paste your personal token here]
   - Environment: Production, Preview, Development (all)
4. Click "Save"

### 3. Deploy the New Endpoint
The endpoint is already in your repo at:
```
vercel-proxy/api/update-leaderboard.js
```

To deploy:
```bash
cd vercel-proxy
vercel --prod
```

Or just push to GitHub and Vercel will auto-deploy if you have GitHub integration enabled.

### 4. Verify It Works
Test the endpoint:
```bash
curl -X POST https://word-wave-auth-proxy.vercel.app/api/update-leaderboard \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -d '{"playerData": {...}, "gistId": "2acc97044fc86cb79c96b02a5bd1b5fb"}'
```

## Security Notes
- ✅ User must be authenticated (their token is verified)
- ✅ Only the authenticated user's data can be updated
- ✅ Gist ID is validated against expected value
- ✅ Admin token (PYQUAR_GITHUB_TOKEN) is only on server, never exposed to clients
- ✅ CORS is enabled for your domain

## Troubleshooting

### Error: "Admin token not configured"
- Make sure you added `PYQUAR_GITHUB_TOKEN` to Vercel environment variables
- Redeploy after adding the variable

### Error: "Invalid user token"
- User needs to login again
- Check that user token hasn't expired

### Error: "Failed to update leaderboard"
- Check that the personal token has `gist` scope
- Make sure the token belongs to PyQuar (the Gist owner)
- Verify the Gist ID is correct: `2acc97044fc86cb79c96b02a5bd1b5fb`

## Environment Variables Needed

On Vercel, you need **two** environment variables:

1. `GITHUB_CLIENT_SECRET` - OAuth app secret (already configured)
2. `PYQUAR_GITHUB_TOKEN` - Personal access token with `gist` scope (NEW!)

## Endpoint URL
After deployment, the endpoint will be available at:
```
https://word-wave-auth-proxy.vercel.app/api/update-leaderboard
```

This URL is already configured in `js/auth.js` as `AUTH_CONFIG.LEADERBOARD_UPDATE_URL`.
