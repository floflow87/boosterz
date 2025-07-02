-- SCHEMA DE BASE DE DONNEES COMMUNAUTAIRE CORRECT
-- Architecture corrigee selon les besoins metier reels

-- 1. SUPPRESSION DES TABLES EXISTANTES (dans l'ordre des dependances)
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

-- Table collections : Check-lists maitres partagees par tous
CREATE TABLE collections (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  type VARCHAR(100) NOT NULL,
  season VARCHAR(20),
  year INTEGER,
  brand VARCHAR(100),
  description TEXT,
  is_public BOOLEAN DEFAULT true NOT NULL,
  total_cards INTEGER DEFAULT 0 NOT NULL,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Table cards : Cartes master de chaque check-list
CREATE TABLE cards (
  id SERIAL PRIMARY KEY,
  collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  team_name TEXT NOT NULL,
  card_type VARCHAR(50) NOT NULL,
  reference TEXT,
  numbering TEXT,
  image_url TEXT,
  rarity VARCHAR(50),
  is_featured BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Table user_card_ownership : Propriete individuelle des cartes master
CREATE TABLE user_card_ownership (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id INTEGER NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  owned BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, card_id)
);

-- Table personal_cards : Cartes personnelles des utilisateurs
CREATE TABLE personal_cards (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
  player_name TEXT,
  team_name TEXT,
  card_type VARCHAR(50),
  reference TEXT,
  numbering TEXT,
  condition VARCHAR(50),
  image_url TEXT,
  is_for_sale BOOLEAN DEFAULT false NOT NULL,
  sale_price DECIMAL(10,2),
  sale_description TEXT,
  is_for_trade BOOLEAN DEFAULT false NOT NULL,
  trade_price DECIMAL(10,2),
  trade_description TEXT,
  trade_only BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- 3. TABLES COMMUNAUTAIRES

-- Table conversations : Conversations privees
CREATE TABLE conversations (
  id SERIAL PRIMARY KEY,
  participant1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  participant2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMP DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(participant1_id, participant2_id)
);

-- Table messages : Messages des conversations
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Table subscriptions : Abonnements entre utilisateurs
CREATE TABLE subscriptions (
  id SERIAL PRIMARY KEY,
  follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'active' NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(follower_id, following_id)
);

-- Table posts : Publications des utilisateurs
CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  likes_count INTEGER DEFAULT 0 NOT NULL,
  comments_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Table post_likes : Likes des publications
CREATE TABLE post_likes (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(post_id, user_id)
);

-- Table post_comments : Commentaires des publications
CREATE TABLE post_comments (
  id SERIAL PRIMARY KEY,
  post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Table decks : Decks personnels des utilisateurs
CREATE TABLE decks (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  theme VARCHAR(100),
  cover_image TEXT,
  banner_position TEXT DEFAULT 'center',
  is_public BOOLEAN DEFAULT true NOT NULL,
  cards_count INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Table deck_cards : Cartes dans les decks
CREATE TABLE deck_cards (
  id SERIAL PRIMARY KEY,
  deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
  personal_card_id INTEGER NOT NULL REFERENCES personal_cards(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(deck_id, personal_card_id),
  UNIQUE(deck_id, position)
);

-- Table notifications : Notifications utilisateurs
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false NOT NULL,
  related_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  related_post_id INTEGER REFERENCES posts(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Table unlocked_trophies : Trophees debloques
CREATE TABLE unlocked_trophies (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  trophy_key VARCHAR(100) NOT NULL,
  trophy_name TEXT NOT NULL,
  trophy_tier VARCHAR(50) NOT NULL,
  unlocked_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, trophy_key)
);

-- 4. INDEX POUR PERFORMANCES

CREATE INDEX idx_user_card_ownership_user_id ON user_card_ownership(user_id);
CREATE INDEX idx_user_card_ownership_card_id ON user_card_ownership(card_id);
CREATE INDEX idx_personal_cards_user_id ON personal_cards(user_id);
CREATE INDEX idx_personal_cards_collection_id ON personal_cards(collection_id);
CREATE INDEX idx_personal_cards_for_sale ON personal_cards(is_for_sale) WHERE is_for_sale = true;
CREATE INDEX idx_cards_collection_id ON cards(collection_id);
CREATE INDEX idx_conversations_participants ON conversations(participant1_id, participant2_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_deck_cards_deck_id ON deck_cards(deck_id);
CREATE INDEX idx_deck_cards_position ON deck_cards(deck_id, position);

-- 5. INSERTION DE DONNEES DE TEST

-- Utilisateurs de test
INSERT INTO users (id, username, password, name, email, bio, avatar) VALUES
(1, 'Floflow87', '$2b$10$rQ/ZrZp9z9z9z9z9z9z9z9z9z9z9z9z9z9z9z9z9z9z9z9z9z9z9z9', 'Florent Martin', 'florent@yopmail.com', 'Passionné de cartes de football et supporter de l''OM !', NULL),
(2, 'maxlamenace', '$2b$10$rQ/ZrZp9z9z9z9z9z9z9z9z9z9z9z9z9z9z9z9z9z9z9z9z9z9z9z9z9', 'Max Lamenace', 'maxlamenace@yopmail.com', 'Je suis un passionné de cartes et je PC l''OM', NULL);

-- Collection Score Ligue 1
INSERT INTO collections (id, name, type, season, year, brand, description, total_cards) VALUES
(1, 'Score ligue 1', 'Score ligue 1', '2023/24', 2024, 'Panini', 'Collection Score Ligue 1 2023/24', 2869);

-- Reinitialiser les sequences
SELECT setval('users_id_seq', 2, true);
SELECT setval('collections_id_seq', 1, true);

-- 6. TRIGGERS POUR MISE A JOUR AUTOMATIQUE

-- Fonction pour mettre a jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_collections_updated_at BEFORE UPDATE ON collections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cards_updated_at BEFORE UPDATE ON cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_personal_cards_updated_at BEFORE UPDATE ON personal_cards FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_decks_updated_at BEFORE UPDATE ON decks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- SCHEMA COMMUNAUTAIRE COMPLETE - PRET POUR PRODUCTION