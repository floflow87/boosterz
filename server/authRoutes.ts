import { Router } from 'express';
import { AuthService, authenticateToken, type AuthRequest } from './auth';
import { storage } from './storage';
import { insertUserSchema } from '@shared/schema';
import { z } from 'zod';

const router = Router();

// Test endpoint pour diagnostiquer les problèmes de production
router.get('/test', async (req, res) => {
  try {
    console.log('=== AUTH TEST ENDPOINT ===');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('Database connection test...');
    
    // Test simple de connexion à la base de données
    const testUser = await storage.getUserByEmail('test@example.com');
    console.log('Database query successful');
    
    // Test de connexion avec un utilisateur existant
    const floflow87 = await storage.getUserByUsername('Floflow87');
    console.log('Floflow87 user found:', floflow87 ? { 
      id: floflow87.id, 
      username: floflow87.username, 
      isActive: floflow87.isActive,
      passwordHashPrefix: floflow87.password ? floflow87.password.substring(0, 10) + '...' : 'No password'
    } : 'Not found');
    
    // Test de vérification du mot de passe
    let passwordTestResult = 'User not found';
    let passwordHashInfo = 'No user';
    
    if (floflow87) {
      passwordHashInfo = floflow87.password ? floflow87.password.substring(0, 10) + '...' : 'No password';
      try {
        const testPassword = 'Test25';
        const isValidPassword = await AuthService.verifyPassword(testPassword, floflow87.password);
        passwordTestResult = isValidPassword ? 'Password verification SUCCESS' : 'Password verification FAILED';
        console.log('Password verification test:', isValidPassword);
      } catch (passwordError) {
        passwordTestResult = `Password verification ERROR: ${passwordError instanceof Error ? passwordError.message : 'Unknown error'}`;
        console.error('Password verification error:', passwordError);
      }
    }
    
    res.json({
      success: true,
      environment: process.env.NODE_ENV,
      databaseConnected: true,
      floflow87Found: !!floflow87,
      floflow87Active: floflow87?.isActive,
      passwordHashInfo,
      passwordTestResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('=== AUTH TEST ERROR ===');
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      error: error
    });
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  }
});

// Login schema - accept either email or username
const loginSchema = z.object({
  email: z.string().min(1).optional(),
  username: z.string().min(1).optional(),
  password: z.string().min(6),
}).refine(data => data.email || data.username, {
  message: "Email ou nom d'utilisateur requis",
}).transform(data => ({
  email: data.email || data.username, // Use username as email if no email provided
  username: data.username,
  password: data.password
}));

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

    // Add default collection (Score Ligue 1 23/24) for new users
    try {
      await storage.addUserToCollection(user.id, 1); // Collection ID 1 = Score Ligue 1 23/24
      console.log(`Default collection Score Ligue 1 23/24 added for user ${user.id}`);
    } catch (error) {
      console.error('Error adding default collection to user:', error);
      // Don't fail registration if collection assignment fails
    }

    // Create session
    const token = await AuthService.createSession(user.id);
    
    // Store user ID in session
    (req as any).session.userId = user.id;

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
    console.log('Login attempt:', { 
      body: { ...req.body, password: '[REDACTED]' },
      env: process.env.NODE_ENV 
    });
    
    const { email, username, password } = loginSchema.parse(req.body);
    console.log('Parsed login data:', { email, username, hasPassword: !!password });
    
    // Try to find user by email or username
    let user;
    if (email) {
      console.log('Searching user by email:', email);
      // First try by email
      user = await storage.getUserByEmail(email);
      console.log('User found by email:', user ? { id: user.id, username: user.username, isActive: user.isActive } : 'Not found');
      
      // If not found and email looks like a username, try by username
      if (!user && !email.includes('@')) {
        console.log('Email looks like username, trying username search:', email);
        user = await storage.getUserByUsername(email);
        console.log('User found by username (via email field):', user ? { id: user.id, username: user.username, isActive: user.isActive } : 'Not found');
      }
    }
    
    if (username) {
      console.log('Searching user by username:', username);
      user = await storage.getUserByUsername(username);
      console.log('User found by username:', user ? { id: user.id, username: user.username, isActive: user.isActive } : 'Not found');
    }
    
    if (!user || !user.password) {
      console.log('Login failed: User not found or no password');
      return res.status(401).json({ message: 'Identifiant ou mot de passe incorrect' });
    }

    // Check if user account is active
    if (user.isActive === false) {
      console.log('Login failed: Account disabled for user', user.id);
      return res.status(401).json({ message: 'Compte désactivé' });
    }

    console.log('Verifying password for user:', user.id);
    // Verify password
    const isValidPassword = await AuthService.verifyPassword(password, user.password);
    console.log('Password verification result:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('Login failed: Invalid password for user', user.id);
      return res.status(401).json({ message: 'Identifiant ou mot de passe incorrect' });
    }

    console.log('Creating session for user:', user.id);
    // Create session
    const token = await AuthService.createSession(user.id);
    console.log('Session created successfully, token length:', token?.length);
    
    // Store user ID in session
    (req as any).session.userId = user.id;

    console.log('Login successful for user:', user.id);
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
      console.log('Login validation error:', error.errors);
      return res.status(400).json({ message: 'Données invalides', errors: error.errors });
    }
    console.error('Login error - Full details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace',
      error: error
    });
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
  // Get fresh user data from database to ensure we have latest avatar
  const freshUser = await storage.getUser(req.user!.id);
  if (!freshUser) {
    return res.status(404).json({ message: 'Utilisateur non trouvé' });
  }
  
  res.json({ user: freshUser });
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

export default router;