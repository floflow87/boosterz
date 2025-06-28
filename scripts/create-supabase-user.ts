import { db } from '../server/db';
import * as bcrypt from 'bcryptjs';
import { users } from '../shared/schema';

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
      followersCount: 0,
      followingCount: 0,
      totalCards: 0,
      collectionsCount: 0,
      completionPercentage: 0,
      isFirstLogin: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    console.log('👤 Création de l\'utilisateur principal...');
    
    // Insérer l'utilisateur
    await db.insert(users).values(userData);
    
    console.log('✅ Utilisateur créé avec succès !');
    console.log(`📧 Email: ${userData.email}`);
    console.log(`🔑 Mot de passe: Test123456`);
    console.log(`👤 ID: ${userData.id}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la création:', error);
  }
}

// Exécuter le script
createSupabaseUser();