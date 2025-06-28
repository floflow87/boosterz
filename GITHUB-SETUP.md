# Guide pour publier le code sur GitHub

## Étapes pour créer votre repository GitHub

### 1. Créer un nouveau repository sur GitHub

1. Allez sur [GitHub.com](https://github.com)
2. Cliquez sur "New repository" (bouton vert)
3. Nommez votre repository : `boosterz-trading-cards` (ou autre nom de votre choix)
4. Description : "Plateforme de gestion de collections de cartes football avec système social"
5. **Important** : Laissez la case "Add a README file" DÉCOCHÉE (on a déjà un README.md)
6. Choisissez "Public" ou "Private" selon vos préférences
7. Cliquez "Create repository"

### 2. Préparer votre projet local

Votre .gitignore est déjà configuré pour exclure :
- Les fichiers sensibles (scripts/ avec les mots de passe)
- Les assets utilisateur (attached_assets/)
- Les fichiers de configuration Replit
- Les guides de déploiement
- node_modules et autres fichiers temporaires

### 3. Commandes Git à exécuter

Ouvrez le Shell dans Replit et exécutez ces commandes une par une :

```bash
# Résoudre le verrou git s'il existe
rm -f .git/index.lock

# Ajouter tous les fichiers (sauf ceux dans .gitignore)
git add .

# Créer le commit initial
git commit -m "Initial commit: Application de gestion de collections de cartes football

✨ Fonctionnalités principales:
- Système d'authentification avec JWT et IsActive
- Gestion de collections Score Ligue 1 23/24
- Interface sociale avec messagerie temps réel
- Reconnaissance de cartes par IA
- Marketplace et système d'échange
- Architecture dual env (Neon dev / Supabase prod)

🛠️ Technologies:
- Frontend: React + TypeScript + Tailwind
- Backend: Node.js + Express + PostgreSQL
- ORM: Drizzle avec migrations
- État: TanStack Query
- Temps réel: WebSocket"

# Connecter votre repository GitHub (remplacez USERNAME et REPO_NAME)
git remote add origin https://github.com/USERNAME/REPO_NAME.git

# Envoyer le code
git branch -M main
git push -u origin main
```

### 4. Remplacer les placeholders

Dans les commandes ci-dessus, remplacez :
- `USERNAME` par votre nom d'utilisateur GitHub
- `REPO_NAME` par le nom de votre repository

Exemple concret :
```bash
git remote add origin https://github.com/floflow87/boosterz-trading-cards.git
```

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