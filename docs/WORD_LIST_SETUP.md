# Word List Setup Guide

The Word Wave game loads its word list from a GitHub Gist, allowing you to update the words for all players without updating the code.

## Initial Setup (One-time)

### Step 1: Create the Word List Gist

1. Open the Word Wave game: https://wavyessai.me/game.html
2. Log in with your GitHub account
3. Open the browser console (F12)
4. Run this command to create the Gist:

```javascript
createWordListGist()
```

5. Copy the Gist ID that appears in the console

### Step 2: Configure the Game

1. Open `game.js` in your editor
2. Find the `WORD_LIST_CONFIG` section at the top (around line 8)
3. Replace the empty `GIST_ID` with your Gist ID:

```javascript
const WORD_LIST_CONFIG = {
    GIST_USERNAME: 'PyQuar',
    GIST_ID: 'your-gist-id-here', // ← Paste your Gist ID here
    CACHE_KEY: 'wordWaveWordListCache',
    CACHE_DURATION: 1000 * 60 * 60 // 1 hour
};
```

4. Save, commit, and push to GitHub:

```bash
git add game.js
git commit -m "Configure word list Gist ID"
git push origin HEAD:main --force
```

## Updating the Word List

Once configured, you can update the word list at any time:

### Method 1: From Browser Console (Recommended)

1. Open Word Wave and log in with GitHub
2. Open browser console (F12)
3. Run this command with your new words:

```javascript
updateWordListGist([
    'PRESS', 'STORY', 'MEDIA', 'WRITE', 'QUOTE',
    'ATOMS', 'CELLS', 'GENES', 'VIRUS', 'BRAIN',
    'LASER', 'ORBIT', 'PROBE', 'SOLAR', 'LIGHT',
    'PAPER', 'PRINT', 'COVER', 'ISSUE', 'PHOTO',
    'FACTS', 'TRUTH', 'PROOF', 'STUDY', 'TESTS',
    'FIELD', 'TOPIC', 'THEME', 'DRAFT', 'RADIO',
    'WAVES', 'FORCE', 'POWER', 'SPEED', 'SPACE',
    // Add more 5-letter words here
])
```

4. The page will automatically reload with the new words

### Method 2: Edit Gist Directly

1. Go to your GitHub Gists: https://gist.github.com/
2. Find the "Word Wave - Word List" gist
3. Click "Edit"
4. Update the `words` array in the JSON
5. Click "Update public gist"

## How It Works

- **Loading**: The game fetches the word list from the Gist when it starts
- **Caching**: Words are cached for 1 hour to reduce API calls
- **Fallback**: If the Gist fails to load, it uses the default word list in `game.js`
- **Sync**: All players will get the updated words within 1 hour
- **Format**: The Gist contains a JSON file with this structure:

```json
{
  "words": [
    "PRESS",
    "STORY",
    "MEDIA",
    ...
  ],
  "lastUpdated": "2025-10-18T12:00:00.000Z",
  "version": "1.0"
}
```

## Word Requirements

- Must be exactly 5 letters
- Should be valid English words
- Will be automatically converted to UPPERCASE
- Should be guessable but challenging
- Recommend 35+ words for variety (one month of unique words)

## Tips

- **Add seasonal words**: Update the list for holidays or events
- **Theme weeks**: Create themed word lists for special occasions
- **Difficulty levels**: Mix common and uncommon words
- **Test first**: Use the developer tools to test new words before updating

## Troubleshooting

**Words not updating?**
- Clear the cache: `localStorage.removeItem('wordWaveWordListCache')`
- Check the console for error messages
- Verify the Gist ID is correct in `game.js`
- Make sure you're logged in when updating

**"No Gist ID configured" error?**
- You need to complete Step 2 of Initial Setup
- Check that `WORD_LIST_CONFIG.GIST_ID` is not empty

**Permission denied?**
- Make sure you're logged in with GitHub
- The Gist must be owned by your account
- Check that your token has gist permissions

## Current Word List

The default word list contains 35 press and science-themed words. You can view the current list at:
- In game: Open console and type `WORD_LIST`
- In Gist: https://gist.github.com/PyQuar/[your-gist-id]

