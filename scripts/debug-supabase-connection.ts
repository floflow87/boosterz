import { db } from '../server/db';
import { users } from '../shared/schema';

async function debugSupabaseConnection() {
  try {
    console.log('🔍 Debug de la connexion Supabase...');
    console.log('🌍 NODE_ENV:', process.env.NODE_ENV);
    
    // Vérifier si l'URL Supabase est configurée
    const supabaseUrl = process.env.SUPABASE_DATABASE_URL;
    if (supabaseUrl) {
      console.log('✅ SUPABASE_DATABASE_URL configuré');
      console.log('🔗 URL commence par:', supabaseUrl.substring(0, 30) + '...');
    } else {
      console.log('❌ SUPABASE_DATABASE_URL manquant');
      return;
    }

    // Tester la connexion avec une requête simple
    console.log('🔍 Test de connexion à la base...');
    const result = await db.select().from(users);
    console.log('✅ Connexion réussie !');
    console.log('📊 Nombre d\'utilisateurs trouvés:', result.length);
    
    if (result.length > 0) {
      console.log('👥 Utilisateurs:');
      result.forEach(user => {
        console.log(`  - ID: ${user.id}, Username: ${user.username}, Email: ${user.email}`);
      });
    } else {
      console.log('⚠️ Aucun utilisateur dans la table users');
      console.log('💡 La table existe mais est vide');
    }

    // Créer un utilisateur test
    console.log('🧪 Création d\'un utilisateur test...');
    const [newUser] = await db.insert(users).values({
      username: 'test-debug',
      email: 'test@debug.com',
      name: 'Test Debug',
      password: 'test123',
      isActive: true
    }).returning();
    
    console.log('✅ Utilisateur test créé avec ID:', newUser.id);
    
    // Vérifier qu'il apparaît dans la table
    const verifyResult = await db.select().from(users);
    console.log('📊 Nombre d\'utilisateurs après création:', verifyResult.length);

  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    console.error('💡 Détails:', error);
  }
}

debugSupabaseConnection();