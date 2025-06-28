import { Pool } from 'pg';
import bcrypt from 'bcryptjs';

async function createSecondUser() {
  console.log('👤 Création du deuxième utilisateur...');
  
  // Créer dans les deux bases de données
  const devUrl = process.env.DATABASE_URL;
  const prodUrl = process.env.SUPABASE_DATABASE_URL;
  
  // Hasher le mot de passe Test25
  const password = 'Test25';
  const hashedPassword = await bcrypt.hash(password, 10);
  console.log('🔐 Mot de passe hashé généré');
  
  // Base de développement (Neon)
  if (devUrl) {
    console.log('\n📍 Création dans la base de développement (Neon)...');
    const devPool = new Pool({ 
      connectionString: devUrl,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    try {
      const result = await devPool.query(`
        INSERT INTO users (
          id, username, email, name, password, 
          bio, is_active, is_public,
          total_cards, collections_count, completion_percentage,
          followers_count, following_count
        ) VALUES (
          2, 'maxlamenace', 'maxlamenace@yopmail.com', 'Max',
          $1,
          'Je suis un passionné de cartes et je PC l''OM',
          true, true,
          0, 0, 0,
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
      
      console.log('✅ Utilisateur créé dans Neon:', result.rows[0]);
      
    } catch (error) {
      console.error('❌ Erreur base dev:', error.message);
    } finally {
      await devPool.end();
    }
  }

  // Base de production (Supabase)
  if (prodUrl) {
    console.log('\n📍 Création dans la base de production (Supabase)...');
    const prodPool = new Pool({ 
      connectionString: prodUrl,
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    try {
      const result = await prodPool.query(`
        INSERT INTO users (
          id, username, email, name, password, 
          bio, is_active, is_public,
          total_cards, collections_count, completion_percentage,
          followers_count, following_count
        ) VALUES (
          2, 'maxlamenace', 'maxlamenace@yopmail.com', 'Max',
          $1,
          'Je suis un passionné de cartes et je PC l''OM',
          true, true,
          0, 0, 0,
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
      
      console.log('✅ Utilisateur créé dans Supabase:', result.rows[0]);
      
    } catch (error) {
      console.error('❌ Erreur base prod:', error.message);
    } finally {
      await prodPool.end();
    }
  }
  
  // Vérifier la connexion avec le mot de passe
  const isValid = await bcrypt.compare(password, hashedPassword);
  console.log(`🔑 Vérification mot de passe: ${isValid ? 'OK' : 'ERREUR'}`);
  
  console.log('\n🎯 Informations de connexion du nouvel utilisateur:');
  console.log('ID: 2');
  console.log('Username: maxlamenace');
  console.log('Email: maxlamenace@yopmail.com');
  console.log('Nom: Max');
  console.log('Bio: Je suis un passionné de cartes et je PC l\'OM');
  console.log('Mot de passe: Test25');
  console.log('IsActive: true');
}

createSecondUser().catch(console.error);