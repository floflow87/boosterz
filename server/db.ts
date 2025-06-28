import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

// Configuration pour environnements séparés dev/production
const isProduction = process.env.NODE_ENV === 'production';
const isReplit = process.env.REPLIT_DB_URL !== undefined;

// Configuration WebSocket pour Neon (nécessaire en développement)
if (!isProduction) {
  neonConfig.webSocketConstructor = ws;
}

let databaseUrl: string;

if (isProduction) {
  // En production, utilise la base Supabase fournie
  const prodUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
  if (!prodUrl) {
    throw new Error(
      "SUPABASE_DATABASE_URL must be set for production. Please configure your Supabase database URL."
    );
  }
  databaseUrl = prodUrl;
  console.log('🗄️  Database: Production (Supabase)');
} else {
  // En développement, utilise la base Neon existante
  const devUrl = process.env.DATABASE_URL;
  if (!devUrl) {
    throw new Error(
      "DATABASE_URL must be set for development."
    );
  }
  databaseUrl = devUrl;
  console.log('🗄️  Database: Development (Neon)');
}

export const pool = new Pool({ 
  connectionString: databaseUrl,
  ssl: isProduction ? true : false // SSL uniquement requis en production pour Supabase
});

export const db = drizzle({ client: pool, schema });