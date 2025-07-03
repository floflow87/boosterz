-- ===========================================
-- SCRIPT D'OPTIMISATION COMPLÈTE DATABASE
-- ===========================================
-- Objectifs :
-- 1. Ajouter les contraintes FK manquantes
-- 2. Clarifier l'architecture cards vs checklist_cards  
-- 3. Optimiser les performances en production
-- 4. Ajouter les index nécessaires
-- ===========================================

-- ========================================
-- PARTIE 1: CONTRAINTES FK MANQUANTES
-- ========================================

-- 1.1 Ajouter contrainte FK pour base_card_id dans checklist_cards
-- Permet de gérer les variantes correctement
ALTER TABLE checklist_cards 
ADD CONSTRAINT checklist_cards_base_card_id_fkey 
FOREIGN KEY (base_card_id) REFERENCES checklist_cards(id);

-- 1.2 Ajouter contrainte FK pour base_card_id dans cards  
-- (Si cette table doit être conservée)
ALTER TABLE cards 
ADD CONSTRAINT cards_base_card_id_fkey 
FOREIGN KEY (base_card_id) REFERENCES cards(id);

-- ========================================
-- PARTIE 2: CLARIFICATION ARCHITECTURE
-- ========================================

-- 2.1 Ajouter relation checklist_card_id dans cards
-- Pour lier les cartes individuelles aux cartes de référence
ALTER TABLE cards 
ADD COLUMN checklist_card_id INTEGER REFERENCES checklist_cards(id);

-- 2.2 Ajouter relation checklist_card_id dans personal_cards
-- Pour lier les cartes personnelles aux cartes de référence  
ALTER TABLE personal_cards 
ADD COLUMN checklist_card_id INTEGER REFERENCES checklist_cards(id);

-- ========================================
-- PARTIE 3: INDEX PERFORMANCE CRITIQUES
-- ========================================

-- 3.1 Index sur checklist_cards pour recherches rapides
CREATE INDEX IF NOT EXISTS idx_checklist_cards_collection_type ON checklist_cards(collection_id, card_type);
CREATE INDEX IF NOT EXISTS idx_checklist_cards_player_team ON checklist_cards(player_name, team_name);
CREATE INDEX IF NOT EXISTS idx_checklist_cards_reference ON checklist_cards(reference);
CREATE INDEX IF NOT EXISTS idx_checklist_cards_base_card ON checklist_cards(base_card_id) WHERE base_card_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_checklist_cards_variant ON checklist_cards(is_variant, base_card_id);

-- 3.2 Index sur user_card_ownership pour ownership rapide
CREATE INDEX IF NOT EXISTS idx_ownership_user_collection ON user_card_ownership(user_id, card_id);
CREATE INDEX IF NOT EXISTS idx_ownership_owned_status ON user_card_ownership(owned, user_id);

-- 3.3 Index sur personal_cards pour performances utilisateur
CREATE INDEX IF NOT EXISTS idx_personal_cards_user ON personal_cards(user_id);
CREATE INDEX IF NOT EXISTS idx_personal_cards_sale ON personal_cards(is_for_sale, user_id) WHERE is_for_sale = true;
CREATE INDEX IF NOT EXISTS idx_personal_cards_trade ON personal_cards(is_for_trade, user_id) WHERE is_for_trade = true;
CREATE INDEX IF NOT EXISTS idx_personal_cards_checklist ON personal_cards(checklist_card_id) WHERE checklist_card_id IS NOT NULL;

-- 3.4 Index sur cards pour performances recherche
CREATE INDEX IF NOT EXISTS idx_cards_collection_type ON cards(collection_id, card_type);
CREATE INDEX IF NOT EXISTS idx_cards_user_collection ON cards(user_id, collection_id);
CREATE INDEX IF NOT EXISTS idx_cards_checklist_ref ON cards(checklist_card_id) WHERE checklist_card_id IS NOT NULL;

-- 3.5 Index sur posts et interactions sociales
CREATE INDEX IF NOT EXISTS idx_posts_user_created ON posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_created ON post_comments(post_id, created_at DESC);

-- 3.6 Index sur follows pour réseaux sociaux rapides
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_follows_status ON follows(status);

-- 3.7 Index sur conversations et messages
CREATE INDEX IF NOT EXISTS idx_conversations_users ON conversations(user1_id, user2_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(conversation_id, is_read) WHERE is_read = false;

-- 3.8 Index sur decks et deck_cards
CREATE INDEX IF NOT EXISTS idx_decks_user ON decks(user_id);
CREATE INDEX IF NOT EXISTS idx_deck_cards_deck_position ON deck_cards(deck_id, position);

-- ========================================
-- PARTIE 4: VUES OPTIMISÉES
-- ========================================

-- 4.1 Vue pour statistiques utilisateur rapides
CREATE OR REPLACE VIEW user_stats_optimized AS
SELECT 
    u.id,
    u.username,
    u.name,
    COUNT(DISTINCT pc.id) as personal_cards_count,
    COUNT(DISTINCT d.id) as decks_count,
    COUNT(DISTINCT f1.id) as followers_count,
    COUNT(DISTINCT f2.id) as following_count,
    COUNT(DISTINCT p.id) as posts_count
FROM users u
LEFT JOIN personal_cards pc ON u.id = pc.user_id
LEFT JOIN decks d ON u.id = d.user_id  
LEFT JOIN follows f1 ON u.id = f1.following_id AND f1.status = 'accepted'
LEFT JOIN follows f2 ON u.id = f2.follower_id AND f2.status = 'accepted'
LEFT JOIN posts p ON u.id = p.user_id
GROUP BY u.id, u.username, u.name;

-- 4.2 Vue pour completion pourcentage par collection
CREATE OR REPLACE VIEW collection_completion_optimized AS
SELECT 
    uco.user_id,
    cc.collection_id,
    COUNT(*) as total_cards,
    COUNT(CASE WHEN uco.owned = true THEN 1 END) as owned_cards,
    ROUND(
        COUNT(CASE WHEN uco.owned = true THEN 1 END) * 100.0 / COUNT(*), 
        2
    ) as completion_percentage
FROM user_card_ownership uco
INNER JOIN checklist_cards cc ON uco.card_id = cc.id
GROUP BY uco.user_id, cc.collection_id;

-- ========================================
-- PARTIE 5: FONCTIONS STOCKÉES PERFORMANCE
-- ========================================

-- 5.1 Fonction pour compter les cartes d'un utilisateur rapidement
CREATE OR REPLACE FUNCTION get_user_card_count(user_id_param INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM personal_cards 
        WHERE user_id = user_id_param
    );
END;
$$ LANGUAGE plpgsql;

-- 5.2 Fonction pour obtenir le pourcentage de complétion collection
CREATE OR REPLACE FUNCTION get_collection_completion(user_id_param INTEGER, collection_id_param INTEGER)
RETURNS DECIMAL AS $$
DECLARE
    total_count INTEGER;
    owned_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count
    FROM checklist_cards 
    WHERE collection_id = collection_id_param;
    
    SELECT COUNT(*) INTO owned_count
    FROM user_card_ownership uco
    INNER JOIN checklist_cards cc ON uco.card_id = cc.id
    WHERE uco.user_id = user_id_param 
    AND cc.collection_id = collection_id_param 
    AND uco.owned = true;
    
    IF total_count = 0 THEN
        RETURN 0;
    END IF;
    
    RETURN ROUND((owned_count * 100.0) / total_count, 2);
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PARTIE 6: NETTOYAGE ET MAINTENANCE
-- ========================================

-- 6.1 Fonction de nettoyage des données orphelines
CREATE OR REPLACE FUNCTION cleanup_orphaned_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Nettoyer les user_card_ownership orphelins
    DELETE FROM user_card_ownership 
    WHERE card_id NOT IN (SELECT id FROM checklist_cards);
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Nettoyer les deck_cards orphelins
    DELETE FROM deck_cards 
    WHERE deck_id NOT IN (SELECT id FROM decks);
    
    -- Nettoyer les messages orphelins
    DELETE FROM messages 
    WHERE conversation_id NOT IN (SELECT id FROM conversations);
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ========================================
-- PARTIE 7: CONFIGURATION PERFORMANCE
-- ========================================

-- 7.1 Mise à jour des statistiques pour l'optimiseur
ANALYZE;

-- 7.2 Configuration recommandée (à adapter selon la RAM disponible)
-- SET shared_buffers = '256MB';
-- SET effective_cache_size = '1GB';
-- SET work_mem = '16MB';
-- SET maintenance_work_mem = '64MB';

-- ========================================
-- PARTIE 8: VÉRIFICATION POST-MIGRATION
-- ========================================

-- Vérifier les contraintes ajoutées
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('checklist_cards', 'cards', 'personal_cards');

-- Vérifier les index créés
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('checklist_cards', 'user_card_ownership', 'personal_cards', 'posts', 'follows')
ORDER BY tablename, indexname;

-- Résumé des optimisations
SELECT 
    'Optimisation complète terminée' as status,
    COUNT(DISTINCT table_name) as tables_optimized
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('checklist_cards', 'user_card_ownership', 'personal_cards', 'cards');