# Guide pour publier le code sur GitHub

## ⚠️ RÉSOLUTION DU PROBLÈME

Ton repository est déjà connecté à GitHub mais tu as un problème d'authentification. Voici comment le résoudre :

## Méthode Rapide : Token GitHub

### 1. Créer un token d'accès GitHub

1. Va sur GitHub.com → Settings (ton profil) → Developer settings
2. Clique "Personal access tokens" → "Tokens (classic)"
3. Clique "Generate new token (classic)"
4. Nom du token : "Replit-Boosterz"
5. Sélectionne : **repo** (accès complet aux repositories)
6. Clique "Generate token"
7. **COPIE LE TOKEN** (tu ne le reverras plus !)

### 2. Configurer l'authentification

Dans le Shell de Replit, tape ces commandes **UNE PAR UNE** :

```bash
# Étape 1 : Supprime l'ancienne configuration
git remote remove origin

# Étape 2 : Configure ton identité
git config --global user.name "Florent Martin"
git config --global user.email "florent@yopmail.com"

# Étape 3 : Ajoute le nouveau remote avec ton token
# Remplace TON_TOKEN par le token que tu viens de créer
git remote add origin https://TON_TOKEN@github.com/floflow87/boosterz.git

# Étape 4 : Ajoute tous les fichiers
git add .

# Étape 5 : Crée le commit
git commit -m "Initial commit: Application BOOSTERZ

✨ Fonctionnalités:
- Collections de cartes football
- Système social et messagerie  
- Marketplace et échanges
- Interface moderne React+TypeScript
- Base de données PostgreSQL avec Drizzle
- Architecture dev/prod séparée"

# Étape 6 : Envoie vers GitHub
git push -u origin main
```

### 3. Alternative plus simple : GitHub CLI

Si tu as des problèmes avec le token, utilise GitHub CLI :

```bash
# Installe GitHub CLI
gh auth login

# Suis les instructions à l'écran
# Puis :
git push -u origin main
```

## Vérification

Une fois envoyé, ton code sera visible sur : https://github.com/floflow87/boosterz

## En cas d'erreur

Si tu as toujours des erreurs, partage-moi le message d'erreur exact et je t'aiderai !

### 5. Fichiers importants inclus

Votre repository contiendra :
- ✅ Tout le code source (client/, server/, shared/)
- ✅ Configuration (package.json, tsconfig.json, etc.)
- ✅ Documentation (README.md, replit.md)
- ✅ Styling (tailwind.config.ts, postcss.config.js)
- ✅ Types et schémas (components.json, drizzle.config.ts)

### 6. Fichiers exclus (pour la sécurité)

- ❌ scripts/ (contient les mots de passe hashés et URLs de bases)
- ❌ attached_assets/ (fichiers utilisateur volumineux)
- ❌ .env et variables d'environnement
- ❌ node_modules/
- ❌ Fichiers de déploiement avec configurations serveur

### 7. Après le push

Une fois le code envoyé, votre repository GitHub sera prêt pour :
- Collaboration avec d'autres développeurs
- Déploiement automatique (Vercel, Netlify, etc.)
- Issues et pull requests
- Documentation publique

### 8. Variables d'environnement pour les contributeurs

Créez un fichier `.env.example` que les autres pourront copier :

```env
# Base de données (utiliser Neon ou Supabase)
DATABASE_URL="postgresql://..."
SUPABASE_DATABASE_URL="postgresql://..."

# Variables optionnelles
NODE_ENV="development"
```

## Commandes de développement

```bash
# Installation
npm install

# Développement
npm run dev

# Migration base de données
npm run db:push

# Build production
npm run build
```

Votre application est maintenant prête pour GitHub ! 🚀