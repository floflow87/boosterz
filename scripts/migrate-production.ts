import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';

const DATABASE_URL = process.env.SUPABASE_DATABASE_URL || 
  process.env.DATABASE_URL ||
  "postgresql://postgres.cqfzgjefafqwcjzvfnaq:[YOUR-PASSWORD]@aws-0-eu-west-3.pooler.supabase.com:6543/postgres";

if (!DATABASE_URL) {
  console.error('❌ SUPABASE_DATABASE_URL environment variable is required');
  process.exit(1);
}

if (DATABASE_URL.includes('[YOUR-PASSWORD]')) {
  console.error('❌ Please replace [YOUR-PASSWORD] with your actual Supabase password');
  console.error('💡 Set SUPABASE_DATABASE_URL with your complete connection string');
  process.exit(1);
}

console.log('🚀 Starting Supabase production database migration...');

const pool = new Pool({ 
  connectionString: DATABASE_URL,
  ssl: true
});

const db = drizzle({ client: pool });

async function migrateProduction() {
  try {
    console.log('📋 Creating tables in production database...');
    
    // Créer les tables une par une avec les bonnes relations
    await db.execute(`
      -- Users table
      CREATE TABLE IF NOT EXISTS users (
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
        followers_count INTEGER DEFAULT 0 NOT NULL,
        following_count INTEGER DEFAULT 0 NOT NULL,
        total_cards INTEGER DEFAULT 0 NOT NULL,
        collections_count INTEGER DEFAULT 0 NOT NULL,
        completion_percentage REAL DEFAULT 0 NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      -- Collections table
      CREATE TABLE IF NOT EXISTS collections (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        season TEXT,
        total_cards INTEGER NOT NULL,
        owned_cards INTEGER DEFAULT 0 NOT NULL,
        completion_percentage REAL DEFAULT 0 NOT NULL,
        image_url TEXT,
        background_color TEXT DEFAULT '#F37261'
      );

      -- Cards table  
      CREATE TABLE IF NOT EXISTS cards (
        id SERIAL PRIMARY KEY,
        collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
        reference TEXT NOT NULL,
        player_name TEXT,
        team_name TEXT,
        card_type TEXT NOT NULL,
        card_sub_type TEXT,
        season TEXT,
        image_url TEXT,
        numbering TEXT,
        is_rookie BOOLEAN DEFAULT false,
        condition TEXT DEFAULT 'mint',
        acquired_date TIMESTAMP,
        notes TEXT,
        is_owned BOOLEAN DEFAULT false NOT NULL,
        is_for_sale BOOLEAN DEFAULT false NOT NULL,
        sale_price TEXT,
        sale_description TEXT,
        is_sold BOOLEAN DEFAULT false NOT NULL
      );

      -- User collections junction table
      CREATE TABLE IF NOT EXISTS user_collections (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        collection_id INTEGER NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
        owned_cards INTEGER DEFAULT 0 NOT NULL,
        completion_percentage REAL DEFAULT 0 NOT NULL,
        UNIQUE(user_id, collection_id)
      );

      -- Personal cards table
      CREATE TABLE IF NOT EXISTS personal_cards (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        collection_id INTEGER REFERENCES collections(id) ON DELETE SET NULL,
        reference TEXT,
        player_name TEXT NOT NULL,
        team_name TEXT,
        card_type TEXT NOT NULL,
        season TEXT,
        image_url TEXT,
        numbering TEXT,
        condition TEXT DEFAULT 'mint',
        notes TEXT,
        acquired_date TIMESTAMP DEFAULT NOW(),
        is_for_sale BOOLEAN DEFAULT false NOT NULL,
        sale_price TEXT,
        sale_description TEXT,
        is_sold BOOLEAN DEFAULT false NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      -- Decks table
      CREATE TABLE IF NOT EXISTS decks (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        theme TEXT DEFAULT 'Marine & Or',
        cover_image TEXT,
        banner_position TEXT DEFAULT 'center',
        is_public BOOLEAN DEFAULT true NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      -- Deck cards table
      CREATE TABLE IF NOT EXISTS deck_cards (
        id SERIAL PRIMARY KEY,
        deck_id INTEGER NOT NULL REFERENCES decks(id) ON DELETE CASCADE,
        personal_card_id INTEGER NOT NULL REFERENCES personal_cards(id) ON DELETE CASCADE,
        position INTEGER NOT NULL,
        UNIQUE(deck_id, position),
        UNIQUE(deck_id, personal_card_id)
      );

      -- Posts table
      CREATE TABLE IF NOT EXISTS posts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        card_image TEXT,
        card_name TEXT,
        type TEXT DEFAULT 'general',
        likes_count INTEGER DEFAULT 0 NOT NULL,
        comments_count INTEGER DEFAULT 0 NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      -- Post likes table
      CREATE TABLE IF NOT EXISTS post_likes (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(user_id, post_id)
      );

      -- Comments table
      CREATE TABLE IF NOT EXISTS comments (
        id SERIAL PRIMARY KEY,
        post_id INTEGER NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      -- Follows table
      CREATE TABLE IF NOT EXISTS follows (
        id SERIAL PRIMARY KEY,
        follower_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        following_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(follower_id, following_id),
        CHECK (follower_id != following_id)
      );

      -- Conversations table
      CREATE TABLE IF NOT EXISTS conversations (
        id SERIAL PRIMARY KEY,
        participant1_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        participant2_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        last_message_at TIMESTAMP DEFAULT NOW() NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(participant1_id, participant2_id),
        CHECK (participant1_id != participant2_id)
      );

      -- Messages table
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      -- Notifications table
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false NOT NULL,
        related_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        related_post_id INTEGER REFERENCES posts(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
      CREATE INDEX IF NOT EXISTS idx_cards_collection_id ON cards(collection_id);
      CREATE INDEX IF NOT EXISTS idx_personal_cards_user_id ON personal_cards(user_id);
      CREATE INDEX IF NOT EXISTS idx_deck_cards_deck_id ON deck_cards(deck_id);
      CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
      CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON post_likes(post_id);
      CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
      CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
      CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);
      CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
    `);

    console.log('✅ Production database migration completed successfully!');
    console.log('🎯 All tables and indexes have been created in Supabase');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Execute migration
migrateProduction()
  .then(() => {
    console.log('🎉 Migration process completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration process failed:', error);
    process.exit(1);
  });