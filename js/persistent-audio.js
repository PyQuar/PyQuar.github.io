// =================================================================
//  PERSISTENT AUDIO PLAYER - Shared across all pages
//  Saves state in localStorage to persist across navigation
// =================================================================

class PersistentAudioPlayer {
    constructor() {
        this.storageKey = 'wavyEssai_audioPlayer';
        this.audio = null;
        this.player = null;
        this.isInitialized = false;
        
        // Check if we're on a page with audio player
        this.checkAndInit();
        
        // Listen for storage changes (when other tabs update)
        window.addEventListener('storage', (e) => {
            if (e.key === this.storageKey) {
                this.syncWithStorage();
            }
        });
        
        // Save state before page unload
        window.addEventListener('beforeunload', () => {
            this.saveState();
        });
    }
    
    checkAndInit() {
        // Check if audio player elements exist on this page
        this.audio = document.getElementById('audioElement');
        this.player = document.getElementById('audioPlayer');
        
        if (this.audio && this.player) {
            this.isInitialized = true;
            this.restoreState();
            this.setupEventListeners();
        }
    }
    
    saveState() {
        if (!this.isInitialized || !this.audio.src) return;
        
        const thumbnailEl = document.querySelector('.player-thumbnail');
        const state = {
            src: this.audio.src,
            currentTime: this.audio.currentTime,
            isPlaying: !this.audio.paused,
            volume: this.audio.volume,
            title: document.getElementById('playerTitle')?.textContent || '',
            subtitle: document.getElementById('playerSubtitle')?.textContent || '',
            thumbnail: thumbnailEl?.src || 'assets/clublogo.png',
            timestamp: Date.now()
        };
        
        localStorage.setItem(this.storageKey, JSON.stringify(state));
    }
    
    restoreState() {
        const savedState = localStorage.getItem(this.storageKey);
        if (!savedState) return;
        
        try {
            const state = JSON.parse(savedState);
            
            // Don't restore if state is too old (more than 1 hour)
            if (Date.now() - state.timestamp > 3600000) {
                localStorage.removeItem(this.storageKey);
                return;
            }
            
            // Restore audio
            this.audio.src = state.src;
            this.audio.volume = state.volume;
            this.audio.currentTime = state.currentTime;
            
            // Restore UI
            if (document.getElementById('playerTitle')) {
                document.getElementById('playerTitle').textContent = state.title;
            }
            if (document.getElementById('playerSubtitle')) {
                document.getElementById('playerSubtitle').textContent = state.subtitle;
            }
            
            // Restore thumbnail
            const thumbnailEl = document.querySelector('.player-thumbnail');
            if (thumbnailEl && state.thumbnail) {
                thumbnailEl.src = state.thumbnail;
            }
            
            // Show player
            this.player.classList.add('active');
            
            // Resume playing if it was playing
            if (state.isPlaying) {
                this.audio.play().catch(err => {
                    console.log('Autoplay prevented:', err);
                    // Update play/pause button
                    const playPauseBtn = document.getElementById('playPauseBtn');
                    if (playPauseBtn) {
                        const icon = playPauseBtn.querySelector('i');
                        icon.className = 'fas fa-play';
                    }
                });
            }
        } catch (error) {
            console.error('Error restoring audio state:', error);
            localStorage.removeItem(this.storageKey);
        }
    }
    
    setupEventListeners() {
        // Save state periodically while playing
        this.audio.addEventListener('timeupdate', () => {
            if (!this.audio.paused) {
                this.saveState();
            }
        });
        
        // Save on play/pause
        this.audio.addEventListener('play', () => this.saveState());
        this.audio.addEventListener('pause', () => this.saveState());
        
        // Save on volume change
        this.audio.addEventListener('volumechange', () => this.saveState());
    }
    
    syncWithStorage() {
        // Sync with changes from other tabs (if needed)
        this.restoreState();
    }
    
    clearState() {
        localStorage.removeItem(this.storageKey);
    }
}

// Initialize persistent player on every page
const persistentPlayer = new PersistentAudioPlayer();

// Export for use in other scripts
window.persistentAudioPlayer = persistentPlayer;
