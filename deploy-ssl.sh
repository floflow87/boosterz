#!/bin/bash

# Script de déploiement HTTPS pour boosterz.fr
# Version: 1.0
# Date: 27 juin 2025

set -e  # Arrêter le script en cas d'erreur

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Configuration
DOMAIN="boosterz.fr"
WWW_DOMAIN="www.boosterz.fr"
APP_DIR="/var/www/boosterz"
EMAIL="admin@boosterz.fr"
NODE_VERSION="20"

log_info "🚀 Début du déploiement HTTPS pour $DOMAIN"

# 1. Vérification des prérequis
log_info "📋 Vérification des prérequis..."

if [[ $EUID -eq 0 ]]; then
   log_error "Ce script ne doit pas être exécuté en tant que root pour des raisons de sécurité"
   log_info "Utilisez: bash deploy-ssl.sh"
   exit 1
fi

# Vérifier que le domaine pointe vers ce serveur
log_info "🔍 Vérification DNS pour $DOMAIN..."
CURRENT_IP=$(curl -s ifconfig.me)
DOMAIN_IP=$(dig +short $DOMAIN)

if [ "$CURRENT_IP" != "$DOMAIN_IP" ]; then
    log_warning "L'IP du domaine ($DOMAIN_IP) ne correspond pas à l'IP du serveur ($CURRENT_IP)"
    log_warning "Assurez-vous que les enregistrements DNS pointent vers ce serveur"
    read -p "Continuer quand même ? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 2. Mise à jour du système
log_info "📦 Mise à jour du système..."
sudo apt update && sudo apt upgrade -y

# 3. Installation des dépendances
log_info "🔧 Installation des dépendances..."
sudo apt install -y nginx certbot python3-certbot-nginx curl wget git ufw fail2ban

# 4. Installation de Node.js
log_info "📦 Installation de Node.js $NODE_VERSION..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    log_success "Node.js déjà installé: $(node --version)"
fi

# 5. Installation de PM2 pour la gestion des processus
log_info "⚙️ Installation de PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
    pm2 startup
else
    log_success "PM2 déjà installé: $(pm2 --version)"
fi

# 6. Configuration du pare-feu
log_info "🔒 Configuration du pare-feu..."
sudo ufw --force enable
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw status

# 7. Préparation du répertoire de l'application
log_info "📁 Préparation du répertoire de l'application..."
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# 8. Clone ou mise à jour du projet
if [ -d "$APP_DIR/.git" ]; then
    log_info "🔄 Mise à jour du code existant..."
    cd $APP_DIR
    git pull origin main
else
    log_info "📥 Clone du projet..."
    # Remplacez par votre URL de repository
    log_warning "Clonez manuellement votre repository dans $APP_DIR"
    log_info "Exemple: git clone https://github.com/votre-compte/boosterz.git $APP_DIR"
    read -p "Appuyez sur Entrée une fois le code cloné..."
    cd $APP_DIR
fi

# 9. Installation des dépendances Node.js
log_info "📦 Installation des dépendances Node.js..."
npm install

# 10. Build de production
log_info "🏗️ Build de production..."
npm run build

# 11. Configuration de la base de données PostgreSQL
log_info "🗄️ Configuration de la base de données..."
if ! command -v psql &> /dev/null; then
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

# Créer la base de données de production (si nécessaire)
log_info "🗃️ Configuration de la base de données de production..."
sudo -u postgres psql -c "CREATE DATABASE boosterz_prod;" 2>/dev/null || log_warning "Base de données déjà existante"
sudo -u postgres psql -c "CREATE USER boosterz WITH PASSWORD 'secure_password_here';" 2>/dev/null || log_warning "Utilisateur déjà existant"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE boosterz_prod TO boosterz;" 2>/dev/null

# 12. Configuration des variables d'environnement
log_info "⚙️ Configuration des variables d'environnement..."
cat > $APP_DIR/.env.production << EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://boosterz:secure_password_here@localhost:5432/boosterz_prod
DOMAIN=https://$DOMAIN
SECURE_COOKIES=true
SESSION_SECRET=$(openssl rand -base64 32)
EOF

# 13. Migration de la base de données
log_info "🗄️ Migration de la base de données..."
npm run db:push

# 14. Configuration Nginx temporaire (pour Let's Encrypt)
log_info "🌐 Configuration Nginx temporaire..."
sudo mkdir -p /var/www/certbot

sudo tee /etc/nginx/sites-available/$DOMAIN > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN $WWW_DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Activer le site
sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test de la configuration
sudo nginx -t

# 15. Démarrage de l'application
log_info "🚀 Démarrage de l'application..."
cd $APP_DIR
pm2 delete boosterz 2>/dev/null || true
pm2 start npm --name "boosterz" -- start
pm2 save
pm2 startup

# 16. Redémarrage Nginx
log_info "🔄 Redémarrage Nginx..."
sudo systemctl restart nginx

# 17. Obtention du certificat SSL
log_info "🔐 Obtention du certificat SSL..."
sudo certbot --nginx -d $DOMAIN -d $WWW_DOMAIN --agree-tos --email $EMAIL --non-interactive --redirect

# 18. Installation de la configuration Nginx optimisée
log_info "⚡ Installation de la configuration Nginx optimisée..."
sudo cp nginx-boosterz.conf /etc/nginx/sites-available/$DOMAIN
sudo nginx -t
sudo systemctl reload nginx

# 19. Configuration du renouvellement automatique
log_info "🔄 Configuration du renouvellement automatique..."
(sudo crontab -l 2>/dev/null; echo "0 2 * * * /usr/bin/certbot renew --quiet && /usr/bin/systemctl reload nginx") | sudo crontab -

# 20. Configuration de Fail2ban
log_info "🛡️ Configuration de Fail2ban..."
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# 21. Tests finaux
log_info "🧪 Tests finaux..."

# Test HTTP -> HTTPS redirect
log_info "Testing HTTP to HTTPS redirect..."
HTTP_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://$DOMAIN)
if [ "$HTTP_RESPONSE" = "301" ] || [ "$HTTP_RESPONSE" = "302" ]; then
    log_success "✅ Redirection HTTP vers HTTPS fonctionne"
else
    log_warning "⚠️ La redirection HTTP vers HTTPS pourrait ne pas fonctionner (Code: $HTTP_RESPONSE)"
fi

# Test HTTPS
log_info "Testing HTTPS..."
HTTPS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN)
if [ "$HTTPS_RESPONSE" = "200" ]; then
    log_success "✅ HTTPS fonctionne correctement"
else
    log_warning "⚠️ HTTPS pourrait ne pas fonctionner correctement (Code: $HTTPS_RESPONSE)"
fi

# Test SSL certificate
log_info "Testing SSL certificate..."
SSL_EXPIRY=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
log_success "✅ Certificat SSL valide jusqu'au: $SSL_EXPIRY"

# 22. Nettoyage
log_info "🧹 Nettoyage..."
sudo apt autoremove -y
sudo apt autoclean

# 23. Récapitulatif
log_success "🎉 Déploiement HTTPS terminé avec succès !"
echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "                            RÉCAPITULATIF DU DÉPLOIEMENT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo
log_success "🌐 Site web disponible à: https://$DOMAIN"
log_success "🔒 Certificat SSL configuré et renouvelé automatiquement"
log_success "🚀 Application démarrée avec PM2"
log_success "⚡ Nginx configuré avec optimisations de performance"
log_success "🛡️ Pare-feu et Fail2ban activés"
echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "                              COMMANDES UTILES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo
echo "📊 Status de l'application:     pm2 status"
echo "📋 Logs de l'application:       pm2 logs boosterz"
echo "🔄 Redémarrer l'application:    pm2 restart boosterz"
echo "🌐 Status Nginx:                sudo systemctl status nginx"
echo "📋 Logs Nginx:                  sudo tail -f /var/log/nginx/boosterz.fr.access.log"
echo "🔐 Status certificat:           sudo certbot certificates"
echo "🔄 Renouveler certificat:       sudo certbot renew"
echo "🛡️ Status Fail2ban:             sudo fail2ban-client status"
echo
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "                               SÉCURITÉ"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo
log_warning "🔑 Changez le mot de passe PostgreSQL dans .env.production"
log_warning "🔐 Configurez une clé de session forte"
log_warning "📧 Configurez les variables d'environnement pour les emails"
echo
log_success "✨ Votre site BOOSTERZ est maintenant en ligne et sécurisé !"