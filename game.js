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
    lastPlayedDate: null,
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
    console.log('Game initializing...');
    
    // Initialize authentication first
    let cloudGameState = null;
    if (window.authManager) {
        await window.authManager.init();
        cloudGameState = await loadStatsWithSync();
    } else {
        loadStats();
    }
    
    console.log('Stats after loading:', gameState.stats);
    console.log('Last played date:', gameState.lastPlayedDate);
    console.log('Cloud game state:', cloudGameState);
    
    initializeGame();
    setupEventListeners();
    
    // Check if user already played today
    const today = getTodayString();
    let lastPlayed = gameState.lastPlayedDate;
    
    console.log('Today:', today, 'Last played:', lastPlayed);
    
    if (lastPlayed === today && cloudGameState) {
        // User already played today - restore from cloud
        console.log('Restoring game from cloud...');
        gameState.gameOver = cloudGameState.gameOver || true;
        gameState.isWin = cloudGameState.isWin;
        gameState.currentRow = cloudGameState.currentRow || 0;
        gameState.guesses = cloudGameState.guesses || [];
        gameState.targetWord = cloudGameState.targetWord || getDailyWord();
        
        // Recreate the board with saved state
        createBoard();
        restoreBoardFromState(cloudGameState);
        
        // Show message
        setTimeout(() => {
            showMessage('You already played today! Come back tomorrow.', false);
            // Show result modal with countdown
            if (gameState.isWin !== undefined) {
                setTimeout(() => {
                    showResultModal(gameState.isWin);
                }, 1000);
            }
        }, 500);
    } else if (lastPlayed === today) {
        // Fallback to local storage if no cloud state
        gameState.gameOver = true;
        gameState.lastPlayedDate = today;
        
        // Load the previous game state from localStorage
        loadGameState();
        
        // Show message
        setTimeout(() => {
            showMessage('You already played today! Come back tomorrow.', false);
            if (gameState.isWin !== undefined) {
                setTimeout(() => {
                    showResultModal(gameState.isWin);
                }, 1000);
            }
        }, 500);
    } else {
        // New game - create empty board
        createBoard();
    }
    
    // Display stats after loading them
    if (document.getElementById('gamesPlayed')) {
        console.log('Calling displayStats...');
        displayStats();
    }
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

// Get today's date as string (YYYY-MM-DD)
function getTodayString() {
    const today = new Date();
    return today.toISOString().split('T')[0];
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

// Restore board from saved cloud state
function restoreBoardFromState(cloudState) {
    if (!cloudState || !cloudState.guesses) return;
    
    console.log('Restoring board with guesses:', cloudState.guesses);
    
    cloudState.guesses.forEach((guess, rowIndex) => {
        for (let i = 0; i < WORD_LENGTH; i++) {
            const tile = getTile(rowIndex, i);
            tile.textContent = guess[i];
            tile.classList.add('filled');
            
            // Apply colors
            if (guess[i] === gameState.targetWord[i]) {
                tile.classList.add('correct');
                updateKeyboard(guess[i], 'correct');
            } else if (gameState.targetWord.includes(guess[i])) {
                tile.classList.add('present');
                updateKeyboard(guess[i], 'present');
            } else {
                tile.classList.add('absent');
                updateKeyboard(guess[i], 'absent');
            }
        }
    });
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
    
    // Update stats (this also saves game state)
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
    
    // Update stats (this also saves game state)
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
    
    // Mark today as played
    // Mark today as played
    const today = getTodayString();
    localStorage.setItem('wordWaveLastPlayed', today);
    gameState.lastPlayedDate = today;
    
    // Save game state for reload
    saveGameState();
    
    saveStats();
    
    // Also save to GitHub if authenticated (with lastPlayedDate and game state)
    if (window.authManager && window.authManager.isAuthenticated) {
        window.authManager.updateSyncStatus('syncing');
        
        // Prepare game state for cloud storage
        const cloudGameState = {
            currentRow: gameState.currentRow,
            guesses: gameState.guesses,
            gameOver: gameState.gameOver,
            isWin: gameState.isWin,
            targetWord: gameState.targetWord,
            date: today
        };
        
        window.authManager.saveStats(gameState.stats, today, cloudGameState);
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
    console.log('displayStats called, current stats:', gameState.stats);
    
    // Ensure stats object exists
    if (!gameState.stats) {
        gameState.stats = {
            gamesPlayed: 0,
            gamesWon: 0,
            currentStreak: 0,
            maxStreak: 0,
            guessDistribution: [0, 0, 0, 0, 0, 0]
        };
    }
    
    const gamesPlayed = gameState.stats.gamesPlayed || 0;
    const gamesWon = gameState.stats.gamesWon || 0;
    const currentStreak = gameState.stats.currentStreak || 0;
    const maxStreak = gameState.stats.maxStreak || 0;
    
    document.getElementById('gamesPlayed').textContent = gamesPlayed;
    document.getElementById('winPercentage').textContent = 
        gamesPlayed > 0 
            ? Math.round((gamesWon / gamesPlayed) * 100) 
            : 0;
    document.getElementById('currentStreak').textContent = currentStreak;
    document.getElementById('maxStreak').textContent = maxStreak;
    
    // Display distribution
    const distribution = document.getElementById('distribution');
    distribution.innerHTML = '';
    
    const guessDistribution = gameState.stats.guessDistribution || [0, 0, 0, 0, 0, 0];
    const maxGuesses = Math.max(...guessDistribution, 1);
    
    guessDistribution.forEach((count, index) => {
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
    console.log('loadStats - raw localStorage:', saved);
    
    if (saved) {
        try {
            const parsedStats = JSON.parse(saved);
            console.log('loadStats - parsed:', parsedStats);
            
            // Validate and ensure all properties exist
            gameState.stats = {
                gamesPlayed: Number(parsedStats.gamesPlayed) || 0,
                gamesWon: Number(parsedStats.gamesWon) || 0,
                currentStreak: Number(parsedStats.currentStreak) || 0,
                maxStreak: Number(parsedStats.maxStreak) || 0,
                guessDistribution: Array.isArray(parsedStats.guessDistribution) 
                    ? parsedStats.guessDistribution.map(n => Number(n) || 0)
                    : [0, 0, 0, 0, 0, 0]
            };
            
            console.log('loadStats - final gameState.stats:', gameState.stats);
        } catch (error) {
            console.error('Error loading stats:', error);
            // Reset to default stats if parsing fails
            gameState.stats = {
                gamesPlayed: 0,
                gamesWon: 0,
                currentStreak: 0,
                maxStreak: 0,
                guessDistribution: [0, 0, 0, 0, 0, 0]
            };
        }
    } else {
        console.log('No saved stats found');
    }
}

// Load stats with cloud sync
async function loadStatsWithSync() {
    if (!window.authManager || !window.authManager.isAuthenticated) {
        loadStats();
        return null;
    }
    
    try {
        // Load local stats
        const localStats = localStorage.getItem('wordWaveStats');
        const parsedLocalStats = localStats ? JSON.parse(localStats) : null;
        const localLastPlayed = localStorage.getItem('wordWaveLastPlayed');
        
        // Load cloud data (stats, lastPlayedDate, and gameState)
        window.authManager.updateSyncStatus('syncing');
        const cloudData = await window.authManager.loadStats();
        
        console.log('Cloud data received:', cloudData);
        
        let cloudGameState = null;
        
        // Merge stats (take the better one)
        if (cloudData && cloudData.stats && parsedLocalStats) {
            gameState.stats = window.authManager.mergeStats(parsedLocalStats, cloudData.stats);
            // Use cloud lastPlayedDate if it exists (cloud is source of truth when authenticated)
            gameState.lastPlayedDate = cloudData.lastPlayedDate || localLastPlayed;
            cloudGameState = cloudData.gameState;
            showMessage('Stats synced from cloud!');
        } else if (cloudData && cloudData.stats) {
            gameState.stats = cloudData.stats;
            gameState.lastPlayedDate = cloudData.lastPlayedDate;
            cloudGameState = cloudData.gameState;
            showMessage('Stats loaded from cloud!');
        } else if (parsedLocalStats) {
            gameState.stats = parsedLocalStats;
            gameState.lastPlayedDate = localLastPlayed;
            // Upload local stats to cloud
            await window.authManager.saveStats(gameState.stats, localLastPlayed, null);
        }
        
        // Save merged stats locally
        saveStats();
        if (gameState.lastPlayedDate) {
            localStorage.setItem('wordWaveLastPlayed', gameState.lastPlayedDate);
        }
        
        // Return the cloud game state for today's game restoration
        return cloudGameState;
        
    } catch (error) {
        console.error('Error syncing stats:', error);
        loadStats(); // Fallback to local stats
        window.authManager.updateSyncStatus('error');
        return null;
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
        
        // Clear lastPlayedDate
        gameState.lastPlayedDate = null;
        localStorage.removeItem('wordWaveLastPlayed');
        
        // Save reset stats locally
        saveStats();
        displayStats();
        
        // Also reset on GitHub Gists if authenticated
        if (window.authManager && window.authManager.isAuthenticated) {
            window.authManager.updateSyncStatus('syncing');
            window.authManager.saveStats(gameState.stats, null, null).then(() => {
                showMessage('Statistics reset (local and cloud)!');
            }).catch(() => {
                showMessage('Statistics reset locally!');
            });
        } else {
            showMessage('Statistics reset!');
        }
    }
}

// Save/Load game state (for daily play restriction)
function saveGameState() {
    const gameData = {
        currentRow: gameState.currentRow,
        guesses: gameState.guesses,
        gameOver: gameState.gameOver,
        isWin: gameState.isWin,
        targetWord: gameState.targetWord,
        date: getTodayString()
    };
    localStorage.setItem('wordWaveGameState', JSON.stringify(gameData));
}

function loadGameState() {
    const saved = localStorage.getItem('wordWaveGameState');
    if (saved) {
        try {
            const gameData = JSON.parse(saved);
            
            // Only load if it's from today
            if (gameData.date === getTodayString()) {
                gameState.currentRow = gameData.currentRow;
                gameState.guesses = gameData.guesses || [];
                gameState.gameOver = gameData.gameOver;
                gameState.isWin = gameData.isWin;
                gameState.targetWord = gameData.targetWord;
                
                // Recreate the board with previous guesses
                createBoard();
                gameState.guesses.forEach((guess, rowIndex) => {
                    for (let i = 0; i < WORD_LENGTH; i++) {
                        const tile = getTile(rowIndex, i);
                        tile.textContent = guess[i];
                        tile.classList.add('filled');
                        
                        // Apply colors
                        if (guess[i] === gameState.targetWord[i]) {
                            tile.classList.add('correct');
                            updateKeyboard(guess[i], 'correct');
                        } else if (gameState.targetWord.includes(guess[i])) {
                            tile.classList.add('present');
                            updateKeyboard(guess[i], 'present');
                        } else {
                            tile.classList.add('absent');
                            updateKeyboard(guess[i], 'absent');
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Error loading game state:', error);
        }
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
