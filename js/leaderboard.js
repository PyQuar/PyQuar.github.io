// Leaderboard Page JavaScript
// Displays the global Word Wave leaderboard

const LEADERBOARD_CONFIG = {
    GIST_ID: '2acc97044fc86cb79c96b02a5bd1b5fb',
    OWNER: 'PyQuar',
    FILENAME: 'wordwave-leaderboard.json'
};

let currentFilter = 'all';
let leaderboardData = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadLeaderboard();
    setupFilterButtons();
});

// Setup filter buttons
function setupFilterButtons() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active state
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Apply filter
            currentFilter = btn.dataset.filter;
            displayLeaderboard(leaderboardData);
        });
    });
}

// Load leaderboard from GitHub Gist
async function loadLeaderboard() {
    showLoading();
    hideError();
    
    try {
        const response = await fetch(`https://api.github.com/gists/${LEADERBOARD_CONFIG.GIST_ID}`, {
            headers: {
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const gist = await response.json();
        const fileContent = gist.files[LEADERBOARD_CONFIG.FILENAME]?.content;

        if (!fileContent) {
            throw new Error('Leaderboard file not found in Gist');
        }

        leaderboardData = JSON.parse(fileContent);
        displayLeaderboard(leaderboardData);
        updateStats(leaderboardData);
        
    } catch (error) {
        console.error('Error loading leaderboard:', error);
        showError();
    }
}

// Display leaderboard table
function displayLeaderboard(data) {
    if (!data || !data.players) {
        showError();
        return;
    }

    // Convert players object to array and sort
    const playersArray = Object.values(data.players);
    const sortedPlayers = sortPlayers(playersArray);
    
    // Apply filter
    let filteredPlayers = sortedPlayers;
    if (currentFilter === 'top10') {
        filteredPlayers = sortedPlayers.slice(0, 10);
    } else if (currentFilter === 'top50') {
        filteredPlayers = sortedPlayers.slice(0, 50);
    }

    // Generate table rows
    const tbody = document.getElementById('leaderboard-body');
    tbody.innerHTML = '';

    filteredPlayers.forEach((player, index) => {
        const row = createPlayerRow(player, index + 1);
        tbody.appendChild(row);
    });

    hideLoading();
    document.getElementById('leaderboard-table').style.display = 'block';
}

// Sort players by wins (desc) then total attempts (asc)
function sortPlayers(players) {
    return players.sort((a, b) => {
        // Primary: wins (more is better)
        if (b.stats.gamesWon !== a.stats.gamesWon) {
            return b.stats.gamesWon - a.stats.gamesWon;
        }
        
        // Secondary: total attempts (fewer is better)
        const attemptsA = calculateTotalAttempts(a.stats);
        const attemptsB = calculateTotalAttempts(b.stats);
        return attemptsA - attemptsB;
    });
}

// Calculate total attempts from guess distribution
function calculateTotalAttempts(stats) {
    if (!stats.guessDistribution) return 0;
    
    let total = 0;
    for (let i = 1; i <= 6; i++) {
        total += (stats.guessDistribution[i] || 0) * i;
    }
    return total;
}

// Create a table row for a player
function createPlayerRow(player, rank) {
    const row = document.createElement('tr');
    
    const stats = player.stats;
    const totalGames = stats.gamesPlayed || 0;
    const wins = stats.gamesWon || 0;
    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;
    const currentStreak = stats.currentStreak || 0;
    const totalAttempts = calculateTotalAttempts(stats);
    
    // Rank badge
    let rankBadgeClass = 'rank-other';
    if (rank === 1) rankBadgeClass = 'rank-1';
    else if (rank === 2) rankBadgeClass = 'rank-2';
    else if (rank === 3) rankBadgeClass = 'rank-3';
    
    // Win rate color
    let winRateClass = 'winrate-low';
    if (winRate >= 80) winRateClass = 'winrate-good';
    else if (winRate >= 50) winRateClass = 'winrate-medium';
    
    row.innerHTML = `
        <td class="rank-col">
            <span class="rank-badge ${rankBadgeClass}">${rank}</span>
        </td>
        <td class="player-col">
            <div class="player-info">
                <img src="${player.avatar || 'https://github.com/identicons/' + player.username + '.png'}" 
                     alt="${player.username}" 
                     class="player-avatar"
                     onerror="this.src='https://github.com/identicons/default.png'">
                <span class="player-name">${escapeHtml(player.username)}</span>
            </div>
        </td>
        <td class="wins-col">
            <span class="stat-highlight">${wins}</span>
        </td>
        <td class="played-col">${totalGames}</td>
        <td class="winrate-col">
            <span class="${winRateClass}">${winRate}%</span>
        </td>
        <td class="streak-col">
            ${currentStreak > 0 ? `<span class="current-streak">🔥 ${currentStreak}</span>` : '-'}
        </td>
        <td class="attempts-col">${totalAttempts}</td>
    `;
    
    return row;
}

// Update stats summary
function updateStats(data) {
    const players = Object.values(data.players || {});
    const totalPlayers = players.length;
    const totalGames = players.reduce((sum, p) => sum + (p.stats.gamesPlayed || 0), 0);
    
    document.getElementById('total-players').textContent = totalPlayers;
    document.getElementById('total-games').textContent = totalGames;
    
    if (data.lastUpdated) {
        const lastUpdated = new Date(data.lastUpdated);
        const now = new Date();
        const diffMinutes = Math.floor((now - lastUpdated) / 60000);
        
        let timeText = '';
        if (diffMinutes < 1) timeText = 'maintenant';
        else if (diffMinutes < 60) timeText = `il y a ${diffMinutes}m`;
        else if (diffMinutes < 1440) timeText = `il y a ${Math.floor(diffMinutes / 60)}h`;
        else timeText = `il y a ${Math.floor(diffMinutes / 1440)}j`;
        
        document.getElementById('last-updated').textContent = timeText;
    } else {
        document.getElementById('last-updated').textContent = 'N/A';
    }
}

// Helper functions
function showLoading() {
    document.getElementById('loading').style.display = 'block';
    document.getElementById('leaderboard-table').style.display = 'none';
}

function hideLoading() {
    document.getElementById('loading').style.display = 'none';
}

function showError() {
    document.getElementById('error').style.display = 'block';
    document.getElementById('loading').style.display = 'none';
    document.getElementById('leaderboard-table').style.display = 'none';
}

function hideError() {
    document.getElementById('error').style.display = 'none';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
