# Déploiement de l'endpoint update-leaderboard

## Étapes pour déployer

### 1. Créer un Personal Access Token GitHub

1. Va sur https://github.com/settings/tokens
2. Clique sur **"Generate new token"** → **"Generate new token (classic)"**
3. Nom : `Word Wave Leaderboard Update`
4. Sélectionne le scope : **`gist`** (pour lire et écrire les Gists)
5. Clique sur **"Generate token"**
6. **COPIE LE TOKEN** (tu ne pourras plus le voir après !)

### 2. Ajouter le token sur Vercel

1. Va sur https://vercel.com/pyquar/word-wave-auth-proxy
2. Va dans **Settings** → **Environment Variables**
3. Ajoute une nouvelle variable :
   - **Name:** `GITHUB_ADMIN_TOKEN`
   - **Value:** Colle ton Personal Access Token
   - **Environments:** Sélectionne **Production, Preview, Development**
4. Clique sur **"Save"**

### 3. Déployer les changements

Dans le terminal, depuis le dossier `vercel-proxy` :

```powershell
cd vercel-proxy
vercel --prod
```

OU simplement push vers GitHub et Vercel déploiera automatiquement :

```powershell
cd ..
git add vercel-proxy/
git commit -m "Add update-leaderboard endpoint"
git push origin main
```

### 4. Tester l'endpoint

Une fois déployé, teste avec :

```powershell
curl -X POST https://word-wave-auth-proxy.vercel.app/api/update-leaderboard `
  -H "Content-Type: application/json" `
  -H "Authorization: Bearer YOUR_USER_GITHUB_TOKEN" `
  -d '{\"playerData\": {\"username\": \"test\", \"stats\": {\"gamesPlayed\": 1}}, \"gistId\": \"2acc97044fc86cb79c96b02a5bd1b5fb\"}'
```

Remplace `YOUR_USER_GITHUB_TOKEN` par le token d'un utilisateur (n'importe quel token GitHub valide, juste pour la validation).

## Comment ça marche

- L'utilisateur s'authentifie avec son propre token GitHub
- L'endpoint vérifie que le token de l'utilisateur est valide
- Ensuite, l'endpoint utilise le **GITHUB_ADMIN_TOKEN** (ton token) pour mettre à jour le Gist
- Ainsi, seul toi (PyQuar) as besoin d'avoir les permissions d'écriture sur le Gist

## Sécurité

✅ Le token admin est stocké de manière sécurisée dans les variables d'environnement Vercel
✅ Les utilisateurs doivent être authentifiés avec GitHub pour soumettre des scores
✅ Le Gist du leaderboard reste public en lecture
