// ===========================================
// OPTIMISATIONS PERFORMANCE BACKEND
// ===========================================

import { db } from "./db";
import { sql } from "drizzle-orm";

// Cache global en mémoire avec TTL intelligent
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class AdvancedCache {
  private cache = new Map<string, CacheEntry<any>>();
  private maxSize = 1000; // Limite de taille
  
  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
    // Nettoyer le cache si trop plein
    if (this.cache.size >= this.maxSize) {
      this.cleanup();
    }
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlSeconds * 1000
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  private cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        toDelete.push(key);
      }
    }
    
    toDelete.forEach(key => this.cache.delete(key));
    
    // Si encore trop plein, supprimer les plus anciens
    if (this.cache.size >= this.maxSize) {
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);
      
      const toRemove = entries.slice(0, Math.floor(this.maxSize / 4));
      toRemove.forEach(([key]) => this.cache.delete(key));
    }
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0 // À implémenter si nécessaire
    };
  }
}

export const performanceCache = new AdvancedCache();

// ===========================================
// REQUÊTES OPTIMISÉES PRÉCONSTRUITES
// ===========================================

export class OptimizedQueries {
  
  // Requête optimisée pour les cartes de collection avec ownership
  static async getCollectionCardsWithOwnership(userId: number, collectionId: number) {
    const cacheKey = `collection_cards_ownership_${userId}_${collectionId}`;
    
    const cached = performanceCache.get(cacheKey);
    if (cached) return cached;

    const result = await db.execute(sql`
      SELECT 
        cc.*,
        COALESCE(uco.owned, false) as is_owned,
        COALESCE(uco.id, null) as ownership_id
      FROM checklist_cards cc
      LEFT JOIN user_card_ownership uco ON cc.id = uco.card_id AND uco.user_id = ${userId}
      WHERE cc.collection_id = ${collectionId}
      ORDER BY cc.reference::integer ASC
    `);

    performanceCache.set(cacheKey, result.rows, 600); // 10 minutes
    return result.rows;
  }

  // Requête optimisée pour les statistiques utilisateur
  static async getUserStatsOptimized(userId: number) {
    const cacheKey = `user_stats_${userId}`;
    
    const cached = performanceCache.get(cacheKey);
    if (cached) return cached;

    const result = await db.execute(sql`
      SELECT 
        u.id,
        u.username,
        u.name,
        u.avatar,
        u.bio,
        COUNT(DISTINCT pc.id) as personal_cards_count,
        COUNT(DISTINCT d.id) as decks_count,
        COUNT(DISTINCT f1.id) as followers_count,
        COUNT(DISTINCT f2.id) as following_count,
        COUNT(DISTINCT p.id) as posts_count
      FROM users u
      LEFT JOIN personal_cards pc ON u.id = pc.user_id AND pc.is_sold = false
      LEFT JOIN decks d ON u.id = d.user_id  
      LEFT JOIN follows f1 ON u.id = f1.following_id AND f1.status = 'accepted'
      LEFT JOIN follows f2 ON u.id = f2.follower_id AND f2.status = 'accepted'
      LEFT JOIN posts p ON u.id = p.user_id
      WHERE u.id = ${userId}
      GROUP BY u.id, u.username, u.name, u.avatar, u.bio
    `);

    performanceCache.set(cacheKey, result.rows[0], 300); // 5 minutes
    return result.rows[0];
  }

  // Requête optimisée pour le feed social
  static async getFeedPostsOptimized(userId: number, limit: number = 20, offset: number = 0) {
    const cacheKey = `feed_posts_${userId}_${limit}_${offset}`;
    
    const cached = performanceCache.get(cacheKey);
    if (cached) return cached;

    const result = await db.execute(sql`
      WITH followed_users AS (
        SELECT following_id 
        FROM follows 
        WHERE follower_id = ${userId} AND status = 'accepted'
      ),
      feed_posts AS (
        SELECT 
          p.*,
          u.name as user_name,
          u.username,
          u.avatar as user_avatar,
          COUNT(DISTINCT pl.id) as likes_count,
          COUNT(DISTINCT pc.id) as comments_count,
          EXISTS(
            SELECT 1 FROM post_likes pl2 
            WHERE pl2.post_id = p.id AND pl2.user_id = ${userId}
          ) as is_liked
        FROM posts p
        INNER JOIN users u ON p.user_id = u.id
        INNER JOIN followed_users fu ON p.user_id = fu.following_id
        LEFT JOIN post_likes pl ON p.id = pl.post_id
        LEFT JOIN post_comments pc ON p.id = pc.post_id
        GROUP BY p.id, u.name, u.username, u.avatar
        ORDER BY p.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      )
      SELECT * FROM feed_posts
    `);

    performanceCache.set(cacheKey, result.rows, 180); // 3 minutes
    return result.rows;
  }

  // Requête optimisée pour les conversations avec derniers messages
  static async getConversationsOptimized(userId: number) {
    const cacheKey = `conversations_${userId}`;
    
    const cached = performanceCache.get(cacheKey);
    if (cached) return cached;

    const result = await db.execute(sql`
      WITH conversation_users AS (
        SELECT 
          c.id,
          CASE 
            WHEN c.user1_id = ${userId} THEN c.user2_id
            ELSE c.user1_id
          END as other_user_id,
          c.updated_at
        FROM conversations c
        WHERE c.user1_id = ${userId} OR c.user2_id = ${userId}
      ),
      latest_messages AS (
        SELECT DISTINCT ON (conversation_id)
          m.conversation_id,
          m.content as last_message,
          m.created_at as last_message_date,
          m.sender_id,
          COUNT(*) FILTER (WHERE m.is_read = false AND m.sender_id != ${userId}) 
            OVER (PARTITION BY m.conversation_id) as unread_count
        FROM messages m
        WHERE m.conversation_id IN (SELECT id FROM conversation_users)
        ORDER BY m.conversation_id, m.created_at DESC
      )
      SELECT 
        cu.id,
        u.id as user_id,
        u.name,
        u.username,
        u.avatar,
        lm.last_message,
        lm.last_message_date,
        COALESCE(lm.unread_count, 0) as unread_count
      FROM conversation_users cu
      INNER JOIN users u ON cu.other_user_id = u.id
      LEFT JOIN latest_messages lm ON cu.id = lm.conversation_id
      ORDER BY COALESCE(lm.last_message_date, cu.updated_at) DESC
    `);

    performanceCache.set(cacheKey, result.rows, 120); // 2 minutes
    return result.rows;
  }

  // Invalidation intelligente du cache
  static invalidateUserCache(userId: number) {
    performanceCache.invalidatePattern(`user_stats_${userId}`);
    performanceCache.invalidatePattern(`conversations_${userId}`);
    performanceCache.invalidatePattern(`feed_posts_${userId}`);
  }

  static invalidateCollectionCache(collectionId: number) {
    performanceCache.invalidatePattern(`collection_cards_ownership_.*_${collectionId}`);
  }
}

// ===========================================
// MIDDLEWARE D'OPTIMISATION
// ===========================================

export const performanceMiddleware = (req: any, res: any, next: any) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    
    // Log les requêtes lentes (> 1 seconde)
    if (duration > 1000) {
      console.warn(`🐌 Requête lente détectée: ${req.method} ${req.path} - ${duration}ms`);
    }
    
    // Log les statistiques du cache périodiquement
    if (Math.random() < 0.01) { // 1% des requêtes
      const stats = performanceCache.getStats();
      console.log(`📊 Cache stats: ${stats.size}/${stats.maxSize} entries`);
    }
  });
  
  next();
};

// ===========================================
// BATCH OPERATIONS OPTIMISÉES
// ===========================================

export class BatchOperations {
  
  // Mise à jour en lot de l'ownership
  static async updateOwnershipBatch(updates: Array<{userId: number, cardId: number, owned: boolean}>) {
    if (updates.length === 0) return;
    
    const values = updates.map(u => `(${u.userId}, ${u.cardId}, ${u.owned})`).join(',');
    
    await db.execute(sql`
      INSERT INTO user_card_ownership (user_id, card_id, owned)
      VALUES ${sql.raw(values)}
      ON CONFLICT (user_id, card_id)
      DO UPDATE SET 
        owned = EXCLUDED.owned,
        updated_at = NOW()
    `);
    
    // Invalider le cache pour tous les utilisateurs affectés
    const userIds = [...new Set(updates.map(u => u.userId))];
    userIds.forEach(userId => OptimizedQueries.invalidateUserCache(userId));
  }

  // Création en lot de cartes checklist
  static async createChecklistCardsBatch(cards: Array<any>) {
    if (cards.length === 0) return;
    
    const columns = Object.keys(cards[0]);
    const values = cards.map(card => 
      `(${columns.map(col => `'${card[col]}'`).join(',')})`
    ).join(',');
    
    await db.execute(sql`
      INSERT INTO checklist_cards (${sql.raw(columns.join(','))})
      VALUES ${sql.raw(values)}
      ON CONFLICT (collection_id, reference) DO NOTHING
    `);
  }
}

// ===========================================
// MONITORING ET ALERTES
// ===========================================

export class PerformanceMonitor {
  private static slowQueries: Array<{query: string, duration: number, timestamp: Date}> = [];
  
  static logSlowQuery(query: string, duration: number) {
    if (duration > 1000) {
      this.slowQueries.push({
        query: query.substring(0, 100) + '...',
        duration,
        timestamp: new Date()
      });
      
      // Garder seulement les 50 dernières
      if (this.slowQueries.length > 50) {
        this.slowQueries = this.slowQueries.slice(-50);
      }
      
      console.warn(`🐌 Requête lente: ${query.substring(0, 50)}... - ${duration}ms`);
    }
  }
  
  static getSlowQueries() {
    return this.slowQueries;
  }
  
  static clearSlowQueries() {
    this.slowQueries = [];
  }
}

// ===========================================
// CONFIGURATION PRODUCTION
// ===========================================

export const PRODUCTION_CONFIG = {
  // Cache TTL plus long en production
  CACHE_TTL: {
    USER_STATS: process.env.NODE_ENV === 'production' ? 900 : 300, // 15min vs 5min
    COLLECTION_CARDS: process.env.NODE_ENV === 'production' ? 1800 : 600, // 30min vs 10min
    FEED_POSTS: process.env.NODE_ENV === 'production' ? 300 : 180, // 5min vs 3min
    CONVERSATIONS: process.env.NODE_ENV === 'production' ? 300 : 120, // 5min vs 2min
  },
  
  // Limites de pagination plus strictes en production
  PAGINATION: {
    MAX_LIMIT: process.env.NODE_ENV === 'production' ? 50 : 100,
    DEFAULT_LIMIT: process.env.NODE_ENV === 'production' ? 20 : 20,
  },
  
  // Nettoyage automatique du cache en production
  CACHE_CLEANUP_INTERVAL: process.env.NODE_ENV === 'production' ? 300000 : 600000, // 5min vs 10min
};

// Nettoyage automatique du cache
if (process.env.NODE_ENV === 'production') {
  setInterval(() => {
    performanceCache.clear();
    console.log('🧹 Cache automatiquement nettoyé');
  }, PRODUCTION_CONFIG.CACHE_CLEANUP_INTERVAL);
}