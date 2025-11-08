// =================================================================
//  WAVY ESSAI - PODCASTS PAGE INTERACTIVITY
//  Audio Player, Wave Animations, Filters
// =================================================================

// ===== AUDIO PLAYER =====
class PodcastPlayer {
    constructor() {
        this.audio = document.getElementById('audioElement');
        this.player = document.getElementById('audioPlayer');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.rewindBtn = document.getElementById('rewindBtn');
        this.forwardBtn = document.getElementById('forwardBtn');
        this.volumeBtn = document.getElementById('volumeBtn');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.progressBar = document.getElementById('progressBar');
        this.playerProgress = document.querySelector('.player-progress');
        this.currentTimeEl = document.getElementById('currentTime');
        this.totalTimeEl = document.getElementById('totalTime');
        this.playerTitle = document.getElementById('playerTitle');
        this.playerSubtitle = document.getElementById('playerSubtitle');
        
        this.currentEpisode = null;
        this.isPlaying = false;
        
        this.init();
    }
    
    init() {
        // Play/Pause button
        this.playPauseBtn.addEventListener('click', () => this.togglePlayPause());
        
        // Rewind and Forward
        this.rewindBtn.addEventListener('click', () => this.skip(-10));
        this.forwardBtn.addEventListener('click', () => this.skip(10));
        
        // Volume controls
        this.volumeBtn.addEventListener('click', () => this.toggleMute());
        this.volumeSlider.addEventListener('input', (e) => {
            this.audio.volume = e.target.value / 100;
            this.updateVolumeIcon();
        });
        
        // Progress bar
        this.playerProgress.addEventListener('click', (e) => {
            const rect = this.playerProgress.getBoundingClientRect();
            const percent = (e.clientX - rect.left) / rect.width;
            this.audio.currentTime = percent * this.audio.duration;
        });
        
        // Audio events
        this.audio.addEventListener('timeupdate', () => this.updateProgress());
        this.audio.addEventListener('loadedmetadata', () => this.updateDuration());
        this.audio.addEventListener('ended', () => this.onAudioEnded());
        
        // Set initial volume
        this.audio.volume = 0.8;
        
        // Episode card buttons
        this.initEpisodeButtons();
    }
    
    initEpisodeButtons() {
        // Play buttons on cards
        document.querySelectorAll('.play-btn, .btn-listen').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const audioSrc = btn.dataset.audio;
                const thumbnail = btn.dataset.thumbnail || 'assets/clublogo.png';
                const card = btn.closest('.episode-card');
                const title = card.querySelector('.episode-title').textContent;
                this.loadAndPlay(audioSrc, title, thumbnail);
            });
        });
        
        // Hero button
        const playLatestBtn = document.getElementById('playLatestBtn');
        if (playLatestBtn) {
            playLatestBtn.addEventListener('click', () => {
                const firstEpisode = document.querySelector('.episode-card');
                if (firstEpisode) {
                    const playBtn = firstEpisode.querySelector('[data-audio]');
                    const audioSrc = playBtn.dataset.audio;
                    const thumbnail = playBtn.dataset.thumbnail || 'assets/clublogo.png';
                    const title = firstEpisode.querySelector('.episode-title').textContent;
                    this.loadAndPlay(audioSrc, title, thumbnail);
                }
            });
        }
    }
    
    loadAndPlay(src, title, thumbnail = 'assets/clublogo.png') {
        this.audio.src = src;
        this.playerTitle.textContent = title;
        this.playerSubtitle.textContent = 'Wavy Essai Podcast';
        this.currentEpisode = src;
        
        // Update thumbnail
        const playerThumbnail = document.querySelector('.player-thumbnail');
        if (playerThumbnail) {
            playerThumbnail.src = thumbnail;
        }
        
        this.audio.play();
        this.isPlaying = true;
        this.updatePlayPauseIcon();
        this.showPlayer();
    }
    
    togglePlayPause() {
        if (this.isPlaying) {
            this.audio.pause();
        } else {
            this.audio.play();
        }
        this.isPlaying = !this.isPlaying;
        this.updatePlayPauseIcon();
    }
    
    updatePlayPauseIcon() {
        const icon = this.playPauseBtn.querySelector('i');
        if (this.isPlaying) {
            icon.className = 'fas fa-pause';
        } else {
            icon.className = 'fas fa-play';
        }
    }
    
    skip(seconds) {
        this.audio.currentTime += seconds;
    }
    
    toggleMute() {
        this.audio.muted = !this.audio.muted;
        this.updateVolumeIcon();
    }
    
    updateVolumeIcon() {
        const icon = this.volumeBtn.querySelector('i');
        if (this.audio.muted || this.audio.volume === 0) {
            icon.className = 'fas fa-volume-mute';
        } else if (this.audio.volume < 0.5) {
            icon.className = 'fas fa-volume-down';
        } else {
            icon.className = 'fas fa-volume-up';
        }
    }
    
    updateProgress() {
        if (this.audio.duration) {
            const percent = (this.audio.currentTime / this.audio.duration) * 100;
            this.progressBar.style.width = `${percent}%`;
            this.currentTimeEl.textContent = this.formatTime(this.audio.currentTime);
        }
    }
    
    updateDuration() {
        if (this.audio.duration) {
            this.totalTimeEl.textContent = this.formatTime(this.audio.duration);
            
            // Update duration in the episode card
            const episodeCard = document.querySelector(`[data-audio="${this.currentEpisode}"]`)?.closest('.episode-card');
            if (episodeCard) {
                const durationEl = episodeCard.querySelector('[id^="duration-"]');
                if (durationEl) {
                    durationEl.textContent = this.formatTime(this.audio.duration);
                }
            }
        }
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }
    
    onAudioEnded() {
        this.isPlaying = false;
        this.updatePlayPauseIcon();
        this.audio.currentTime = 0;
    }
    
    showPlayer() {
        this.player.classList.add('active');
    }
}

// ===== ANIMATED SOUND WAVES =====
class SoundWaveAnimation {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.waves = [];
        this.numWaves = 3;
        this.animationId = null;
        
        this.init();
    }
    
    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        // Create waves
        for (let i = 0; i < this.numWaves; i++) {
            this.waves.push({
                y: this.canvas.height / 2,
                length: 0.01 + i * 0.003,
                amplitude: 30 + i * 20,
                frequency: 0.01 + i * 0.005,
                phase: i * Math.PI / 2,
                speed: 0.02 + i * 0.01,
                color: i === 0 ? 'rgba(0, 212, 255, 0.3)' : 
                       i === 1 ? 'rgba(168, 85, 247, 0.2)' : 
                       'rgba(0, 239, 255, 0.15)'
            });
        }
        
        this.animate();
    }
    
    resize() {
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
    }
    
    drawWave(wave, time) {
        this.ctx.beginPath();
        this.ctx.moveTo(0, wave.y);
        
        for (let x = 0; x < this.canvas.width; x++) {
            const y = wave.y + 
                     Math.sin(x * wave.length + time * wave.speed + wave.phase) * 
                     wave.amplitude * 
                     Math.sin(time * wave.frequency);
            
            this.ctx.lineTo(x, y);
        }
        
        this.ctx.strokeStyle = wave.color;
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }
    
    animate(time = 0) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.waves.forEach(wave => {
            this.drawWave(wave, time * 0.01);
        });
        
        this.animationId = requestAnimationFrame((t) => this.animate(t));
    }
    
    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
}

// ===== EPISODE FILTERS =====
class EpisodeFilter {
    constructor() {
        this.filterBtns = document.querySelectorAll('.filter-chip');
        this.episodeCards = document.querySelectorAll('.episode-card');
        this.currentFilter = 'all';
        
        this.init();
    }
    
    init() {
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.dataset.filter;
                this.setFilter(filter);
                
                // Update active state
                this.filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
            });
        });
    }
    
    setFilter(filter) {
        this.currentFilter = filter;
        
        this.episodeCards.forEach(card => {
            if (filter === 'all') {
                card.style.display = 'block';
                setTimeout(() => {
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 50);
            } else {
                const category = card.dataset.category;
                if (category === filter) {
                    card.style.display = 'block';
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, 50);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 300);
                }
            }
        });
        
        this.updateCount();
    }
    
    updateCount() {
        const episodeCount = document.getElementById('episodeCount');
        const episodePlural = document.getElementById('episodePlural');
        const availablePlural = document.getElementById('availablePlural');
        
        let visibleCount = 0;
        this.episodeCards.forEach(card => {
            if (card.style.display !== 'none') {
                visibleCount++;
            }
        });
        
        episodeCount.textContent = visibleCount;
        episodePlural.textContent = visibleCount > 1 ? 's' : '';
        availablePlural.textContent = visibleCount > 1 ? 's' : '';
    }
}

// ===== LOAD EPISODE DURATIONS =====
function loadEpisodeDurations() {
    document.querySelectorAll('[data-audio]').forEach(btn => {
        const audioSrc = btn.dataset.audio;
        const card = btn.closest('.episode-card');
        if (!card) return;
        
        const episodeNum = card.dataset.episode;
        const durationEl = document.getElementById(`duration-${episodeNum}`);
        
        if (durationEl && durationEl.textContent === '--:--') {
            const tempAudio = new Audio(audioSrc);
            tempAudio.addEventListener('loadedmetadata', () => {
                const mins = Math.floor(tempAudio.duration / 60);
                const secs = Math.floor(tempAudio.duration % 60);
                durationEl.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
            });
        }
    });
}

// ===== INITIALIZE ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', () => {
    // Initialize audio player
    const player = new PodcastPlayer();
    
    // Initialize sound wave animation
    const waveAnimation = new SoundWaveAnimation('waveCanvas');
    
    // Initialize filters
    const filters = new EpisodeFilter();
    
    // Load episode durations
    loadEpisodeDurations();
    
    // Update episode count
    const totalEpisodes = document.querySelectorAll('.episode-card').length;
    document.getElementById('episodeCount').textContent = totalEpisodes;
    document.getElementById('episodePlural').textContent = totalEpisodes > 1 ? 's' : '';
    document.getElementById('availablePlural').textContent = totalEpisodes > 1 ? 's' : '';

    // Like & View system
    document.querySelectorAll('.btn-like').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const episodeId = btn.dataset.episode;
            await incrementLike(episodeId);
        });
    });

    document.querySelectorAll('.btn-listen, .play-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const card = btn.closest('.episode-card');
            const episodeId = card?.dataset.episode;
            if (episodeId) await incrementView(episodeId);
        });
    });

    // Charger les likes/vues au démarrage
    loadLikesViews();
});

// API Vercel config for podcast stats
const PODCAST_API_CONFIG = {
    BASE_URL: 'https://word-wave-auth-proxy.vercel.app',
    ENDPOINT: '/api/podcast-stats',
};

// Charger les likes/vues depuis le backend Vercel
async function loadLikesViews() {
    try {
        const response = await fetch(`${PODCAST_API_CONFIG.BASE_URL}${PODCAST_API_CONFIG.ENDPOINT}`);
        if (response.ok) {
            const stats = await response.json();
            Object.entries(stats).forEach(([episodeId, data]) => {
                const likesEl = document.getElementById(`likes-${episodeId}`);
                const viewsEl = document.getElementById(`views-${episodeId}`);
                if (likesEl) likesEl.textContent = data.likes || 0;
                if (viewsEl) viewsEl.textContent = data.views || 0;
            });
        }
    } catch (error) {
        console.error('Erreur chargement stats podcasts:', error);
    }
}

// Incrémenter le nombre de vues
async function incrementView(episodeId) {
    try {
        const response = await fetch(`${PODCAST_API_CONFIG.BASE_URL}${PODCAST_API_CONFIG.ENDPOINT}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ episodeId, action: 'view' })
        });
        if (response.ok) {
            const data = await response.json();
            const viewsEl = document.getElementById(`views-${episodeId}`);
            if (viewsEl) viewsEl.textContent = data.views;
        }
    } catch (error) {
        console.error('Erreur incrément vue:', error);
    }
}

// Incrémenter le nombre de likes
async function incrementLike(episodeId) {
    try {
        const response = await fetch(`${PODCAST_API_CONFIG.BASE_URL}${PODCAST_API_CONFIG.ENDPOINT}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ episodeId, action: 'like' })
        });
        if (response.ok) {
            const data = await response.json();
            const likesEl = document.getElementById(`likes-${episodeId}`);
            if (likesEl) likesEl.textContent = data.likes;
        }
    } catch (error) {
        console.error('Erreur incrément like:', error);
    }
}
