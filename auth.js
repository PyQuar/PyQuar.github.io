// GitHub OAuth Authentication System for Word Wave
// This handles user authentication and GitHub Gists storage

const AUTH_CONFIG = {
    // You'll need to create a GitHub OAuth App at: https://github.com/settings/developers
    // Set Homepage URL to: https://wavyessai.me
    // Set Authorization callback URL to: https://wavyessai.me/game.html
    CLIENT_ID: 'Ov23lio9xRVWeE2HuJ6w', // Your GitHub OAuth App Client ID
    REDIRECT_URI: window.location.origin + '/game.html',
    SCOPE: 'gist',
    GIST_FILENAME: 'word-wave-stats.json',
    PROXY_URL: 'https://word-wave-auth-proxy.vercel.app/api/token' // Permanent Vercel production URL
};' // Vercel proxy endpoint
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

    // Save stats to GitHub Gist
    async saveStats(stats) {
        if (!this.isAuthenticated) {
            console.log('Not authenticated, saving locally only');
            return false;
        }

        try {
            const gistData = {
                description: 'Word Wave Game Statistics',
                public: false,
                files: {
                    [AUTH_CONFIG.GIST_FILENAME]: {
                        content: JSON.stringify({
                            stats: stats,
                            lastUpdated: new Date().toISOString(),
                            version: '1.0'
                        }, null, 2)
                    }
                }
            };

            // Check if gist already exists
            const storedGistId = localStorage.getItem('gist_id');
            
            let response;
            if (storedGistId) {
                // Update existing gist
                response = await fetch(`https://api.github.com/gists/${storedGistId}`, {
                    method: 'PATCH',
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(gistData)
                });
            } else {
                // Create new gist
                response = await fetch('https://api.github.com/gists', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.token}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(gistData)
                });
            }

            if (!response.ok) {
                throw new Error('Failed to save to Gist');
            }

            const gist = await response.json();
            this.gistId = gist.id;
            localStorage.setItem('gist_id', gist.id);
            
            console.log('Stats saved to GitHub Gist:', gist.id);
            this.updateSyncStatus('synced');
            return true;
        } catch (error) {
            console.error('Error saving to Gist:', error);
            this.updateSyncStatus('error');
            return false;
        }
    }

    // Load stats from GitHub Gist
    async loadStats() {
        if (!this.isAuthenticated) {
            console.log('Not authenticated, loading local stats only');
            return null;
        }

        try {
            // First, try to get gist ID from localStorage
            let gistId = localStorage.getItem('gist_id');

            // If no gist ID, search for existing gist
            if (!gistId) {
                gistId = await this.findExistingGist();
            }

            if (!gistId) {
                console.log('No existing gist found');
                return null;
            }

            // Fetch gist content
            const response = await fetch(`https://api.github.com/gists/${gistId}`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load from Gist');
            }

            const gist = await response.json();
            const fileContent = gist.files[AUTH_CONFIG.GIST_FILENAME]?.content;

            if (fileContent) {
                const data = JSON.parse(fileContent);
                console.log('Stats loaded from GitHub Gist');
                this.updateSyncStatus('synced');
                return data.stats;
            }

            return null;
        } catch (error) {
            console.error('Error loading from Gist:', error);
            this.updateSyncStatus('error');
            return null;
        }
    }

    // Find existing Word Wave gist
    async findExistingGist() {
        try {
            const response = await fetch('https://api.github.com/gists', {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch gists');
            }

            const gists = await response.json();
            const wordWaveGist = gists.find(gist => 
                gist.description === 'Word Wave Game Statistics' &&
                gist.files[AUTH_CONFIG.GIST_FILENAME]
            );

            if (wordWaveGist) {
                this.gistId = wordWaveGist.id;
                localStorage.setItem('gist_id', wordWaveGist.id);
                return wordWaveGist.id;
            }

            return null;
        } catch (error) {
            console.error('Error finding existing gist:', error);
            return null;
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

console.log('%c🔐 GitHub Auth System Loaded!', 'font-size: 16px; font-weight: bold; color: #2dd4bf;');
