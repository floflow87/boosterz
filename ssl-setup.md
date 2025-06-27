# Configuration SSL pour boosterz.fr

## Préparation du certificat SSL

### 1. Installation de Certbot
```bash
# Sur Ubuntu/Debian
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Sur CentOS/RHEL
sudo yum install certbot python3-certbot-nginx
```

### 2. Configuration Nginx pour boosterz.fr
```nginx
# /etc/nginx/sites-available/boosterz.fr
server {
    listen 80;
    server_name boosterz.fr www.boosterz.fr;
    
    # Redirection temporaire pour la validation Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Redirection HTTPS (sera activée après obtention du certificat)
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# Configuration HTTPS (à activer après obtention du certificat)
server {
    listen 443 ssl http2;
    server_name boosterz.fr www.boosterz.fr;
    
    # Certificats SSL (chemins générés par Certbot)
    ssl_certificate /etc/letsencrypt/live/boosterz.fr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/boosterz.fr/privkey.pem;
    
    # Configuration SSL sécurisée
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # HSTS (HTTP Strict Transport Security)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Sécurité supplémentaire
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # Reverse proxy vers l'application Node.js
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
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # WebSocket support pour les fonctionnalités temps réel
    location /ws {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Cache statique pour les assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### 3. Obtention du certificat SSL

#### Méthode 1: Certbot automatique (recommandée)
```bash
# Obtenir le certificat pour boosterz.fr et www.boosterz.fr
sudo certbot --nginx -d boosterz.fr -d www.boosterz.fr

# Tester le renouvellement automatique
sudo certbot renew --dry-run
```

#### Méthode 2: Certbot manuel (si problèmes DNS)
```bash
# Générer le certificat manuellement
sudo certbot certonly --manual --preferred-challenges=dns -d boosterz.fr -d www.boosterz.fr

# Suivre les instructions pour ajouter les enregistrements TXT DNS
```

### 4. Configuration du renouvellement automatique
```bash
# Créer un cron job pour le renouvellement automatique
sudo crontab -e

# Ajouter cette ligne pour renouveler tous les jours à 2h du matin
0 2 * * * /usr/bin/certbot renew --quiet && /usr/bin/systemctl reload nginx
```

### 5. Script de déploiement avec SSL
```bash
#!/bin/bash
# deploy-ssl.sh

echo "🚀 Déploiement HTTPS pour boosterz.fr"

# 1. Mise à jour du système
sudo apt update && sudo apt upgrade -y

# 2. Installation des dépendances
sudo apt install -y nginx certbot python3-certbot-nginx nodejs npm git

# 3. Clone du projet
git clone https://github.com/votre-repo/boosterz.git /var/www/boosterz
cd /var/www/boosterz

# 4. Installation des dépendances Node.js
npm install

# 5. Build de production
npm run build

# 6. Configuration Nginx
sudo cp ssl-config/nginx-boosterz.conf /etc/nginx/sites-available/boosterz.fr
sudo ln -sf /etc/nginx/sites-available/boosterz.fr /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 7. Test de la configuration Nginx
sudo nginx -t

# 8. Redémarrage Nginx
sudo systemctl restart nginx

# 9. Obtention du certificat SSL
sudo certbot --nginx -d boosterz.fr -d www.boosterz.fr --agree-tos --email admin@boosterz.fr --non-interactive

# 10. Configuration du renouvellement automatique
echo "0 2 * * * /usr/bin/certbot renew --quiet && /usr/bin/systemctl reload nginx" | sudo crontab -

# 11. Démarrage de l'application
npm start

echo "✅ Déploiement HTTPS terminé pour boosterz.fr"
```

## Vérifications post-déploiement

### 1. Test SSL
```bash
# Vérifier le certificat
openssl s_client -connect boosterz.fr:443 -servername boosterz.fr

# Test avec SSL Labs
curl -s "https://api.ssllabs.com/api/v3/analyze?host=boosterz.fr"
```

### 2. Test de redirection HTTP vers HTTPS
```bash
curl -I http://boosterz.fr
# Doit retourner une redirection 301 vers https://
```

### 3. Vérification des headers de sécurité
```bash
curl -I https://boosterz.fr
# Vérifier la présence des headers HSTS, X-Frame-Options, etc.
```

## Variables d'environnement pour la production

```bash
# /var/www/boosterz/.env.production
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:password@localhost:5432/boosterz_prod
DOMAIN=https://boosterz.fr
SECURE_COOKIES=true
```

## Maintenance SSL

### Vérification du statut des certificats
```bash
sudo certbot certificates
```

### Renouvellement manuel si nécessaire
```bash
sudo certbot renew
sudo systemctl reload nginx
```

### Surveillance des logs
```bash
# Logs Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Logs Certbot
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

## Résolution de problèmes courants

### 1. Échec de validation DNS
- Vérifier que les enregistrements A pointent vers la bonne IP
- Attendre la propagation DNS (jusqu'à 48h)
- Utiliser `dig boosterz.fr` pour vérifier

### 2. Certificat non reconnu
- Vérifier que Nginx utilise le bon chemin de certificat
- Redémarrer Nginx : `sudo systemctl restart nginx`

### 3. Erreur de renouvellement
- Vérifier les permissions sur `/etc/letsencrypt/`
- Tester manuellement : `sudo certbot renew --dry-run`

## Sécurité supplémentaire

### 1. Configuration du pare-feu
```bash
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw enable
```

### 2. Fail2ban pour protection contre les attaques
```bash
sudo apt install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

Cette configuration garantit un déploiement HTTPS sécurisé et professionnel pour boosterz.fr.