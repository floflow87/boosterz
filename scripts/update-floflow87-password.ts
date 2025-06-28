import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

async function updateFloflow87Password() {
  console.log('🔐 Mise à jour du mot de passe de Floflow87...');
  
  // Nouveau mot de passe
  const newPassword = 'Test25';
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  console.log('🔐 Nouveau mot de passe hashé généré');
  
  // Base de développement (Neon)
  const devUrl = process.env.DATABASE_URL;
  if (devUrl) {
    console.log('\n📍 Mise à jour dans la base de développement (Neon)...');
    const devPool = new Pool({ 
      connectionString: devUrl,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    try {
      const result = await devPool.query(`
        UPDATE users 
        SET password = $1, updated_at = NOW()
        WHERE id = 1
        RETURNING id, username, email
      `, [hashedPassword]);
      
      console.log('✅ Mot de passe mis à jour dans Neon:', result.rows[0]);
      
    } catch (error) {
      console.error('❌ Erreur base dev:', error.message);
    } finally {
      await devPool.end();
    }
  }

  // Base de production (Supabase)
  const prodUrl = process.env.SUPABASE_DATABASE_URL;
  if (prodUrl) {
    console.log('\n📍 Mise à jour dans la base de production (Supabase)...');
    const prodPool = new Pool({ 
      connectionString: prodUrl,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    try {
      const result = await prodPool.query(`
        UPDATE users 
        SET password = $1, updated_at = NOW()
        WHERE id = 1
        RETURNING id, username, email
      `, [hashedPassword]);
      
      console.log('✅ Mot de passe mis à jour dans Supabase:', result.rows[0]);
      
    } catch (error) {
      console.error('❌ Erreur base prod:', error.message);
    } finally {
      await prodPool.end();
    }
  }
  
  // Vérifier le nouveau mot de passe
  const isValid = await bcrypt.compare(newPassword, hashedPassword);
  console.log(`🔑 Vérification nouveau mot de passe: ${isValid ? 'OK' : 'ERREUR'}`);
  
  console.log('\n🎯 Nouvelles informations de connexion Floflow87:');
  console.log('Email: florent@yopmail.com');
  console.log('Mot de passe: Test25');
}

updateFloflow87Password().catch(console.error);