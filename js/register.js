// ===== ESSAI LEAGUE - REGISTRATION SYSTEM =====

// Configuration API Vercel
const API_CONFIG = {
    BASE_URL: 'https://word-wave-auth-proxy.vercel.app',
    REGISTER_ENDPOINT: '/api/register-tournament',
};

// État de l'application
let participants = [];
let currentFilter = 'all';

// ===== DRAG & DROP POSITIONS =====
const positionsContainer = document.getElementById('positionsContainer');
let draggedElement = null;

function initDragAndDrop() {
    const positionItems = positionsContainer.querySelectorAll('.position-item');
    
    positionItems.forEach(item => {
        item.addEventListener('dragstart', handleDragStart);
        item.addEventListener('dragend', handleDragEnd);
        item.addEventListener('dragover', handleDragOver);
        item.addEventListener('drop', handleDrop);
        item.addEventListener('dragenter', handleDragEnter);
        item.addEventListener('dragleave', handleDragLeave);
    });
}

function handleDragStart(e) {
    draggedElement = this;
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', this.innerHTML);
}

function handleDragEnd(e) {
    this.classList.remove('dragging');
    
    // Mettre à jour les rangs
    updatePositionRanks();
}

function handleDragOver(e) {
    if (e.preventDefault) {
        e.preventDefault();
    }
    e.dataTransfer.dropEffect = 'move';
    return false;
}

function handleDragEnter(e) {
    this.classList.add('drag-over');
}

function handleDragLeave(e) {
    this.classList.remove('drag-over');
}

function handleDrop(e) {
    if (e.stopPropagation) {
        e.stopPropagation();
    }
    
    if (draggedElement !== this) {
        const allItems = Array.from(positionsContainer.querySelectorAll('.position-item'));
        const draggedIndex = allItems.indexOf(draggedElement);
        const targetIndex = allItems.indexOf(this);
        
        if (draggedIndex < targetIndex) {
            this.parentNode.insertBefore(draggedElement, this.nextSibling);
        } else {
            this.parentNode.insertBefore(draggedElement, this);
        }
    }
    
    this.classList.remove('drag-over');
    return false;
}

function updatePositionRanks() {
    const items = positionsContainer.querySelectorAll('.position-item');
    const ranks = ['1er choix', '2ème choix', '3ème choix'];
    
    items.forEach((item, index) => {
        const rankElement = item.querySelector('.position-rank');
        rankElement.textContent = ranks[index];
    });
}

function getPositionPreferences() {
    const items = positionsContainer.querySelectorAll('.position-item');
    return Array.from(items).map(item => item.dataset.position);
}

// ===== FORM SUBMISSION =====
const registrationForm = document.getElementById('registrationForm');
const submitBtn = document.getElementById('submitBtn');
const formMessage = document.getElementById('formMessage');

registrationForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Désactiver le bouton
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Inscription en cours...</span>';
    
    // Récupérer les données du formulaire
    const formData = {
        firstName: document.getElementById('firstName').value.trim(),
        lastName: document.getElementById('lastName').value.trim(),
        idCard: document.getElementById('idCard').value.trim(),
        email: document.getElementById('email').value.trim() || 'Non fourni',
        phone: document.getElementById('phone').value.trim() || 'Non fourni',
        positions: getPositionPreferences(),
        registrationDate: new Date().toISOString(),
        timestamp: Date.now()
    };
    
    try {
        // Envoyer au backend Vercel
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.REGISTER_ENDPOINT}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (!response.ok) {
            if (response.status === 409) {
                throw new Error('Cette carte d\'identité est déjà enregistrée.');
            }
            throw new Error(result.error || 'Erreur lors de l\'inscription');
        }
        
        // Mettre à jour la liste locale
        participants = result.participants || [];
        localStorage.setItem('essai-league-registrations', JSON.stringify(participants));
        
        // Afficher le message de succès
        showMessage('success', `✅ Inscription réussie ! Bienvenue ${formData.firstName} ${formData.lastName} !`);
        
        // Réinitialiser le formulaire
        registrationForm.reset();
        initDragAndDrop();
        updatePositionRanks();
        
        // Actualiser la liste des participants
        displayParticipants();
        
        // Scroll vers la liste des participants
        setTimeout(() => {
            document.querySelector('.participants-section').scrollIntoView({ behavior: 'smooth' });
        }, 1500);
        
    } catch (error) {
        showMessage('error', `❌ Erreur: ${error.message}`);
        console.error('Erreur d\'inscription:', error);
    } finally {
        // Réactiver le bouton
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> <span>S\'inscrire au Tournoi</span>';
    }
});

function isAlreadyRegistered(idCard) {
    return participants.some(p => p.idCard === idCard);
}

function showMessage(type, message) {
    formMessage.className = `form-message ${type}`;
    formMessage.textContent = message;
    
    setTimeout(() => {
        formMessage.className = 'form-message';
        formMessage.textContent = '';
    }, 5000);
}

// ===== GIST INTEGRATION =====
// Sauvegarder dans GitHub Gist (via Vercel proxy)
async function saveToGist() {
    // Cette fonction n'est plus utilisée car tout passe par l'API Vercel
    localStorage.setItem('essai-league-registrations', JSON.stringify(participants));
    console.log('Sauvegarde locale effectuée');
}

// Charger depuis GitHub Gist (via Vercel proxy)
async function loadFromGist() {
    try {
        // Charger depuis localStorage d'abord
        const stored = localStorage.getItem('essai-league-registrations');
        if (stored) {
            participants = JSON.parse(stored);
        }
        
        // Puis charger depuis l'API Vercel
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.REGISTER_ENDPOINT}`);
        
        if (response.ok) {
            const data = await response.json();
            participants = data.participants || [];
            localStorage.setItem('essai-league-registrations', JSON.stringify(participants));
            console.log(`${participants.length} participants chargés depuis le serveur`);
        }
        
        displayParticipants();
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
        participants = [];
        displayParticipants();
    }
}

// ===== EXPORT TO GOOGLE SHEETS =====
function exportToGoogleSheets() {
    // Créer un CSV
    const headers = ['Prénom', 'Nom', 'Carte d\'Identité', 'Email', 'Téléphone', '1er Choix', '2ème Choix', '3ème Choix', 'Date d\'Inscription'];
    const rows = participants.map(p => [
        p.firstName,
        p.lastName,
        p.idCard,
        p.email,
        p.phone,
        p.positions[0],
        p.positions[1],
        p.positions[2],
        new Date(p.registrationDate).toLocaleString('fr-FR')
    ]);
    
    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.join(','))
    ].join('\n');
    
    // Télécharger le CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `essai-league-registrations-${Date.now()}.csv`;
    link.click();
    
    console.log('CSV téléchargé ! Vous pouvez l\'importer dans Google Sheets.');
}

// Ajouter un bouton d'export (optionnel)
window.exportRegistrations = exportToGoogleSheets;

// ===== DISPLAY PARTICIPANTS =====
function displayParticipants() {
    const grid = document.getElementById('participantsGrid');
    const noParticipants = document.getElementById('noParticipants');
    const totalPlayersEl = document.getElementById('totalPlayers');
    
    // Mettre à jour le compteur total (si l'élément existe)
    if (totalPlayersEl) {
        totalPlayersEl.textContent = participants.length;
    }
    
    // Filtrer les participants
    let filtered = participants;
    if (currentFilter !== 'all') {
        filtered = participants.filter(p => p.positions[0] === currentFilter);
    }
    
    // Mettre à jour les compteurs des filtres
    updateFilterCounts();
    
    if (filtered.length === 0) {
        grid.style.display = 'none';
        noParticipants.style.display = 'block';
        return;
    }
    
    grid.style.display = 'grid';
    noParticipants.style.display = 'none';
    
    // Générer les cartes
    grid.innerHTML = filtered.map(participant => createParticipantCard(participant)).join('');
}

function createParticipantCard(participant) {
    const initials = `${participant.firstName[0]}${participant.lastName[0]}`.toUpperCase();
    const primaryPosition = participant.positions[0];
    const positionIcons = {
        attaque: 'fa-crosshairs',
        milieu: 'fa-compass',
        defense: 'fa-shield-alt'
    };
    const positionNames = {
        attaque: 'Attaque',
        milieu: 'Milieu',
        defense: 'Défense'
    };
    
    return `
        <div class="participant-card" data-primary-position="${primaryPosition}">
            <div class="participant-header">
                <div class="participant-avatar">${initials}</div>
                <div class="participant-info">
                    <h3>${participant.firstName} ${participant.lastName}</h3>
                </div>
            </div>
            
            <div class="participant-positions">
                ${participant.positions.map((pos, index) => `
                    <div class="position-badge ${index === 0 ? 'primary' : 'secondary'}">
                        <i class="fas ${positionIcons[pos]}"></i>
                        <span>${index + 1}. ${positionNames[pos]}</span>
                    </div>
                `).join('')}
            </div>
            
            ${participant.email !== 'Non fourni' || participant.phone !== 'Non fourni' ? `
                <div class="participant-contact">
                    ${participant.email !== 'Non fourni' ? `<div><i class="fas fa-envelope"></i> ${participant.email}</div>` : ''}
                    ${participant.phone !== 'Non fourni' ? `<div><i class="fas fa-phone"></i> ${participant.phone}</div>` : ''}
                </div>
            ` : ''}
        </div>
    `;
}

function updateFilterCounts() {
    const countAll = document.getElementById('countAll');
    const countAttaque = document.getElementById('countAttaque');
    const countMilieu = document.getElementById('countMilieu');
    const countDefense = document.getElementById('countDefense');
    
    // Mettre à jour les compteurs uniquement si les éléments existent
    if (countAll) countAll.textContent = participants.length;
    if (countAttaque) countAttaque.textContent = participants.filter(p => p.positions[0] === 'attaque').length;
    if (countMilieu) countMilieu.textContent = participants.filter(p => p.positions[0] === 'milieu').length;
    if (countDefense) countDefense.textContent = participants.filter(p => p.positions[0] === 'defense').length;
}

// ===== FILTERS =====
const filterBtns = document.querySelectorAll('.filter-btn');

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        // Retirer la classe active de tous les boutons
        filterBtns.forEach(b => b.classList.remove('active'));
        
        // Ajouter la classe active au bouton cliqué
        btn.classList.add('active');
        
        // Mettre à jour le filtre
        currentFilter = btn.dataset.filter;
        
        // Afficher les participants filtrés
        displayParticipants();
    });
});

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    // Initialiser le drag & drop
    initDragAndDrop();
    
    // Charger les participants
    loadFromGist();
    
    // Message dans la console pour l'export
    console.log('%c💾 Export des inscriptions', 'color: #00A651; font-size: 16px; font-weight: bold;');
    console.log('Pour exporter toutes les inscriptions en CSV, tapez: exportRegistrations()');
});

// ===== INSTRUCTIONS POUR GOOGLE SHEETS =====
/*
INSTRUCTIONS POUR INTÉGRER AVEC GOOGLE SHEETS:

1. Créer un Google Sheet
2. Aller dans Extensions > Apps Script
3. Coller ce code:

function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  const data = JSON.parse(e.postData.contents);
  
  sheet.appendRow([
    data.firstName,
    data.lastName,
    data.idCard,
    data.email,
    data.phone,
    data.positions[0],
    data.positions[1],
    data.positions[2],
    new Date(data.registrationDate)
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({success: true}));
}

4. Déployer en tant que Web App
5. Copier l'URL de déploiement
6. Dans ce fichier, ajouter à la fonction saveToGist():

*/
