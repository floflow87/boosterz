-- SCRIPT POUR AJOUTER SCORE LIGUE 1 2023/24 À SUPABASE
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier et créer la collection Score Ligue 1 2023/24
DO $$
BEGIN
    -- Supprimer la collection existante si elle existe pour éviter les doublons
    DELETE FROM collections WHERE name = 'SCORE LIGUE 1' AND season = '2023/24';
    
    -- Insérer la collection Score Ligue 1 2023/24 pour Floflow87 (ID 1)
    INSERT INTO collections (
        user_id,
        name, 
        season,
        total_cards, 
        owned_cards, 
        completion_percentage, 
        image_url, 
        background_color
    ) VALUES (
        1, -- user_id pour Floflow87
        'SCORE LIGUE 1',
        '2023/24',
        2869, -- Total des cartes Score Ligue 1 2023/24
        0, -- Initialement aucune carte possédée
        0, -- 0% de complétion au début
        '@assets/image 29_1750232088999.png',
        '#F37261'
    );
    
    -- Insérer aussi pour l'utilisateur maxlamenace (ID 2)
    INSERT INTO collections (
        user_id,
        name, 
        season,
        total_cards, 
        owned_cards, 
        completion_percentage, 
        image_url, 
        background_color
    ) VALUES (
        2, -- user_id pour maxlamenace
        'SCORE LIGUE 1',
        '2023/24',
        2869, -- Total des cartes Score Ligue 1 2023/24
        0, -- Initialement aucune carte possédée
        0, -- 0% de complétion au début
        '@assets/image 29_1750232088999.png',
        '#F37261'
    );

    RAISE NOTICE 'Collection Score Ligue 1 2023/24 ajoutée avec succès pour les utilisateurs ID 1 et 2';
END $$;

-- 2. Vérifier que les collections ont été créées
SELECT 
    c.id,
    c.user_id,
    c.name,
    c.season,
    c.total_cards,
    c.owned_cards,
    c.completion_percentage
FROM collections c
WHERE c.name = 'SCORE LIGUE 1' AND c.season = '2023/24'
ORDER BY c.user_id;

-- 4. Vérification finale
SELECT 
    'Collections créées:' as status,
    COUNT(*) as nombre
FROM collections 
WHERE name = 'SCORE LIGUE 1' AND season = '2023/24';

-- Messages de confirmation
SELECT 
    '✅ Script exécuté avec succès!' as message,
    'Les collections Score Ligue 1 2023/24 ont été ajoutées pour tous les utilisateurs' as details;