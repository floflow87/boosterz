-- SCRIPT USER OWNERSHIP CHECKLIST COMPLET
-- Ajoute le système de propriété individuelle des cartes checklist
-- Corrige la collection 1 cassée en production

-- =====================================================
-- PARTIE 1: CORRECTIF COLLECTION 1 CASSÉE
-- =====================================================

-- Migrer les cartes de la collection ID 9 vers la collection ID 1
-- pour corriger le problème de collection vide

-- 1. Vérifier d'abord l'état actuel
SELECT 'ÉTAT AVANT MIGRATION' as etape;
SELECT id, name, season, total_cards FROM collections WHERE id IN (1, 9);
SELECT COUNT(*) as cartes_collection_1 FROM checklist_cards WHERE collection_id = 1;
SELECT COUNT(*) as cartes_collection_9 FROM checklist_cards WHERE collection_id = 9;

-- 2. Migrer toutes les cartes de la collection 9 vers la collection 1
UPDATE checklist_cards 
SET collection_id = 1 
WHERE collection_id = 9;

-- 3. Supprimer la collection 9 maintenant vide
DELETE FROM collections WHERE id = 9;

-- 4. Mettre à jour le total_cards de la collection 1
UPDATE collections 
SET total_cards = (
    SELECT COUNT(*) FROM checklist_cards WHERE collection_id = 1
)
WHERE id = 1;

-- Vérifier le résultat
SELECT 'ÉTAT APRÈS MIGRATION' as etape;
SELECT id, name, season, total_cards FROM collections WHERE id = 1;
SELECT COUNT(*) as cartes_collection_1 FROM checklist_cards WHERE collection_id = 1;

-- =====================================================
-- PARTIE 2: SYSTÈME USER OWNERSHIP CHECKLIST
-- =====================================================

-- Table déjà existante user_card_ownership
-- Ajouter les endpoints API et méthodes storage

-- Créer des méthodes pour gérer la propriété des cartes checklist

-- API Endpoints nécessaires à ajouter dans routes.ts :

/*
// ✅ Obtenir la propriété des cartes checklist pour un utilisateur
app.get("/api/collections/:id/checklist-ownership", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const collectionId = parseInt(req.params.id);
    const userId = req.user!.id;
    
    const ownership = await storage.getUserChecklistCardOwnership(userId, collectionId);
    res.json({ ownership });
  } catch (error) {
    console.error('Error loading checklist ownership:', error);
    res.status(500).json({ error: "Erreur lors du chargement de la propriété des cartes" });
  }
});

// ✅ Mettre à jour la propriété d'une carte checklist
app.patch("/api/checklist-cards/:cardId/ownership", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const cardId = parseInt(req.params.cardId);
    const userId = req.user!.id;
    const { owned } = req.body;
    
    const ownership = await storage.updateUserChecklistCardOwnership(userId, cardId, owned);
    res.json({ ownership });
  } catch (error) {
    console.error('Error updating checklist ownership:', error);
    res.status(500).json({ error: "Erreur lors de la mise à jour de la propriété" });
  }
});

// ✅ Obtenir les statistiques de completion pour un utilisateur
app.get("/api/collections/:id/completion-stats", authenticateToken, async (req: AuthRequest, res) => {
  try {
    const collectionId = parseInt(req.params.id);
    const userId = req.user!.id;
    
    const stats = await storage.getCollectionCompletionStats(userId, collectionId);
    res.json({ stats });
  } catch (error) {
    console.error('Error loading completion stats:', error);
    res.status(500).json({ error: "Erreur lors du chargement des statistiques" });
  }
});
*/

-- =====================================================
-- PARTIE 3: FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour initialiser la propriété par défaut pour un utilisateur
CREATE OR REPLACE FUNCTION initialize_user_checklist_ownership(user_id_param INTEGER, collection_id_param INTEGER)
RETURNS VOID AS $$
BEGIN
    -- Insérer toutes les cartes checklist comme non possédées par défaut
    INSERT INTO user_card_ownership (user_id, card_id, owned, created_at, updated_at)
    SELECT 
        user_id_param,
        cc.id,
        false,
        NOW(),
        NOW()
    FROM checklist_cards cc
    WHERE cc.collection_id = collection_id_param
    AND NOT EXISTS (
        SELECT 1 FROM user_card_ownership uco 
        WHERE uco.user_id = user_id_param AND uco.card_id = cc.id
    );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer les statistiques de completion
CREATE OR REPLACE FUNCTION get_collection_completion_stats(user_id_param INTEGER, collection_id_param INTEGER)
RETURNS TABLE(
    total_cards INTEGER,
    owned_cards INTEGER,
    completion_percentage DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(cc.id)::INTEGER as total_cards,
        COUNT(CASE WHEN uco.owned = true THEN 1 END)::INTEGER as owned_cards,
        CASE 
            WHEN COUNT(cc.id) > 0 THEN 
                ROUND((COUNT(CASE WHEN uco.owned = true THEN 1 END) * 100.0 / COUNT(cc.id)), 2)
            ELSE 0.00
        END as completion_percentage
    FROM checklist_cards cc
    LEFT JOIN user_card_ownership uco ON uco.card_id = cc.id AND uco.user_id = user_id_param
    WHERE cc.collection_id = collection_id_param;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- PARTIE 4: INITIALISATION POUR UTILISATEURS EXISTANTS
-- =====================================================

-- Initialiser la propriété pour tous les utilisateurs existants sur la collection 1
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id FROM users WHERE is_active = true
    LOOP
        PERFORM initialize_user_checklist_ownership(user_record.id, 1);
        RAISE NOTICE 'Initialisé propriété checklist pour utilisateur %', user_record.id;
    END LOOP;
END $$;

-- =====================================================
-- PARTIE 5: VÉRIFICATIONS FINALES
-- =====================================================

SELECT 'VÉRIFICATIONS FINALES' as etape;

-- Vérifier la collection 1
SELECT 
    c.id,
    c.name,
    c.season,
    c.total_cards,
    COUNT(cc.id) as cartes_checklist_reelles
FROM collections c
LEFT JOIN checklist_cards cc ON cc.collection_id = c.id
WHERE c.id = 1
GROUP BY c.id, c.name, c.season, c.total_cards;

-- Vérifier les statistiques par utilisateur
SELECT 
    u.id as user_id,
    u.username,
    stats.total_cards,
    stats.owned_cards,
    stats.completion_percentage
FROM users u
CROSS JOIN get_collection_completion_stats(u.id, 1) stats
WHERE u.is_active = true
ORDER BY u.id;

-- Vérifier quelques exemples de propriété
SELECT 
    u.username,
    cc.reference,
    cc.player_name,
    uco.owned
FROM users u
JOIN user_card_ownership uco ON uco.user_id = u.id
JOIN checklist_cards cc ON cc.id = uco.card_id
WHERE cc.collection_id = 1
LIMIT 10;

SELECT 'SCRIPT TERMINÉ AVEC SUCCÈS' as resultat;