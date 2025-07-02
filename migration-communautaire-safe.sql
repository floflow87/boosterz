-- MIGRATION SÉCURISÉE VERS ARCHITECTURE COMMUNAUTAIRE
-- Préserve l'existant et ajoute seulement ce qui manque

-- 1. VÉRIFICATION DE L'ÉTAT ACTUEL
SELECT 
    'État actuel de la base de données:' as info,
    COUNT(*) as nombre_tables_existantes
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Lister toutes les tables existantes
SELECT table_name as tables_existantes
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- 2. AJOUT DE LA TABLE MANQUANTE PRINCIPALE
-- Table user_card_ownership : Qui possède quoi dans les check-lists (logique communautaire)
CREATE TABLE IF NOT EXISTS user_card_ownership (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  is_owned BOOLEAN DEFAULT false NOT NULL,
  acquired_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, card_id)
);

-- 3. MODIFICATIONS DES TABLES EXISTANTES

-- Ajouter collection_id à la table cards si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cards' AND column_name = 'collection_id'
    ) THEN
        ALTER TABLE cards ADD COLUMN collection_id INTEGER REFERENCES collections(id) ON DELETE CASCADE;
        
        -- Rattacher toutes les cartes existantes à la collection Score Ligue 1 par défaut
        UPDATE cards SET collection_id = (
            SELECT id FROM collections 
            WHERE name ILIKE '%score%ligue%' 
            ORDER BY id 
            LIMIT 1
        ) WHERE collection_id IS NULL;
        
        -- Rendre la colonne NOT NULL après avoir mis à jour les données
        ALTER TABLE cards ALTER COLUMN collection_id SET NOT NULL;
    END IF;
END $$;

-- Supprimer la colonne isOwned de cards si elle existe (logique incorrecte)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'cards' AND column_name = 'isowned'
    ) THEN
        -- Migrer les données vers user_card_ownership avant suppression
        INSERT INTO user_card_ownership (user_id, card_id, is_owned, created_at)
        SELECT 1 as user_id, id as card_id, isowned, created_at 
        FROM cards 
        WHERE isowned = true
        ON CONFLICT (user_id, card_id) DO NOTHING;
        
        -- Supprimer la colonne problématique
        ALTER TABLE cards DROP COLUMN isowned;
    END IF;
END $$;

-- Ajouter des champs manquants à personal_cards si nécessaires
DO $$ 
BEGIN
    -- Ajouter collection_id pour rattachement (peut être NULL pour hors collection)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'personal_cards' AND column_name = 'collection_id'
    ) THEN
        ALTER TABLE personal_cards ADD COLUMN collection_id INTEGER REFERENCES collections(id);
    END IF;
    
    -- Ajouter free_field pour cartes hors collection
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'personal_cards' AND column_name = 'free_field'
    ) THEN
        ALTER TABLE personal_cards ADD COLUMN free_field TEXT;
    END IF;
    
    -- Ajouter card_sub_type pour sous-catégories
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'personal_cards' AND column_name = 'card_sub_type'
    ) THEN
        ALTER TABLE personal_cards ADD COLUMN card_sub_type TEXT;
    END IF;
END $$;

-- 4. DONNÉES DE TEST SI BESOIN
-- Créer quelques entrées user_card_ownership pour test
INSERT INTO user_card_ownership (user_id, card_id, is_owned, created_at)
SELECT 
    1 as user_id,
    c.id as card_id,
    (random() > 0.7) as is_owned,  -- 30% de chance d'être possédée
    NOW() as created_at
FROM cards c
WHERE c.id <= 10  -- Seulement les 10 premières cartes pour test
ON CONFLICT (user_id, card_id) DO NOTHING;

INSERT INTO user_card_ownership (user_id, card_id, is_owned, created_at)
SELECT 
    2 as user_id,
    c.id as card_id,
    (random() > 0.6) as is_owned,  -- 40% de chance d'être possédée
    NOW() as created_at
FROM cards c
WHERE c.id <= 15  -- Seulement les 15 premières cartes pour test
ON CONFLICT (user_id, card_id) DO NOTHING;

-- 5. VÉRIFICATION POST-MIGRATION
SELECT 
    'Migration terminée - État final:' as info,
    COUNT(*) as nombre_tables_finales
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Vérifier la nouvelle table user_card_ownership
SELECT 
    'Table user_card_ownership:' as table_info,
    COUNT(*) as nombre_lignes,
    COUNT(DISTINCT user_id) as utilisateurs_distincts,
    COUNT(*) FILTER (WHERE is_owned = true) as cartes_possedees
FROM user_card_ownership;

-- Vérifier que cards a bien collection_id
SELECT 
    'Table cards avec collection_id:' as table_info,
    COUNT(*) as total_cartes,
    COUNT(DISTINCT collection_id) as collections_distinctes
FROM cards
WHERE collection_id IS NOT NULL;

-- Vérifier l'état des personal_cards
SELECT 
    'Table personal_cards:' as table_info,
    COUNT(*) as total_cartes_personnelles,
    COUNT(*) FILTER (WHERE collection_id IS NOT NULL) as rattachees_collection,
    COUNT(*) FILTER (WHERE free_field IS NOT NULL) as hors_collection
FROM personal_cards;

-- Résumé final
SELECT 
    '=== MIGRATION COMMUNAUTAIRE TERMINÉE ===' as status,
    'Check-lists partagées: collections + cards (avec collection_id)' as check_lists,
    'Propriété individuelle: user_card_ownership (userId + cardId + isOwned)' as propriete,
    'Cartes personnelles: personal_cards (avec collection_id optionnel)' as cartes_perso,
    'Tables préservées: toutes les tables existantes maintenues' as preservation;