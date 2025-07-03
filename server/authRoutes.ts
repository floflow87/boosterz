import { Router } from 'express';
import { AuthService, authenticateToken, type AuthRequest } from './auth-production';
import { storage } from './storage';
import { insertUserSchema } from '@shared/schema';
import { z } from 'zod';

const router = Router();

// Test de production pour Supabase
router.get('/production-test', async (req, res) => {
  try {
    console.log('=== PRODUCTION DATABASE TEST ===');
    console.log('Environment:', process.env.NODE_ENV);
    
    // Test de base de données basique
    const testQuery = await storage.getAllUsers();
    console.log('Database query successful');
    console.log('Users found:', testQuery.length);
    
    // Test utilisateur spécifique Floflow87
    const floflow87 = await storage.getUserByUsername('Floflow87');
    console.log('Floflow87 lookup result:', floflow87 ? 'FOUND' : 'NOT FOUND');
    
    if (floflow87) {
      console.log('Floflow87 details:', {
        id: floflow87.id,
        username: floflow87.username,
        email: floflow87.email,
        isActive: floflow87.isActive,
        hasPassword: !!floflow87.password
      });
    }
    
    res.json({
      success: true,
      environment: process.env.NODE_ENV,
      databaseConnection: 'OK',
      totalUsers: testQuery.length,
      floflow87Found: !!floflow87,
      floflow87Active: floflow87?.isActive,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('=== PRODUCTION TEST ERROR ===');
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    
    res.status(500).json({ 
      success: false, 
      message: 'Production test failed',
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env.NODE_ENV
    });
  }
});

// Test endpoint pour diagnostiquer les problèmes de production
// Test endpoint for login debugging
router.post('/login-test', async (req, res) => {
  try {
    console.log('=== LOGIN TEST ENDPOINT ===');
    console.log('Request headers:', req.headers);
    console.log('Request body:', req.body);
    console.log('Content-Type:', req.headers['content-type']);
    
    res.json({
      success: true,
      message: 'Login test endpoint reached successfully',
      bodyReceived: req.body,
      environment: process.env.NODE_ENV,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Login test error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login test failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

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

// Diagnostic endpoint pour comparer dev vs prod
router.post('/login-diagnostic', async (req, res) => {
  try {
    console.log('=== LOGIN DIAGNOSTIC ===');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Request headers:', req.headers);
    console.log('Raw body type:', typeof req.body);
    console.log('Body keys:', req.body ? Object.keys(req.body) : 'NO BODY');
    console.log('Body content:', req.body);
    console.log('Username value:', req.body?.username);
    console.log('Password present:', !!req.body?.password);
    
    const diagnosticInfo = {
      environment: process.env.NODE_ENV,
      bodyReceived: !!req.body,
      bodyType: typeof req.body,
      bodyKeys: req.body ? Object.keys(req.body) : null,
      usernamePresent: !!req.body?.username,
      passwordPresent: !!req.body?.password,
      contentType: req.headers['content-type'],
      userAgent: req.headers['user-agent'],
      timestamp: new Date().toISOString()
    };
    
    console.log('Diagnostic info:', diagnosticInfo);
    res.json(diagnosticInfo);
  } catch (error) {
    console.error('Diagnostic error:', error);
    res.status(500).json({ error: String(error) });
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

// Ultra-simplified login for production debugging
router.post('/login', async (req, res) => {
  try {
    console.log('=== ULTRA LOGIN START ===');
    console.log('Environment:', process.env.NODE_ENV);
    console.log('Database URL type:', process.env.DATABASE_URL ? 'NEON' : (process.env.SUPABASE_DATABASE_URL ? 'SUPABASE' : 'NONE'));
    console.log('Request body received:', req.body ? 'YES' : 'NO');
    
    if (!req.body) {
      console.log('No body received');
      return res.status(400).json({ message: 'Corps de requête manquant' });
    }

    const username = req.body.username;
    const password = req.body.password;
    
    console.log('Username received:', username ? 'YES' : 'NO');
    console.log('Password received:', password ? 'YES' : 'NO');
    
    if (!username || !password) {
      console.log('Missing credentials');
      return res.status(400).json({ message: 'Identifiants manquants' });
    }

    // Test de connexion base de données AVANT de chercher l'utilisateur
    console.log('Testing database connection...');
    try {
      const dbTest = await storage.getAllUsers();
      console.log('Database connection OK - found', dbTest.length, 'users');
    } catch (dbError) {
      console.error('DATABASE CONNECTION FAILED:', dbError);
      return res.status(500).json({ 
        message: 'Erreur de base de données',
        error: dbError instanceof Error ? dbError.message : 'Database connection failed'
      });
    }

    console.log('Looking for user:', username);
    console.log('getUserByUsername called with:', username);
    const user = await storage.getUserByUsername(username);
    console.log('getUserByUsername result:', user ? {
      id: user.id,
      username: user.username,
      email: user.email,
      isActive: user.isActive
    } : 'NULL');
    console.log('User found:', user ? 'YES' : 'NO');
    
    if (!user) {
      console.log('User not found');
      return res.status(401).json({ message: 'Utilisateur introuvable' });
    }

    console.log('User active:', user.isActive);
    if (!user.isActive) {
      console.log('User inactive');
      return res.status(401).json({ message: 'Compte désactivé' });
    }

    console.log('Checking password...');
    const isValid = await AuthService.verifyPassword(password, user.password);
    console.log('Password valid:', isValid);
    
    if (!isValid) {
      console.log('Invalid password');
      return res.status(401).json({ message: 'Mot de passe incorrect' });
    }

    console.log('Creating token...');
    const token = await AuthService.createSession(user.id);
    console.log('Token created:', token ? 'YES' : 'NO');

    console.log('=== LOGIN SUCCESS ===');
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
    console.error('=== LOGIN FATAL ERROR ===');
    console.error('Error type:', typeof error);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown');
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
    console.error('Full error:', error);
    
    res.status(500).json({ 
      message: 'Erreur fatale de connexion',
      error: error instanceof Error ? error.message : String(error)
    });
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