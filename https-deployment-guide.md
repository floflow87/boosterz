# Guide de déploiement HTTPS pour boosterz.fr

## Vue d'ensemble

Ce guide détaille la configuration HTTPS pour le déploiement de l'application de cartes à collectionner sur le domaine boosterz.fr avec des environnements séparés pour le développement et la production.

## Configuration des environnements

### Développement (Replit)
- URL: `https://[repl-name].[username].repl.co`
- Base de données: PostgreSQL Neon (développement)
- Variables d'environnement: `DATABASE_URL` (dev)

### Production (boosterz.fr)
- URL: `https://boosterz.fr`
- Base de données: PostgreSQL Neon (production - à créer)
- Variables d'environnement: `DATABASE_URL` (prod)

## Étapes de déploiement HTTPS

### 1. Configuration du domaine

#### Enregistrement DNS
```
Type: A
Nom: @
Valeur: [IP du serveur de production]

Type: CNAME  
Nom: www
Valeur: boosterz.fr
```

#### Configuration SSL/TLS
- Utiliser Let's Encrypt pour les certificats gratuits
- Ou utiliser Cloudflare pour la gestion SSL automatique

### 2. Configuration du serveur de production

#### Serveur web (Nginx)
```nginx
server {
    listen 80;
    server_name boosterz.fr www.boosterz.fr;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name boosterz.fr www.boosterz.fr;

    ssl_certificate /etc/letsencrypt/live/boosterz.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/boosterz.fr/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 3. Base de données de production

#### Création de la base Neon PostgreSQL
1. Créer un nouveau projet Neon pour la production
2. Configurer les variables d'environnement:
   ```bash
   DATABASE_URL=postgresql://[user]:[password]@[host]/[database]?sslmode=require
   ```

#### Migration des données
```bash
# Exporter les données de développement
pg_dump $DEV_DATABASE_URL > dev_backup.sql

# Importer en production
psql $PROD_DATABASE_URL < dev_backup.sql
```

### 4. Variables d'environnement de production

```bash
# Production
DATABASE_URL=postgresql://[prod-credentials]
NODE_ENV=production
PORT=5000
JWT_SECRET=[secure-random-string]

# Optionnel
REPLIT_DOMAINS=boosterz.fr,www.boosterz.fr
```

### 5. Configuration de l'application

#### Mise à jour de db.ts pour la production
```typescript
const databaseUrl = process.env.NODE_ENV === 'production' 
  ? process.env.PROD_DATABASE_URL || process.env.DATABASE_URL
  : process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

export const pool = new Pool({ 
  connectionString: databaseUrl,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});
```

### 6. Process de déploiement

#### Depuis Replit vers production
```bash
# 1. Build de l'application
npm run build

# 2. Upload des fichiers vers le serveur
rsync -avz dist/ user@boosterz.fr:/var/www/boosterz/

# 3. Installation des dépendances sur le serveur
ssh user@boosterz.fr "cd /var/www/boosterz && npm install --production"

# 4. Redémarrage de l'application
ssh user@boosterz.fr "pm2 restart boosterz"
```

#### Configuration PM2 (serveur de production)
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'boosterz',
    script: './dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
```

### 7. Sécurité HTTPS

#### Headers de sécurité
```typescript
// Dans server/index.ts
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});
```

#### Redirection HTTPS automatique
```typescript
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && req.header('x-forwarded-proto') !== 'https') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});
```

### 8. Monitoring et logs

#### Configuration des logs de production
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### 9. Tests de déploiement

#### Checklist avant mise en production
- [ ] Certificats SSL valides
- [ ] Redirection HTTP → HTTPS fonctionnelle
- [ ] Base de données accessible
- [ ] Variables d'environnement configurées
- [ ] Application démarre sans erreur
- [ ] Tests d'intégration passent
- [ ] Logs de production configurés

#### Tests après déploiement
```bash
# Test HTTPS
curl -I https://boosterz.fr

# Test redirections
curl -I http://boosterz.fr

# Test API
curl https://boosterz.fr/api/health
```

### 10. Maintenance

#### Sauvegarde automatique
```bash
# Crontab pour sauvegarde quotidienne
0 2 * * * pg_dump $DATABASE_URL > /backups/boosterz_$(date +\%Y\%m\%d).sql
```

#### Mise à jour des certificats
```bash
# Renouvellement automatique Let's Encrypt
0 12 * * * /usr/bin/certbot renew --quiet && systemctl reload nginx
```

## Notes importantes

- **Sécurité**: Toutes les communications doivent passer par HTTPS
- **Performance**: Utiliser un CDN pour les assets statiques
- **Monitoring**: Configurer des alertes pour la disponibilité
- **Backup**: Sauvegardes régulières de la base de données
- **Séparation**: Environnements dev/prod complètement séparés

## Troubleshooting

### Problèmes courants
1. **Certificats SSL expirés**: Vérifier le renouvellement automatique
2. **Erreurs de base de données**: Vérifier les variables d'environnement
3. **Erreurs 502**: Vérifier que l'application Node.js fonctionne
4. **Lenteur**: Optimiser la base de données et utiliser un CDN

### Logs utiles
```bash
# Logs nginx
tail -f /var/log/nginx/error.log

# Logs application
pm2 logs boosterz

# Logs système
journalctl -u nginx -f
```