-- SCRIPT POUR AJOUTER SCORE LIGUE 1 2023/24 À SUPABASE (VERSION PRODUCTION)
-- Structure adaptée à la table collections existante en production

-- 1. D'abord, mettre à jour la structure de la table collections si nécessaire
ALTER TABLE collections 
ADD COLUMN IF NOT EXISTS user_id INTEGER,
ADD COLUMN IF NOT EXISTS season TEXT,
ADD COLUMN IF NOT EXISTS owned_cards INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS completion_percentage REAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT '#F37261';

-- 2. Créer la collection Score Ligue 1 2023/24
DO $$
BEGIN
    -- Supprimer les collections existantes Score Ligue 1 2023/24 pour éviter les doublons
    DELETE FROM collections 
    WHERE name = 'SCORE LIGUE 1' 
    AND (season = '2023/24' OR season IS NULL);
    
    -- Supprimer aussi par nom si pas de season
    DELETE FROM collections 
    WHERE name LIKE '%SCORE LIGUE 1%' 
    AND name LIKE '%2023/24%';
    
    -- Insérer la collection pour Floflow87 (ID 1)
    INSERT INTO collections (
        user_id,
        name,
        season,
        description,
        image_url,
        total_cards,
        owned_cards,
        completion_percentage,
        background_color,
        created_at,
        updated_at
    ) VALUES (
        1, -- user_id pour Floflow87
        'SCORE LIGUE 1',
        '2023/24',
        'Collection Score Ligue 1 saison 2023/24',
        '@assets/image 29_1750232088999.png',
        2869, -- Total des cartes Score Ligue 1 2023/24
        0, -- Initialement aucune carte possédée
        0, -- 0% de complétion au début
        '#F37261',
        NOW(),
        NOW()
    );
    
    -- Insérer aussi pour maxlamenace (ID 2)
    INSERT INTO collections (
        user_id,
        name,
        season,
        description,
        image_url,
        total_cards,
        owned_cards,
        completion_percentage,
        background_color,
        created_at,
        updated_at
    ) VALUES (
        2, -- user_id pour maxlamenace
        'SCORE LIGUE 1',
        '2023/24',
        'Collection Score Ligue 1 saison 2023/24',
        '@assets/image 29_1750232088999.png',
        2869, -- Total des cartes Score Ligue 1 2023/24
        0, -- Initialement aucune carte possédée
        0, -- 0% de complétion au début
        '#F37261',
        NOW(),
        NOW()
    );

    RAISE NOTICE 'Collection Score Ligue 1 2023/24 ajoutée avec succès pour les utilisateurs ID 1 et 2';
END $$;

-- 3. Vérifier que les collections ont été créées
SELECT 
    c.id,
    c.user_id,
    c.name,
    c.season,
    c.total_cards,
    c.owned_cards,
    c.completion_percentage,
    c.created_at
FROM collections c
WHERE c.name = 'SCORE LIGUE 1' AND c.season = '2023/24'
ORDER BY c.user_id;

-- 4. Vérification finale
SELECT 
    'Collections créées:' as status,
    COUNT(*) as nombre
FROM collections 
WHERE name = 'SCORE LIGUE 1' AND season = '2023/24';

-- 5. Messages de confirmation
SELECT 
    '✅ Script exécuté avec succès!' as message,
    'Les collections Score Ligue 1 2023/24 ont été ajoutées pour tous les utilisateurs' as details;