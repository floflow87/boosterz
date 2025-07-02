-- Script d'import du CSV complet Score Ligue 1 23/24 (398 cartes)
-- Nettoie d'abord les données existantes de la collection 1
BEGIN;

-- Supprimer d'abord les données ownership
DELETE FROM user_card_ownership WHERE card_id IN (
    SELECT id FROM checklist_cards WHERE collection_id = 1
);

-- Supprimer les cartes existantes de la collection 1
DELETE FROM checklist_cards WHERE collection_id = 1;

-- Réinitialiser la séquence ID pour commencer à 1
SELECT setval('checklist_cards_id_seq', 1, false);

COMMIT;

-- Le CSV sera importé après ce nettoyage