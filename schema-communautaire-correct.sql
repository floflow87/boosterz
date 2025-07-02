-- SCHÉMA DE BASE DE DONNÉES COMMUNAUTAIRE CORRECT
-- Architecture corrigée selon les besoins métier réels

-- 1. SUPPRESSION DES TABLES EXISTANTES (dans l'ordre des dépendances)
DROP TABLE IF EXISTS unlocked_trophies CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS post_comments CASCADE;
DROP TABLE IF EXISTS post_likes CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS deck_cards CASCADE;
DROP TABLE IF EXISTS decks CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS user_card_ownership CASCADE;
DROP TABLE IF EXISTS personal_cards CASCADE;
DROP TABLE IF EXISTS user_cards CASCADE;
DROP TABLE IF EXISTS cards CASCADE;
DROP TABLE IF EXISTS collections CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. TABLES PRINCIPALES

-- Table users : Comptes utilisateurs
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  postal_code VARCHAR(10),
  country VARCHAR(100),
  avatar TEXT,
  bio TEXT,
  is_public BOOLEAN DEFAULT true NOT NULL,
  is_active BOOLEAN DEFAULT true NOT NULL,
  followers_count INTEGER DEFAULT 0 NOT NULL,
  following_count INTEGER DEFAULT 0 NOT NULL,
  total_cards INTEGER DEFAULT 0 NOT NULL,
  collections_count INTEGER DEFAULT 0 NOT NULL,
  completion_percentage REAL DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Table collections : Check-lists maîtres partagées par tous
CREATE TABLE collections (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  season TEXT,
  description TEXT,
  total_cards INTEGER DEFAULT 0 NOT NULL,
  image_url TEXT,
  background_color TEXT DEFAULT '#F37261',
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Table cards : Cartes des check-lists (partagées, SANS isOwned)
CREATE TABLE cards (
  id SERIAL PRIMARY KEY,
  collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  reference TEXT NOT NULL,
  player_name TEXT,
  team_name TEXT,
  card_type TEXT NOT NULL, -- "base_numbered", "insert", "memorabilia", "autographe", "special"
  card_sub_type TEXT, -- Sous-catégories spécifiques
  season TEXT,
  rarity TEXT,
  numbering TEXT,
  base_card_id INTEGER REFERENCES cards(id),
  is_variant BOOLEAN DEFAULT false NOT NULL,
  variants TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Table user_card_ownership : Qui possède quoi dans les check-lists
CREATE TABLE user_card_ownership (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  is_owned BOOLEAN DEFAULT false NOT NULL,
  acquired_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, card_id)
);

-- Table personal_cards : Cartes personnelles ajoutées par chaque user
CREATE TABLE personal_cards (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  collection_id INTEGER REFERENCES collections(id), -- Peut être NULL pour cartes hors collection
  player_name TEXT,
  team_name TEXT,
  card_type TEXT NOT NULL, -- "base_numbered", "insert", "memorabilia", "autographe", "special"
  card_sub_type TEXT,
  reference TEXT,
  numbering TEXT,
  season TEXT,
  free_field TEXT, -- Champ libre pour cartes hors collection
  image_url TEXT,
  condition TEXT,
  is_for_sale BOOLEAN DEFAULT false NOT NULL,
  sale_price TEXT,
  sale_description TEXT,
  is_for_trade BOOLEAN DEFAULT false NOT NULL,
  trade_price TEXT,
  trade_description TEXT,
  trade_only BOOLEAN DEFAULT false NOT NULL,
  is_featured BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 3. SYSTÈME DE DECKS

-- Table decks : Decks publics par user
CREATE TABLE decks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  theme TEXT DEFAULT 'default',
  cover_image TEXT,
  banner_position INTEGER DEFAULT 50,
  is_public BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Table deck_cards : Contenu des decks (personal_cards)
CREATE TABLE deck_cards (
  id SERIAL PRIMARY KEY,
  deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  personal_card_id INTEGER NOT NULL REFERENCES personal_cards(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(deck_id, position)
);

-- 4. SYSTÈME SOCIAL

-- Table subscriptions : Système de suivi entre users
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(follower_id, following_id)
);

-- Table posts : Publications communautaires
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  personal_card_id INTEGER REFERENCES personal_cards(id), -- Carte mise en avant
  image_url TEXT,
  likes_count INTEGER DEFAULT 0 NOT NULL,
  comments_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Table post_likes
CREATE TABLE post_likes (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(post_id, user_id)
);

-- Table post_comments
CREATE TABLE post_comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 5. SYSTÈME DE COMMUNICATION

-- Table conversations
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  participant1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participant2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(participant1_id, participant2_id)
);

-- Table messages
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 6. SYSTÈME DE NOTIFICATIONS ET TROPHÉES

-- Table notifications
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Table unlocked_trophies : Système de trophées basé sur la typologie
CREATE TABLE unlocked_trophies (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trophy_type TEXT NOT NULL, -- "base_numbered", "insert", "memorabilia", "autographe", "special"
  tier TEXT NOT NULL, -- "bronze", "silver", "gold", etc.
  unlocked_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, trophy_type, tier)
);

-- 7. INSERTION DES DONNÉES DE BASE

-- Utilisateurs de test
INSERT INTO users (id, username, password, name, email, bio, is_active, created_at, updated_at) VALUES
(1, 'Floflow87', '$2b$10$rQ7M4fPbZvS8YqL1bT8R.uN9J4K6H7A3M2S9D0V1L6X8W4Q5R2U3E', 'Florent Martin', 'florent@yopmail.com', 'Collectionneur passionné et admin de BOOSTERZ', true, NOW(), NOW()),
(2, 'maxlamenace', '$2b$10$rQ7M4fPbZvS8YqL1bT8R.uN9J4K6H7A3M2S9D0V1L6X8W4Q5R2U3E', 'Max la Menace', 'maxlamenace@yopmail.com', 'Passionné de cartes de football et supporter de l''OM !', true, NOW(), NOW());

-- Collection Score Ligue 1 2023/24 (check-list maître partagée)
INSERT INTO collections (name, season, description, total_cards, image_url, background_color) VALUES
('SCORE LIGUE 1', '2023/24', 'Collection officielle Panini Score Ligue 1 saison 2023/24', 2869, '@assets/image 29_1750232088999.png', '#F37261');

-- Cartes de la check-list (échantillon pour test)
INSERT INTO cards (collection_id, reference, player_name, team_name, card_type, rarity, numbering, season) VALUES
(1, 'SL23-001', 'Kylian Mbappé', 'Paris Saint-Germain', 'base_numbered', 'Base', NULL, '2023/24'),
(1, 'SL23-001', 'Kylian Mbappé', 'Paris Saint-Germain', 'base_numbered', 'Commune', '/50 laser', '2023/24'),
(1, 'SL23-002', 'Lionel Messi', 'Paris Saint-Germain', 'base_numbered', 'Base', NULL, '2023/24'),
(1, 'SL23-003', 'Neymar Jr', 'Paris Saint-Germain', 'base_numbered', 'Base', NULL, '2023/24'),
(1, 'SL23-AU001', 'Kylian Mbappé', 'Paris Saint-Germain', 'autographe', 'Légendaire', '/199', '2023/24'),
(1, 'SL23-AU002', 'Lionel Messi', 'Paris Saint-Germain', 'autographe', 'Légendaire', '/99', '2023/24'),
(1, 'SL23-H001', 'Dimitri Payet', 'Olympique de Marseille', 'insert', 'Rare', '/15', '2023/24'),
(1, 'SL23-SP001', 'Gianluigi Donnarumma', 'Paris Saint-Germain', 'special', 'Unique', '1/1', '2023/24');

-- 8. VÉRIFICATION FINALE
SELECT 
    'Architecture communautaire créée avec succès!' as status,
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as nombre_tables_total;

-- Compter les tables par catégorie
SELECT 
    'Tables principales: users, collections, cards, user_card_ownership, personal_cards' as categories,
    'Tables decks: decks, deck_cards' as decks,
    'Tables sociales: subscriptions, posts, post_likes, post_comments' as social,
    'Tables communication: conversations, messages' as communication,
    'Tables système: notifications, unlocked_trophies' as systeme;

-- Vérifier les données de base
SELECT 
    u.id,
    u.username,
    c.name as collection_name,
    c.total_cards,
    COUNT(cards.*) as cartes_check_list
FROM users u
CROSS JOIN collections c
LEFT JOIN cards ON cards.collection_id = c.id
GROUP BY u.id, u.username, c.name, c.total_cards
ORDER BY u.id;