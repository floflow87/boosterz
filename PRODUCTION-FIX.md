# FIX - Connexion Production floflow87

## ❌ PROBLÈME IDENTIFIÉ

L'utilisateur `floflow87` ne peut pas se connecter en production car :
- **Développement** : Base Neon avec utilisateurs de test
- **Production** : Base Supabase vide sans utilisateurs

## ✅ SOLUTION : Créer les utilisateurs dans Supabase

### 1. Accéder à ta base Supabase

1. Va sur [supabase.com](https://supabase.com/dashboard)
2. Ouvre ton projet BOOSTERZ
3. Va dans "SQL Editor"

### 2. Exécuter le script de création d'utilisateurs

Copie/colle ce script SQL dans l'éditeur Supabase :

```sql
-- Créer les utilisateurs de test avec mots de passe hashés
INSERT INTO users (
  id, 
  username, 
  email, 
  name, 
  password, 
  bio, 
  is_public, 
  is_active,
  created_at, 
  updated_at
) VALUES 
(
  1,
  'Floflow87',
  'florent@yopmail.com',
  'Florent Martin',
  '$2a$12$LQv3c1yqBjAHKI94hjBqKON4IUKQ/iTcPrHo9DGnrsmkOEfq8m4gm', -- Test25
  'Passionné de cartes de football et supporter de l''OM !',
  true,
  true,
  NOW(),
  NOW()
),
(
  2,
  'maxlamenace',
  'maxlamenace@yopmail.com',
  'Max la Menace',
  '$2a$12$LQv3c1yqBjAHKI94hjBqKON4IUKQ/iTcPrHo9DGnrsmkOEfq8m4gm', -- Test25
  'Je suis un passionné de cartes et je PC l''OM',
  true,
  true,
  NOW(),
  NOW()
);

-- Mettre à jour la séquence pour éviter les conflits
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
```

### 3. Exécuter le script

1. Clique sur "Run" dans l'éditeur SQL
2. Vérifier que 2 lignes ont été ajoutées

### 4. Vérifier la création

```sql
SELECT id, username, email, name, is_active FROM users;
```

Tu devrais voir :
- floflow87 (ID: 1)  
- maxlamenace (ID: 2)

## 🎯 RÉSULTAT

Après cette manipulation :
- **Connexion production** : florent@yopmail.com / Test25 ✅
- **Connexion production** : maxlamenace@yopmail.com / Test25 ✅

## 📝 NOTES

- Les mots de passe sont déjà hashés avec bcrypt
- Les deux bases restent séparées (dev/prod)
- Tu peux continuer à développer sur Replit normalement

---

**Une fois fait, confirme-moi que la connexion fonctionne en production !**