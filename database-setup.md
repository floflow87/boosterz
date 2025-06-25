# Configuration Bases de Données Séparées - Boosterz.fr

## État Actuel
- **Développement** : Base Replit actuelle (partagée)
- **Production** : Pas encore créée

## Étapes pour Séparer les Bases

### 1. Créer Base de Production
Choisissez un fournisseur :

**Option A: Neon (Recommandé)**
```
1. Aller sur https://neon.tech
2. Créer compte/se connecter
3. Créer nouveau projet "boosterz-production"
4. Noter l'URL de connexion fournie
```

**Option B: Supabase**
```
1. Aller sur https://supabase.com
2. Créer projet "boosterz-prod"
3. Aller dans Settings > Database
4. Copier l'URL de connexion
```

### 2. Configurer Variables d'Environnement

**Pour Vercel (Production)**
```
Aller dans Settings > Environment Variables
Ajouter:
- NODE_ENV = production
- PRODUCTION_DATABASE_URL = [URL base prod]
```

**Pour Replit (Développement)**
```
Garder:
- DATABASE_URL = [URL base dev actuelle]
```

### 3. Migrer le Schema vers Production
```bash
# Une fois la base prod créée, lancer :
NODE_ENV=production npm run db:push
NODE_ENV=production npm run seed
```

## Avantages de la Séparation

✓ **Sécurité** : Données prod protégées
✓ **Tests** : Modifications dev sans risque  
✓ **Performance** : Bases optimisées par usage
✓ **Conformité** : Isolation des environnements

## URLs de Connexion Type

**Neon :**
```
postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/boosterz_prod
```

**Supabase :**
```
postgresql://postgres:password@db.xxx.supabase.co:5432/postgres
```

## Commandes de Vérification

```bash
# Vérifier base dev
npm run db:studio

# Vérifier base prod  
NODE_ENV=production npm run db:studio
```