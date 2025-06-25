# Guide de Déploiement - Boosterz.fr

## 🔒 Configuration HTTPS Automatique

### Option 1: Vercel (Recommandé)
```bash
# Installer Vercel CLI
npm i -g vercel

# Déployer depuis votre repo
vercel

# Configurer domaine
vercel domains add boosterz.fr
vercel domains verify boosterz.fr
```

**Avantages Vercel:**
- SSL automatique avec Let's Encrypt
- CDN mondial
- Déploiement continu avec GitHub
- Configuration DNS simplifiée

### Option 2: Railway
```bash
# Installer Railway CLI
npm install -g @railway/cli

# Login et déploiement
railway login
railway link
railway up
```

### Option 3: DigitalOcean App Platform
- Interface web simple
- SSL automatique
- Scaling automatique

## 🌐 Configuration DNS pour boosterz.fr

### Chez votre registraire (OVH, Gandi, etc.)
```
Type    Nom     Valeur                      TTL
A       @       [IP fournie par hébergeur]  300
CNAME   www     boosterz.fr                 300
```

### Pour Vercel spécifiquement:
```
Type    Nom     Valeur
CNAME   @       cname.vercel-dns.com
CNAME   www     cname.vercel-dns.com
```

## Bases de Données Séparées

### Variables d'Environnement

#### Développement (.env.development)
```
NODE_ENV=development
DATABASE_URL=postgresql://[dev-credentials]
```

#### Production (.env.production)
```
NODE_ENV=production
PRODUCTION_DATABASE_URL=postgresql://[prod-credentials]
```

### Création des Bases

1. **Base de Développement** : Déjà configurée dans Replit
2. **Base de Production** : À créer sur Neon, Supabase, ou PlanetScale

## Migration des Données

### Schema Sync
```bash
# Développement vers Production
npm run db:push

# Ou migration sécurisée
npm run db:generate
npm run db:migrate
```

### Seed Production
```bash
NODE_ENV=production npm run seed
```

## Configuration Domaine

### 1. Acheter/Configurer boosterz.fr
- Pointer les DNS vers votre hébergeur
- Configurer les sous-domaines si nécessaire

### 2. Variables Domaine
```env
# Production
NEXT_PUBLIC_DOMAIN=https://boosterz.fr
NEXT_PUBLIC_API_URL=https://boosterz.fr/api

# Développement  
NEXT_PUBLIC_DOMAIN=http://localhost:5000
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

## 📋 Checklist Complet - Déploiement boosterz.fr

### 1. Préparation Base de Données
- [ ] Créer base de données production (Neon/Supabase)
- [ ] Noter l'URL de connexion production
- [ ] Tester la connexion

### 2. Variables d'Environnement Production
```env
NODE_ENV=production
PRODUCTION_DATABASE_URL=postgresql://username:password@host:port/database
NEXT_PUBLIC_DOMAIN=https://boosterz.fr
NEXT_PUBLIC_API_URL=https://boosterz.fr/api
```

### 3. Déploiement Vercel (Recommandé)
- [ ] Fork le projet sur GitHub
- [ ] Connecter Vercel à GitHub  
- [ ] Ajouter variables d'environnement dans Vercel
- [ ] Déployer automatiquement
- [ ] Ajouter domaine boosterz.fr dans Vercel
- [ ] Vérifier le domaine

### 4. Configuration DNS
- [ ] Aller sur votre registraire (OVH, Gandi, etc.)
- [ ] Configurer les enregistrements DNS:
  ```
  CNAME @ cname.vercel-dns.com
  CNAME www cname.vercel-dns.com
  ```
- [ ] Attendre propagation DNS (0-48h)

### 5. Vérifications Finales
- [ ] https://boosterz.fr accessible
- [ ] https://www.boosterz.fr redirige vers boosterz.fr
- [ ] Certificat SSL valide (cadenas vert)
- [ ] Base de données production fonctionnelle
- [ ] Tous les endpoints API fonctionnent
- [ ] Upload d'images fonctionne
- [ ] Système d'authentification opérationnel

### 🚀 Commandes de Déploiement
```bash
# Via Vercel CLI
npm i -g vercel
vercel --prod

# Via GitHub (automatique)
git push origin main
# Vercel déploie automatiquement
```

## Commandes Utiles

```bash
# Build production
npm run build

# Démarrer en production
NODE_ENV=production npm start

# Vérifier la base
npm run db:studio
```