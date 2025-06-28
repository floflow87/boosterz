import { neon } from '@neondatabase/serverless';

async function addIsActiveToSupabase() {
  try {
    console.log('🔧 Ajout de la colonne is_active à Supabase...');
    
    const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
    if (!supabaseUrl) {
      throw new Error('SUPABASE_DATABASE_URL not found');
    }
    
    const sql = neon(supabaseUrl);
    
    // Ajouter la colonne is_active si elle n'existe pas
    await sql`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true NOT NULL
    `;
    
    console.log('✅ Colonne is_active ajoutée à Supabase');
    
    // Vérifier que la colonne a été créée
    const columns = await sql`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'is_active'
    `;
    
    if (columns.length > 0) {
      console.log('✅ Confirmation: colonne is_active existe dans Supabase');
      console.log('Structure:', columns[0]);
    } else {
      console.log('❌ Erreur: colonne is_active non trouvée après création');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout de is_active:', error);
  }
}

addIsActiveToSupabase();