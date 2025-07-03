import { Router } from 'express';
import { AuthRequest, authenticateToken } from './auth-production';
import { storage } from './storage';
import { permissions, systemLogs, users } from '../shared/schema';
import { eq, desc } from 'drizzle-orm';
import { db } from './db';

const router = Router();

// Middleware pour vérifier les permissions admin
const requireAdminAccess = async (req: AuthRequest, res: any, next: any) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const userPermissions = await db
      .select()
      .from(permissions)
      .where(eq(permissions.userId, req.user.id))
      .limit(1);

    if (!userPermissions.length || !userPermissions[0].canAccessAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.userPermissions = userPermissions[0];
    next();
  } catch (error) {
    console.error('Error checking admin permissions:', error);
    res.status(500).json({ error: 'Permission check failed' });
  }
};

// Middleware pour logger les requêtes admin
const logAdminAction = async (req: AuthRequest, res: any, next: any) => {
  const startTime = Date.now();
  
  // Capturer la réponse
  const originalSend = res.send;
  let responseData: any;
  let responseStatus = res.statusCode;

  res.send = function(data: any) {
    responseData = data;
    responseStatus = res.statusCode;
    return originalSend.call(this, data);
  };

  res.on('finish', async () => {
    const responseTime = Date.now() - startTime;
    
    try {
      await db.insert(systemLogs).values({
        level: responseStatus >= 400 ? 'error' : 'info',
        message: `Admin action: ${req.method} ${req.path}`,
        endpoint: req.path,
        userId: req.user?.id,
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip || req.connection.remoteAddress,
        requestData: req.method !== 'GET' ? JSON.stringify(req.body) : null,
        responseStatus,
        responseTime,
      });
    } catch (error) {
      console.error('Error logging admin action:', error);
    }
  });

  next();
};

// Obtenir les permissions de l'utilisateur actuel
router.get('/permissions/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userPermissions = await db
      .select()
      .from(permissions)
      .where(eq(permissions.userId, req.user!.id))
      .limit(1);

    if (!userPermissions.length) {
      // Créer des permissions par défaut
      const newPermissions = await db
        .insert(permissions)
        .values({
          userId: req.user!.id,
          role: req.user!.id === 1 ? 'admin' : 'user',
          canAccessAdmin: req.user!.id === 1,
          canManageUsers: req.user!.id === 1,
          canViewLogs: req.user!.id === 1,
          canManagePermissions: req.user!.id === 1,
          canModerateContent: req.user!.id === 1,
          canManageDatabase: req.user!.id === 1,
        })
        .returning();

      return res.json(newPermissions[0]);
    }

    res.json(userPermissions[0]);
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

// Obtenir tous les utilisateurs (admin seulement)
router.get('/users', authenticateToken, requireAdminAccess, logAdminAction, async (req: AuthRequest, res) => {
  if (!req.userPermissions?.canManageUsers) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  try {
    const allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        name: users.name,
        email: users.email,
        isActive: users.isActive,
        isAdmin: users.isAdmin,
        createdAt: users.createdAt,
      })
      .from(users);

    res.json(allUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Activer/désactiver un utilisateur
router.patch('/users/:id/toggle', authenticateToken, requireAdminAccess, logAdminAction, async (req: AuthRequest, res) => {
  if (!req.userPermissions?.canManageUsers) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const userId = parseInt(req.params.id);
  const { isActive } = req.body;

  try {
    const updatedUser = await db
      .update(users)
      .set({ isActive, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();

    res.json(updatedUser[0]);
  } catch (error) {
    console.error('Error toggling user:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// Obtenir toutes les permissions (admin seulement)
router.get('/permissions', authenticateToken, requireAdminAccess, logAdminAction, async (req: AuthRequest, res) => {
  if (!req.userPermissions?.canManagePermissions) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  try {
    const allPermissions = await db
      .select({
        id: permissions.id,
        userId: permissions.userId,
        role: permissions.role,
        canManageUsers: permissions.canManageUsers,
        canViewLogs: permissions.canViewLogs,
        canManagePermissions: permissions.canManagePermissions,
        canAccessAdmin: permissions.canAccessAdmin,
        canModerateContent: permissions.canModerateContent,
        canManageDatabase: permissions.canManageDatabase,
        user: {
          id: users.id,
          username: users.username,
          name: users.name,
          email: users.email,
        },
      })
      .from(permissions)
      .leftJoin(users, eq(permissions.userId, users.id));

    res.json(allPermissions);
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({ error: 'Failed to fetch permissions' });
  }
});

// Mettre à jour les permissions d'un utilisateur
router.patch('/permissions/:userId', authenticateToken, requireAdminAccess, logAdminAction, async (req: AuthRequest, res) => {
  if (!req.userPermissions?.canManagePermissions) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  const userId = parseInt(req.params.userId);
  const permissionUpdates = req.body;

  try {
    const updatedPermissions = await db
      .update(permissions)
      .set({ ...permissionUpdates, updatedAt: new Date() })
      .where(eq(permissions.userId, userId))
      .returning();

    res.json(updatedPermissions[0]);
  } catch (error) {
    console.error('Error updating permissions:', error);
    res.status(500).json({ error: 'Failed to update permissions' });
  }
});

// Obtenir les logs système (admin seulement)
router.get('/logs', authenticateToken, requireAdminAccess, async (req: AuthRequest, res) => {
  if (!req.userPermissions?.canViewLogs) {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  try {
    const logs = await db
      .select()
      .from(systemLogs)
      .orderBy(desc(systemLogs.createdAt))
      .limit(200);

    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

// Obtenir les statistiques système
router.get('/stats', authenticateToken, requireAdminAccess, async (req: AuthRequest, res) => {
  try {
    const totalUsers = await db.select().from(users);
    const recentLogs = await db
      .select()
      .from(systemLogs)
      .where(eq(systemLogs.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)));

    const stats = {
      totalUsers: totalUsers.length,
      activeUsers: totalUsers.filter(u => u.isActive).length,
      adminUsers: totalUsers.filter(u => u.isAdmin).length,
      logsToday: recentLogs.length,
      errorLogs: recentLogs.filter(log => log.level === 'error').length,
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Logger une erreur manuellement
export const logError = async (
  message: string,
  endpoint?: string,
  userId?: number,
  error?: Error,
  req?: any
) => {
  try {
    await db.insert(systemLogs).values({
      level: 'error',
      message,
      endpoint,
      userId,
      userAgent: req?.headers['user-agent'],
      ipAddress: req?.ip || req?.connection?.remoteAddress,
      stackTrace: error?.stack,
    });
  } catch (logError) {
    console.error('Failed to log error to database:', logError);
  }
};

// Logger une action
export const logAction = async (
  message: string,
  level: 'info' | 'warn' | 'debug' = 'info',
  endpoint?: string,
  userId?: number,
  req?: any
) => {
  try {
    await db.insert(systemLogs).values({
      level,
      message,
      endpoint,
      userId,
      userAgent: req?.headers['user-agent'],
      ipAddress: req?.ip || req?.connection?.remoteAddress,
    });
  } catch (error) {
    console.error('Failed to log action to database:', error);
  }
};

export default router;