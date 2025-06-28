import { Pool } from 'pg';

async function addIsActiveColumn() {
  console.log('🔧 Migration: Ajout de la colonne is_active...');
  
  // Base de développement (Neon)
  const devUrl = process.env.DATABASE_URL;
  console.log('\n📍 Migration base de développement (Neon)...');
  
  if (devUrl) {
    const devPool = new Pool({ 
      connectionString: devUrl,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    try {
      await devPool.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL
      `);
      console.log('✅ Colonne is_active ajoutée à la base de développement');
      
      // Vérifier
      const result = await devPool.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_active'
      `);
      console.log(`✅ Vérification: colonne trouvée = ${result.rows.length > 0}`);
      
    } catch (error) {
      console.error('❌ Erreur base dev:', error.message);
    } finally {
      await devPool.end();
    }
  }

  // Base de production (Supabase) - seulement si disponible
  const prodUrl = process.env.SUPABASE_DATABASE_URL;
  if (prodUrl) {
    console.log('\n📍 Migration base de production (Supabase)...');
    const prodPool = new Pool({ 
      connectionString: prodUrl,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    try {
      await prodPool.query(`
        ALTER TABLE users 
        ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL
      `);
      console.log('✅ Colonne is_active ajoutée à la base de production');
      
      // Vérifier
      const result = await prodPool.query(`
        SELECT column_name FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_active'
      `);
      console.log(`✅ Vérification: colonne trouvée = ${result.rows.length > 0}`);
      
    } catch (error) {
      console.error('❌ Erreur base prod:', error.message);
    } finally {
      await prodPool.end();
    }
  } else {
    console.log('⚠️  SUPABASE_DATABASE_URL non configuré - migration production ignorée');
  }
  
  console.log('\n🎯 Migration terminée');
}

addIsActiveColumn().catch(console.error);