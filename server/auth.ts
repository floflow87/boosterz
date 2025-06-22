import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { users, sessions } from '@shared/schema';
import { eq, and, gt } from 'drizzle-orm';
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

  // Create session
  static async createSession(userId: number): Promise<string> {
    const token = this.generateToken(userId);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await db.insert(sessions).values({
      userId,
      token,
      expiresAt,
    });

    return token;
  }

  // Remove session
  static async removeSession(token: string): Promise<void> {
    await db.delete(sessions).where(eq(sessions.token, token));
  }

  // Get user by session token
  static async getUserByToken(token: string) {
    const session = await db
      .select()
      .from(sessions)
      .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
      .limit(1);

    if (session.length === 0) return null;

    const user = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        name: users.name,
        avatar: users.avatar,
        bio: users.bio,
      })
      .from(users)
      .where(eq(users.id, session[0].userId))
      .limit(1);

    return user[0] || null;
  }
}

// Authentication middleware
export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Check for session-based authentication first
  const sessionUserId = (req as any).session?.userId;
  if (sessionUserId) {
    try {
      const user = await storage.getUser(sessionUserId);
      if (user) {
        req.user = {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name
        };
        return next();
      }
    } catch (error) {
      console.error('Session auth error:', error);
    }
  }

  // Fallback to Bearer token authentication
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const user = await AuthService.getUserByToken(token);
    if (!user) {
      return res.status(403).json({ message: 'Invalid or expired token' });
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
      if (user) {
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
      if (user) {
        req.user = user;
      }
    } catch (error) {
      // Ignore token errors in optional auth
    }
  }

  next();
};