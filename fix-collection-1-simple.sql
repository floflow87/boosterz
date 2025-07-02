-- CORRECTIF SIMPLE COLLECTION 1
-- Migrer les cartes de la collection 9 vers la collection 1

-- 1. Migrer toutes les cartes de la collection 9 vers la collection 1
UPDATE checklist_cards 
SET collection_id = 1 
WHERE collection_id = 9;

-- 2. Supprimer la collection 9 maintenant vide
DELETE FROM collections WHERE id = 9;

-- 3. Mettre à jour le total_cards de la collection 1
UPDATE collections 
SET total_cards = (
    SELECT COUNT(*) FROM checklist_cards WHERE collection_id = 1
)
WHERE id = 1;

-- 4. Vérifier le résultat
SELECT 'Collection 1 après migration:' as info;
SELECT id, name, season, total_cards FROM collections WHERE id = 1;
SELECT COUNT(*) as cartes_checklist FROM checklist_cards WHERE collection_id = 1;