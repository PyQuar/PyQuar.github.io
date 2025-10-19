// GitHub OAuth Authentication System for Word Wave
// This handles user authentication and GitHub Gists storage

const AUTH_CONFIG = {
    // You'll need to create a GitHub OAuth App at: https://github.com/settings/developers
    // Set Homepage URL to: https://wavyessai.me
    // Set Authorization callback URL to: https://wavyessai.me/game.html
    CLIENT_ID: 'Ov23lio9xRVWeE2HuJ6w', // Your GitHub OAuth App Client ID
    REDIRECT_URI: window.location.origin + '/game.html',
    SCOPE: 'gist',
    
    // Central leaderboard Gist (owned by admin/PyQuar)
    LEADERBOARD_GIST_ID: '', // TODO: Set this after creating the gist with createLeaderboardGist()
    LEADERBOARD_OWNER: 'PyQuar', // GitHub username who owns the leaderboard
    
    PROXY_URL: 'https://word-wave-auth-proxy.vercel.app/api/token' // Permanent Vercel production URL
};

class AuthManager {
    constructor() {
        this.token = null;
        this.user = null;
        this.gistId = null;
        this.isAuthenticated = false;
    }

    // Initialize authentication
    async init() {
        // Check for OAuth callback
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        if (code) {
            await this.handleCallback(code);
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
            return;
        }
        
        // Check for existing token
        this.token = localStorage.getItem('github_token');
        if (this.token) {
            await this.validateToken();
        }
        
        this.updateUI();
    }

    // Start OAuth flow
    login() {
        const authUrl = `https://github.com/login/oauth/authorize?client_id=${AUTH_CONFIG.CLIENT_ID}&redirect_uri=${AUTH_CONFIG.REDIRECT_URI}&scope=${AUTH_CONFIG.SCOPE}`;
        window.location.href = authUrl;
    }

    // Handle OAuth callback
    async handleCallback(code) {
        try {
            // Exchange code for token using proxy
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

            const data = await response.json();
            
            if (data.access_token) {
                this.token = data.access_token;
                localStorage.setItem('github_token', this.token);
                await this.fetchUserInfo();
                this.isAuthenticated = true;
                showMessage('Successfully logged in!');
            } else {
                throw new Error('Failed to get access token');
            }
        } catch (error) {
            console.error('OAuth error:', error);
            showMessage('Login failed. Please try again.', true);
        }
    }

    // Validate existing token
    async validateToken() {
        try {
            await this.fetchUserInfo();
            this.isAuthenticated = true;
        } catch (error) {
            console.error('Token validation failed:', error);
            this.logout();
        }
    }

    // Fetch user information
    async fetchUserInfo() {
        try {
            const response = await fetch('https://api.github.com/user', {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch user info');
            }

            this.user = await response.json();
            return this.user;
        } catch (error) {
            console.error('Error fetching user info:', error);
            throw error;
        }
    }

    // Logout
    logout() {
        this.token = null;
        this.user = null;
        this.gistId = null;
        this.isAuthenticated = false;
        localStorage.removeItem('github_token');
        localStorage.removeItem('gist_id');
        this.updateUI();
        showMessage('Logged out successfully');
    }

    // Update UI based on auth state
    updateUI() {
        const loginBtn = document.getElementById('loginBtn');
        const userProfile = document.getElementById('userProfile');
        const userName = document.getElementById('userName');
        const userAvatar = document.getElementById('userAvatar');
        const syncStatus = document.getElementById('syncStatus');

        if (this.isAuthenticated && this.user) {
            loginBtn.style.display = 'none';
            userProfile.style.display = 'flex';
            userName.textContent = this.user.login;
            userAvatar.src = this.user.avatar_url;
            if (syncStatus) {
                syncStatus.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Synced';
                syncStatus.classList.add('synced');
            }
        } else {
            loginBtn.style.display = 'block';
            userProfile.style.display = 'none';
            if (syncStatus) {
                syncStatus.innerHTML = '<i class="fas fa-cloud-slash"></i> Not synced';
                syncStatus.classList.remove('synced');
            }
        }
    }

    // Save stats to central leaderboard Gist
    async saveStats(stats, lastPlayedDate = null, gameState = null) {
        if (!this.isAuthenticated || !this.user) {
            console.log('Not authenticated, saving locally only');
            return false;
        }

        try {
            // Get current leaderboard data
            const leaderboard = await this.loadLeaderboard();
            
            // Update player's data
            const playerData = {
                username: this.user.login,
                avatar: this.user.avatar_url,
                stats: stats,
                lastPlayedDate: lastPlayedDate,
                gameState: gameState,
                lastUpdated: new Date().toISOString()
            };
            
            leaderboard.players[this.user.login] = playerData;
            leaderboard.lastUpdated = new Date().toISOString();
            
            // Save back to central Gist
            const saved = await this.updateLeaderboard(leaderboard);
            
            if (saved) {
                console.log('Stats saved to leaderboard');
                this.updateSyncStatus('synced');
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Error saving to leaderboard:', error);
            this.updateSyncStatus('error');
            return false;
        }
    }

    // Load stats from central leaderboard
    async loadStats() {
        if (!this.isAuthenticated || !this.user) {
            console.log('Not authenticated, loading local stats only');
            return null;
        }

        try {
            const leaderboard = await this.loadLeaderboard();
            const playerData = leaderboard.players[this.user.login];
            
            if (playerData) {
                console.log('Stats loaded from leaderboard');
                this.updateSyncStatus('synced');
                return {
                    stats: playerData.stats,
                    lastPlayedDate: playerData.lastPlayedDate || null,
                    gameState: playerData.gameState || null
                };
            }

            console.log('No stats found in leaderboard for this user');
            return null;
        } catch (error) {
            console.error('Error loading from leaderboard:', error);
            this.updateSyncStatus('error');
            return null;
        }
    }

    // Load leaderboard from central Gist
    async loadLeaderboard() {
        if (!AUTH_CONFIG.LEADERBOARD_GIST_ID) {
            console.warn('Leaderboard Gist ID not configured');
            return { players: {}, lastUpdated: null, version: '2.0' };
        }

        try {
            // Leaderboard is public, so anyone can read it
            const response = await fetch(`https://api.github.com/gists/${AUTH_CONFIG.LEADERBOARD_GIST_ID}`, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                if (response.status === 404) {
                    console.log('Leaderboard Gist not found');
                    return { players: {}, lastUpdated: null, version: '2.0' };
                }
                throw new Error(`HTTP ${response.status}`);
            }

            const gist = await response.json();
            const fileContent = gist.files['wordwave-leaderboard.json']?.content;

            if (fileContent) {
                return JSON.parse(fileContent);
            }

            return { players: {}, lastUpdated: null, version: '2.0' };
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            return { players: {}, lastUpdated: null, version: '2.0' };
        }
    }

    // Update central leaderboard Gist
    async updateLeaderboard(leaderboard) {
        if (!this.isAuthenticated || !this.token) {
            console.error('Not authenticated');
            return false;
        }

        if (!AUTH_CONFIG.LEADERBOARD_GIST_ID) {
            console.error('Leaderboard Gist ID not configured');
            return false;
        }

        try {
            const gistData = {
                description: 'Word Wave - Global Leaderboard',
                public: true, // Public so anyone can view leaderboard
                files: {
                    'wordwave-leaderboard.json': {
                        content: JSON.stringify(leaderboard, null, 2)
                    }
                }
            };

            const response = await fetch(`https://api.github.com/gists/${AUTH_CONFIG.LEADERBOARD_GIST_ID}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(gistData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            return true;
        } catch (error) {
            console.error('Error updating leaderboard:', error);
            return false;
        }
    }

    // Get top players for leaderboard display
    async getTopPlayers(limit = 10) {
        try {
            const leaderboard = await this.loadLeaderboard();
            const players = Object.values(leaderboard.players);
            
            // Sort by win rate, then by games played
            players.sort((a, b) => {
                const winRateA = a.stats.gamesPlayed > 0 ? (a.stats.gamesWon / a.stats.gamesPlayed) : 0;
                const winRateB = b.stats.gamesPlayed > 0 ? (b.stats.gamesWon / b.stats.gamesPlayed) : 0;
                
                if (winRateB !== winRateA) {
                    return winRateB - winRateA; // Higher win rate first
                }
                
                return b.stats.gamesPlayed - a.stats.gamesPlayed; // More games played as tiebreaker
            });
            
            return players.slice(0, limit);
        } catch (error) {
            console.error('Error getting top players:', error);
            return [];
        }
    }

    // Update sync status indicator
    updateSyncStatus(status) {
        const syncStatus = document.getElementById('syncStatus');
        if (!syncStatus) return;

        syncStatus.classList.remove('synced', 'syncing', 'error');

        switch (status) {
            case 'synced':
                syncStatus.innerHTML = '<i class="fas fa-cloud-upload-alt"></i> Synced';
                syncStatus.classList.add('synced');
                break;
            case 'syncing':
                syncStatus.innerHTML = '<i class="fas fa-sync fa-spin"></i> Syncing...';
                syncStatus.classList.add('syncing');
                break;
            case 'error':
                syncStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Sync Error';
                syncStatus.classList.add('error');
                break;
        }
    }

    // Merge local and cloud stats (take the better one)
    mergeStats(localStats, cloudStats) {
        if (!cloudStats) return localStats;
        if (!localStats) return cloudStats;

        return {
            gamesPlayed: Math.max(localStats.gamesPlayed, cloudStats.gamesPlayed),
            gamesWon: Math.max(localStats.gamesWon, cloudStats.gamesWon),
            currentStreak: Math.max(localStats.currentStreak, cloudStats.currentStreak),
            maxStreak: Math.max(localStats.maxStreak, cloudStats.maxStreak),
            guessDistribution: localStats.guessDistribution.map((val, i) => 
                Math.max(val, cloudStats.guessDistribution[i] || 0)
            )
        };
    }
}

// Create global auth manager instance
const authManager = new AuthManager();

// Export for use in game.js
window.authManager = authManager;

// Helper function to create the central leaderboard Gist (run once by admin)
window.createLeaderboardGist = async function() {
    if (!window.authManager || !window.authManager.isAuthenticated) {
        console.error('❌ You must be logged in as PyQuar to create the leaderboard');
        return;
    }
    
    try {
        const gistData = {
            description: 'Word Wave - Global Leaderboard',
            public: true,
            files: {
                'wordwave-leaderboard.json': {
                    content: JSON.stringify({
                        players: {},
                        lastUpdated: new Date().toISOString(),
                        version: '2.0'
                    }, null, 2)
                }
            }
        };
        
        const response = await fetch('https://api.github.com/gists', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${window.authManager.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(gistData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('✅ Leaderboard Gist created successfully!');
        console.log('📋 Gist ID:', result.id);
        console.log('🔗 URL:', result.html_url);
        console.log('\n📝 Next steps:');
        console.log(`1. Copy this Gist ID: ${result.id}`);
        console.log('2. Update auth.js: AUTH_CONFIG.LEADERBOARD_GIST_ID = "' + result.id + '"');
        console.log('3. Commit and push the change');
        
        return result.id;
        
    } catch (error) {
        console.error('❌ Error creating leaderboard Gist:', error);
    }
};

// Helper function to display leaderboard in console
window.showLeaderboard = async function(limit = 10) {
    try {
        const players = await window.authManager.getTopPlayers(limit);
        
        console.log('\n🏆 === WORD WAVE LEADERBOARD === 🏆\n');
        console.table(players.map((p, i) => ({
            Rank: i + 1,
            Player: p.username,
            'Games Played': p.stats.gamesPlayed,
            'Games Won': p.stats.gamesWon,
            'Win Rate': p.stats.gamesPlayed > 0 ? 
                `${Math.round((p.stats.gamesWon / p.stats.gamesPlayed) * 100)}%` : '0%',
            'Current Streak': p.stats.currentStreak,
            'Best Streak': p.stats.maxStreak
        })));
        
        return players;
    } catch (error) {
        console.error('Error showing leaderboard:', error);
    }
};

console.log('%c🔐 GitHub Auth System Loaded!', 'font-size: 16px; font-weight: bold; color: #2dd4bf;');
