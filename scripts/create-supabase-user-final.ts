import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

async function createSupabaseUser() {
  console.log('👤 Création de l\'utilisateur principal dans Supabase...');
  
  const prodUrl = process.env.SUPABASE_DATABASE_URL;
  if (!prodUrl) {
    console.log('❌ SUPABASE_DATABASE_URL non configuré');
    return;
  }
  
  const pool = new Pool({ 
    connectionString: prodUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });
  
  try {
    // Hasher le mot de passe Test123456
    const password = 'Test123456';
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('🔐 Mot de passe hashé généré');
    
    // Créer ou mettre à jour l'utilisateur
    const result = await pool.query(`
      INSERT INTO users (
        id, username, email, name, password, 
        bio, is_active, is_public,
        total_cards, collections_count, completion_percentage,
        followers_count, following_count
      ) VALUES (
        1, 'Floflow87', 'florent@yopmail.com', 'Florent Martin',
        $1,
        'Passionné de cartes de football et supporter de l''OM !',
        true, true,
        1247, 4, 76,
        0, 0
      ) ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        password = EXCLUDED.password,
        bio = EXCLUDED.bio,
        is_active = EXCLUDED.is_active
      RETURNING id, username, email, is_active
    `, [hashedPassword]);
    
    console.log('✅ Utilisateur créé/mis à jour dans Supabase:', result.rows[0]);
    
    // Vérifier la connexion avec le mot de passe
    const isValid = await bcrypt.compare(password, hashedPassword);
    console.log(`🔑 Vérification mot de passe: ${isValid ? 'OK' : 'ERREUR'}`);
    
    console.log('\n🎯 Informations de connexion:');
    console.log('Email: florent@yopmail.com');
    console.log('Mot de passe: Test123456');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await pool.end();
  }
}

createSupabaseUser();