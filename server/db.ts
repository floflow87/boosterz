import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from "@shared/schema";

// Configuration pour environnements séparés dev/production
const isProduction = process.env.NODE_ENV === 'production';

let databaseUrl: string;

if (isProduction) {
  // En production, utilise la base Supabase fournie
  const prodUrl = process.env.DATABASE_URL;
  if (!prodUrl) {
    throw new Error(
      "DATABASE_URL must be set for production. Please configure your Supabase database URL."
    );
  }
  databaseUrl = prodUrl;
} else {
  // En développement, utilise la base Neon locale
  const devUrl = process.env.DEV_DATABASE_URL || process.env.DATABASE_URL;
  if (!devUrl) {
    throw new Error(
      "DEV_DATABASE_URL or DATABASE_URL must be set for development."
    );
  }
  databaseUrl = devUrl;
}

console.log(`🗄️  Database: ${isProduction ? 'Production (Supabase)' : 'Development (Neon)'}`);

export const pool = new Pool({ 
  connectionString: databaseUrl,
  ssl: true // Supabase et Neon nécessitent tous deux SSL
});

export const db = drizzle({ client: pool, schema });