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
        
        initializeGame();
        
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
        
        initializeGame();
        
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
        // New day - clear old game state and start fresh
        console.log('New day detected! Clearing old game state...');
        localStorage.removeItem('wordWaveGameState');
        localStorage.removeItem('wordWaveLastPlayed');
        
        // Reset game state for new game
        gameState.gameOver = false;
        gameState.isWin = false;
        gameState.currentRow = 0;
        gameState.currentTile = 0;
        gameState.currentGuess = '';
        gameState.guesses = [];
        gameState.lastPlayedDate = null;
        
        // Get today's word (must be called AFTER clearing state)
        const todayWord = getDailyWord();
        gameState.targetWord = todayWord;
        console.log('New daily word for', today, ':', todayWord);
        
        // Initialize game
        initializeGame();
        
        // Create fresh board
        createBoard();
    }
    
    // Display stats after loading them (with slight delay to ensure DOM is ready)
    setTimeout(() => {
        if (document.getElementById('gamesPlayed')) {
            console.log('Calling displayStats...');
            console.log('Final gameState.stats:', gameState.stats);
            displayStats();
        }
    }, 100);
});

// Initialize game
function initializeGame() {
    // Get or generate daily word (only if not already set)
    if (!gameState.targetWord) {
        gameState.targetWord = getDailyWord();
    }
    console.log('Target word:', gameState.targetWord); // For testing
}

// Get daily word (same word for everyone each day)
function getDailyWord() {
    // Check if dev mode has overridden the date
    const devDate = localStorage.getItem('wordWaveDevDate');
    let today;
    
    if (devDate) {
        // Use the dev date override
        today = new Date(devDate + 'T00:00:00');
    } else {
        // Use actual current date
        today = new Date();
    }
    
    const start = new Date(today.getFullYear(), 0, 0);
    const diff = today - start;
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = Math.floor(diff / oneDay);
    const index = dayOfYear % WORD_LIST.length;
    return WORD_LIST[index];
}

// Get today's date as string (YYYY-MM-DD) in local timezone
function getTodayString() {
    // Check if dev mode has overridden the date
    const devDate = localStorage.getItem('wordWaveDevDate');
    if (devDate) {
        return devDate;
    }
    
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
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
    
    // Developer Tools
    const devBtn = document.getElementById('devBtn');
    if (devBtn) {
        devBtn.addEventListener('click', () => openModal('devModal'));
    }
    
    document.getElementById('setDateBtn')?.addEventListener('click', setDevDate);
    document.getElementById('setWordBtn')?.addEventListener('click', setDevWord);
    document.getElementById('nextDayBtn')?.addEventListener('click', skipToTomorrow);
    document.getElementById('resetDayBtn')?.addEventListener('click', resetToToday);
    
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
    
    // Ensure stats object exists with valid defaults
    if (!gameState.stats || typeof gameState.stats !== 'object') {
        console.warn('Stats object invalid, resetting to defaults');
        gameState.stats = {
            gamesPlayed: 0,
            gamesWon: 0,
            currentStreak: 0,
            maxStreak: 0,
            guessDistribution: [0, 0, 0, 0, 0, 0]
        };
    }
    
    // Force convert to numbers and handle NaN
    const gamesPlayed = parseInt(gameState.stats.gamesPlayed) || 0;
    const gamesWon = parseInt(gameState.stats.gamesWon) || 0;
    const currentStreak = parseInt(gameState.stats.currentStreak) || 0;
    const maxStreak = parseInt(gameState.stats.maxStreak) || 0;
    
    console.log('Computed values:', { gamesPlayed, gamesWon, currentStreak, maxStreak });
    
    // Update DOM elements
    const gamesPlayedEl = document.getElementById('gamesPlayed');
    const winPercentageEl = document.getElementById('winPercentage');
    const currentStreakEl = document.getElementById('currentStreak');
    const maxStreakEl = document.getElementById('maxStreak');
    
    console.log('DOM Elements found:', {
        gamesPlayedEl: !!gamesPlayedEl,
        winPercentageEl: !!winPercentageEl,
        currentStreakEl: !!currentStreakEl,
        maxStreakEl: !!maxStreakEl
    });
    
    if (gamesPlayedEl) {
        const oldValue = gamesPlayedEl.textContent;
        gamesPlayedEl.textContent = String(gamesPlayed);
        console.log('Set gamesPlayed from', oldValue, 'to:', gamesPlayedEl.textContent, '| Value type:', typeof gamesPlayed, '| Value:', gamesPlayed);
    } else {
        console.error('gamesPlayed element not found!');
    }
    
    if (winPercentageEl) {
        const winPct = gamesPlayed > 0 ? Math.round((gamesWon / gamesPlayed) * 100) : 0;
        const oldValue = winPercentageEl.textContent;
        winPercentageEl.textContent = String(winPct);
        console.log('Set winPercentage from', oldValue, 'to:', winPercentageEl.textContent);
    } else {
        console.error('winPercentage element not found!');
    }
    
    if (currentStreakEl) {
        const oldValue = currentStreakEl.textContent;
        currentStreakEl.textContent = String(currentStreak);
        console.log('Set currentStreak from', oldValue, 'to:', currentStreakEl.textContent);
    } else {
        console.error('currentStreak element not found!');
    }
    
    if (maxStreakEl) {
        const oldValue = maxStreakEl.textContent;
        maxStreakEl.textContent = String(maxStreak);
        console.log('Set maxStreak from', oldValue, 'to:', maxStreakEl.textContent);
    } else {
        console.error('maxStreak element not found!');
    }
    
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
        console.log('No saved stats found, initializing defaults');
        // Initialize with default stats if nothing saved
        gameState.stats = {
            gamesPlayed: 0,
            gamesWon: 0,
            currentStreak: 0,
            maxStreak: 0,
            guessDistribution: [0, 0, 0, 0, 0, 0]
        };
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

// ================== DEVELOPER TOOLS ==================

// Populate word dropdown
const devWordSelect = document.getElementById('devWord');
if (devWordSelect) {
    WORD_LIST.forEach(word => {
        const option = document.createElement('option');
        option.value = word;
        option.textContent = word;
        devWordSelect.appendChild(option);
    });
}

// Update dev info panel
function updateDevInfo() {
    const devCurrentDate = document.getElementById('devCurrentDate');
    const devCurrentWord = document.getElementById('devCurrentWord');
    const devLastPlayed = document.getElementById('devLastPlayed');
    
    if (devCurrentDate) devCurrentDate.textContent = getTodayString();
    if (devCurrentWord) devCurrentWord.textContent = gameState.targetWord || 'Not set';
    if (devLastPlayed) devLastPlayed.textContent = gameState.lastPlayedDate || 'Never';
}

// Open dev modal and update info
const devModal = document.getElementById('devModal');
if (devModal) {
    const originalOpenModal = window.openModal;
    window.openModal = function(modalId) {
        originalOpenModal(modalId);
        if (modalId === 'devModal') {
            updateDevInfo();
        }
    };
}

// Set custom date
function setDevDate() {
    const dateInput = document.getElementById('devDate');
    if (!dateInput || !dateInput.value) {
        showMessage('Please select a date');
        return;
    }
    
    // Store custom date in localStorage
    localStorage.setItem('wordWaveDevDate', dateInput.value);
    
    // Clear game state to trigger new game
    localStorage.removeItem('wordWaveLastPlayed');
    localStorage.removeItem('wordWaveGameState');
    
    // Reload to apply changes
    showMessage('Date set! Reloading...');
    setTimeout(() => location.reload(), 500);
}

// Set custom word
function setDevWord() {
    const wordSelect = document.getElementById('devWord');
    if (!wordSelect || !wordSelect.value) {
        showMessage('Please select a word');
        return;
    }
    
    // Force the selected word
    gameState.targetWord = wordSelect.value.toUpperCase();
    gameState.currentRow = 0;
    gameState.currentGuess = '';
    gameState.guesses = [];
    gameState.gameOver = false;
    gameState.isWin = false;
    
    // Save to localStorage
    localStorage.setItem('wordWaveGameState', JSON.stringify(gameState));
    
    // Clear the board
    document.querySelectorAll('.tile').forEach(tile => {
        tile.textContent = '';
        tile.className = 'tile';
    });
    
    closeModal('devModal');
    showMessage(`Word set to ${wordSelect.value.toUpperCase()}`);
    updateDevInfo();
}

// Skip to tomorrow
function skipToTomorrow() {
    const today = new Date();
    today.setDate(today.getDate() + 1);
    
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const tomorrowString = `${year}-${month}-${day}`;
    
    // Store custom date
    localStorage.setItem('wordWaveDevDate', tomorrowString);
    
    // Clear game state
    localStorage.removeItem('wordWaveLastPlayed');
    localStorage.removeItem('wordWaveGameState');
    
    // Reload
    showMessage('Skipping to tomorrow...');
    setTimeout(() => location.reload(), 500);
}

// Reset to today
function resetToToday() {
    // Clear dev date override
    localStorage.removeItem('wordWaveDevDate');
    
    // Clear game state
    localStorage.removeItem('wordWaveLastPlayed');
    localStorage.removeItem('wordWaveGameState');
    
    // Reload
    showMessage('Resetting to today...');
    setTimeout(() => location.reload(), 500);
}

// Show/hide dev button based on authentication
function updateDevButtonVisibility() {
    const devBtn = document.getElementById('devBtn');
    if (devBtn && window.authManager) {
        devBtn.style.display = window.authManager.isAuthenticated ? 'flex' : 'none';
    }
}

// Update visibility when auth state changes
if (window.authManager) {
    const originalUpdateUI = window.authManager.updateUI;
    window.authManager.updateUI = function() {
        originalUpdateUI.call(window.authManager);
        updateDevButtonVisibility();
    };
}

// Initial visibility check
updateDevButtonVisibility();

// ====================================================

console.log('%c🌊 Word Wave Game Loaded!', 'font-size: 20px; font-weight: bold; color: #2dd4bf;');
console.log('%cToday\'s word:', gameState.targetWord);
