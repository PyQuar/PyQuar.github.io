# Wavy Essai Press Club - Project Structure

This document describes the organization of the project files.

## 📁 Folder Structure

```
website/
├── 📄 index.html           # Home page
├── 📄 game.html            # Word Wave game page
├── 📄 papers.html          # Scientific papers page
├── 📄 README.md            # Project readme
├── 📄 CNAME                # Custom domain configuration
├── 📄 .gitignore           # Git ignore rules
│
├── 📂 css/                 # All stylesheets
│   ├── main.css            # Main/shared styles for all pages
│   ├── game.css            # Word Wave game styles
│   ├── papers.css          # Papers page styles
│   └── styles.css          # Additional styles
│
├── 📂 js/                  # All JavaScript files
│   ├── main.js             # Main/shared JavaScript for navigation
│   ├── game.js             # Word Wave game logic
│   ├── auth.js             # GitHub OAuth authentication
│   ├── papers.js           # Papers page functionality
│   └── script.js           # Additional scripts
│
├── 📂 assets/              # Images and media files
│   └── clublogo.png        # Wavy Essai club logo
│
├── 📂 docs/                # Documentation files
│   ├── AUTH_README.md      # Authentication documentation
│   ├── DEBUG_LOGIN.md      # Login debugging guide
│   ├── FIX_AUTH_NOW.md     # Authentication fixes
│   ├── GITHUB_AUTH_SETUP.md    # GitHub OAuth setup guide
│   ├── IMPLEMENTATION_SUMMARY.md   # Implementation details
│   ├── QUICK_START.md      # Quick start guide
│   └── WORD_LIST_SETUP.md  # Word list configuration guide
│
└── 📂 vercel-proxy/        # Vercel serverless proxy for OAuth
    └── api/
        └── token.js        # Token exchange endpoint
```

## 🔗 File Paths

All HTML files use relative paths to reference assets:

### CSS References
```html
<link rel="stylesheet" href="css/main.css">
<link rel="stylesheet" href="css/game.css">
```

### JavaScript References
```html
<script src="js/main.js"></script>
<script src="js/auth.js"></script>
<script src="js/game.js"></script>
```

### Image References
```html
<img src="assets/clublogo.png" alt="Wavy Essai Logo">
<link rel="icon" type="image/png" href="assets/clublogo.png">
```

## 📦 Page Dependencies

### index.html (Home Page)
- **CSS:** `css/main.css`
- **JS:** `js/main.js`
- **Assets:** `assets/clublogo.png`

### game.html (Word Wave Game)
- **CSS:** `css/main.css`, `css/game.css`
- **JS:** `js/main.js`, `js/auth.js`, `js/game.js`
- **Assets:** `assets/clublogo.png`
- **External:** Font Awesome icons

### papers.html (Scientific Papers)
- **CSS:** `css/main.css`, `css/papers.css`
- **JS:** `js/main.js`, `js/papers.js`
- **Assets:** `assets/clublogo.png`

## 🎯 Benefits of This Structure

1. **Organization:** Related files grouped together
2. **Maintainability:** Easy to find and update files
3. **Scalability:** Simple to add new CSS/JS files
4. **Clean Root:** Main HTML files easy to locate
5. **Professional:** Standard web project structure
6. **Performance:** Better caching with organized folders

## 🔄 Version Control

All files are tracked with Git, with proper rename history preserved using `git mv` commands.

## 📝 Notes

- All paths are relative to the root directory
- The structure follows standard web development practices
- Documentation is separated from code files
- Assets are centralized for easy management

