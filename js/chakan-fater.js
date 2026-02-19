// ===== CHAKAN FATER — RAMADAN REGISTRATION SYSTEM =====

// Configuration — Same Vercel proxy, new endpoint
const CHAKAN_API = {
    BASE_URL: 'https://word-wave-auth-proxy.vercel.app',
    REGISTER_ENDPOINT: '/api/register-chakan-fater',
};

// App state
let guests = [];

// ===== FORM SUBMISSION =====
const chakanForm = document.getElementById('chakanForm');
const submitBtn = document.getElementById('submitBtn');
const formMessage = document.getElementById('formMessage');

if (chakanForm) {
chakanForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Disable button
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> <span>Inscription en cours...</span>';

    // Gather dietary preferences (if the field exists)
    const dietCheckboxes = document.querySelectorAll('input[name="diet"]:checked');
    const dietPreferences = Array.from(dietCheckboxes).map(cb => cb.value);

    // Safely get all fields
    const firstNameEl = document.getElementById('firstName');
    const lastNameEl = document.getElementById('lastName');
    const phoneEl = document.getElementById('phone');
    const emailEl = document.getElementById('email');
    const guestsEl = document.getElementById('guests');
    const allergiesEl = document.getElementById('allergies');
    const contributionEl = document.getElementById('contribution');
    const messageEl = document.getElementById('message');

    // Build form data
    const formData = {
        firstName: firstNameEl ? firstNameEl.value.trim() : '',
        lastName: lastNameEl ? lastNameEl.value.trim() : '',
        phone: phoneEl ? phoneEl.value.trim() : '',
        email: emailEl ? emailEl.value.trim() || 'Non fourni' : 'Non fourni',
        guests: guestsEl ? (parseInt(guestsEl.value) || 1) : 1,
        dietPreferences: dietPreferences.length > 0 ? dietPreferences : ['normal'],
        allergies: allergiesEl ? allergiesEl.value.trim() : '',
        contribution: contributionEl ? contributionEl.value : 'non',
        message: messageEl ? messageEl.value.trim() : '',
        registrationDate: new Date().toISOString(),
        timestamp: Date.now()
    };

    // Validate
    if (!formData.firstName || !formData.lastName || !formData.phone) {
        showMessage('error', 'Veuillez remplir tous les champs obligatoires.');
        resetButton();
        return;
    }

    try {
        const response = await fetch(`${CHAKAN_API.BASE_URL}${CHAKAN_API.REGISTER_ENDPOINT}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (!response.ok) {
            if (response.status === 409) {
                throw new Error('Ce numéro de téléphone est déjà enregistré.');
            }
            throw new Error(result.error || 'Erreur lors de l\'inscription');
        }

        // Update local list
        guests = result.guests || [];
        localStorage.setItem('chakan-fater-registrations', JSON.stringify(guests));

        // Show success
        showMessage('success', `✅ رمضان كريم ! Bienvenue ${formData.firstName} ${formData.lastName} ! Votre inscription est confirmée.`);

        // Reset form
        chakanForm.reset();

        // Refresh guest list
        displayGuests();

        // Scroll to guest list
        setTimeout(() => {
            document.querySelector('.guests-section').scrollIntoView({ behavior: 'smooth' });
        }, 1500);

    } catch (error) {
        showMessage('error', `❌ Erreur: ${error.message}`);
        console.error('Erreur d\'inscription:', error);
    } finally {
        resetButton();
    }
});
} // end if (chakanForm)

function resetButton() {
    submitBtn.disabled = false;
    submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> <span>Confirmer ma Présence</span>';
}

function showMessage(type, message) {
    formMessage.className = `form-message ${type}`;
    formMessage.textContent = message;

    setTimeout(() => {
        formMessage.className = 'form-message';
        formMessage.textContent = '';
    }, 6000);
}

// ===== LOAD FROM GIST (via Vercel) =====
async function loadGuests() {
    try {
        // Load from localStorage first
        const stored = localStorage.getItem('chakan-fater-registrations');
        if (stored) {
            guests = JSON.parse(stored);
            displayGuests();
        }

        // Then fetch from server
        const response = await fetch(`${CHAKAN_API.BASE_URL}${CHAKAN_API.REGISTER_ENDPOINT}`);

        if (response.ok) {
            const data = await response.json();
            guests = (data.guests || []).map(g => ({
                ...g,
                paid: g.paid !== undefined ? g.paid : 0
            }));
            localStorage.setItem('chakan-fater-registrations', JSON.stringify(guests));
            console.log(`${guests.length} invités chargés depuis le serveur`);
        }

        displayGuests();
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
        guests = [];
        displayGuests();
    }
}

// ===== DISPLAY GUESTS =====
function displayGuests() {
    const grid = document.getElementById('guestsGrid');
    const noGuests = document.getElementById('noGuests');

    // Update stats
    updateStats();

    if (guests.length === 0) {
        grid.style.display = 'none';
        noGuests.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    noGuests.style.display = 'none';

    grid.innerHTML = guests.map(guest => createGuestCard(guest)).join('');
}

function createGuestCard(guest) {
    const initials = `${(guest.firstName || '?')[0]}${(guest.lastName || '?')[0]}`.toUpperCase();
    const isPaid = guest.paid === 1;

    const contributionLabels = {
        'non': '',
        'plat': '🍽️ Apporte un plat',
        'dessert': '🍰 Apporte un dessert',
        'boisson': '🥤 Apporte des boissons',
        'autre': '🎁 Autre contribution'
    };

    const contributionText = contributionLabels[guest.contribution] || '';

    return `
        <div class="guest-card${isPaid ? ' guest-paid' : ''}">
            <div class="guest-header">
                <div class="guest-avatar${isPaid ? ' avatar-paid' : ''}">${initials}</div>
                <div class="guest-info">
                    <h3>${guest.firstName} ${guest.lastName}${isPaid ? ' <span class="paid-indicator" title="Payé">✅</span>' : ''}</h3>
                    <span class="guest-meta">${new Date(guest.registrationDate).toLocaleDateString('fr-FR')}</span>
                </div>
            </div>

            <div class="guest-details">
                <span class="guest-badge people">
                    <i class="fas fa-users"></i> ${guest.guests || 1} personne${(guest.guests || 1) > 1 ? 's' : ''}
                </span>
                ${isPaid ? `
                    <span class="guest-badge paid-badge">
                        <i class="fas fa-check-circle"></i> Payé
                    </span>
                ` : `
                    <span class="guest-badge unpaid-badge">
                        <i class="fas fa-times-circle"></i> Non payé
                    </span>
                `}
                ${contributionText ? `
                    <span class="guest-badge contribution">
                        ${contributionText}
                    </span>
                ` : ''}
            </div>

            ${guest.message ? `
                <div class="guest-message">
                    "${guest.message}"
                </div>
            ` : ''}
        </div>
    `;
}

function updateStats() {
    const totalGuestsEl = document.getElementById('totalGuests');
    if (totalGuestsEl) {
        const count = Array.isArray(guests) ? guests.length : 0;
        totalGuestsEl.textContent = isNaN(count) ? 0 : count;
    }

    const totalPaidEl = document.getElementById('totalPaid');
    if (totalPaidEl) {
        const paidCount = Array.isArray(guests) ? guests.filter(g => g.paid === 1).length : 0;
        totalPaidEl.textContent = paidCount;
    }
}

// ===== EXPORT =====
function exportChakanRegistrations() {
    const headers = ['Prénom', 'Nom', 'Téléphone', 'Email', 'Nb Personnes', 'Régime', 'Allergies', 'Contribution', 'Message', 'Payé', 'Date'];
    const rows = guests.map(g => [
        g.firstName,
        g.lastName,
        g.phone,
        g.email,
        g.guests,
        (g.dietPreferences || []).join('; '),
        g.allergies || '',
        g.contribution,
        g.message || '',
        g.paid === 1 ? 'Oui' : 'Non',
        new Date(g.registrationDate).toLocaleString('fr-FR')
    ]);

    const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `chakan-fater-registrations-${Date.now()}.csv`;
    link.click();
}

window.exportChakanRegistrations = exportChakanRegistrations;

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
    loadGuests();
    console.log('%c🌙 Chakan Fater — Ramadan 2026', 'color: #d4a017; font-size: 16px; font-weight: bold;');
    console.log('Pour exporter les inscriptions: exportChakanRegistrations()');
});
