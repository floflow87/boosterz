# Configuration Production - Étapes Finales

## 1. Créer l'utilisateur principal en production

Exécute cette commande pour créer l'utilisateur avec le champ `isActive` :

```bash
NODE_ENV=production npx tsx scripts/create-supabase-user.ts
```

## 2. Identifiants de connexion

Une fois le script exécuté avec succès, tu pourras te connecter avec :

- **Email** : `florent@yopmail.com`
- **Mot de passe** : `Test123456`
- **Username** : `Floflow87`

## 3. Système d'administration

Le système `isActive` est maintenant en place :

### Pour désactiver un utilisateur :
```sql
UPDATE users SET is_active = false WHERE id = [USER_ID];
```

### Pour réactiver un utilisateur :
```sql
UPDATE users SET is_active = true WHERE id = [USER_ID];
```

## 4. Vérification

Après avoir créé l'utilisateur, vérifie que :
- La connexion fonctionne avec les identifiants ci-dessus
- L'utilisateur a bien `isActive = true` dans la base
- L'application fonctionne normalement

## Notes importantes

- Tous les nouveaux utilisateurs créés auront `isActive = true` par défaut
- Les utilisateurs avec `isActive = false` recevront "Compte désactivé" lors de la connexion
- Le contrôle d'accès se fait automatiquement via le système d'authentification

## En cas de problème

Si le script échoue, vérifier :
1. Que `SUPABASE_DATABASE_URL` est bien configuré
2. Que la base Supabase a bien toutes les tables créées
3. Exécuter d'abord le script de migration si nécessaire