-- Script de migration simple et propre pour user_card_ownership
-- Compatible avec Neon et Supabase

-- Creation de la table user_card_ownership
CREATE TABLE IF NOT EXISTS user_card_ownership (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
    owned BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, card_id)
);

-- Creation des index pour les performances
CREATE INDEX IF NOT EXISTS idx_user_card_ownership_user_id ON user_card_ownership(user_id);
CREATE INDEX IF NOT EXISTS idx_user_card_ownership_card_id ON user_card_ownership(card_id);
CREATE INDEX IF NOT EXISTS idx_user_card_ownership_owned ON user_card_ownership(owned);

-- Fonction pour la mise a jour automatique du timestamp
CREATE OR REPLACE FUNCTION update_user_card_ownership_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Trigger pour la mise a jour automatique
DROP TRIGGER IF EXISTS update_user_card_ownership_updated_at ON user_card_ownership;
CREATE TRIGGER update_user_card_ownership_updated_at 
    BEFORE UPDATE ON user_card_ownership 
    FOR EACH ROW EXECUTE FUNCTION update_user_card_ownership_updated_at();

-- Verification du succes de la migration
SELECT 
    'Migration terminee avec succes' as status,
    COUNT(*) as tables_totales
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';