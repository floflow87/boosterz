import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { Pool as PgPool } from 'pg';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import ws from "ws";
import * as schema from "@shared/schema";

// Configuration pour environnements séparés dev/production
const isProduction = process.env.NODE_ENV === 'production';

let databaseUrl: string;
let db: any;

async function initializeDatabase() {
  if (isProduction) {
    // En production, utilise Supabase avec pg
    const prodUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
    if (!prodUrl) {
      throw new Error(
        "SUPABASE_DATABASE_URL must be set for production. Please configure your Supabase database URL."
      );
    }
    databaseUrl = prodUrl;
    console.log('🗄️  Database: Production (Supabase)');
    console.log('Database URL configured:', prodUrl.substring(0, 50) + '...');
    
    try {
      const pool = new PgPool({ 
        connectionString: databaseUrl,
        ssl: {
          rejectUnauthorized: false
        }
      });
      
      // Test database connection
      pool.connect((err, client, release) => {
        if (err) {
          console.error('Error connecting to database:', err);
        } else {
          console.log('✅ Database connection successful');
          release();
        }
      });
      
      db = drizzlePg(pool, { schema });
    } catch (error) {
      console.error('Error setting up database:', error);
      throw error;
    }
  } else {
    // En développement, utilise Neon
    try {
      neonConfig.webSocketConstructor = ws;
      
      const devUrl = process.env.DATABASE_URL;
      if (!devUrl) {
        throw new Error(
          "DATABASE_URL must be set for development."
        );
      }
      databaseUrl = devUrl;
      console.log('🗄️  Database: Development (Neon)');
      
      const pool = new NeonPool({ 
        connectionString: databaseUrl,
        ssl: true
      });
      
      // Initialize database connection without testing (to avoid WebSocket issues during startup)
      db = drizzleNeon({ client: pool, schema });
      console.log('✅ Neon database connection initialized');
      
    } catch (error) {
      console.error('Error setting up Neon database:', error);
      throw error;
    }
  }
}

// Initialize database synchronously for now
if (isProduction) {
  const prodUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
  if (!prodUrl) {
    throw new Error(
      "SUPABASE_DATABASE_URL must be set for production. Please configure your Supabase database URL."
    );
  }
  databaseUrl = prodUrl;
  console.log('🗄️  Database: Production (Supabase)');
  
  const pool = new PgPool({ 
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  db = drizzlePg(pool, { schema });
} else {
  // En développement, utilise Neon (simplified initialization)
  neonConfig.webSocketConstructor = ws;
  
  const devUrl = process.env.DATABASE_URL;
  if (!devUrl) {
    throw new Error(
      "DATABASE_URL must be set for development."
    );
  }
  databaseUrl = devUrl;
  console.log('🗄️  Database: Development (Neon)');
  
  const pool = new NeonPool({ 
    connectionString: databaseUrl,
    ssl: true
  });
  
  db = drizzleNeon({ client: pool, schema });
  console.log('✅ Neon database connection initialized');
}

export { db };