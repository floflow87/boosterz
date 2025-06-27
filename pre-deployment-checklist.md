# Checklist pré-déploiement HTTPS pour boosterz.fr

## ✅ Configuration DNS (À faire AVANT le déploiement)

### 1. Enregistrements DNS requis
- [ ] **Enregistrement A** : `boosterz.fr` → IP du serveur
- [ ] **Enregistrement A** : `www.boosterz.fr` → IP du serveur
- [ ] **Délai de propagation** : Attendre 1-48h après modification DNS

### 2. Vérification DNS
```bash
# Vérifier que les domaines pointent vers le bon serveur
dig +short boosterz.fr
dig +short www.boosterz.fr

# Vérifier depuis différents DNS
nslookup boosterz.fr 8.8.8.8
nslookup boosterz.fr 1.1.1.1
```

## ✅ Configuration serveur

### 3. Prérequis serveur
- [ ] **OS** : Ubuntu 20.04+ ou Debian 10+
- [ ] **RAM** : Minimum 2GB (recommandé 4GB+)
- [ ] **Stockage** : Minimum 20GB libre
- [ ] **Ports ouverts** : 22 (SSH), 80 (HTTP), 443 (HTTPS)

### 4. Accès serveur
- [ ] **SSH** : Accès root ou sudo configuré
- [ ] **Utilisateur** : Utilisateur non-root créé pour l'application
- [ ] **Clés SSH** : Authentification par clé plutôt que mot de passe

## ✅ Variables d'environnement

### 5. Secrets et configurations
- [ ] **Mot de passe PostgreSQL** : Générer un mot de passe fort
- [ ] **SESSION_SECRET** : Clé de session aléatoire et sécurisée
- [ ] **DATABASE_URL** : URL de connexion à la base de production
- [ ] **Email admin** : Adresse email pour Let's Encrypt

### 6. Variables d'environnement à configurer
```bash
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://username:password@localhost:5432/boosterz_prod
DOMAIN=https://boosterz.fr
SECURE_COOKIES=true
SESSION_SECRET=your_super_secure_random_string_here
```

## ✅ Code et dépendances

### 7. Code source
- [ ] **Repository** : Code source accessible via Git
- [ ] **Branche** : Branche main/master prête pour production
- [ ] **Tests** : Tests passants (si applicable)
- [ ] **Build** : `npm run build` fonctionne sans erreur

### 8. Base de données
- [ ] **Schéma** : Migrations de DB prêtes
- [ ] **Données** : Données de seed configurées (optionnel)
- [ ] **Backup** : Plan de sauvegarde défini

## ✅ Sécurité

### 9. Configuration sécurité
- [ ] **Firewall** : UFW ou iptables configuré
- [ ] **Fail2ban** : Protection contre les attaques par force brute
- [ ] **SSH** : Désactivation de l'authentification par mot de passe
- [ ] **Updates** : Système à jour

### 10. Monitoring
- [ ] **Logs** : Rotation des logs configurée
- [ ] **Monitoring** : Système de surveillance (optionnel)
- [ ] **Alertes** : Notifications en cas de problème (optionnel)

## ✅ Déploiement

### 11. Commandes de déploiement
```bash
# 1. Se connecter au serveur
ssh user@your-server-ip

# 2. Cloner le repository (si première fois)
git clone https://github.com/your-account/boosterz.git /var/www/boosterz

# 3. Exécuter le script de déploiement
cd /var/www/boosterz
chmod +x deploy-ssl.sh
./deploy-ssl.sh

# 4. Suivre les instructions du script
```

## ✅ Tests post-déploiement

### 12. Vérifications automatiques
Le script `deploy-ssl.sh` effectue ces tests automatiquement :
- [ ] **HTTP → HTTPS** : Redirection fonctionnelle
- [ ] **Certificat SSL** : Validité et expiration
- [ ] **Application** : Réponse HTTP 200
- [ ] **Nginx** : Configuration valide

### 13. Tests manuels supplémentaires
- [ ] **Navigation** : Tester les principales pages
- [ ] **Fonctionnalités** : Login, inscription, navigation
- [ ] **Performance** : Temps de chargement acceptable
- [ ] **Mobile** : Responsive design fonctionnel

### 14. Outils de test SSL
```bash
# Test SSL complet
curl -I https://boosterz.fr

# Test SSL Labs (en ligne)
# https://www.ssllabs.com/ssltest/analyze.html?d=boosterz.fr

# Test de sécurité des headers
curl -I https://boosterz.fr | grep -E "(Strict-Transport|X-Frame|X-Content)"
```

## ✅ Maintenance

### 15. Documentation des procédures
- [ ] **Backup** : Procédure de sauvegarde documentée
- [ ] **Restauration** : Procédure de restauration testée
- [ ] **Updates** : Process de mise à jour défini
- [ ] **Monitoring** : Dashboards et alertes configurés

### 16. Contacts et support
- [ ] **Hébergeur** : Contacts techniques disponibles
- [ ] **DNS** : Accès au panel de gestion DNS
- [ ] **Support** : Plan de support technique défini

## 🚨 Points critiques

### ⚠️ ATTENTION - À vérifier absolument
1. **DNS propagé** : Vérifier que boosterz.fr pointe vers le serveur
2. **Ports ouverts** : 80 et 443 accessibles publiquement
3. **Permissions** : L'utilisateur peut exécuter sudo
4. **Espace disque** : Suffisant pour l'application et les logs
5. **Memory** : RAM suffisante pour Node.js + PostgreSQL + Nginx

### 🔄 En cas d'échec
1. **Logs** : Consulter `/var/log/nginx/error.log`
2. **SSL** : Vérifier `/var/log/letsencrypt/letsencrypt.log`
3. **Application** : `pm2 logs boosterz`
4. **Support** : Contacter l'équipe technique

## 📞 Commandes de dépannage

```bash
# Status des services
sudo systemctl status nginx
sudo systemctl status postgresql
pm2 status

# Redémarrer les services
sudo systemctl restart nginx
sudo systemctl restart postgresql
pm2 restart boosterz

# Logs en temps réel
sudo tail -f /var/log/nginx/error.log
pm2 logs boosterz --lines 50

# Test de connectivité
curl -I http://localhost:5000
curl -I https://boosterz.fr
```

---

**Note** : Cocher chaque élément avant de procéder au déploiement. Un déploiement réussi nécessite que tous les points soient vérifiés.