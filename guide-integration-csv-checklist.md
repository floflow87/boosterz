# GUIDE D'INTÉGRATION CSV CHECKLIST

## Table cible : `checklist_cards`

### Structure de la table
```sql
checklist_cards (
  id SERIAL PRIMARY KEY,
  collection_id INTEGER REFERENCES collections(id),
  reference VARCHAR(10) NOT NULL,
  player_name VARCHAR(255) NOT NULL,
  team_name VARCHAR(255) NOT NULL,
  card_type VARCHAR(50) NOT NULL,
  season VARCHAR(10) NOT NULL,
  rarity VARCHAR(50) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## Fichier CSV fourni : `checklist-score-ligue1-template.csv`

### Contenu
- **200 cartes de base** Score Ligue 1 23/24
- **Tous les joueurs principaux** des 20 équipes
- **Format correct** pour import direct

### Instructions d'import
```sql
-- 1. Vérifier l'ID de la collection
SELECT id, name, season FROM collections WHERE name LIKE '%Score%ligue%1%';

-- 2. Ajuster collection_id dans le CSV si nécessaire
-- (actuellement défini à 2)

-- 3. Import via interface admin ou commande COPY
COPY checklist_cards (collection_id, reference, player_name, team_name, card_type, season, rarity)
FROM '/path/to/checklist-score-ligue1-template.csv'
DELIMITER ','
CSV HEADER;

-- 4. Vérifier l'import
SELECT COUNT(*) FROM checklist_cards WHERE collection_id = 2;

-- 5. Mettre à jour le total
UPDATE collections SET total_cards = 200 WHERE id = 2;
```

## Architecture complète checklist

### Tables impliquées
1. **`checklist_cards`** : Cartes de référence partagées
2. **`user_card_ownership`** : Propriété individuelle par utilisateur
3. **`collections`** : Métadonnées des check-lists

### Après import CSV
Les utilisateurs pourront :
- Voir les 200 cartes dans leur checklist
- Marquer individuellement chaque carte comme possédée
- Avoir leur progression personnelle
- Calculer leur pourcentage de completion

## Corrections erreurs production

### 1. Erreurs 500 messages
**Problème** : Méthodes manquantes dans storage.ts
**Solution** : Ajouter les méthodes createMessage, getMessages, etc.

### 2. Page cartes qui ne charge pas
**Problème** : Cache ou requête bloquée  
**Solution** : Vérifier cache et requêtes getAllCards

### 3. Onglet checklist inaccessible
**Problème** : Chargement des checklist_cards
**Solution** : S'assurer que les routes checklist existent

## Actions immédiates
1. ✅ Utiliser le CSV fourni pour remplir checklist_cards
2. ⏳ Corriger les méthodes storage manquantes  
3. ⏳ Tester en production après import