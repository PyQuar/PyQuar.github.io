// Word Wave Game Logic
// Game Constants
const WORD_LENGTH = 5;
const MAX_ATTEMPTS = 6;

// Word list - Press & Science themed words
const WORD_LIST = [
    'PRESS', 'STORY', 'MEDIA', 'WRITE', 'QUOTE',
    'ATOMS', 'CELLS', 'GENES', 'VIRUS', 'BRAIN',
    'LASER', 'ORBIT', 'PROBE', 'SOLAR', 'LIGHT',
    'PAPER', 'PRINT', 'COVER', 'ISSUE', 'PHOTO',
    'FACTS', 'TRUTH', 'PROOF', 'STUDY', 'TESTS',
    'FIELD', 'TOPIC', 'THEME', 'DRAFT', 'RADIO',
    'WAVES', 'FORCE', 'POWER', 'SPEED', 'SPACE'
];

// Game State
let gameState = {
    currentRow: 0,
    currentTile: 0,
    currentGuess: '',
    targetWord: '',
    gameOver: false,
    isWin: false,
    guesses: [],
    stats: {
        gamesPlayed: 0,
        gamesWon: 0,
        currentStreak: 0,
        maxStreak: 0,
        guessDistribution: [0, 0, 0, 0, 0, 0]
    }
};

// DOM Elements
const gameBoard = document.getElementById('gameBoard');
const keyboard = document.getElementById('keyboard');
const messageContainer = document.getElementById('messageContainer');
const helpModal = document.getElementById('helpModal');
const statsModal = document.getElementById('statsModal');
const settingsModal = document.getElementById('settingsModal');
const resultModal = document.getElementById('resultModal');

// Initialize game
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize authentication first
    if (window.authManager) {
        await window.authManager.init();
        await loadStatsWithSync();
    } else {
        loadStats();
    }
    
    initializeGame();
    setupEventListeners();
    createBoard();
});

// Initialize game
function initializeGame() {
    // Get or generate daily word
    gameState.targetWord = getDailyWord();
    console.log('Target word:', gameState.targetWord); // For testing
}

// Get daily word (same word for everyone each day)
function getDailyWord() {
    const today = new Date();
    const start = new Date(today.getFullYear(), 0, 0);
    const diff = today - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    const index = dayOfYear % WORD_LIST.length;
    return WORD_LIST[index];
}

// Create game board
function createBoard() {
    gameBoard.innerHTML = '';
    for (let i = 0; i < MAX_ATTEMPTS; i++) {
        const row = document.createElement('div');
        row.className = 'board-row';
        row.setAttribute('data-row', i);
        
        for (let j = 0; j < WORD_LENGTH; j++) {
            const tile = document.createElement('div');
            tile.className = 'tile';
            tile.setAttribute('data-row', i);
            tile.setAttribute('data-tile', j);
            row.appendChild(tile);
        }
        
        gameBoard.appendChild(row);
    }
}

// Setup event listeners
function setupEventListeners() {
    // Keyboard clicks
    document.querySelectorAll('.key').forEach(key => {
        key.addEventListener('click', handleKeyPress);
    });
    
    // Physical keyboard
    document.addEventListener('keydown', handlePhysicalKeyPress);
    
    // Modal controls
    document.getElementById('helpBtn').addEventListener('click', () => openModal('helpModal'));
    document.getElementById('statsBtn').addEventListener('click', () => {
        openModal('statsModal');
        displayStats();
    });
    document.getElementById('settingsBtn').addEventListener('click', () => openModal('settingsModal'));
    
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const modalId = e.target.closest('.modal-close').getAttribute('data-modal');
            closeModal(modalId);
        });
    });
    
    // Click outside modal to close
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    // Share buttons
    document.getElementById('shareBtn').addEventListener('click', shareResults);
    document.getElementById('shareResultBtn').addEventListener('click', shareResults);
    document.getElementById('viewStatsBtn').addEventListener('click', () => {
        closeModal('resultModal');
        openModal('statsModal');
        displayStats();
    });
    
    // Settings
    document.getElementById('resetBtn').addEventListener('click', resetStats);
    
    // Auth event listeners
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            if (window.authManager) {
                window.authManager.login();
            }
        });
    }
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (window.authManager) {
                window.authManager.logout();
            }
        });
    }
    
    // Load settings
    loadSettings();
}

// Handle key press from on-screen keyboard
function handleKeyPress(e) {
    if (gameState.gameOver) return;
    
    const key = e.target.getAttribute('data-key') || e.target.closest('.key').getAttribute('data-key');
    processKey(key);
}

// Handle physical keyboard press
function handlePhysicalKeyPress(e) {
    if (gameState.gameOver) return;
    
    // Prevent default for game keys
    if (e.key === 'Enter' || e.key === 'Backspace' || /^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
    }
    
    if (e.key === 'Enter') {
        processKey('ENTER');
    } else if (e.key === 'Backspace') {
        processKey('BACKSPACE');
    } else if (/^[a-zA-Z]$/.test(e.key)) {
        processKey(e.key.toUpperCase());
    }
}

// Process key input
function processKey(key) {
    if (key === 'ENTER') {
        submitGuess();
    } else if (key === 'BACKSPACE') {
        deleteLetter();
    } else if (gameState.currentTile < WORD_LENGTH) {
        addLetter(key);
    }
}

// Add letter to current guess
function addLetter(letter) {
    if (gameState.currentTile < WORD_LENGTH) {
        const tile = getTile(gameState.currentRow, gameState.currentTile);
        tile.textContent = letter;
        tile.classList.add('filled');
        
        gameState.currentGuess += letter;
        gameState.currentTile++;
    }
}

// Delete letter from current guess
function deleteLetter() {
    if (gameState.currentTile > 0) {
        gameState.currentTile--;
        const tile = getTile(gameState.currentRow, gameState.currentTile);
        tile.textContent = '';
        tile.classList.remove('filled');
        
        gameState.currentGuess = gameState.currentGuess.slice(0, -1);
    }
}

// Submit guess
function submitGuess() {
    if (gameState.currentTile !== WORD_LENGTH) {
        showMessage('Not enough letters', true);
        shakeTiles(gameState.currentRow);
        return;
    }
    
    // Check if word is valid (in this simple version, we accept any 5-letter combination)
    // In a full version, you'd check against a dictionary
    
    gameState.guesses.push(gameState.currentGuess);
    checkGuess();
    
    if (gameState.currentGuess === gameState.targetWord) {
        gameWon();
    } else if (gameState.currentRow === MAX_ATTEMPTS - 1) {
        gameLost();
    } else {
        gameState.currentRow++;
        gameState.currentTile = 0;
        gameState.currentGuess = '';
    }
}

// Check guess and update tiles
function checkGuess() {
    const guess = gameState.currentGuess;
    const target = gameState.targetWord;
    const letterCount = {};
    
    // Count letters in target word
    for (let letter of target) {
        letterCount[letter] = (letterCount[letter] || 0) + 1;
    }
    
    // First pass: mark correct letters
    for (let i = 0; i < WORD_LENGTH; i++) {
        const tile = getTile(gameState.currentRow, i);
        const letter = guess[i];
        
        if (letter === target[i]) {
            setTimeout(() => {
                tile.classList.add('correct');
                updateKeyboard(letter, 'correct');
            }, i * 300);
            letterCount[letter]--;
        }
    }
    
    // Second pass: mark present letters
    for (let i = 0; i < WORD_LENGTH; i++) {
        const tile = getTile(gameState.currentRow, i);
        const letter = guess[i];
        
        if (letter !== target[i]) {
            if (target.includes(letter) && letterCount[letter] > 0) {
                setTimeout(() => {
                    tile.classList.add('present');
                    updateKeyboard(letter, 'present');
                }, i * 300);
                letterCount[letter]--;
            } else {
                setTimeout(() => {
                    tile.classList.add('absent');
                    updateKeyboard(letter, 'absent');
                }, i * 300);
            }
        }
    }
}

// Update keyboard key colors
function updateKeyboard(letter, state) {
    const key = document.querySelector(`.key[data-key="${letter}"]`);
    if (!key) return;
    
    // Only update if the new state is "better" than current
    if (state === 'correct') {
        key.classList.remove('present', 'absent');
        key.classList.add('correct');
    } else if (state === 'present' && !key.classList.contains('correct')) {
        key.classList.remove('absent');
        key.classList.add('present');
    } else if (state === 'absent' && !key.classList.contains('correct') && !key.classList.contains('present')) {
        key.classList.add('absent');
    }
}

// Game won
function gameWon() {
    gameState.gameOver = true;
    gameState.isWin = true;
    
    // Animate winning tiles
    setTimeout(() => {
        for (let i = 0; i < WORD_LENGTH; i++) {
            const tile = getTile(gameState.currentRow, i);
            setTimeout(() => {
                tile.classList.add('win');
            }, i * 100);
        }
    }, 1500);
    
    // Update stats
    updateStats(true);
    
    // Show result modal
    setTimeout(() => {
        showResultModal(true);
    }, 2000);
}

// Game lost
function gameLost() {
    gameState.gameOver = true;
    gameState.isWin = false;
    
    // Update stats
    updateStats(false);
    
    // Show result modal
    setTimeout(() => {
        showResultModal(false);
    }, 1500);
}

// Update statistics
function updateStats(won) {
    gameState.stats.gamesPlayed++;
    
    if (won) {
        gameState.stats.gamesWon++;
        gameState.stats.currentStreak++;
        gameState.stats.maxStreak = Math.max(gameState.stats.maxStreak, gameState.stats.currentStreak);
        gameState.stats.guessDistribution[gameState.currentRow]++;
    } else {
        gameState.stats.currentStreak = 0;
    }
    
    saveStats();
    
    // Also save to GitHub if authenticated
    if (window.authManager && window.authManager.isAuthenticated) {
        window.authManager.updateSyncStatus('syncing');
        window.authManager.saveStats(gameState.stats);
    }
}

// Show message
function showMessage(text, isError = false) {
    const message = document.createElement('div');
    message.className = `message ${isError ? 'error' : ''}`;
    message.textContent = text;
    
    messageContainer.appendChild(message);
    
    setTimeout(() => {
        message.remove();
    }, 2000);
}

// Shake tiles animation
function shakeTiles(row) {
    for (let i = 0; i < WORD_LENGTH; i++) {
        const tile = getTile(row, i);
        tile.classList.add('shake');
        setTimeout(() => {
            tile.classList.remove('shake');
        }, 500);
    }
}

// Get tile element
function getTile(row, tile) {
    return document.querySelector(`[data-row="${row}"][data-tile="${tile}"]`);
}

// Modal functions
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
}

// Show result modal
function showResultModal(won) {
    const modal = document.getElementById('resultModal');
    const title = document.getElementById('resultTitle');
    const message = document.getElementById('resultMessage');
    const word = document.getElementById('correctWord');
    const attempts = document.getElementById('resultAttempts');
    const streak = document.getElementById('resultStreak');
    const shareBtn = document.getElementById('shareResultBtn');
    
    if (won) {
        title.innerHTML = '<i class="fas fa-trophy"></i> Congratulations!';
        const messages = [
            'Genius!',
            'Magnificent!',
            'Impressive!',
            'Splendid!',
            'Great!',
            'Phew!'
        ];
        message.textContent = messages[gameState.currentRow];
    } else {
        title.innerHTML = '<i class="fas fa-times-circle"></i> Game Over';
        message.textContent = 'Better luck next time!';
    }
    
    word.textContent = gameState.targetWord;
    attempts.textContent = won ? gameState.currentRow + 1 : 'X';
    streak.textContent = gameState.stats.currentStreak;
    
    shareBtn.style.display = 'block';
    
    // Start countdown
    startCountdown('resultCountdown');
    
    openModal('resultModal');
}

// Display statistics
function displayStats() {
    document.getElementById('gamesPlayed').textContent = gameState.stats.gamesPlayed;
    document.getElementById('winPercentage').textContent = 
        gameState.stats.gamesPlayed > 0 
            ? Math.round((gameState.stats.gamesWon / gameState.stats.gamesPlayed) * 100) 
            : 0;
    document.getElementById('currentStreak').textContent = gameState.stats.currentStreak;
    document.getElementById('maxStreak').textContent = gameState.stats.maxStreak;
    
    // Display distribution
    const distribution = document.getElementById('distribution');
    distribution.innerHTML = '';
    
    const maxGuesses = Math.max(...gameState.stats.guessDistribution, 1);
    
    gameState.stats.guessDistribution.forEach((count, index) => {
        const row = document.createElement('div');
        row.className = 'distribution-row';
        
        const percentage = (count / maxGuesses) * 100;
        const isCurrentGame = gameState.gameOver && gameState.isWin && index === gameState.currentRow;
        
        row.innerHTML = `
            <span class="distribution-label">${index + 1}</span>
            <div class="distribution-bar-container">
                <div class="distribution-bar ${isCurrentGame ? 'highlight' : ''}" style="width: ${Math.max(percentage, 7)}%">
                    ${count}
                </div>
            </div>
        `;
        
        distribution.appendChild(row);
    });
    
    // Show next word timer if game is over
    if (gameState.gameOver) {
        document.getElementById('nextWordTimer').style.display = 'block';
        document.getElementById('shareBtn').style.display = 'block';
        startCountdown('countdown');
    }
}

// Start countdown to next word
function startCountdown(elementId) {
    const countdownElement = document.getElementById(elementId);
    
    function updateCountdown() {
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(0, 0, 0, 0);
        
        const diff = tomorrow - now;
        
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        countdownElement.textContent = 
            `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    
    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// Share results
function shareResults() {
    const attempts = gameState.isWin ? gameState.currentRow + 1 : 'X';
    let text = `Word Wave ${attempts}/${MAX_ATTEMPTS}\n\n`;
    
    gameState.guesses.forEach(guess => {
        for (let i = 0; i < WORD_LENGTH; i++) {
            if (guess[i] === gameState.targetWord[i]) {
                text += '🟩';
            } else if (gameState.targetWord.includes(guess[i])) {
                text += '🟨';
            } else {
                text += '⬛';
            }
        }
        text += '\n';
    });
    
    text += '\nPlay at: [Your Website URL]';
    
    // Copy to clipboard
    navigator.clipboard.writeText(text).then(() => {
        showMessage('Copied to clipboard!');
    }).catch(() => {
        // Fallback for browsers that don't support clipboard API
        alert(text);
    });
}

// Save/Load stats
function saveStats() {
    localStorage.setItem('wordWaveStats', JSON.stringify(gameState.stats));
}

function loadStats() {
    const saved = localStorage.getItem('wordWaveStats');
    if (saved) {
        gameState.stats = JSON.parse(saved);
    }
}

// Load stats with cloud sync
async function loadStatsWithSync() {
    if (!window.authManager || !window.authManager.isAuthenticated) {
        loadStats();
        return;
    }
    
    try {
        // Load local stats
        const localStats = localStorage.getItem('wordWaveStats');
        const parsedLocalStats = localStats ? JSON.parse(localStats) : null;
        
        // Load cloud stats
        window.authManager.updateSyncStatus('syncing');
        const cloudStats = await window.authManager.loadStats();
        
        // Merge stats (take the better one)
        if (cloudStats && parsedLocalStats) {
            gameState.stats = window.authManager.mergeStats(parsedLocalStats, cloudStats);
            showMessage('Stats synced from cloud!');
        } else if (cloudStats) {
            gameState.stats = cloudStats;
            showMessage('Stats loaded from cloud!');
        } else if (parsedLocalStats) {
            gameState.stats = parsedLocalStats;
            // Upload local stats to cloud
            await window.authManager.saveStats(gameState.stats);
        }
        
        // Save merged stats locally
        saveStats();
        
    } catch (error) {
        console.error('Error syncing stats:', error);
        loadStats(); // Fallback to local stats
        window.authManager.updateSyncStatus('error');
    }
}

function resetStats() {
    if (confirm('Are you sure you want to reset your statistics? This cannot be undone.')) {
        gameState.stats = {
            gamesPlayed: 0,
            gamesWon: 0,
            currentStreak: 0,
            maxStreak: 0,
            guessDistribution: [0, 0, 0, 0, 0, 0]
        };
        saveStats();
        displayStats();
        showMessage('Statistics reset!');
    }
}

// Save/Load settings
function loadSettings() {
    // Load settings from localStorage
    const darkMode = localStorage.getItem('darkMode') === 'true';
    const colorBlind = localStorage.getItem('colorBlind') === 'true';
    const hardMode = localStorage.getItem('hardMode') === 'true';
    
    document.getElementById('darkModeToggle').checked = darkMode;
    document.getElementById('colorBlindToggle').checked = colorBlind;
    document.getElementById('hardModeToggle').checked = hardMode;
    
    // Apply settings
    if (darkMode) document.body.classList.add('dark-mode');
    if (colorBlind) document.body.classList.add('color-blind-mode');
}

// Settings event listeners
document.getElementById('darkModeToggle').addEventListener('change', (e) => {
    localStorage.setItem('darkMode', e.target.checked);
    document.body.classList.toggle('dark-mode', e.target.checked);
});

document.getElementById('colorBlindToggle').addEventListener('change', (e) => {
    localStorage.setItem('colorBlind', e.target.checked);
    document.body.classList.toggle('color-blind-mode', e.target.checked);
});

document.getElementById('hardModeToggle').addEventListener('change', (e) => {
    localStorage.setItem('hardMode', e.target.checked);
    if (e.target.checked && gameState.currentRow > 0) {
        showMessage('Hard mode can only be enabled at the start');
        e.target.checked = false;
        localStorage.setItem('hardMode', false);
    }
});

console.log('%c🌊 Word Wave Game Loaded!', 'font-size: 20px; font-weight: bold; color: #2dd4bf;');
console.log('%cToday\'s word:', gameState.targetWord);
