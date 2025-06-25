import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Détermine l'environnement
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

// Utilise la base de données appropriée selon l'environnement
const databaseUrl = isProduction 
  ? process.env.PRODUCTION_DATABASE_URL 
  : process.env.DATABASE_URL;

if (!databaseUrl) {
  const envType = isProduction ? 'PRODUCTION_DATABASE_URL' : 'DATABASE_URL';
  throw new Error(
    `${envType} must be set for ${isProduction ? 'production' : 'development'} environment.`,
  );
}

console.log(`🗄️ Connecting to ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} database`);

export const pool = new Pool({ connectionString: databaseUrl });
export const db = drizzle({ client: pool, schema });