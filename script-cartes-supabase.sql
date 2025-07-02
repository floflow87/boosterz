-- SCRIPT POUR AJOUTER LES CARTES SCORE LIGUE 1 2023/24 À SUPABASE
-- Ajoute la structure de table cards si nécessaire et copie les cartes depuis la base de développement

-- 1. D'abord, vérifier et créer la structure de la table cards si nécessaire
DO $$
BEGIN
    -- Vérifier si la table cards existe
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'cards') THEN
        -- Créer la table cards avec la structure complète
        CREATE TABLE cards (
            id SERIAL PRIMARY KEY,
            collection_id INTEGER NOT NULL,
            player_name TEXT NOT NULL,
            team_name TEXT NOT NULL,
            card_type TEXT NOT NULL,
            rarity TEXT,
            reference TEXT NOT NULL,
            numbering TEXT,
            season TEXT,
            image_url TEXT,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
        
        RAISE NOTICE 'Table cards créée avec succès';
    ELSE
        -- Ajouter les colonnes manquantes si elles n'existent pas
        ALTER TABLE cards 
        ADD COLUMN IF NOT EXISTS collection_id INTEGER,
        ADD COLUMN IF NOT EXISTS player_name TEXT,
        ADD COLUMN IF NOT EXISTS team_name TEXT,
        ADD COLUMN IF NOT EXISTS card_type TEXT,
        ADD COLUMN IF NOT EXISTS rarity TEXT,
        ADD COLUMN IF NOT EXISTS reference TEXT,
        ADD COLUMN IF NOT EXISTS numbering TEXT,
        ADD COLUMN IF NOT EXISTS season TEXT,
        ADD COLUMN IF NOT EXISTS image_url TEXT,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
        
        RAISE NOTICE 'Structure de la table cards mise à jour';
    END IF;
END $$;

-- 2. Récupérer l'ID de la collection Score Ligue 1 2023/24 créée précédemment
DO $$
DECLARE
    collection_id_var INTEGER;
BEGIN
    -- Trouver l'ID de la collection Score Ligue 1 2023/24
    SELECT id INTO collection_id_var 
    FROM collections 
    WHERE name = 'SCORE LIGUE 1' AND season = '2023/24' 
    LIMIT 1;
    
    IF collection_id_var IS NULL THEN
        RAISE EXCEPTION 'Collection Score Ligue 1 2023/24 non trouvée. Exécutez d''abord le script de création de collection.';
    END IF;
    
    RAISE NOTICE 'Collection trouvée avec ID: %', collection_id_var;
    
    -- Supprimer les cartes existantes pour cette collection pour éviter les doublons
    DELETE FROM cards WHERE collection_id = collection_id_var;
    
    -- Insérer un échantillon de cartes Score Ligue 1 2023/24 pour tester
    -- (En production, vous devrez importer toutes les 2869 cartes)
    
    INSERT INTO cards (collection_id, player_name, team_name, card_type, rarity, reference, numbering, season, created_at, updated_at) VALUES
    (collection_id_var, 'Kylian Mbappé', 'Paris Saint-Germain', 'base', 'Base', 'SL23-001', NULL, '2023/24', NOW(), NOW()),
    (collection_id_var, 'Kylian Mbappé', 'Paris Saint-Germain', 'parallel', 'Commune', 'SL23-001', '/50 laser', '2023/24', NOW(), NOW()),
    (collection_id_var, 'Lionel Messi', 'Paris Saint-Germain', 'base', 'Base', 'SL23-002', NULL, '2023/24', NOW(), NOW()),
    (collection_id_var, 'Neymar Jr', 'Paris Saint-Germain', 'base', 'Base', 'SL23-003', NULL, '2023/24', NOW(), NOW()),
    (collection_id_var, 'Erling Haaland', 'Manchester City', 'base', 'Base', 'SL23-004', NULL, '2023/24', NOW(), NOW()),
    (collection_id_var, 'Karim Benzema', 'Real Madrid', 'base', 'Base', 'SL23-005', NULL, '2023/24', NOW(), NOW()),
    (collection_id_var, 'Kylian Mbappé', 'Paris Saint-Germain', 'autographe', 'Légendaire', 'SL23-AU001', '/199', '2023/24', NOW(), NOW()),
    (collection_id_var, 'Lionel Messi', 'Paris Saint-Germain', 'autographe', 'Légendaire', 'SL23-AU002', '/99', '2023/24', NOW(), NOW()),
    (collection_id_var, 'Dimitri Payet', 'Olympique de Marseille', 'hits', 'Rare', 'SL23-H001', '/15', '2023/24', NOW(), NOW()),
    (collection_id_var, 'Steve Mandanda', 'Olympique de Marseille', 'hits', 'Épique', 'SL23-H002', '/10', '2023/24', NOW(), NOW()),
    (collection_id_var, 'Gianluigi Donnarumma', 'Paris Saint-Germain', 'special_1_1', 'Unique', 'SL23-SP001', '1/1', '2023/24', NOW(), NOW()),
    (collection_id_var, 'Achraf Hakimi', 'Paris Saint-Germain', 'special_1_1', 'Unique', 'SL23-SP002', '1/1', '2023/24', NOW(), NOW());
    
    RAISE NOTICE 'Échantillon de cartes inséré pour test (% cartes)', (SELECT COUNT(*) FROM cards WHERE collection_id = collection_id_var);
    
END $$;

-- 3. Vérifier que les cartes ont été créées
SELECT 
    c.name as collection_name,
    c.season,
    COUNT(cards.*) as nombre_cartes,
    cards.card_type,
    COUNT(*) as count_par_type
FROM collections c
LEFT JOIN cards ON cards.collection_id = c.id
WHERE c.name = 'SCORE LIGUE 1' AND c.season = '2023/24'
GROUP BY c.name, c.season, cards.card_type
ORDER BY cards.card_type;

-- 4. Messages de confirmation
SELECT 
    '✅ Script cartes exécuté avec succès!' as message,
    'Échantillon de cartes Score Ligue 1 2023/24 ajouté pour test' as details;