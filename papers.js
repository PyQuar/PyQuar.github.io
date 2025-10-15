// Papers Page JavaScript
// Get DOM elements
const searchInput = document.getElementById('searchInput');
const clearSearchBtn = document.getElementById('clearSearch');
const clearTagsBtn = document.getElementById('clearTags');
const filterBtns = document.querySelectorAll('.filter-btn');
const tagFilterBtns = document.querySelectorAll('.tag-filter');
const papersGrid = document.getElementById('papersGrid');
const noResults = document.getElementById('noResults');
const resultsCount = document.getElementById('resultsCount');
const sortSelect = document.getElementById('sortSelect');
const activeFiltersDiv = document.getElementById('activeFilters');
const activeFiltersList = document.getElementById('activeFiltersList');

// State
let activeFilter = 'all';
let activeTags = new Set();
let searchQuery = '';
let allPapers = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    // Get all papers
    allPapers = Array.from(document.querySelectorAll('.paper-card'));
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Initial display
    updatePapersDisplay();
});

// Event Listeners
function initializeEventListeners() {
    // Search input
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        clearSearchBtn.style.display = searchQuery ? 'block' : 'none';
        updatePapersDisplay();
    });

    // Clear search
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.style.display = 'none';
        updatePapersDisplay();
    });

    // Filter buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            activeFilter = btn.getAttribute('data-filter');
            updatePapersDisplay();
        });
    });

    // Tag filter buttons
    tagFilterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tag = btn.getAttribute('data-tag');
            
            if (activeTags.has(tag)) {
                activeTags.delete(tag);
                btn.classList.remove('active');
            } else {
                activeTags.add(tag);
                btn.classList.add('active');
            }
            
            updateActiveFiltersDisplay();
            updatePapersDisplay();
        });
    });

    // Clear all tags
    clearTagsBtn.addEventListener('click', () => {
        activeTags.clear();
        tagFilterBtns.forEach(btn => btn.classList.remove('active'));
        updateActiveFiltersDisplay();
        updatePapersDisplay();
    });

    // Sort select
    sortSelect.addEventListener('change', () => {
        sortPapers();
        updatePapersDisplay();
    });
}

// Update active filters display
function updateActiveFiltersDisplay() {
    if (activeTags.size === 0) {
        activeFiltersDiv.style.display = 'none';
        return;
    }

    activeFiltersDiv.style.display = 'flex';
    activeFiltersList.innerHTML = '';

    activeTags.forEach(tag => {
        const filterTag = document.createElement('div');
        filterTag.className = 'active-filter-tag';
        filterTag.innerHTML = `
            ${tag.replace('-', ' ')}
            <button onclick="removeTag('${tag}')">×</button>
        `;
        activeFiltersList.appendChild(filterTag);
    });
}

// Remove tag
function removeTag(tag) {
    activeTags.delete(tag);
    tagFilterBtns.forEach(btn => {
        if (btn.getAttribute('data-tag') === tag) {
            btn.classList.remove('active');
        }
    });
    updateActiveFiltersDisplay();
    updatePapersDisplay();
}

// Filter papers
function filterPapers() {
    return allPapers.filter(paper => {
        // Search filter
        if (searchQuery) {
            const title = paper.querySelector('.paper-title').textContent.toLowerCase();
            const author = paper.querySelector('.paper-author').textContent.toLowerCase();
            const excerpt = paper.querySelector('.paper-excerpt').textContent.toLowerCase();
            const paperTags = paper.getAttribute('data-tags').toLowerCase();
            
            const matchesSearch = title.includes(searchQuery) || 
                                 author.includes(searchQuery) || 
                                 excerpt.includes(searchQuery) ||
                                 paperTags.includes(searchQuery);
            
            if (!matchesSearch) return false;
        }

        // Tag filter
        if (activeTags.size > 0) {
            const paperTags = paper.getAttribute('data-tags').split(',');
            const hasMatchingTag = Array.from(activeTags).some(tag => 
                paperTags.includes(tag)
            );
            
            if (!hasMatchingTag) return false;
        }

        // Category filter (recent, popular, etc.)
        if (activeFilter === 'recent') {
            const date = new Date(paper.getAttribute('data-date'));
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return date >= weekAgo;
        }

        if (activeFilter === 'popular') {
            const views = parseInt(paper.getAttribute('data-views'));
            return views >= 250;
        }

        return true;
    });
}

// Sort papers
function sortPapers() {
    const sortBy = sortSelect.value;

    allPapers.sort((a, b) => {
        switch (sortBy) {
            case 'newest':
                return new Date(b.getAttribute('data-date')) - new Date(a.getAttribute('data-date'));
            
            case 'oldest':
                return new Date(a.getAttribute('data-date')) - new Date(b.getAttribute('data-date'));
            
            case 'title':
                return a.querySelector('.paper-title').textContent.localeCompare(
                    b.querySelector('.paper-title').textContent
                );
            
            case 'author':
                return a.querySelector('.paper-author').textContent.localeCompare(
                    b.querySelector('.paper-author').textContent
                );
            
            default:
                return 0;
        }
    });
}

// Update papers display
function updatePapersDisplay() {
    const filteredPapers = filterPapers();
    
    // Clear grid
    papersGrid.innerHTML = '';
    
    // Show/hide no results
    if (filteredPapers.length === 0) {
        noResults.style.display = 'block';
        papersGrid.style.display = 'none';
    } else {
        noResults.style.display = 'none';
        papersGrid.style.display = 'grid';
        
        // Add filtered papers
        filteredPapers.forEach(paper => {
            papersGrid.appendChild(paper);
        });
    }
    
    // Update count
    updateResultsCount(filteredPapers.length);
    
    // Animate cards
    animateCards();
}

// Update results count
function updateResultsCount(count) {
    resultsCount.innerHTML = `Showing <strong>${count}</strong> paper${count !== 1 ? 's' : ''}`;
}

// Animate cards on display
function animateCards() {
    const cards = papersGrid.querySelectorAll('.paper-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease-out';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 50);
    });
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    // Focus search on Ctrl+K or Cmd+K
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
    }
    
    // Clear search on Escape
    if (e.key === 'Escape' && document.activeElement === searchInput) {
        searchInput.value = '';
        searchQuery = '';
        clearSearchBtn.style.display = 'none';
        updatePapersDisplay();
        searchInput.blur();
    }
});

// Smooth scroll to top of papers when filtering
function scrollToPapers() {
    const papersSection = document.querySelector('.papers-section');
    if (papersSection) {
        papersSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Add scroll to papers after filter change
filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        setTimeout(scrollToPapers, 100);
    });
});

// Loading state for async operations (for future use)
function showLoading() {
    papersGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px;">
            <div style="display: inline-block; width: 50px; height: 50px; border: 4px solid rgba(45, 212, 191, 0.3); border-top-color: #2dd4bf; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <p style="color: #e0e0e0; margin-top: 20px; font-size: 1.1rem;">Loading papers...</p>
        </div>
    `;
}

// Add spin animation
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Export functions for use in HTML
window.removeTag = removeTag;

// Console welcome message
console.log('%c🔬 Scientific Papers Section Loaded', 'font-size: 16px; font-weight: bold; color: #2dd4bf;');
console.log('%cUse Ctrl+K to quick search!', 'font-size: 12px; color: #20a39e;');
