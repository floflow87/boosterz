-- MIGRATION SIMPLE - AJOUT user_card_ownership
-- Version simplifiee sans verification du nombre de tables

-- 1. CREATION DE LA TABLE user_card_ownership (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS user_card_ownership (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  owned BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, card_id)
);

-- 2. CREATION DES INDEX (si ils n'existent pas)
CREATE INDEX IF NOT EXISTS idx_user_card_ownership_user_id ON user_card_ownership(user_id);
CREATE INDEX IF NOT EXISTS idx_user_card_ownership_card_id ON user_card_ownership(card_id);
CREATE INDEX IF NOT EXISTS idx_user_card_ownership_owned ON user_card_ownership(owned);

-- 3. MIGRATION DES DONNEES depuis personal_cards
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
)
ON CONFLICT (user_id, card_id) DO NOTHING;

-- 4. MIGRATION DES DONNEES depuis user_cards
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
)
ON CONFLICT (user_id, card_id) DO NOTHING;

-- 5. TRIGGER POUR MISE A JOUR AUTOMATIQUE
CREATE OR REPLACE FUNCTION update_user_card_ownership_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS update_user_card_ownership_updated_at ON user_card_ownership;
CREATE TRIGGER update_user_card_ownership_updated_at 
    BEFORE UPDATE ON user_card_ownership 
    FOR EACH ROW EXECUTE FUNCTION update_user_card_ownership_updated_at();

-- 6. VERIFICATION FINALE
SELECT 
    'Migration terminee' as status,
    COUNT(*) as lignes_user_card_ownership,
    (SELECT COUNT(*) FROM personal_cards) as personal_cards_total,
    (SELECT COUNT(*) FROM user_cards) as user_cards_total
FROM user_card_ownership;