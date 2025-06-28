import { db } from '../server/db';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

async function checkUserStatus() {
  try {
    console.log('🔍 Vérification du statut utilisateur dans Supabase...');
    
    const [user] = await db.select().from(users).where(eq(users.id, 1));
    
    if (user) {
      console.log('✅ Utilisateur trouvé:');
      console.log('- ID:', user.id);
      console.log('- Username:', user.username);
      console.log('- Email:', user.email);
      console.log('- Name:', user.name);
      console.log('- isActive:', user.isActive);
      console.log('- Bio:', user.bio?.substring(0, 50) + '...');
      
      if (user.isActive) {
        console.log('✅ Le système isActive est correctement configuré !');
        console.log('📧 Pour te connecter:');
        console.log('   Email: florent@yopmail.com');
        console.log('   Mot de passe: Test123456');
      } else {
        console.log('⚠️ isActive est à false - utilisateur désactivé');
      }
    } else {
      console.log('❌ Aucun utilisateur trouvé avec l\'ID 1');
      console.log('💡 Il faut créer l\'utilisateur avec le script create-supabase-user');
    }
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.message);
    console.log('💡 Vérifie que SUPABASE_DATABASE_URL est bien configuré');
  }
}

checkUserStatus();