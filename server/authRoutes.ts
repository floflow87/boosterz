import { Router } from 'express';
import { AuthService, authenticateToken, type AuthRequest } from './auth';
import { storage } from './storage';
import { insertUserSchema } from '@shared/schema';
import { z } from 'zod';

const router = Router();

// Simple login schema
const loginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(6),
});

// Register schema
const registerSchema = insertUserSchema.extend({
  password: z.string().min(6),
});

// Register new user
router.post('/register', async (req, res) => {
  try {
    const userData = registerSchema.parse(req.body);
    
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(userData.email);
    if (existingUser) {
      return res.status(400).json({ message: 'Un utilisateur avec cet email existe déjà' });
    }

    // Hash password
    const hashedPassword = await AuthService.hashPassword(userData.password);
    
    // Create user
    const user = await storage.createUser({
      ...userData,
      password: hashedPassword,
    });

    // Create default Score Ligue 1 23/24 collection for new user
    await storage.createCollection({
      userId: user.id,
      name: "SCORE LIGUE 1",
      season: "23/24",
      totalCards: 2900,
      ownedCards: 0,
      completionPercentage: 0,
      imageUrl: null,
      backgroundColor: null
    });

    // Generate JWT token directly
    const token = AuthService.generateToken(user.id);

    res.status(201).json({
      message: 'Compte créé avec succès',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Données invalides', errors: error.errors });
    }
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Erreur lors de la création du compte' });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    
    // Basic validation
    if (!identifier || !password || password.length < 6) {
      return res.status(400).json({ message: 'Identifiant et mot de passe requis (minimum 6 caractères)' });
    }
    
    // Find user by username or email
    let user = await storage.getUserByUsername(identifier);
    if (!user) {
      user = await storage.getUserByEmail(identifier);
    }
    
    if (!user || !user.password) {
      return res.status(401).json({ message: 'Identifiant ou mot de passe incorrect' });
    }

    // Verify password
    const isValidPassword = await AuthService.verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Identifiant ou mot de passe incorrect' });
    }

    // Generate JWT token directly
    const token = AuthService.generateToken(user.id);

    res.json({
      message: 'Connexion réussie',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Données invalides', errors: error.errors });
    }
    console.error('Login error:', error);
    res.status(500).json({ message: 'Erreur lors de la connexion' });
  }
});

// Logout user
router.post('/logout', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (token) {
      await AuthService.removeSession(token);
    }

    res.json({ message: 'Déconnexion réussie' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ message: 'Erreur lors de la déconnexion' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const user = await storage.getUser(req.user!.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      totalCards: user.totalCards,
      collectionsCount: user.collectionsCount,
      completionPercentage: user.completionPercentage,
      isFirstLogin: user.isFirstLogin,
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération de l\'utilisateur' });
  }
});

// Update user profile
router.put('/profile', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const updates = req.body;
    const userId = req.user!.id;

    // Don't allow updating sensitive fields
    delete updates.id;
    delete updates.password;

    const updatedUser = await storage.updateUser(userId, updates);
    if (!updatedUser) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json({
      message: 'Profil mis à jour avec succès',
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        name: updatedUser.name,
        avatar: updatedUser.avatar,
        bio: updatedUser.bio,
        phone: updatedUser.phone,
        address: updatedUser.address,
        city: updatedUser.city,
        postalCode: updatedUser.postalCode,
        country: updatedUser.country,
      },
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du profil' });
  }
});

// Mark first login as complete
router.post('/complete-first-login', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    
    const updatedUser = await storage.updateUser(userId, { isFirstLogin: false });
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    
    res.json({ message: 'Première connexion marquée comme terminée' });
  } catch (error) {
    console.error('Error completing first login:', error);
    res.status(500).json({ message: 'Erreur lors de la mise à jour' });
  }
});

export default router;