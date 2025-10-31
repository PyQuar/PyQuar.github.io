# 🏆 Configuration du Système d'Inscription ESSAI LEAGUE

## 📋 Vue d'ensemble

Ce système permet aux participants de s'inscrire au tournoi de football via un formulaire en ligne. Les données sont sauvegardées dans:
- **localStorage** (stockage temporaire local)
- **GitHub Gist** (stockage cloud - à configurer)
- **Google Sheets** (export CSV)

---

## 🔧 Configuration GitHub Gist

### Étape 1: Créer un Gist

1. Allez sur [gist.github.com](https://gist.github.com)
2. Créez un nouveau Gist avec:
   - **Nom du fichier**: `essai-league-registrations.json`
   - **Contenu initial**: `[]`
   - **Type**: Public ou Secret (recommandé: Secret)
3. Cliquez sur "Create public gist" ou "Create secret gist"
4. Copiez l'ID du Gist depuis l'URL (ex: `https://gist.github.com/username/ABC123DEF456`)

### Étape 2: Créer un Token d'Accès Personnel

1. Allez dans **Settings** > **Developer settings** > **Personal access tokens** > **Tokens (classic)**
2. Cliquez sur "Generate new token (classic)"
3. Donnez un nom au token (ex: "Essai League Registrations")
4. Cochez la permission: **gist** (Create gists)
5. Cliquez sur "Generate token"
6. **⚠️ IMPORTANT**: Copiez le token immédiatement (vous ne pourrez plus le voir)

### Étape 3: Configurer le Code

Dans `js/register.js`, remplacez:

```javascript
const GIST_CONFIG = {
    GIST_ID: 'VOTRE_GIST_ID_ICI',  // Collez l'ID de votre Gist
    FILENAME: 'essai-league-registrations.json',
    TOKEN: 'VOTRE_TOKEN_ICI'  // Collez votre token GitHub
};
```

### Étape 4: Activer la Sauvegarde Gist

Dans `js/register.js`, décommentez le code dans la fonction `saveToGist()`:

```javascript
async function saveToGist() {
    localStorage.setItem('essai-league-registrations', JSON.stringify(participants));
    
    // Décommentez ce bloc:
    const response = await fetch(`https://api.github.com/gists/${GIST_CONFIG.GIST_ID}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `token ${GIST_CONFIG.TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            files: {
                [GIST_CONFIG.FILENAME]: {
                    content: JSON.stringify(participants, null, 2)
                }
            }
        })
    });
    
    if (!response.ok) {
        throw new Error('Erreur lors de la sauvegarde dans le Gist');
    }
}
```

---

## 📊 Configuration Google Sheets

### Option 1: Export CSV Manuel

1. Ouvrez la console du navigateur (F12)
2. Tapez: `exportRegistrations()`
3. Un fichier CSV sera téléchargé
4. Importez-le dans Google Sheets:
   - Fichier > Importer > Upload
   - Sélectionnez votre CSV
   - Choisissez "Remplacer la feuille actuelle"

### Option 2: Intégration Automatique (Apps Script)

#### Étape 1: Créer le Google Sheet

1. Créez un nouveau [Google Sheet](https://sheets.google.com)
2. Nommez-le "Essai League - Inscriptions"
3. Ajoutez les en-têtes dans la première ligne:
   - A1: Prénom
   - B1: Nom
   - C1: Carte d'Identité
   - D1: Email
   - E1: Téléphone
   - F1: 1er Choix
   - G1: 2ème Choix
   - H1: 3ème Choix
   - I1: Date d'Inscription

#### Étape 2: Créer le Script Apps Script

1. Dans votre Google Sheet: **Extensions** > **Apps Script**
2. Supprimez le code par défaut
3. Collez ce code:

```javascript
function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const data = JSON.parse(e.postData.contents);
    
    // Ajouter une nouvelle ligne
    sheet.appendRow([
      data.firstName,
      data.lastName,
      data.idCard,
      data.email,
      data.phone,
      data.positions[0],
      data.positions[1],
      data.positions[2],
      new Date(data.registrationDate).toLocaleString('fr-FR')
    ]);
    
    return ContentService.createTextOutput(JSON.stringify({
      success: true,
      message: 'Inscription enregistrée avec succès'
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
```

4. Sauvegardez le projet (Ctrl+S)

#### Étape 3: Déployer le Script

1. Cliquez sur **Déployer** > **Nouveau déploiement**
2. Cliquez sur l'icône ⚙️ à côté de "Sélectionner le type"
3. Choisissez **Application Web**
4. Configurez:
   - Description: "API d'inscription Essai League"
   - Exécuter en tant que: **Moi**
   - Qui a accès: **Tout le monde**
5. Cliquez sur **Déployer**
6. Copiez l'**URL de l'application web**

#### Étape 4: Intégrer avec le Site Web

Dans `js/register.js`, dans la fonction `saveToGist()`, ajoutez:

```javascript
// Sauvegarder dans Google Sheets
await fetch('VOTRE_URL_GOOGLE_SCRIPT_ICI', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(formData)
});
```

---

## 🎯 Fonctionnalités du Formulaire

### Champs du Formulaire
- ✅ **Prénom** (requis)
- ✅ **Nom** (requis)
- ✅ **Carte d'Identité** (requis, 8 chiffres)
- ⚪ **Email** (optionnel)
- ⚪ **Téléphone** (optionnel)
- ✅ **Classement des postes** (requis, drag & drop)

### Système de Drag & Drop
- Les participants peuvent glisser-déposer les positions pour les classer
- 3 positions: Attaque, Milieu, Défense
- Le premier choix est mis en évidence sur la carte du participant

### Validation
- ✅ Vérification que la carte d'identité n'est pas déjà inscrite
- ✅ Format de carte d'identité (8 chiffres)
- ✅ Tous les champs requis doivent être remplis

---

## 👥 Affichage des Participants

### Filtres Disponibles
- **Tous**: Affiche tous les participants
- **Attaquants**: Participants ayant choisi Attaque en 1er choix
- **Milieux**: Participants ayant choisi Milieu en 1er choix
- **Défenseurs**: Participants ayant choisi Défense en 1er choix

### Carte Participant
Chaque carte affiche:
- Initiales (avatar)
- Nom complet
- Numéro de carte d'identité
- Classement des 3 positions préférées
- Email et téléphone (si fournis)

---

## 🔒 Sécurité

### ⚠️ IMPORTANT - Ne JAMAIS exposer votre token

**Problème**: Le token GitHub est visible dans le code JavaScript

**Solutions**:

#### Option 1: Backend Proxy (Recommandé)
Créez un petit serveur backend (Node.js, Python, PHP) qui:
1. Reçoit les données du formulaire
2. Fait la requête GitHub avec le token côté serveur
3. Le token reste secret

#### Option 2: GitHub Actions
Utilisez GitHub Actions pour:
1. Recevoir un webhook
2. Mettre à jour le Gist automatiquement

#### Option 3: Netlify Functions / Vercel
Utilisez des fonctions serverless pour gérer le token en sécurité

---

## 📱 Responsive Design

Le site est entièrement responsive:
- 📱 Mobile (< 480px)
- 📱 Tablette (480px - 768px)
- 💻 Desktop (> 768px)

---

## 🎨 Thème Football

### Couleurs
- **Vert terrain**: `#00A651` (Principal)
- **Vert foncé**: `#007A3D` (Accent)
- **Or**: `#FFD700` (Trophées)
- **Bleu marine**: `#0A2463` (Textes importants)

### Éléments visuels
- ⚽ Ballons de foot flottants
- 🏟️ Motif de terrain de foot en arrière-plan
- 🏆 Icône de trophée animée
- 🎯 Icônes de positions (attaque, milieu, défense)

---

## 🚀 Déploiement

1. **Testez localement**:
   ```bash
   # Utilisez un serveur local
   python -m http.server 8000
   # ou
   npx serve
   ```

2. **Déployez sur GitHub Pages**:
   - Push vers votre repo GitHub
   - Settings > Pages > Source: main branch
   - Le site sera disponible sur `https://username.github.io`

3. **Configurez les liens**:
   - Mettez à jour le lien "Register" dans `index.html`
   - Ajoutez `register.html` dans le menu de navigation

---

## 📞 Support

Pour toute question:
- 📧 Email: contact@wavyessai.com
- 📱 Téléphone: +216 22 222 227
- 🌐 Site: [wavyessai.com](https://wavyessai.com)

---

## 📝 License

© 2025 Wavy Essai Press Club. Tous droits réservés.
