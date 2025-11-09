// =================================================================
//  WAVY ESSAI - MUSIC SUGGESTIONS
//  Spotify Playlist & Music Suggestions System
// =================================================================

// API Vercel config for music suggestions
const MUSIC_API_CONFIG = {
    BASE_URL: 'https://word-wave-auth-proxy.vercel.app',
    ENDPOINT: '/api/music-suggestions',
};

// ===== FORM SUBMISSION =====
document.getElementById('suggestionForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        songTitle: document.getElementById('songTitle').value.trim(),
        artistName: document.getElementById('artistName').value.trim(),
        spotifyLink: document.getElementById('spotifyLink').value.trim() || null,
        suggestedBy: document.getElementById('suggestedBy').value.trim(),
        timestamp: Date.now(),
        date: new Date().toISOString()
    };
    
    try {
        showMessage('Envoi en cours...', 'info');
        
        const response = await fetch(`${MUSIC_API_CONFIG.BASE_URL}${MUSIC_API_CONFIG.ENDPOINT}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        if (response.ok) {
            showMessage('✅ Suggestion envoyée avec succès !', 'success');
            document.getElementById('suggestionForm').reset();
            loadSuggestions(); // Reload suggestions
        } else {
            throw new Error('Erreur lors de l\'envoi');
        }
    } catch (error) {
        console.error('Error submitting suggestion:', error);
        showMessage('❌ Erreur lors de l\'envoi. Réessayez.', 'error');
    }
});

// ===== LOAD SUGGESTIONS =====
async function loadSuggestions() {
    const listContainer = document.getElementById('suggestionsList');
    const countEl = document.getElementById('suggestionsCount');
    
    try {
        const response = await fetch(`${MUSIC_API_CONFIG.BASE_URL}${MUSIC_API_CONFIG.ENDPOINT}`);
        
        if (!response.ok) {
            throw new Error('Failed to load suggestions');
        }
        
        const suggestions = await response.json();
        
        // Sort by date (most recent first)
        const sortedSuggestions = suggestions.sort((a, b) => b.timestamp - a.timestamp);
        
        // Update count
        countEl.textContent = sortedSuggestions.length;
        
        // Display suggestions
        if (sortedSuggestions.length === 0) {
            listContainer.innerHTML = `
                <div class="no-suggestions">
                    <i class="fas fa-music"></i>
                    <p>Aucune suggestion pour le moment. Soyez le premier !</p>
                </div>
            `;
        } else {
            listContainer.innerHTML = sortedSuggestions.map(suggestion => `
                <div class="suggestion-card">
                    <div class="suggestion-header">
                        <div class="song-info">
                            <h4>${escapeHtml(suggestion.songTitle)}</h4>
                            <p><i class="fas fa-microphone"></i> ${escapeHtml(suggestion.artistName)}</p>
                        </div>
                        ${suggestion.spotifyLink ? `
                            <a href="${escapeHtml(suggestion.spotifyLink)}" 
                               target="_blank" 
                               rel="noopener noreferrer" 
                               class="spotify-link">
                                <i class="fab fa-spotify"></i>
                                <span>Écouter</span>
                            </a>
                        ` : ''}
                    </div>
                    <div class="suggestion-footer">
                        <span class="suggested-by">
                            <i class="fas fa-user"></i>
                            Suggéré par ${escapeHtml(suggestion.suggestedBy)}
                        </span>
                        <span class="suggestion-date">
                            <i class="fas fa-clock"></i>
                            ${formatDate(suggestion.date)}
                        </span>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading suggestions:', error);
        listContainer.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Erreur lors du chargement des suggestions</p>
            </div>
        `;
    }
}

// ===== HELPER FUNCTIONS =====
function showMessage(message, type) {
    const messageEl = document.getElementById('formMessage');
    messageEl.textContent = message;
    messageEl.className = `form-message ${type}`;
    
    if (type === 'success') {
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 5000);
    }
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    
    return date.toLocaleDateString('fr-FR', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
    });
}

// ===== INITIALIZE ON PAGE LOAD =====
document.addEventListener('DOMContentLoaded', () => {
    loadSuggestions();
});
