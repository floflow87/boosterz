-- Migration user_card_ownership pour production
-- Encodage ASCII propre

CREATE TABLE IF NOT EXISTS user_card_ownership (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    owned BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, card_id)
);

CREATE INDEX IF NOT EXISTS idx_user_card_ownership_user_id ON user_card_ownership(user_id);
CREATE INDEX IF NOT EXISTS idx_user_card_ownership_card_id ON user_card_ownership(card_id);
CREATE INDEX IF NOT EXISTS idx_user_card_ownership_owned ON user_card_ownership(owned);

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

SELECT 'Migration terminee' as status, COUNT(*) as tables_totales
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';