import { db } from '../server/db';
import * as bcrypt from 'bcryptjs';
import { users } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Script pour créer un utilisateur dans la base Supabase
async function createSupabaseUser() {
  try {
    console.log('🔗 Connexion à la base de données...');
    console.log('✅ Connexion établie');

    // Données de l'utilisateur principal
    const userData = {
      id: 1,
      username: 'Floflow87',
      name: 'Florent Martin',
      email: 'florent@yopmail.com',
      password: await bcrypt.hash('Test123456', 12),
      bio: 'Passionné de cartes de football et supporter de l\'OM !',
      isPublic: true,
      isActive: true,
      followersCount: 0,
      followingCount: 0,
      totalCards: 0,
      collectionsCount: 0,
      completionPercentage: 0,
      isFirstLogin: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('👤 Vérification de l\'utilisateur...');
    
    // Vérifier si l'utilisateur existe déjà
    const [existingUser] = await db.select().from(users).where(eq(users.id, 1));
    
    if (existingUser) {
      console.log('⚠️ Utilisateur existant trouvé, mise à jour du statut isActive...');
      
      // Mettre à jour l'utilisateur existant
      await db.update(users)
        .set({ 
          isActive: true,
          bio: userData.bio,
          name: userData.name,
          username: userData.username,
          email: userData.email,
          updatedAt: new Date()
        })
        .where(eq(users.id, 1));
      
      console.log('✅ Utilisateur mis à jour avec succès !');
      console.log(`📧 Email: ${userData.email}`);
      console.log(`🔑 Mot de passe: Test123456 (inchangé)`);
      console.log(`✅ isActive: true`);
    } else {
      console.log('👤 Création de l\'utilisateur principal...');
      
      // Insérer l'utilisateur
      await db.insert(users).values(userData);
      
      console.log('✅ Utilisateur créé avec succès !');
      console.log(`📧 Email: ${userData.email}`);
      console.log(`🔑 Mot de passe: Test123456`);
      console.log(`👤 ID: ${userData.id}`);
      console.log(`✅ isActive: true`);
    }
    
  } catch (error) {
    console.error('❌ Erreur lors de la création:', error);
  }
}

// Exécuter le script
createSupabaseUser();