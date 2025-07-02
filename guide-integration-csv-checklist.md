# GUIDE D'INTÉGRATION CSV CHECKLIST

## Table cible : `checklist_cards`

### Structure de la table (MISE À JOUR)
```sql
checklist_cards (
  id SERIAL PRIMARY KEY,
  collection_id INTEGER REFERENCES collections(id),
  collection_name TEXT NOT NULL,
  season TEXT NOT NULL,
  numerotation TEXT,
  reference VARCHAR(10) NOT NULL,
  player_name VARCHAR(255) NOT NULL,
  team_name VARCHAR(255) NOT NULL,
  card_type VARCHAR(50) NOT NULL,
  category TEXT NOT NULL,
  rarity TEXT NOT NULL,
  is_rookie BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## Fichiers CSV fournis 

### 1. `checklist-score-ligue1-complet.csv` (NOUVEAU FORMAT)

#### Contenu complet
- **100 cartes de base** Score Ligue 1 23/24 (référence 001-100)
- **5 cartes Hit** avec numérotation (/50, /25, /10, /5, 1/1)
- **5 cartes Autographes** (toutes 1/1)
- **Structure complète** avec toutes les colonnes demandées
- **Rookie Cards** : isRookie=TRUE pour certains joueurs jeunes

### Instructions d'import (NOUVELLES)

#### Étape 1 : Migration de la table
```sql
-- Exécuter d'abord migration-checklist-complet.sql
-- Ajoute toutes les nouvelles colonnes nécessaires
```

#### Étape 2 : Import du CSV complet
```sql
-- 1. Vérifier l'ID de la collection
SELECT id, name, season FROM collections WHERE name LIKE '%Score%ligue%1%';

-- 2. Import du nouveau CSV avec toutes les colonnes
COPY checklist_cards (collection_id, collection_name, season, numerotation, reference, player_name, team_name, card_type, category, rarity, is_rookie)
FROM '/path/to/checklist-score-ligue1-complet.csv'
DELIMITER ','
CSV HEADER;

-- 3. Vérifier l'import
SELECT 
    category,
    COUNT(*) as total,
    COUNT(CASE WHEN is_rookie = TRUE THEN 1 END) as rookies
FROM checklist_cards 
WHERE collection_id = 2 
GROUP BY category;

-- 4. Mettre à jour le total dans collections
UPDATE collections SET total_cards = 110 WHERE id = 2;
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