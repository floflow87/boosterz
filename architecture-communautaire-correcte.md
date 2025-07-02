# ARCHITECTURE COMMUNAUTAIRE CORRECTE

## LOGIQUE MÉTIER CLARIFIÉE

### 1. CHECK-LISTS PARTAGÉES
- **Tables maîtres** : `collections` et `cards` (sans isOwned)
- **Propriété individuelle** : `user_card_ownership` (userId + cardId + isOwned)
- Tous voient les mêmes listes, chacun marque SES cartes possédées

### 2. CARTES PERSONNELLES
- **Table** : `personal_cards` (cartes ajoutées par chaque user)
- Chaque user ajoute SES propres cartes
- Rattachement à une collection OU hors collection (champ libre)
- Base pour : decks, feed, posts, marketplace

### 3. SYSTÈME DE DECKS
- **Propriété** : Chaque deck appartient à UN user
- **Visibilité** : Visible par tous, modifiable uniquement par le propriétaire
- **Contenu** : Cartes personnelles du user pour mise en avant communautaire

### 4. TYPOLOGIE DES CARTES
- Base numérotée
- Insert (avec sous-catégories)
- Memorabilia (avec sous-catégories)
- Autographe (avec sous-catégories)
- Spéciale (avec sous-catégories)

### 5. SYSTÈME DE TROPHÉES
- Basé sur la typologie des cartes possédées
- Visible sur profil public
- Niveau affiché dans la communauté

### 6. COMMUNAUTÉ
- **Profils publics** : Trophées + decks + feed
- **Posts** : Avec images de cartes personnelles
- **Suivis** : Pour accéder aux feeds des autres users
- **Marketplace** : Cartes personnelles mises en vente

## STRUCTURE DE TABLES CORRIGÉE

### Tables principales
1. `users` - Comptes utilisateurs
2. `collections` - Check-lists maîtres (partagées)
3. `cards` - Cartes des check-lists (partagées, SANS isOwned)
4. `user_card_ownership` - Qui possède quoi dans les check-lists
5. `personal_cards` - Cartes personnelles de chaque user
6. `decks` - Decks publics par user
7. `deck_cards` - Contenu des decks (personal_cards)
8. `posts` - Publications communautaires
9. `subscriptions` - Système de suivi
10. Autres tables sociales (messages, notifications, etc.)

## ERREURS ACTUELLES À CORRIGER
- ❌ `isOwned` dans `cards` (global au lieu d'individuel)
- ❌ Pas de `collection_id` dans `cards`
- ❌ Logique de propriété mal conçue
- ❌ Mélange entre check-lists partagées et cartes personnelles