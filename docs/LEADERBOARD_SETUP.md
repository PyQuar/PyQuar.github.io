# 🏆 Configuration du Leaderboard Global

Le système de leaderboard sauvegarde les stats de TOUS les joueurs dans un seul Gist central que tu possèdes, permettant de créer un classement global.

## 🎯 Avantages

- ✅ **Leaderboard global** - Tous les joueurs dans un seul classement
- ✅ **Données centralisées** - Un seul Gist au lieu d'un par joueur
- ✅ **Public** - Tout le monde peut voir le leaderboard
- ✅ **Facile à gérer** - Tu contrôles toutes les données
- ✅ **Moins de requêtes API** - Meilleure performance

## 📋 Configuration Initiale (Une seule fois)

### Étape 1 : Créer le Gist du Leaderboard

1. Ouvre le jeu : https://wavyessai.me/game.html
2. Connecte-toi avec ton compte GitHub (PyQuar)
3. Ouvre la console du navigateur (F12)
4. Exécute cette commande :

```javascript
createLeaderboardGist()
```

5. Copie le Gist ID qui apparaît

### Étape 2 : Configurer le Gist ID

1. Ouvre le fichier `js/auth.js`
2. Trouve la ligne (environ ligne 11):
```javascript
LEADERBOARD_GIST_ID: '', // TODO: Set this
```

3. Colle ton Gist ID :
```javascript
LEADERBOARD_GIST_ID: 'ton-gist-id-ici',
```

4. Sauvegarde, commit, et push :
```bash
git add js/auth.js
git commit -m "Configure leaderboard Gist ID"
git push origin main --force
```

## 🎮 Utilisation

### Pour les Joueurs

Rien ne change ! Les joueurs :
1. Se connectent avec GitHub
2. Jouent normalement
3. Leurs stats sont automatiquement sauvegardées dans le leaderboard

### Voir le Leaderboard (Console)

Dans la console du navigateur :

```javascript
// Afficher le top 10
showLeaderboard()

// Afficher le top 20
showLeaderboard(20)

// Voir tous les joueurs
const leaderboard = await authManager.loadLeaderboard()
console.log(leaderboard.players)
```

## 🏗️ Structure des Données

Le Gist `wordwave-leaderboard.json` contient :

```json
{
  "players": {
    "PyQuar": {
      "username": "PyQuar",
      "avatar": "https://avatars.githubusercontent.com/u/...",
      "stats": {
        "gamesPlayed": 10,
        "gamesWon": 8,
        "currentStreak": 3,
        "maxStreak": 5,
        "guessDistribution": [0, 2, 3, 2, 1, 0]  // [1 essai, 2 essais, ..., 6 essais]
      },
      "lastPlayedDate": "2025-10-19",  // Date du dernier jeu (format YYYY-MM-DD)
      "gameState": {                    // État de la dernière board jouée
        "targetWord": "PROBE",
        "guesses": ["PRESS", "PROBE"],
        "gameOver": true,
        "isWin": true,
        "currentRow": 2
      },
      "lastUpdated": "2025-10-19T12:00:00.000Z"
    },
    "autreJoueur": {
      ...
    }
  },
  "lastUpdated": "2025-10-19T12:00:00.000Z",
  "version": "2.0"
}
```

## 📊 Classement

Les joueurs sont classés par :
1. **Nombre de victoires** (plus = mieux) - Critère principal
2. **Total des tentatives** (moins = mieux) - En cas d'égalité

### Comment sont comptées les tentatives ?

Le total des tentatives est calculé à partir de la distribution des victoires :
- Si tu gagnes en 1 essai : +1 tentative
- Si tu gagnes en 2 essais : +2 tentatives
- Si tu gagnes en 3 essais : +3 tentatives
- etc.

**Exemple :**
- Joueur A : 10 victoires, 25 tentatives totales (moyenne : 2.5 essais/victoire)
- Joueur B : 10 victoires, 30 tentatives totales (moyenne : 3.0 essais/victoire)
- → **Joueur A est premier** (même nombre de victoires, mais moins de tentatives)

### Pourquoi ce système ?

✅ Récompense la **consistance** - Gagner souvent compte le plus
✅ Récompense l'**efficacité** - Gagner rapidement départage les égalités
✅ **Équitable** - Pas de pénalité pour jouer plus (seules les victoires comptent)
✅ **Anti-triche** - Le système sauvegarde la dernière board jouée et la date

## 🔧 Fonctions API Disponibles

### Pour les Développeurs

```javascript
// Charger le leaderboard complet
const leaderboard = await authManager.loadLeaderboard()

// Obtenir le top N joueurs (triés)
const topPlayers = await authManager.getTopPlayers(10)

// Sauvegarder les stats d'un joueur
await authManager.saveStats(stats, lastPlayedDate, gameState)

// Afficher le leaderboard dans la console
showLeaderboard(10)
```

## 🎨 Affichage UI (À venir)

Tu peux créer une page `leaderboard.html` pour afficher le classement :

```javascript
async function displayLeaderboard() {
    const players = await authManager.getTopPlayers(10);
    
    players.forEach((player, index) => {
        const winRate = player.stats.gamesPlayed > 0 
            ? Math.round((player.stats.gamesWon / player.stats.gamesPlayed) * 100)
            : 0;
            
        // Afficher: rang, avatar, nom, stats
        console.log(`${index + 1}. ${player.username} - ${winRate}%`);
    });
}
```

## 🔒 Permissions

- **Lecture** : Tout le monde (Gist public)
- **Écriture** : Seulement les joueurs connectés (pour leurs propres stats)
- **Gestion** : Toi (propriétaire du Gist)

## 🛡️ Protection Anti-Triche

Le système empêche les joueurs de tricher de plusieurs façons :

### 1. Une partie par jour maximum
- Le système sauvegarde `lastPlayedDate` pour chaque joueur
- Le jeu vérifie cette date avant de permettre une nouvelle partie
- Si `lastPlayedDate` = aujourd'hui → le joueur ne peut pas rejouer

### 2. Sauvegarde de la board complète
- Chaque partie jouée est sauvegardée dans `gameState` :
  - Le mot cible (`targetWord`)
  - Toutes les tentatives (`guesses`)
  - L'état final (`gameOver`, `isWin`)
  - La rangée actuelle (`currentRow`)
- Impossible de modifier les résultats après coup

### 3. Vérification côté serveur
- Les stats sont dans TON Gist (contrôle central)
- Les joueurs ne peuvent modifier que leurs propres données
- GitHub API valide l'authentification

### 4. Détection d'incohérences
Le système peut détecter :
- Nombre de victoires > nombre de parties jouées
- Distribution invalide (somme ≠ victoires)
- Dates futures
- Multiple parties le même jour

### Comment un joueur pourrait-il essayer de tricher ?

❌ **Supprimer localStorage** → Le système recharge depuis le Gist
❌ **Changer la date système** → Le serveur utilise la date réelle
❌ **Modifier le code client** → Les stats sont validées côté serveur
❌ **Rejouer plusieurs fois** → `lastPlayedDate` l'empêche
✅ **Aucune triche possible sans accès à ton compte GitHub**

## ⚠️ Important

1. **Ne supprime pas le Gist** - Toutes les données seraient perdues
2. **Sauvegarde régulière** - GitHub Gists sont fiables mais sauvegarde le JSON occasionnellement
3. **Limite API** - GitHub limite à 5000 requêtes/heure par utilisateur authentifié

## 🚀 Migration depuis l'ancien système

Si des joueurs avaient déjà des stats dans leurs Gists personnels, elles seront automatiquement migrées la prochaine fois qu'ils se connectent (car le système charge d'abord depuis leurs stats locales s'ils n'ont pas de données dans le leaderboard).

## 📝 Logs

Le système affiche des logs dans la console :
- ✅ `Stats saved to leaderboard` - Sauvegarde réussie
- ✅ `Stats loaded from leaderboard` - Chargement réussi
- ⚠️ `Leaderboard Gist ID not configured` - ID manquant
- ❌ `Error updating leaderboard` - Erreur de sauvegarde

## 🔗 Liens Utiles

- **Ton Gist** : https://gist.github.com/PyQuar/[ton-gist-id]
- **API GitHub Gists** : https://docs.github.com/en/rest/gists
- **Voir les données** : Ouvre le Gist dans GitHub pour voir le JSON

