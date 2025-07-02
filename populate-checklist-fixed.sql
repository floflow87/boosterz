-- Script corrigé pour peupler la checklist Score Ligue 1 23/24

-- 1. Insertion des cartes de base (200 joueurs) - VERSION CORRIGEE
WITH base_data AS (
  SELECT 
    generate_series(1, 200) as card_num,
    (SELECT id FROM collections WHERE name LIKE '%Score%ligue%1%' AND season = '2023/24' LIMIT 1) as collection_id
),
team_mapping AS (
  SELECT 
    card_num,
    collection_id,
    LPAD(card_num::text, 3, '0') as reference,
    'Joueur ' || card_num as player_name,
    CASE 
      WHEN card_num % 20 = 1 THEN 'Paris Saint-Germain'
      WHEN card_num % 20 = 2 THEN 'Olympique de Marseille'
      WHEN card_num % 20 = 3 THEN 'AS Monaco'
      WHEN card_num % 20 = 4 THEN 'Olympique Lyonnais'
      WHEN card_num % 20 = 5 THEN 'RC Lens'
      WHEN card_num % 20 = 6 THEN 'Stade Rennais'
      WHEN card_num % 20 = 7 THEN 'OGC Nice'
      WHEN card_num % 20 = 8 THEN 'Lille OSC'
      WHEN card_num % 20 = 9 THEN 'Stade de Reims'
      WHEN card_num % 20 = 10 THEN 'RC Strasbourg'
      WHEN card_num % 20 = 11 THEN 'Montpellier HSC'
      WHEN card_num % 20 = 12 THEN 'FC Nantes'
      WHEN card_num % 20 = 13 THEN 'Stade Brestois'
      WHEN card_num % 20 = 14 THEN 'Le Havre AC'
      WHEN card_num % 20 = 15 THEN 'FC Metz'
      WHEN card_num % 20 = 16 THEN 'Toulouse FC'
      WHEN card_num % 20 = 17 THEN 'Clermont Foot'
      WHEN card_num % 20 = 18 THEN 'FC Lorient'
      WHEN card_num % 20 = 19 THEN 'AS Saint-Etienne'
      ELSE 'Angers SCO'
    END as team_name
  FROM base_data
)
INSERT INTO checklist_cards (collection_id, reference, player_name, team_name, card_type, season, rarity)
SELECT 
  collection_id,
  reference,
  player_name,
  team_name,
  'base' as card_type,
  '23/24' as season,
  'Base' as rarity
FROM team_mapping
WHERE collection_id IS NOT NULL;

-- 2. Mise à jour du nombre total de cartes
UPDATE collections 
SET total_cards = (
    SELECT COUNT(*) FROM checklist_cards 
    WHERE collection_id = collections.id
)
WHERE name LIKE '%Score%ligue%1%' AND season = '2023/24';

-- 3. Verification
SELECT 
    'Population reussie' as status,
    c.name as collection_name,
    c.total_cards,
    COUNT(cc.id) as cartes_inserees
FROM collections c
LEFT JOIN checklist_cards cc ON cc.collection_id = c.id
WHERE c.name LIKE '%Score%ligue%1%' AND c.season = '2023/24'
GROUP BY c.id, c.name, c.total_cards;