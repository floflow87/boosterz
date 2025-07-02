-- MIGRATION COMMUNAUTAIRE SECURISEE
-- Preserve les 18 tables existantes et ajoute user_card_ownership
-- Version corrigee sans problemes d'encodage

-- 1. VERIFICATION PRE-MIGRATION
DO $$
DECLARE
    table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';
    
    RAISE NOTICE 'Tables existantes avant migration: %', table_count;
    
    IF table_count < 18 THEN
        RAISE EXCEPTION 'ARRET: Seulement % tables trouvees, minimum 18 requis', table_count;
    END IF;
END $$;

-- 2. SAUVEGARDE DES DONNEES EXISTANTES
CREATE TABLE IF NOT EXISTS backup_personal_cards AS SELECT * FROM personal_cards;
CREATE TABLE IF NOT EXISTS backup_user_cards AS SELECT * FROM user_cards;

-- 3. CREATION DE LA NOUVELLE TABLE user_card_ownership
CREATE TABLE IF NOT EXISTS user_card_ownership (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  owned BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, card_id)
);

-- 4. MIGRATION DES DONNEES
-- Migration depuis personal_cards vers user_card_ownership
INSERT INTO user_card_ownership (user_id, card_id, owned, created_at)
SELECT DISTINCT 
    pc.user_id,
    c.id as card_id,
    true as owned,
    pc.created_at
FROM personal_cards pc
JOIN cards c ON (
    LOWER(pc.player_name) = LOWER(c.player_name) 
    AND LOWER(pc.team_name) = LOWER(c.team_name)
    AND pc.collection_id = c.collection_id
)
WHERE NOT EXISTS (
    SELECT 1 FROM user_card_ownership uco 
    WHERE uco.user_id = pc.user_id AND uco.card_id = c.id
);

-- Migration depuis user_cards vers user_card_ownership
INSERT INTO user_card_ownership (user_id, card_id, owned, created_at)
SELECT DISTINCT 
    uc.user_id,
    uc.card_id,
    uc.owned,
    uc.created_at
FROM user_cards uc
WHERE NOT EXISTS (
    SELECT 1 FROM user_card_ownership uco 
    WHERE uco.user_id = uc.user_id AND uco.card_id = uc.card_id
);

-- 5. CREATION DES INDEX
CREATE INDEX IF NOT EXISTS idx_user_card_ownership_user_id ON user_card_ownership(user_id);
CREATE INDEX IF NOT EXISTS idx_user_card_ownership_card_id ON user_card_ownership(card_id);
CREATE INDEX IF NOT EXISTS idx_user_card_ownership_owned ON user_card_ownership(owned);

-- 6. TRIGGER POUR MISE A JOUR AUTOMATIQUE
CREATE OR REPLACE FUNCTION update_user_card_ownership_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE TRIGGER update_user_card_ownership_updated_at 
    BEFORE UPDATE ON user_card_ownership 
    FOR EACH ROW EXECUTE FUNCTION update_user_card_ownership_updated_at();

-- 7. VERIFICATION POST-MIGRATION
DO $$
DECLARE
    ownership_count INTEGER;
    personal_cards_count INTEGER;
    user_cards_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO ownership_count FROM user_card_ownership;
    SELECT COUNT(*) INTO personal_cards_count FROM personal_cards;
    SELECT COUNT(*) INTO user_cards_count FROM user_cards;
    
    RAISE NOTICE 'Lignes dans user_card_ownership: %', ownership_count;
    RAISE NOTICE 'Lignes dans personal_cards: %', personal_cards_count;
    RAISE NOTICE 'Lignes dans user_cards: %', user_cards_count;
    
    IF ownership_count = 0 THEN
        RAISE WARNING 'ATTENTION: Aucune ligne migree dans user_card_ownership';
    ELSE
        RAISE NOTICE 'SUCCESS: Migration reussie avec % lignes', ownership_count;
    END IF;
END $$;

-- 8. VERIFICATION DES TABLES FINALES
DO $$
DECLARE
    final_table_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO final_table_count
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_type = 'BASE TABLE';
    
    RAISE NOTICE 'Tables finales apres migration: %', final_table_count;
    
    IF final_table_count < 19 THEN
        RAISE WARNING 'ATTENTION: Seulement % tables apres migration', final_table_count;
    ELSE
        RAISE NOTICE 'SUCCESS: % tables preservees + user_card_ownership ajoutee', final_table_count;
    END IF;
END $$;

-- MIGRATION TERMINEE - PRETE POUR DEPLOIEMENT SUPABASE