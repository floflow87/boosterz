import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { users } from '@shared/schema';
import { storage } from './storage';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const SALT_ROUNDS = 12;

export interface AuthRequest extends Request {
  user?: {
    id: number;
    username: string;
    email: string;
    name: string;
  };
}

export class AuthService {
  // Hash password
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  // Verify password
  static async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Generate JWT token
  static generateToken(userId: number): string {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });
  }

  // Verify JWT token
  static verifyToken(token: string): { userId: number } | null {
    try {
      return jwt.verify(token, JWT_SECRET) as { userId: number };
    } catch {
      return null;
    }
  }

  // Create session (simplified - just return JWT token)
  static async createSession(userId: number): Promise<string> {
    return this.generateToken(userId);
  }

  // Remove session (simplified - no database operation needed for JWT)
  static async removeSession(token: string): Promise<void> {
    // With JWT, we don't need to store sessions in database
    // Token expiration is handled by JWT itself
  }

  // Get user by token (simplified - use JWT verification only)
  static async getUserByToken(token: string) {
    try {
      const decoded = this.verifyToken(token);
      if (!decoded) {
        return null;
      }

      const user = await storage.getUser(decoded.userId);
      return user || null;
    } catch (error) {
      console.error('Error getting user by token:', error);
      return null;
    }
  }
}

// Authentication middleware
export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Check for session-based authentication first
  const sessionUserId = (req as any).session?.userId;
  if (sessionUserId) {
    try {
      const user = await storage.getUser(sessionUserId);
      if (user && user.isActive) {
        req.user = {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name
        };
        return next();
      } else if (user && !user.isActive) {
        return res.status(403).json({ message: 'Compte désactivé' });
      }
    } catch (error) {
      console.error('Session auth error:', error);
    }
  }

  // Fallback to Bearer token authentication
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
  
  console.log('Auth middleware - authHeader:', authHeader);
  console.log('Auth middleware - token:', token);

  // Development mode: authenticate with any token as user 1, if no user 1 exists, authenticate as first user
  if (token === 'test' || !token) {
    console.log('Using development mode authentication');
    try {
      let user = await storage.getUser(1);
      
      // If user 1 doesn't exist, try to get any user
      if (!user) {
        console.log('User 1 not found, trying to get any existing user...');
        const allUsers = await storage.getUsers();
        if (allUsers && allUsers.length > 0) {
          user = allUsers[0];
          console.log('Using first available user:', user);
        }
      }
      
      console.log('Dev mode - retrieved user:', user);
      if (user && user.isActive) {
        req.user = {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name
        };
        console.log('Dev mode - set req.user:', req.user);
        return next();
      } else if (user && !user.isActive) {
        console.log('Dev mode - user account is deactivated');
        return res.status(403).json({ message: 'Compte désactivé' });
      }
    } catch (error) {
      console.error('Development auth error:', error);
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const user = await AuthService.getUserByToken(token);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Optional authentication middleware (doesn't fail if no token)
export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Check for session-based authentication first
  if (req.session?.userId) {
    try {
      const user = await storage.getUser(req.session.userId);
      if (user && user.isActive) {
        req.user = {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name
        };
        return next();
      }
    } catch (error) {
      // Ignore session errors for optional auth
    }
  }

  // Fallback to Bearer token authentication
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const user = await AuthService.getUserByToken(token);
      if (user && user.isActive) {
        req.user = user;
      }
    } catch (error) {
      // Ignore token errors in optional auth
    }
  }

  // Development mode: default to user 1 if no authentication found
  if (!req.user) {
    try {
      const user = await storage.getUser(1);
      if (user && user.isActive) {
        req.user = {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name
        };
      }
    } catch (error) {
      console.error('Default user auth error:', error);
    }
  }

  next();
};