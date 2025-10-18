# Word Wave Auth Proxy

This is a serverless OAuth proxy for Word Wave game to securely exchange GitHub OAuth codes for access tokens.

## Why This Proxy?

GitHub OAuth requires a Client Secret to exchange authorization codes for access tokens. Since the Client Secret cannot be exposed in client-side JavaScript, we need a secure server-side proxy.

## Deploy to Vercel

### Quick Deploy (Recommended)

1. **Install Vercel CLI:**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel
   ```

4. **Add Environment Variable:**
   - Go to Vercel Dashboard
   - Select your project
   - Go to Settings → Environment Variables
   - Add variable:
     - **Name:** `GITHUB_CLIENT_SECRET`
     - **Value:** Your GitHub OAuth App Client Secret
     - **Environment:** Production

5. **Redeploy:**
   ```bash
   vercel --prod
   ```

6. **Copy Your URL:**
   Your proxy will be available at: `https://your-project.vercel.app/api/token`

## Deploy to Other Platforms

### Netlify Functions

Create `netlify/functions/token.js`:
```javascript
exports.handler = async (event) => {
  // Same code as api/token.js but adapted for Netlify
};
```

### Cloudflare Workers

Use Wrangler CLI to deploy:
```bash
wrangler publish
```

### AWS Lambda

Package and deploy via AWS Console or Serverless Framework.

## Testing

Test your proxy with curl:
```bash
curl -X POST https://your-project.vercel.app/api/token \
  -H "Content-Type: application/json" \
  -d '{
    "code": "test_code",
    "client_id": "your_client_id",
    "redirect_uri": "https://pyquar.github.io/game.html"
  }'
```

## Security

- ✅ CORS enabled for your domain only (set in production)
- ✅ Client Secret stored as environment variable
- ✅ No secrets exposed to client
- ✅ HTTPS only (enforced by Vercel)

## Update Configuration

After deploying, update `auth.js` in your main website:

```javascript
const AUTH_CONFIG = {
    CLIENT_ID: 'your_github_client_id',
    PROXY_URL: 'https://your-project.vercel.app/api/token', // <-- Your proxy URL
    // ... rest of config
};
```

## Troubleshooting

**500 Error:**
- Check if `GITHUB_CLIENT_SECRET` environment variable is set
- Check Vercel function logs

**CORS Error:**
- Update CORS headers in `api/token.js` if needed
- Ensure your domain is whitelisted

**401 Unauthorized:**
- Check GitHub Client Secret is correct
- Regenerate secret if compromised

## Support

For issues with:
- Vercel deployment: https://vercel.com/docs
- GitHub OAuth: https://docs.github.com/en/developers/apps/building-oauth-apps

## License

MIT
