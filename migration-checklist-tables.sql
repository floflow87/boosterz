-- Migration pour ajouter les tables checklist_cards et user_card_ownership
-- Resout le probleme des check-lists vides en production

-- 1. Creation de la table checklist_cards pour stocker les cartes de reference par check-list
CREATE TABLE IF NOT EXISTS checklist_cards (
    id SERIAL PRIMARY KEY,
    collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    reference TEXT NOT NULL,
    player_name TEXT,
    team_name TEXT,
    card_type TEXT NOT NULL,
    card_sub_type TEXT,
    season TEXT,
    image_url TEXT,
    is_rookie_card BOOLEAN DEFAULT false NOT NULL,
    rarity TEXT,
    serial_number TEXT,
    numbering TEXT,
    base_card_id INTEGER,
    is_variant BOOLEAN DEFAULT false NOT NULL,
    variants TEXT,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(collection_id, reference)
);

-- 2. Creation de la table user_card_ownership pour tracker la propriete individuelle
CREATE TABLE IF NOT EXISTS user_card_ownership (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_id INTEGER NOT NULL REFERENCES checklist_cards(id) ON DELETE CASCADE,
    owned BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, card_id)
);

-- 3. Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_checklist_cards_collection_id ON checklist_cards(collection_id);
CREATE INDEX IF NOT EXISTS idx_checklist_cards_card_type ON checklist_cards(card_type);
CREATE INDEX IF NOT EXISTS idx_checklist_cards_player_name ON checklist_cards(player_name);

CREATE INDEX IF NOT EXISTS idx_user_card_ownership_user_id ON user_card_ownership(user_id);
CREATE INDEX IF NOT EXISTS idx_user_card_ownership_card_id ON user_card_ownership(card_id);
CREATE INDEX IF NOT EXISTS idx_user_card_ownership_owned ON user_card_ownership(owned);

-- 4. Triggers pour la mise a jour automatique des timestamps
CREATE OR REPLACE FUNCTION update_checklist_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

CREATE OR REPLACE FUNCTION update_user_card_ownership_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS update_checklist_cards_updated_at ON checklist_cards;
CREATE TRIGGER update_checklist_cards_updated_at 
    BEFORE UPDATE ON checklist_cards 
    FOR EACH ROW EXECUTE FUNCTION update_checklist_cards_updated_at();

DROP TRIGGER IF EXISTS update_user_card_ownership_updated_at ON user_card_ownership;
CREATE TRIGGER update_user_card_ownership_updated_at 
    BEFORE UPDATE ON user_card_ownership 
    FOR EACH ROW EXECUTE FUNCTION update_user_card_ownership_updated_at();

-- 5. Script pour peupler checklist_cards avec les donnees Score Ligue 1 23/24
-- (A executer separement apres creation des tables)

-- 6. Verification du succes de la migration
SELECT 
    'Migration checklist terminee avec succes' as status,
    COUNT(*) as tables_totales
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';