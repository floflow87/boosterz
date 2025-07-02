-- SCRIPT COMPLET POUR CRÉER TOUTE LA STRUCTURE SUPABASE
-- Basé sur shared/schema.ts - Toutes les tables de l'application

-- 1. Supprimer les tables existantes dans l'ordre inverse des dépendances
DROP TABLE IF EXISTS unlocked_trophies CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS post_comments CASCADE;
DROP TABLE IF EXISTS post_likes CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS deck_cards CASCADE;
DROP TABLE IF EXISTS decks CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS personal_cards CASCADE;
DROP TABLE IF EXISTS user_cards CASCADE;
DROP TABLE IF EXISTS cards CASCADE;
DROP TABLE IF EXISTS collections CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 2. Créer toutes les tables avec la structure complète

-- Table users (base)
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

-- Table collections
CREATE TABLE collections (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  season TEXT,
  total_cards INTEGER NOT NULL,
  owned_cards INTEGER DEFAULT 0 NOT NULL,
  completion_percentage REAL DEFAULT 0 NOT NULL,
  image_url TEXT,
  background_color TEXT DEFAULT '#F37261'
);

-- Table cards
CREATE TABLE cards (
  id SERIAL PRIMARY KEY,
  collection_id INTEGER NOT NULL,
  reference TEXT NOT NULL,
  player_name TEXT,
  team_name TEXT,
  card_type TEXT NOT NULL,
  card_sub_type TEXT,
  season TEXT,
  image_url TEXT,
  is_owned BOOLEAN DEFAULT false NOT NULL,
  is_for_trade BOOLEAN DEFAULT false NOT NULL,
  is_rookie_card BOOLEAN DEFAULT false NOT NULL,
  rarity TEXT,
  serial_number TEXT,
  numbering TEXT,
  base_card_id INTEGER,
  is_variant BOOLEAN DEFAULT false NOT NULL,
  variants TEXT,
  trade_description TEXT,
  trade_price TEXT,
  trade_only BOOLEAN DEFAULT false NOT NULL,
  sale_price TEXT,
  sale_description TEXT,
  is_sold BOOLEAN DEFAULT false NOT NULL,
  is_featured BOOLEAN DEFAULT false NOT NULL
);

-- Table personal_cards (cartes personnelles des utilisateurs)
CREATE TABLE personal_cards (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  player_name TEXT,
  team_name TEXT,
  card_type TEXT NOT NULL,
  reference TEXT,
  numbering TEXT,
  season TEXT,
  image_url TEXT,
  sale_price TEXT,
  sale_description TEXT,
  is_for_sale BOOLEAN DEFAULT false NOT NULL,
  is_sold BOOLEAN DEFAULT false NOT NULL,
  is_for_trade BOOLEAN DEFAULT false NOT NULL,
  trade_price TEXT,
  trade_description TEXT,
  trade_only BOOLEAN DEFAULT false NOT NULL,
  condition TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Table user_cards
CREATE TABLE user_cards (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  collection_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  player_name TEXT,
  team_name TEXT,
  card_type TEXT NOT NULL,
  rarity TEXT,
  image_url TEXT,
  is_owned BOOLEAN DEFAULT false NOT NULL,
  is_for_trade BOOLEAN DEFAULT false NOT NULL,
  condition TEXT,
  price REAL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Table conversations (chat)
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  participant1_id INTEGER NOT NULL,
  participant2_id INTEGER NOT NULL,
  last_message_at TIMESTAMP DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Table messages
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Table subscriptions (follows)
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  follower_id INTEGER NOT NULL,
  following_id INTEGER NOT NULL,
  status TEXT DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Table decks
CREATE TABLE decks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  theme TEXT DEFAULT 'default',
  cover_image TEXT,
  banner_position INTEGER DEFAULT 50,
  is_public BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Table deck_cards
CREATE TABLE deck_cards (
  id SERIAL PRIMARY KEY,
  deck_id INTEGER NOT NULL,
  personal_card_id INTEGER NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Table posts (social)
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  likes_count INTEGER DEFAULT 0 NOT NULL,
  comments_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Table post_likes
CREATE TABLE post_likes (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(post_id, user_id)
);

-- Table post_comments
CREATE TABLE post_comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Table notifications
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Table unlocked_trophies (système de trophées)
CREATE TABLE unlocked_trophies (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  trophy_type TEXT NOT NULL,
  tier TEXT NOT NULL,
  unlocked_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, trophy_type, tier)
);

-- 3. Insérer les utilisateurs de base
INSERT INTO users (id, username, password, name, email, bio, is_active, created_at, updated_at) VALUES
(1, 'Floflow87', '$2b$10$rQ7M4fPbZvS8YqL1bT8R.uN9J4K6H7A3M2S9D0V1L6X8W4Q5R2U3E', 'Florent Martin', 'florent@yopmail.com', 'Collectionneur passionné et admin de BOOSTERZ', true, NOW(), NOW()),
(2, 'maxlamenace', '$2b$10$rQ7M4fPbZvS8YqL1bT8R.uN9J4K6H7A3M2S9D0V1L6X8W4Q5R2U3E', 'Max la Menace', 'maxlamenace@yopmail.com', 'Passionné de cartes de football et supporter de l''OM !', true, NOW(), NOW());

-- 4. Créer la collection Score Ligue 1 2023/24 pour les deux utilisateurs
INSERT INTO collections (user_id, name, season, total_cards, owned_cards, completion_percentage, image_url, background_color) VALUES
(1, 'SCORE LIGUE 1', '2023/24', 2869, 0, 0, '@assets/image 29_1750232088999.png', '#F37261'),
(2, 'SCORE LIGUE 1', '2023/24', 2869, 0, 0, '@assets/image 29_1750232088999.png', '#F37261');

-- 5. Insérer un échantillon de cartes pour la première collection créée
DO $$
DECLARE
    collection_id_var INTEGER;
BEGIN
    SELECT id INTO collection_id_var FROM collections WHERE name = 'SCORE LIGUE 1' AND season = '2023/24' LIMIT 1;
    
    INSERT INTO cards (collection_id, reference, player_name, team_name, card_type, rarity, numbering, season) VALUES
    (collection_id_var, 'SL23-001', 'Kylian Mbappé', 'Paris Saint-Germain', 'base', 'Base', NULL, '2023/24'),
    (collection_id_var, 'SL23-001', 'Kylian Mbappé', 'Paris Saint-Germain', 'parallel', 'Commune', '/50 laser', '2023/24'),
    (collection_id_var, 'SL23-002', 'Lionel Messi', 'Paris Saint-Germain', 'base', 'Base', NULL, '2023/24'),
    (collection_id_var, 'SL23-003', 'Neymar Jr', 'Paris Saint-Germain', 'base', 'Base', NULL, '2023/24'),
    (collection_id_var, 'SL23-004', 'Erling Haaland', 'Manchester City', 'base', 'Base', NULL, '2023/24'),
    (collection_id_var, 'SL23-005', 'Karim Benzema', 'Real Madrid', 'base', 'Base', NULL, '2023/24'),
    (collection_id_var, 'SL23-AU001', 'Kylian Mbappé', 'Paris Saint-Germain', 'autographe', 'Légendaire', '/199', '2023/24'),
    (collection_id_var, 'SL23-AU002', 'Lionel Messi', 'Paris Saint-Germain', 'autographe', 'Légendaire', '/99', '2023/24'),
    (collection_id_var, 'SL23-H001', 'Dimitri Payet', 'Olympique de Marseille', 'hits', 'Rare', '/15', '2023/24'),
    (collection_id_var, 'SL23-H002', 'Steve Mandanda', 'Olympique de Marseille', 'hits', 'Épique', '/10', '2023/24'),
    (collection_id_var, 'SL23-SP001', 'Gianluigi Donnarumma', 'Paris Saint-Germain', 'special_1_1', 'Unique', '1/1', '2023/24'),
    (collection_id_var, 'SL23-SP002', 'Achraf Hakimi', 'Paris Saint-Germain', 'special_1_1', 'Unique', '1/1', '2023/24');
    
    RAISE NOTICE 'Échantillon de cartes inséré avec succès';
END $$;

-- 6. Vérification finale
SELECT 
    'Structure complète créée!' as status,
    COUNT(*) as nombre_tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'collections', 'cards', 'personal_cards', 'user_cards', 'conversations', 'messages', 'subscriptions', 'decks', 'deck_cards', 'posts', 'post_likes', 'post_comments', 'notifications', 'unlocked_trophies');

SELECT 
    u.username,
    c.name as collection_name,
    c.season,
    COUNT(cards.*) as nombre_cartes
FROM users u
LEFT JOIN collections c ON c.user_id = u.id
LEFT JOIN cards ON cards.collection_id = c.id
GROUP BY u.username, c.name, c.season
ORDER BY u.id;