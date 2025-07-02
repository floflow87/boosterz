-- Migration pour modèle de données checklist complet
-- Ajout des nouvelles colonnes dans checklist_cards

-- 1. Ajouter les nouvelles colonnes si elles n'existent pas
ALTER TABLE checklist_cards 
ADD COLUMN IF NOT EXISTS collection_name TEXT NOT NULL DEFAULT 'Score Ligue 1',
ADD COLUMN IF NOT EXISTS season TEXT NOT NULL DEFAULT '23/24',
ADD COLUMN IF NOT EXISTS numerotation TEXT,
ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'Base numérotée',
ADD COLUMN IF NOT EXISTS rarity TEXT NOT NULL DEFAULT 'Base',
ADD COLUMN IF NOT EXISTS is_rookie BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Supprimer les colonnes anciennes qui ne sont plus utilisées (si elles existent)
-- ALTER TABLE checklist_cards DROP COLUMN IF EXISTS card_sub_type;
-- ALTER TABLE checklist_cards DROP COLUMN IF EXISTS image_url;
-- ALTER TABLE checklist_cards DROP COLUMN IF EXISTS is_rookie_card;

-- 3. Vider la table pour la repeupler avec le nouveau format
TRUNCATE TABLE checklist_cards RESTART IDENTITY CASCADE;

-- 4. Vider également user_card_ownership pour cohérence
TRUNCATE TABLE user_card_ownership RESTART IDENTITY CASCADE;

-- 5. Insérer les données du CSV complet (à exécuter après cette migration)
-- COPY checklist_cards (collection_id, collection_name, season, numerotation, reference, player_name, team_name, card_type, category, rarity, is_rookie)
-- FROM '/path/to/checklist-score-ligue1-complet.csv'
-- DELIMITER ','
-- CSV HEADER;

-- 6. Mettre à jour le total de cartes dans la collection
UPDATE collections SET total_cards = 110 WHERE id = 2;

-- 7. Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_checklist_cards_category ON checklist_cards(category);
CREATE INDEX IF NOT EXISTS idx_checklist_cards_rarity ON checklist_cards(rarity);
CREATE INDEX IF NOT EXISTS idx_checklist_cards_is_rookie ON checklist_cards(is_rookie);

-- Vérification
SELECT 
    collection_name,
    season,
    category,
    COUNT(*) as total_cards,
    COUNT(CASE WHEN is_rookie = TRUE THEN 1 END) as rookie_cards
FROM checklist_cards 
GROUP BY collection_name, season, category
ORDER BY category;