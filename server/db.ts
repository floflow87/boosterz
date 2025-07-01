import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { Pool as PgPool } from 'pg';
import { drizzle as drizzleNeon } from 'drizzle-orm/neon-serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import ws from "ws";
import * as schema from "@shared/schema";

// TEMPORAIRE: Utilise la même base de données Neon en dev et prod
neonConfig.webSocketConstructor = ws;

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL must be set."
  );
}

console.log('🗄️  Database: Neon (both dev and prod)');
console.log('Environment:', process.env.NODE_ENV);

const pool = new NeonPool({ 
  connectionString: databaseUrl,
  ssl: false
});

const db = drizzleNeon({ client: pool, schema });

export { db };