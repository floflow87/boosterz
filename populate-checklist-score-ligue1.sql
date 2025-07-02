-- Script pour peupler la checklist Score Ligue 1 23/24 avec toutes les cartes
-- A executer APRES avoir cree les tables checklist_cards et user_card_ownership

-- 1. Identifier l'ID de la collection Score Ligue 1 23/24
-- (Remplacer X par l'ID reel de la collection)

-- 2. Insertion des cartes de base (200 joueurs)
INSERT INTO checklist_cards (collection_id, reference, player_name, team_name, card_type, season, rarity)
SELECT 
    (SELECT id FROM collections WHERE name LIKE '%Score%ligue%1%' AND season = '2023/24' LIMIT 1) as collection_id,
    LPAD(generate_series(1, 200)::text, 3, '0') as reference,
    'Joueur ' || generate_series(1, 200) as player_name,
    CASE 
        WHEN generate_series(1, 200) % 20 = 1 THEN 'Paris Saint-Germain'
        WHEN generate_series(1, 200) % 20 = 2 THEN 'Olympique de Marseille'
        WHEN generate_series(1, 200) % 20 = 3 THEN 'AS Monaco'
        WHEN generate_series(1, 200) % 20 = 4 THEN 'Olympique Lyonnais'
        WHEN generate_series(1, 200) % 20 = 5 THEN 'RC Lens'
        WHEN generate_series(1, 200) % 20 = 6 THEN 'Stade Rennais'
        WHEN generate_series(1, 200) % 20 = 7 THEN 'OGC Nice'
        WHEN generate_series(1, 200) % 20 = 8 THEN 'Lille OSC'
        WHEN generate_series(1, 200) % 20 = 9 THEN 'Stade de Reims'
        WHEN generate_series(1, 200) % 20 = 10 THEN 'RC Strasbourg'
        WHEN generate_series(1, 200) % 20 = 11 THEN 'Montpellier HSC'
        WHEN generate_series(1, 200) % 20 = 12 THEN 'FC Nantes'
        WHEN generate_series(1, 200) % 20 = 13 THEN 'Stade Brestois'
        WHEN generate_series(1, 200) % 20 = 14 THEN 'Le Havre AC'
        WHEN generate_series(1, 200) % 20 = 15 THEN 'FC Metz'
        WHEN generate_series(1, 200) % 20 = 16 THEN 'Toulouse FC'
        WHEN generate_series(1, 200) % 20 = 17 THEN 'Clermont Foot'
        WHEN generate_series(1, 200) % 20 = 18 THEN 'FC Lorient'
        WHEN generate_series(1, 200) % 20 = 19 THEN 'AS Saint-Etienne'
        ELSE 'Angers SCO'
    END as team_name,
    'base' as card_type,
    '23/24' as season,
    'Base' as rarity
WHERE NOT EXISTS (
    SELECT 1 FROM checklist_cards 
    WHERE collection_id = (SELECT id FROM collections WHERE name LIKE '%Score%ligue%1%' AND season = '2023/24' LIMIT 1)
    AND card_type = 'base'
);

-- 3. Insertion des cartes Base Numerotees (1800 variantes : 200 x 9)
INSERT INTO checklist_cards (collection_id, reference, player_name, team_name, card_type, season, rarity, numbering, variants, base_card_id, is_variant)
SELECT 
    c.collection_id,
    c.reference || '_' || v.variant_type as reference,
    c.player_name,
    c.team_name,
    'base numbered' as card_type,
    c.season,
    CASE 
        WHEN v.variant_type IN ('laser_50', 'swirl_25') THEN 'Commune'
        ELSE 'Peu commune'
    END as rarity,
    CASE 
        WHEN v.variant_type = 'laser_50' THEN '/50 laser'
        WHEN v.variant_type = 'swirl_25' THEN '/25 swirl'
        WHEN v.variant_type = 'orange_15' THEN '/15'
        WHEN v.variant_type = 'violet_15' THEN '/15'
        WHEN v.variant_type = 'vert_10' THEN '/10'
        WHEN v.variant_type = 'bleu_10' THEN '/10'
        WHEN v.variant_type = 'rouge_5' THEN '/5'
        WHEN v.variant_type = 'jaune_3' THEN '/3'
        WHEN v.variant_type = 'noir_1' THEN '/1'
    END as numbering,
    CASE 
        WHEN v.variant_type = 'laser_50' THEN 'Laser'
        WHEN v.variant_type = 'swirl_25' THEN 'Swirl'
        WHEN v.variant_type = 'orange_15' THEN 'Orange'
        WHEN v.variant_type = 'violet_15' THEN 'Violet'
        WHEN v.variant_type = 'vert_10' THEN 'Vert'
        WHEN v.variant_type = 'bleu_10' THEN 'Bleu'
        WHEN v.variant_type = 'rouge_5' THEN 'Rouge'
        WHEN v.variant_type = 'jaune_3' THEN 'Jaune'
        WHEN v.variant_type = 'noir_1' THEN 'Noir'
    END as variants,
    c.id as base_card_id,
    true as is_variant
FROM checklist_cards c
CROSS JOIN (
    SELECT 'laser_50' as variant_type UNION ALL
    SELECT 'swirl_25' UNION ALL
    SELECT 'orange_15' UNION ALL
    SELECT 'violet_15' UNION ALL
    SELECT 'vert_10' UNION ALL
    SELECT 'bleu_10' UNION ALL
    SELECT 'rouge_5' UNION ALL
    SELECT 'jaune_3' UNION ALL
    SELECT 'noir_1'
) v
WHERE c.card_type = 'base'
AND NOT EXISTS (
    SELECT 1 FROM checklist_cards cc2 
    WHERE cc2.collection_id = c.collection_id 
    AND cc2.reference = c.reference || '_' || v.variant_type
);

-- 4. Insertion des cartes Insert (360 cartes : 8 types x 45 joueurs chacun)
INSERT INTO checklist_cards (collection_id, reference, player_name, team_name, card_type, card_sub_type, season, rarity, numbering)
WITH insert_types AS (
    SELECT 'breakthrough' as sub_type, 'Breakthrough' as display_name, '/25' as numbering UNION ALL
    SELECT 'hot_rookies' as sub_type, 'Hot Rookies' as display_name, '/25' as numbering UNION ALL
    SELECT 'intergalactic_hit' as sub_type, 'Intergalactic Hit' as display_name, '/25' as numbering UNION ALL
    SELECT 'next_up' as sub_type, 'Next Up' as display_name, '/25' as numbering UNION ALL
    SELECT 'pennants' as sub_type, 'Pennants' as display_name, '/25' as numbering UNION ALL
    SELECT 'gold_rush' as sub_type, 'Gold Rush' as display_name, '/25' as numbering UNION ALL
    SELECT 'memorabilia' as sub_type, 'Memorabilia' as display_name, '/15' as numbering UNION ALL
    SELECT 'autograph' as sub_type, 'Autograph' as display_name, '/10' as numbering
)
SELECT 
    (SELECT id FROM collections WHERE name LIKE '%Score%ligue%1%' AND season = '2023/24' LIMIT 1) as collection_id,
    'I' || LPAD((ROW_NUMBER() OVER())::text, 3, '0') as reference,
    'Joueur Insert ' || (ROW_NUMBER() OVER()) as player_name,
    CASE 
        WHEN (ROW_NUMBER() OVER()) % 20 = 1 THEN 'Paris Saint-Germain'
        WHEN (ROW_NUMBER() OVER()) % 20 = 2 THEN 'Olympique de Marseille'
        WHEN (ROW_NUMBER() OVER()) % 20 = 3 THEN 'AS Monaco'
        WHEN (ROW_NUMBER() OVER()) % 20 = 4 THEN 'Olympique Lyonnais'
        WHEN (ROW_NUMBER() OVER()) % 20 = 5 THEN 'RC Lens'
        WHEN (ROW_NUMBER() OVER()) % 20 = 6 THEN 'Stade Rennais'
        WHEN (ROW_NUMBER() OVER()) % 20 = 7 THEN 'OGC Nice'
        WHEN (ROW_NUMBER() OVER()) % 20 = 8 THEN 'Lille OSC'
        WHEN (ROW_NUMBER() OVER()) % 20 = 9 THEN 'Stade de Reims'
        WHEN (ROW_NUMBER() OVER()) % 20 = 10 THEN 'RC Strasbourg'
        WHEN (ROW_NUMBER() OVER()) % 20 = 11 THEN 'Montpellier HSC'
        WHEN (ROW_NUMBER() OVER()) % 20 = 12 THEN 'FC Nantes'
        WHEN (ROW_NUMBER() OVER()) % 20 = 13 THEN 'Stade Brestois'
        WHEN (ROW_NUMBER() OVER()) % 20 = 14 THEN 'Le Havre AC'
        WHEN (ROW_NUMBER() OVER()) % 20 = 15 THEN 'FC Metz'
        WHEN (ROW_NUMBER() OVER()) % 20 = 16 THEN 'Toulouse FC'
        WHEN (ROW_NUMBER() OVER()) % 20 = 17 THEN 'Clermont Foot'
        WHEN (ROW_NUMBER() OVER()) % 20 = 18 THEN 'FC Lorient'
        WHEN (ROW_NUMBER() OVER()) % 20 = 19 THEN 'AS Saint-Etienne'
        ELSE 'Angers SCO'
    END as team_name,
    'insert' as card_type,
    it.sub_type as card_sub_type,
    '23/24' as season,
    CASE 
        WHEN it.sub_type IN ('breakthrough', 'hot_rookies', 'intergalactic_hit') THEN 'Rare'
        WHEN it.sub_type IN ('next_up', 'pennants', 'gold_rush') THEN 'Rare'
        WHEN it.sub_type = 'memorabilia' THEN 'Epique'
        WHEN it.sub_type = 'autograph' THEN 'Legendaire'
    END as rarity,
    it.numbering
FROM insert_types it
CROSS JOIN generate_series(1, 45) as player_num
WHERE NOT EXISTS (
    SELECT 1 FROM checklist_cards 
    WHERE collection_id = (SELECT id FROM collections WHERE name LIKE '%Score%ligue%1%' AND season = '2023/24' LIMIT 1)
    AND card_type = 'insert'
);

-- 5. Mise a jour du nombre total de cartes dans la collection
UPDATE collections 
SET total_cards = (
    SELECT COUNT(*) FROM checklist_cards 
    WHERE collection_id = collections.id
)
WHERE name LIKE '%Score%ligue%1%' AND season = '2023/24';

-- 6. Verification du resultat
SELECT 
    'Population checklist terminee' as status,
    c.name as collection_name,
    c.total_cards as total_cards,
    COUNT(cc.id) as cartes_inserees,
    COUNT(CASE WHEN cc.card_type = 'base' THEN 1 END) as cartes_base,
    COUNT(CASE WHEN cc.card_type = 'base numbered' THEN 1 END) as cartes_base_num,
    COUNT(CASE WHEN cc.card_type = 'insert' THEN 1 END) as cartes_insert
FROM collections c
LEFT JOIN checklist_cards cc ON cc.collection_id = c.id
WHERE c.name LIKE '%Score%ligue%1%' AND c.season = '2023/24'
GROUP BY c.id, c.name, c.total_cards;