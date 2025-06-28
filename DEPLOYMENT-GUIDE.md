# Guide de Déploiement : Dev (Neon) → Production (Supabase)

Ce guide explique comment configurer et déployer l'application avec deux bases de données séparées :
- **Développement (Replit)** : Base Neon existante 
- **Production (Déploiement)** : Base Supabase

## 🗄️ Configuration des Bases de Données

### Développement (Actuel - Neon)
✅ **Déjà configuré** - Continue d'utiliser la base Neon existante sur Replit

### Production (Supabase)
Tu as déjà créé le projet Supabase. Voici les étapes pour finaliser :

## 📋 Étapes de Configuration Production

### 1. Récupérer l'URL Supabase
1. Va sur [Supabase Dashboard](https://supabase.com/dashboard/projects)
2. Sélectionne ton projet
3. Va dans **Settings** → **Database**
4. Copie la **Connection String** sous "Connection pooling"
5. Remplace `[YOUR-PASSWORD]` par ton mot de passe de base

Format attendu :
```
postgresql://postgres.abc123:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
```

### 2. Initialiser le Schéma Supabase

Une fois l'URL récupérée, exécute le script de migration :

```bash
# Depuis ton terminal local ou lors du déploiement
SUPABASE_DATABASE_URL="postgresql://postgres.abc123:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres" tsx scripts/migrate-production.ts
```

Ou tu peux utiliser directement l'interface SQL de Supabase :

1. Va dans **SQL Editor** dans ton dashboard Supabase
2. Exécute le contenu du fichier `scripts/migrate-production.ts` (la partie SQL entre les backticks)

### 3. Configuration des Variables d'Environnement

#### Pour le Développement (Replit)
✅ **Rien à changer** - Garde la configuration actuelle

#### Pour la Production (Déploiement)
Ajoute ces variables d'environnement lors du déploiement :

```bash
NODE_ENV=production
SUPABASE_DATABASE_URL=postgresql://postgres.abc123:[PASSWORD]@aws-0-eu-west-1.pooler.supabase.com:6543/postgres
```

## 🚀 Processus de Déploiement

### Déploiement sur Replit Deployments

1. **Configure les Secrets de Production** :
   - Dans Replit, va dans les **Secrets** du déploiement
   - Ajoute : `SUPABASE_DATABASE_URL` avec ton URL Supabase complète

2. **Déploie** :
   - L'application détectera automatiquement `NODE_ENV=production`
   - Utilisera Supabase au lieu de Neon

### Vérification Post-Déploiement

1. **Vérifie les logs** pour confirmer :
   ```
   🗄️  Database: Production (Supabase)
   ```

2. **Teste les fonctionnalités principales** :
   - Connexion utilisateur
   - Création de cartes
   - Navigation

## 🔧 Script de Migration Automatique

Le script `scripts/migrate-production.ts` créera automatiquement :
- Toutes les tables (users, collections, cards, etc.)
- Les index pour les performances
- Les contraintes de clés étrangères
- Les relations entre tables

### Tables créées :
- `users` - Comptes utilisateurs
- `collections` - Collections de cartes
- `cards` - Cartes de la collection principale
- `personal_cards` - Cartes personnelles des utilisateurs
- `decks` - Decks personnalisés
- `posts` - Posts sociaux
- `comments` - Commentaires
- `follows` - Relations de suivi
- `conversations` - Conversations privées
- `messages` - Messages
- `notifications` - Notifications

## 🔄 Workflow de Développement

```mermaid
graph TD
    A[Développement sur Replit] --> B[Base Neon]
    C[Build Production] --> D[Base Supabase]
    B --> E[Tests locaux]
    D --> F[Application Live]
```

### Développement
- Code sur Replit avec base Neon
- Tests et développement normaux
- Aucun changement nécessaire

### Production
- `NODE_ENV=production` → Utilise Supabase
- Déploiement automatique
- Base de données séparée

## 🛡️ Sécurité

### En Développement
- Base Neon sécurisée par Replit
- SSL automatique

### En Production
- Base Supabase avec SSL forcé
- Row Level Security (RLS) activable si nécessaire
- Connexions chiffrées

## 📞 Support

Si tu rencontres des problèmes :

1. **Erreur de connexion Supabase** :
   - Vérifie l'URL et le mot de passe
   - Assure-toi que l'IP est autorisée (Supabase autorise tout par défaut)

2. **Tables manquantes** :
   - Exécute le script de migration
   - Vérifie les logs du déploiement

3. **Performance** :
   - Supabase inclut la mise en cache automatique
   - Connection pooling déjà configuré

## ✅ Checklist de Déploiement

- [ ] Projet Supabase créé
- [ ] URL de connexion récupérée et testée
- [ ] Script de migration exécuté
- [ ] Variable `SUPABASE_DATABASE_URL` configurée
- [ ] Déploiement effectué
- [ ] Tests de l'application en production
- [ ] Monitoring en place

L'application est maintenant prête pour un déploiement professionnel avec des bases de données séparées !