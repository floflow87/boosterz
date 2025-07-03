import { 
  users, collections, cards, userCards, personalCards, conversations, messages, 
  posts, activities, follows, decks, deckCards, postLikes, postComments, notifications, unlockedTrophies, 
  checklistCards, userCardOwnership,
  type User, type InsertUser,
  type Collection, type InsertCollection, type Card, type InsertCard,
  type UserCard, type InsertUserCard, type PersonalCard, type InsertPersonalCard,
  type Conversation, type InsertConversation, type Message, type InsertMessage,
  type Post, type Activity, type Follow, type Deck, type DeckCard,
  type ChecklistCard, type InsertChecklistCard, type UserCardOwnership, type InsertUserCardOwnership
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, sql, desc, asc, inArray, isNull } from "drizzle-orm";

// Cache en mémoire ultra-performant pour les requêtes critiques
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class PerformanceCache {
  private cache = new Map<string, CacheEntry<any>>();

  set<T>(key: string, data: T, ttlSeconds: number = 300): void {
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

  clear(): void {
    this.cache.clear();
  }

  // Méthode spéciale pour invalider certaines clés
  invalidatePattern(pattern: string): void {
    const keysArray = Array.from(this.cache.keys());
    for (const key of keysArray) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }
}

const cache = new PerformanceCache();

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  searchUsers(query: string): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  
  // Collections
  getCollectionsByUserId(userId: number): Promise<Collection[]>;
  getCollection(id: number): Promise<Collection | undefined>;
  createCollection(collection: InsertCollection): Promise<Collection>;
  updateCollection(id: number, updates: Partial<Collection>): Promise<Collection | undefined>;
  deleteCollection(id: number): Promise<boolean>;
  addUserToCollection(userId: number, collectionId: number): Promise<boolean>;
  
  // Cards
  getCardsByCollectionId(collectionId: number): Promise<Card[]>;
  getCard(id: number): Promise<Card | undefined>;
  getAllCards(): Promise<Card[]>;
  createCard(card: InsertCard): Promise<Card>;
  updateCard(id: number, updates: Partial<Card>): Promise<Card | undefined>;
  updateCardImage(id: number, imageUrl: string): Promise<Card | undefined>;
  toggleCardOwnership(id: number): Promise<Card | undefined>;
  updateCardTrade(id: number, tradeData: { tradeDescription?: string; tradePrice?: string; tradeOnly: boolean; isForTrade: boolean }): Promise<Card | undefined>;
  
  // User Cards
  getUserCardsByUserId(userId: number): Promise<UserCard[]>;
  getUserCardsByCollectionId(collectionId: number, userId: number): Promise<UserCard[]>;
  getUserCard(id: number): Promise<UserCard | undefined>;
  createUserCard(userCard: InsertUserCard): Promise<UserCard>;
  updateUserCard(id: number, updates: Partial<UserCard>): Promise<UserCard | undefined>;
  deleteUserCard(id: number): Promise<boolean>;
  
  // Trophy Stats (optimized for avatar halos)
  getTrophyStats(userId: number): Promise<{ totalCards: number; autographs: number; specials: number }>;
  
  // Trophy operations
  getUnlockedTrophies(userId: number): Promise<any[]>;
  unlockTrophy(userId: number, trophyId: string, category: string, color: string): Promise<any>;
  getHighestTrophyColor(userId: number): Promise<string | null>;

  // Personal Cards (pour "Mes cartes")
  getPersonalCardsByUserId(userId: number): Promise<PersonalCard[]>;
  getPersonalCardsByCollectionId(collectionId: number, userId: number): Promise<PersonalCard[]>;
  getAllPersonalCards(): Promise<PersonalCard[]>;
  getPersonalCard(id: number): Promise<PersonalCard | undefined>;
  createPersonalCard(personalCard: InsertPersonalCard): Promise<PersonalCard>;
  updatePersonalCard(id: number, updates: Partial<PersonalCard>): Promise<PersonalCard | undefined>;

  // Checklist Cards (cartes de référence partagées)
  getChecklistCardsByCollectionId(collectionId: number): Promise<ChecklistCard[]>;
  getChecklistCard(id: number): Promise<ChecklistCard | undefined>;
  createChecklistCard(checklistCard: InsertChecklistCard): Promise<ChecklistCard>;
  
  // User Card Ownership (propriété individuelle)
  getUserCardOwnership(userId: number, cardId: number): Promise<UserCardOwnership | undefined>;
  getUserCardOwnerships(userId: number): Promise<UserCardOwnership[]>;
  setUserCardOwnership(userId: number, cardId: number, owned: boolean): Promise<UserCardOwnership>;
  deletePersonalCard(id: number): Promise<boolean>;

  // User Checklist Card Ownership (check-lists communautaires)
  getUserChecklistCardOwnership(userId: number, collectionId: number): Promise<UserCardOwnership[]>;
  updateUserChecklistCardOwnership(userId: number, cardId: number, owned: boolean): Promise<UserCardOwnership>;
  getCollectionCompletionStats(userId: number, collectionId: number): Promise<{
    totalCards: number;
    ownedCards: number;
    completionPercentage: number;
  }>;
  initializeUserChecklistOwnership(userId: number, collectionId: number): Promise<void>;

  // Chat system
  getConversations(userId: number): Promise<Conversation[]>;
  getConversation(user1Id: number, user2Id: number): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getMessages(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(conversationId: number, userId: number): Promise<void>;

  // Social network system
  getUserPosts(userId: number): Promise<any[]>;
  createPost(post: any): Promise<any>;
  getPost(id: number): Promise<any>;
  deletePost(id: number): Promise<boolean>;
  createActivity(activity: any): Promise<any>;
  getUserSubscriptions(userId: number): Promise<any[]>;
  deleteSubscription(followingId: number): Promise<boolean>;
  getUserSubscribers(userId: number): Promise<any[]>;
  getUserFollowers(userId: number): Promise<User[]>;
  getUserFollowing(userId: number): Promise<User[]>;
  getPendingSubscriptionRequests(userId: number): Promise<any[]>;
  createSubscription(subscription: any): Promise<any>;
  updateSubscription(id: number, updates: any): Promise<any>;
  getActivityFeed(userId: number): Promise<any[]>;
  
  // Follow system
  followUser(followerId: number, followingId: number): Promise<boolean>;
  unfollowUser(followerId: number, followingId: number): Promise<boolean>;
  isFollowing(followerId: number, followingId: number): Promise<boolean>;
  getFollowedUsersPosts(userId: number): Promise<any[]>;
  getFollowersByUserId(userId: number): Promise<User[]>;
  getFollowingByUserId(userId: number): Promise<any[]>;
  getPostsByUserIds(userIds: number[]): Promise<any[]>;
  getPostsByUserId(userId: number): Promise<any[]>;
  getCardsForSaleByUserId(userId: number): Promise<any[]>;
  getUsers(): Promise<User[]>;
  
  // Deck management
  getDecks(userId: number): Promise<any[]>;
  removeCardFromDeck(deckId: number, cardPosition: number): Promise<void>;
  deleteDeck(deckId: number): Promise<boolean>;
  
  // Followers count
  getFollowersCount(userId: number): Promise<number>;
  getFollowingCount(userId: number): Promise<number>;
  
  // Notifications
  createNotification(notification: { userId: number; fromUserId?: number; type: string; title: string; message: string; postId?: number; messageId?: number }): Promise<void>;
  getNotifications(userId: number): Promise<any[]>;
  markNotificationAsRead(notificationId: number): Promise<void>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user || undefined;
    } catch (error) {
      console.error('❌ Database error in getUser:', error);
      console.error('🔍 Environment:', process.env.NODE_ENV);
      console.error('🔗 Database URL exists:', !!process.env.SUPABASE_DATABASE_URL || !!process.env.DATABASE_URL);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      console.log('getUserByUsername called with:', username);
      const [user] = await db.select().from(users).where(eq(users.username, username));
      console.log('getUserByUsername result:', user ? { id: user.id, username: user.username, email: user.email, isActive: user.isActive } : 'User not found');
      return user || undefined;
    } catch (error) {
      console.error('Error in getUserByUsername:', {
        username,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      console.log('getUserByEmail called with:', email);
      const [user] = await db.select().from(users).where(eq(users.email, email));
      console.log('getUserByEmail result:', user ? { id: user.id, username: user.username, email: user.email, isActive: user.isActive } : 'User not found');
      return user || undefined;
    } catch (error) {
      console.error('Error in getUserByEmail:', {
        email,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      throw error;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async searchUsers(query: string): Promise<User[]> {
    return await db.select().from(users)
      .where(
        or(
          sql`${users.username} ILIKE ${'%' + query + '%'}`,
          sql`${users.name} ILIKE ${'%' + query + '%'}`,
          sql`${users.email} ILIKE ${'%' + query + '%'}`
        )
      );
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getCollectionsByUserId(userId: number): Promise<Collection[]> {
    return await db.select().from(collections).where(eq(collections.userId, userId));
  }

  async getCollection(id: number): Promise<Collection | undefined> {
    const [collection] = await db.select().from(collections).where(eq(collections.id, id));
    return collection || undefined;
  }

  async createCollection(insertCollection: InsertCollection): Promise<Collection> {
    const [collection] = await db
      .insert(collections)
      .values(insertCollection)
      .returning();
    return collection;
  }

  async updateCollection(id: number, updates: Partial<Collection>): Promise<Collection | undefined> {
    const [collection] = await db
      .update(collections)
      .set(updates)
      .where(eq(collections.id, id))
      .returning();
    return collection || undefined;
  }

  async deleteCollection(id: number): Promise<boolean> {
    const result = await db.delete(collections).where(eq(collections.id, id));
    return (result.rowCount || 0) > 0;
  }

  async addUserToCollection(userId: number, collectionId: number): Promise<boolean> {
    try {
      // Check if user already has this collection (prevent duplicates)
      const existingUserCards = await db
        .select()
        .from(userCards)
        .where(and(
          eq(userCards.userId, userId),
          eq(userCards.collectionId, collectionId)
        ))
        .limit(1);

      if (existingUserCards.length > 0) {
        console.log(`User ${userId} already has collection ${collectionId}`);
        return true; // Consider it success if already exists
      }

      // Get all cards from the collection
      const collectionCards = await db
        .select()
        .from(cards)
        .where(eq(cards.collectionId, collectionId));

      // Create userCard entries for all cards in the collection
      const userCardsToInsert = collectionCards.map(card => ({
        userId,
        cardId: card.id,
        collectionId: card.collectionId,
        isOwned: false
      }));

      if (userCardsToInsert.length > 0) {
        await db.insert(userCards).values(userCardsToInsert);
      }

      return true;
    } catch (error) {
      console.error('Error adding user to collection:', error);
      return false;
    }
  }

  async getCardsByCollectionId(collectionId: number): Promise<Card[]> {
    const cacheKey = `cards_collection_${collectionId}`;
    
    // Vérifier le cache d'abord
    const cached = cache.get<Card[]>(cacheKey);
    if (cached) {
      console.log(`📦 Cards for collection ${collectionId} from cache - ${cached.length} cards`);
      return cached;
    }
    
    const startTime = Date.now();
    const result = await db
      .select()
      .from(cards)
      .where(eq(cards.collectionId, collectionId))
      .orderBy(cards.reference);
    
    const endTime = Date.now();
    console.log(`✅ Cards for collection ${collectionId} loaded from DB in ${endTime - startTime}ms - ${result.length} cards`);
    
    // Mettre en cache pour 10 minutes
    cache.set(cacheKey, result, 600);
    
    return result;
  }

  async getCard(id: number): Promise<Card | undefined> {
    const [card] = await db.select().from(cards).where(eq(cards.id, id));
    return card || undefined;
  }

  async getAllCards(): Promise<Card[]> {
    const cacheKey = 'all_cards';
    
    // Vérifier le cache d'abord
    const cached = cache.get<Card[]>(cacheKey);
    if (cached) {
      console.log(`📦 getAllCards from cache - ${cached.length} cards`);
      return cached;
    }
    
    // Si pas en cache, charger depuis la base
    const startTime = Date.now();
    console.log("🔍 Starting getAllCards database query...");
    
    const result = await db
      .select()
      .from(cards)
      .orderBy(cards.playerName, cards.teamName);
    
    const endTime = Date.now();
    console.log(`✅ getAllCards loaded from DB in ${endTime - startTime}ms - ${result.length} cards, caching for 5 minutes`);
    
    // Mettre en cache pour 5 minutes
    cache.set(cacheKey, result, 300);
    
    return result;
  }

  async createCard(insertCard: InsertCard): Promise<Card> {
    const [card] = await db
      .insert(cards)
      .values(insertCard)
      .returning();
    
    // Invalider le cache des cartes après création
    cache.clear();
    
    return card;
  }

  async updateCard(id: number, updates: Partial<Card>): Promise<Card | undefined> {
    const [card] = await db
      .update(cards)
      .set(updates)
      .where(eq(cards.id, id))
      .returning();
    return card || undefined;
  }

  async updateCardImage(id: number, imageUrl: string): Promise<Card | undefined> {
    const [card] = await db
      .update(cards)
      .set({ imageUrl })
      .where(eq(cards.id, id))
      .returning();
    return card || undefined;
  }

  async toggleCardOwnership(id: number): Promise<Card | undefined> {
    const card = await this.getCard(id);
    if (!card) return undefined;

    const [updatedCard] = await db
      .update(cards)
      .set({ isOwned: !card.isOwned })
      .where(eq(cards.id, id))
      .returning();
    return updatedCard || undefined;
  }

  async deleteCard(id: number): Promise<boolean> {
    try {
      const result = await db.delete(cards).where(eq(cards.id, id));
      const success = result.rowCount ? result.rowCount > 0 : false;
      return success;
    } catch (error) {
      console.error("Error deleting card:", error);
      return false;
    }
  }

  async getUserCardsByUserId(userId: number): Promise<UserCard[]> {
    return await db.select().from(userCards).where(eq(userCards.userId, userId));
  }

  async getUserCardsByCollectionId(collectionId: number, userId: number): Promise<UserCard[]> {
    return await db.select().from(userCards)
      .where(
        and(
          eq(userCards.collectionId, collectionId),
          eq(userCards.userId, userId)
        )
      );
  }

  async getUserCard(id: number): Promise<UserCard | undefined> {
    const [userCard] = await db.select().from(userCards).where(eq(userCards.id, id));
    return userCard || undefined;
  }

  async createUserCard(insertUserCard: InsertUserCard): Promise<UserCard> {
    const [userCard] = await db
      .insert(userCards)
      .values(insertUserCard)
      .returning();
    return userCard;
  }

  async updateUserCard(id: number, updates: Partial<UserCard>): Promise<UserCard | undefined> {
    const [userCard] = await db
      .update(userCards)
      .set(updates)
      .where(eq(userCards.id, id))
      .returning();
    return userCard || undefined;
  }

  async deleteUserCard(id: number): Promise<boolean> {
    const result = await db.delete(userCards).where(eq(userCards.id, id));
    
    // Invalider le cache des trophées après suppression
    cache.clear();
    
    return (result.rowCount || 0) > 0;
  }

  async getTrophyStats(userId: number): Promise<{ totalCards: number; autographs: number; specials: number }> {
    const cacheKey = `trophy_stats_${userId}`;
    
    // Vérifier le cache d'abord
    const cached = cache.get<{ totalCards: number; autographs: number; specials: number }>(cacheKey);
    if (cached) {
      console.log(`📦 Trophy stats for user ${userId} from cache - ${cached.totalCards} cards`);
      return cached;
    }
    
    const startTime = Date.now();
    
    // Compter les cartes personnelles avec des requêtes optimisées
    const personalCardsData = await db
      .select({
        cardType: personalCards.cardType
      })
      .from(personalCards)
      .where(eq(personalCards.userId, userId));
    
    const totalCards = personalCardsData.length;
    const autographs = personalCardsData.filter(card => card.cardType?.includes('AUTO')).length;
    // Compter les cartes spéciales = toutes les cartes 1/1 (numbering contient "1/1")
    const specials = personalCardsData.filter(card => 
      card.numbering?.includes('1/1')
    ).length;
    
    const result = { totalCards, autographs, specials };
    
    const endTime = Date.now();
    console.log(`✅ Trophy stats for user ${userId} calculated in ${endTime - startTime}ms - ${totalCards} total, ${autographs} autos, ${specials} specials`);
    
    // Mettre en cache pour 3 minutes (les trophées changent moins souvent)
    cache.set(cacheKey, result, 180);
    
    return result;
  }

  async getPersonalCardsByUserId(userId: number): Promise<PersonalCard[]> {
    const cacheKey = `personal_cards_user_${userId}`;
    
    // Vérifier le cache d'abord
    const cached = cache.get<PersonalCard[]>(cacheKey);
    if (cached) {
      console.log(`📦 Personal cards for user ${userId} from cache - ${cached.length} cards`);
      return cached;
    }
    
    const startTime = Date.now();
    const result = await db.select().from(personalCards).where(eq(personalCards.userId, userId));
    const loadTime = Date.now() - startTime;
    
    // Cache pendant 3 minutes (optimisé pour performances)
    cache.set(cacheKey, result, 180);
    
    console.log(`📊 Personal cards for user ${userId} loaded in ${loadTime}ms - ${result.length} cards`);
    return result;
  }

  async getPersonalCardsByCollectionId(collectionId: number, userId: number): Promise<PersonalCard[]> {
    // Les personal cards n'ont pas de collectionId direct
    // On filtre plutôt par saison correspondante à la collection
    const collection = await this.getCollection(collectionId);
    if (!collection) return [];
    
    return await db.select().from(personalCards)
      .where(
        and(
          eq(personalCards.userId, userId),
          eq(personalCards.season, collection.season)
        )
      );
  }

  async getAllPersonalCards(): Promise<PersonalCard[]> {
    return await db.select().from(personalCards);
  }

  async getPersonalCard(id: number): Promise<PersonalCard | undefined> {
    const [personalCard] = await db.select().from(personalCards).where(eq(personalCards.id, id));
    return personalCard || undefined;
  }

  async createPersonalCard(insertPersonalCard: InsertPersonalCard): Promise<PersonalCard> {
    const [personalCard] = await db
      .insert(personalCards)
      .values(insertPersonalCard)
      .returning();
    
    // Invalider le cache des trophées après création d'une carte personnelle
    cache.clear();
    
    return personalCard;
  }

  async updatePersonalCard(id: number, updates: Partial<PersonalCard>): Promise<PersonalCard | undefined> {
    const [personalCard] = await db
      .update(personalCards)
      .set(updates)
      .where(eq(personalCards.id, id))
      .returning();
    
    // Invalider le cache des trophées après modification d'une carte personnelle
    cache.clear();
    
    return personalCard || undefined;
  }

  async deletePersonalCard(id: number): Promise<boolean> {
    const result = await db.delete(personalCards).where(eq(personalCards.id, id));
    
    // Invalider le cache des trophées après suppression d'une carte personnelle
    cache.clear();
    
    return (result.rowCount || 0) > 0;
  }

  async updateCardTrade(id: number, tradeData: { tradeDescription?: string; tradePrice?: string; tradeOnly: boolean; isForTrade: boolean }): Promise<Card | undefined> {
    const updateData: Partial<Card> = {};
    if (tradeData.tradeDescription !== undefined) updateData.tradeDescription = tradeData.tradeDescription;
    if (tradeData.tradePrice !== undefined) updateData.tradePrice = tradeData.tradePrice;
    updateData.tradeOnly = tradeData.tradeOnly;
    updateData.isForTrade = tradeData.isForTrade;

    const [card] = await db
      .update(cards)
      .set(updateData)
      .where(eq(cards.id, id))
      .returning();
    return card || undefined;
  }

  async getConversations(userId: number): Promise<Conversation[]> {
    try {
      const result = await db.select({
        id: conversations.id,
        user1Id: conversations.user1Id,
        user2Id: conversations.user2Id,
        lastMessageAt: conversations.lastMessageAt,
        createdAt: conversations.createdAt
      })
      .from(conversations)
      .where(
        or(
          eq(conversations.user1Id, userId),
          eq(conversations.user2Id, userId)
        )
      )
      .orderBy(conversations.createdAt);
      
      return result;
    } catch (error) {
      console.error('Error getting conversations:', error);
      return [];
    }
  }

  async getConversation(user1Id: number, user2Id: number): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations)
      .where(
        or(
          and(eq(conversations.user1Id, user1Id), eq(conversations.user2Id, user2Id)),
          and(eq(conversations.user1Id, user2Id), eq(conversations.user2Id, user1Id))
        )
      );
    return conversation || undefined;
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const [newConversation] = await db
      .insert(conversations)
      .values({
        user1Id: conversation.user1Id,
        user2Id: conversation.user2Id
      })
      .returning();
    return newConversation;
  }

  async getMessages(conversationId: number): Promise<Message[]> {
    const result = await db.select({
      id: messages.id,
      conversationId: messages.conversationId,
      senderId: messages.senderId,
      content: messages.content,
      isRead: messages.isRead,
      createdAt: messages.createdAt
    })
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(messages.createdAt);
    
    return result;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    try {
      const [newMessage] = await db
        .insert(messages)
        .values({
          conversationId: message.conversationId,
          senderId: message.senderId,
          content: message.content,
          isRead: false
        })
        .returning();
      
      return newMessage;
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  async markMessagesAsRead(conversationId: number, userId: number): Promise<void> {
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.conversationId, conversationId),
          sql`${messages.senderId} != ${userId}`
        )
      );
  }

  async getUserPosts(userId: number): Promise<any[]> {
    try {
      const result = await db.select({
        id: posts.id,
        userId: posts.userId,
        content: posts.content,
        type: posts.type,
        cardId: posts.cardId,
        imageUrl: posts.imageUrl,
        images: posts.images,
        taggedUsers: posts.taggedUsers,
        likesCount: posts.likesCount,
        commentsCount: posts.commentsCount,
        isVisible: posts.isVisible,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        userName: users.name,
        userUsername: users.username,
        userAvatar: users.avatar
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.createdAt));
      
      return result.map(post => ({
        ...post,
        user: {
          id: post.userId,
          name: post.userName,
          username: post.userUsername,
          avatar: post.userAvatar
        }
      }));
    } catch (error) {
      console.error('Error getting user posts:', error);
      return [];
    }
  }

  async createPost(post: any): Promise<any> {
    try {
      const [newPost] = await db
        .insert(posts)
        .values({
          userId: post.userId,
          content: post.content,
          type: post.type || 'text',
          cardId: post.cardId,
          imageUrl: post.imageUrl,
          images: post.images,
          taggedUsers: post.taggedUsers
        })
        .returning();
      
      return newPost;
    } catch (error) {
      console.error('Error creating post:', error);
      return null;
    }
  }

  async createActivity(activity: any): Promise<any> {
    try {
      const [newActivity] = await db
        .insert(activities)
        .values({
          type: activity.type,
          userId: activity.userId,
          collectionId: activity.collectionId,
          cardId: activity.cardId,
          metadata: activity.metadata
        })
        .returning();
      
      return newActivity;
    } catch (error) {
      console.error('Error creating activity:', error);
      return {
        type: activity.type,
        userId: activity.userId
      };
    }
  }

  async getPost(id: number): Promise<any> {
    try {
      const [post] = await db.select().from(posts).where(eq(posts.id, id));
      return post || undefined;
    } catch (error) {
      console.error('Error getting post:', error);
      return undefined;
    }
  }

  async getFollowersCount(userId: number): Promise<number> {
    try {
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(follows)
        .where(eq(follows.followingId, userId));
      
      const followersCount = result[0]?.count || 0;
      console.log(`User ${userId} has ${followersCount} followers`);
      return followersCount;
    } catch (error) {
      console.error('Error getting followers count:', error);
      return 0;
    }
  }

  async getFollowingCount(userId: number): Promise<number> {
    try {
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(follows)
        .where(eq(follows.followerId, userId));
      
      return result[0]?.count || 0;
    } catch (error) {
      console.error('Error getting following count:', error);
      return 0;
    }
  }

  async deletePost(id: number): Promise<boolean> {
    try {
      const result = await db.delete(posts).where(eq(posts.id, id));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting post:', error);
      return false;
    }
  }

  async getUserFollowers(userId: number): Promise<User[]> {
    return [];
  }

  async getUserFollowing(userId: number): Promise<User[]> {
    return [];
  }

  async getUserSubscriptions(userId: number): Promise<any[]> {
    return [];
  }

  async deleteSubscription(followingId: number): Promise<boolean> {
    return false;
  }

  async getUserSubscribers(userId: number): Promise<any[]> {
    return [];
  }

  async getPendingSubscriptionRequests(userId: number): Promise<any[]> {
    return [];
  }

  async createSubscription(subscription: any): Promise<any> {
    return subscription;
  }

  async updateSubscription(id: number, updates: any): Promise<any> {
    return { id, ...updates };
  }

  async getActivityFeed(userId: number): Promise<any[]> {
    return [];
  }

  async followUser(followerId: number, followingId: number): Promise<boolean> {
    try {
      await db.insert(follows).values({
        followerId,
        followingId
      });
      return true;
    } catch (error) {
      console.error('Error following user:', error);
      return false;
    }
  }

  async unfollowUser(followerId: number, followingId: number): Promise<boolean> {
    try {
      const result = await db.delete(follows)
        .where(
          and(
            eq(follows.followerId, followerId),
            eq(follows.followingId, followingId)
          )
        );
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      return false;
    }
  }

  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    try {
      const [follow] = await db.select().from(follows)
        .where(
          and(
            eq(follows.followerId, followerId),
            eq(follows.followingId, followingId)
          )
        );
      return !!follow;
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  }

  async getFollowedUsersPosts(userId: number): Promise<any[]> {
    try {
      // Get users that the current user follows
      const followedUsersQuery = await db.select({
        followingId: follows.followingId
      })
      .from(follows)
      .where(eq(follows.followerId, userId));

      const followedUserIds = followedUsersQuery.map(f => f.followingId);
      
      if (followedUserIds.length === 0) {
        return [];
      }

      // Get posts from followed users
      const followedPostsQuery = await db.select({
        id: posts.id,
        userId: posts.userId,
        content: posts.content,
        type: posts.type,
        cardId: posts.cardId,
        imageUrl: posts.imageUrl,
        images: posts.images,
        taggedUsers: posts.taggedUsers,
        likesCount: posts.likesCount,
        commentsCount: posts.commentsCount,
        isVisible: posts.isVisible,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        userName: users.name,
        userUsername: users.username,
        userAvatar: users.avatar
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .where(inArray(posts.userId, followedUserIds))
      .orderBy(desc(posts.createdAt));
      
      return followedPostsQuery.map(post => ({
        id: post.id,
        userId: post.userId,
        content: post.content,
        type: post.type,
        cardId: post.cardId,
        imageUrl: post.imageUrl,
        images: post.images,
        taggedUsers: post.taggedUsers,
        likesCount: post.likesCount,
        commentsCount: post.commentsCount,
        isVisible: post.isVisible,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        user: {
          id: post.userId,
          name: post.userName,
          username: post.userUsername,
          avatar: post.userAvatar
        }
      }));
      
    } catch (error) {
      console.error('Error getting followed users posts:', error);
      return [];
    }
  }

  async removeCardFromDeck(deckId: number, cardPosition: number): Promise<void> {
    console.log(`Removing card at position ${cardPosition} from deck ${deckId}`);
    
    // Supprimer la carte à la position spécifiée
    await db.delete(deckCards)
      .where(and(eq(deckCards.deckId, deckId), eq(deckCards.position, cardPosition)));
    
    // Réorganiser les positions des cartes restantes
    const remainingCards = await db.select()
      .from(deckCards)
      .where(eq(deckCards.deckId, deckId))
      .orderBy(deckCards.position);
    
    // Mettre à jour les positions pour qu'elles soient consécutives à partir de 0
    for (let i = 0; i < remainingCards.length; i++) {
      if (remainingCards[i].position !== i) {
        await db.update(deckCards)
          .set({ position: i })
          .where(eq(deckCards.id, remainingCards[i].id));
      }
    }
    
    console.log(`Card at position ${cardPosition} removed and positions reordered`);
  }

  async deleteDeck(deckId: number): Promise<boolean> {
    try {
      await db.delete(deckCards).where(eq(deckCards.deckId, deckId));
      const result = await db.delete(decks).where(eq(decks.id, deckId));
      console.log(`Deck ${deckId} deleted successfully`);
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error deleting deck:', error);
      return false;
    }
  }

  async getFollowersByUserId(userId: number): Promise<User[]> {
    return [];
  }

  async getFollowingByUserId(userId: number): Promise<any[]> {
    return [];
  }

  async getPostsByUserIds(userIds: number[]): Promise<any[]> {
    return [];
  }

  async getPostsByUserId(userId: number): Promise<any[]> {
    return this.getUserPosts(userId);
  }

  async getCardsForSaleByUserId(userId: number): Promise<any[]> {
    return [];
  }

  async getUsers(): Promise<User[]> {
    return this.getAllUsers();
  }

  async getDecks(userId: number): Promise<any[]> {
    return [];
  }

  // Notification methods
  async createNotification(notification: { userId: number; fromUserId?: number; type: string; title: string; message: string; postId?: number; messageId?: number }): Promise<void> {
    await db.insert(notifications).values({
      userId: notification.userId,
      fromUserId: notification.fromUserId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      postId: notification.postId,
      messageId: notification.messageId,
      isRead: false
    });
  }

  async getNotifications(userId: number): Promise<any[]> {
    const notifs = await db
      .select({
        id: notifications.id,
        type: notifications.type,
        title: notifications.title,
        message: notifications.message,
        isRead: notifications.isRead,
        createdAt: notifications.createdAt,
        fromUserId: notifications.fromUserId,
        messageId: notifications.messageId,
        fromUserName: users.name,
        fromUserAvatar: users.avatar
      })
      .from(notifications)
      .leftJoin(users, eq(notifications.fromUserId, users.id))
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
    
    return notifs;
  }

  async markNotificationAsRead(notificationId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, notificationId));
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.userId, userId));
  }

  // Trophy operations
  async getUnlockedTrophies(userId: number): Promise<any[]> {
    const trophies = await db
      .select()
      .from(unlockedTrophies)
      .where(eq(unlockedTrophies.userId, userId));
    
    return trophies;
  }

  async unlockTrophy(userId: number, trophyId: string, category: string, color: string): Promise<any> {
    try {
      const trophy = await db
        .insert(unlockedTrophies)
        .values({
          userId,
          trophyId,
          category,
          color
        })
        .returning()
        .onConflictDoNothing();
      
      return trophy[0];
    } catch (error) {
      // Trophy already exists, return null
      return null;
    }
  }

  async getHighestTrophyColor(userId: number): Promise<string | null> {
    const trophies = await this.getUnlockedTrophies(userId);
    
    // Order by priority: rainbow > gold > purple > blue > green > gray
    const colorPriority = {
      'rainbow': 6,
      'gold': 5,
      'purple': 4,
      'blue': 3,
      'green': 2,
      'gray': 1
    };
    
    let highestColor = null;
    let highestPriority = 0;
    
    for (const trophy of trophies) {
      const priority = colorPriority[trophy.color as keyof typeof colorPriority] || 0;
      if (priority > highestPriority) {
        highestPriority = priority;
        highestColor = trophy.color;
      }
    }
    
    return highestColor;
  }

  // Checklist Cards (cartes de référence partagées)
  async getChecklistCardsByCollectionId(collectionId: number): Promise<ChecklistCard[]> {
    const cacheKey = `checklist_cards_collection_${collectionId}`;
    
    // Vérifier le cache d'abord
    const cached = cache.get<ChecklistCard[]>(cacheKey);
    if (cached) {
      console.log(`📦 Checklist cards for collection ${collectionId} from cache - ${cached.length} cards`);
      return cached;
    }
    
    const startTime = Date.now();
    const result = await db
      .select()
      .from(checklistCards)
      .where(eq(checklistCards.collectionId, collectionId))
      .orderBy(checklistCards.reference);
    
    const endTime = Date.now();
    console.log(`✅ Checklist cards for collection ${collectionId} loaded from DB in ${endTime - startTime}ms - ${result.length} cards`);
    
    // Mettre en cache pour 10 minutes
    cache.set(cacheKey, result, 600);
    
    return result;
  }

  // User Card Ownership (propriété individuelle des cartes checklist)
  async getUserChecklistCardOwnership(userId: number, collectionId: number): Promise<UserCardOwnership[]> {
    const cacheKey = `user_checklist_ownership_${userId}_${collectionId}`;
    
    // Vérifier le cache d'abord
    const cached = cache.get<UserCardOwnership[]>(cacheKey);
    if (cached) {
      console.log(`📦 User checklist ownership for user ${userId}, collection ${collectionId} from cache - ${cached.length} cards`);
      return cached;
    }
    
    const startTime = Date.now();
    const result = await db
      .select()
      .from(userCardOwnership)
      .innerJoin(checklistCards, eq(userCardOwnership.cardId, checklistCards.id))
      .where(
        and(
          eq(userCardOwnership.userId, userId),
          eq(checklistCards.collectionId, collectionId)
        )
      );
    
    const endTime = Date.now();
    console.log(`✅ User checklist ownership for user ${userId}, collection ${collectionId} loaded from DB in ${endTime - startTime}ms - ${result.length} cards`);
    
    // Transformer le résultat pour ne garder que les données d'ownership
    const ownership = result.map(r => r.user_card_ownership);
    
    // Mettre en cache pour 5 minutes
    cache.set(cacheKey, ownership, 300);
    
    return ownership;
  }

  async updateUserChecklistCardOwnership(userId: number, cardId: number, owned: boolean): Promise<UserCardOwnership> {
    // Invalider le cache (simple clear pour éviter les erreurs)
    cache.clear();
    
    // Vérifier si l'enregistrement existe
    const existing = await db
      .select()
      .from(userCardOwnership)
      .where(
        and(
          eq(userCardOwnership.userId, userId),
          eq(userCardOwnership.cardId, cardId)
        )
      )
      .limit(1);
    
    if (existing.length > 0) {
      // Mettre à jour l'enregistrement existant
      const result = await db
        .update(userCardOwnership)
        .set({ 
          owned,
          updatedAt: new Date()
        })
        .where(
          and(
            eq(userCardOwnership.userId, userId),
            eq(userCardOwnership.cardId, cardId)
          )
        )
        .returning();
      
      return result[0];
    } else {
      // Créer un nouvel enregistrement
      const result = await db
        .insert(userCardOwnership)
        .values({
          userId,
          cardId,
          owned,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      return result[0];
    }
  }

  async getCollectionCompletionStats(userId: number, collectionId: number): Promise<{
    totalCards: number;
    ownedCards: number;
    completionPercentage: number;
  }> {
    const cacheKey = `completion_stats_${userId}_${collectionId}`;
    
    // Vérifier le cache d'abord
    const cached = cache.get<{totalCards: number; ownedCards: number; completionPercentage: number}>(cacheKey);
    if (cached) {
      console.log(`📦 Completion stats for user ${userId}, collection ${collectionId} from cache`);
      return cached;
    }
    
    const startTime = Date.now();
    
    // Compter le total de cartes dans la collection
    const totalCardsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(checklistCards)
      .where(eq(checklistCards.collectionId, collectionId));
    
    const totalCards = totalCardsResult[0]?.count || 0;
    
    // Compter les cartes possédées par l'utilisateur
    const ownedCardsResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(userCardOwnership)
      .innerJoin(checklistCards, eq(userCardOwnership.cardId, checklistCards.id))
      .where(
        and(
          eq(userCardOwnership.userId, userId),
          eq(checklistCards.collectionId, collectionId),
          eq(userCardOwnership.owned, true)
        )
      );
    
    const ownedCards = ownedCardsResult[0]?.count || 0;
    
    const completionPercentage = totalCards > 0 ? Math.round((ownedCards / totalCards) * 100) : 0;
    
    const endTime = Date.now();
    console.log(`✅ Completion stats for user ${userId}, collection ${collectionId} loaded in ${endTime - startTime}ms - ${ownedCards}/${totalCards} (${completionPercentage}%)`);
    
    const stats = {
      totalCards,
      ownedCards,
      completionPercentage
    };
    
    // Mettre en cache pour 5 minutes
    cache.set(cacheKey, stats, 300);
    
    return stats;
  }

  async initializeUserChecklistOwnership(userId: number, collectionId: number): Promise<void> {
    // Invalider le cache (simple clear pour éviter les erreurs)
    cache.clear();
    
    // Obtenir toutes les cartes de la collection qui n'ont pas encore d'ownership pour cet utilisateur
    const cardsToInitialize = await db
      .select({ id: checklistCards.id })
      .from(checklistCards)
      .leftJoin(
        userCardOwnership, 
        and(
          eq(checklistCards.id, userCardOwnership.cardId),
          eq(userCardOwnership.userId, userId)
        )
      )
      .where(
        and(
          eq(checklistCards.collectionId, collectionId),
          sql`${userCardOwnership.id} IS NULL`
        )
      );
    
    if (cardsToInitialize.length > 0) {
      // Insérer les enregistrements d'ownership par défaut
      const ownershipData = cardsToInitialize.map(card => ({
        userId,
        cardId: card.id,
        owned: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }));
      
      await db.insert(userCardOwnership).values(ownershipData);
      
      console.log(`✅ Initialized ownership for ${cardsToInitialize.length} cards for user ${userId} in collection ${collectionId}`);
    }
  }

  async getChecklistCard(id: number): Promise<ChecklistCard | undefined> {
    const result = await db.select().from(checklistCards).where(eq(checklistCards.id, id)).limit(1);
    return result[0];
  }

  async createChecklistCard(checklistCard: InsertChecklistCard): Promise<ChecklistCard> {
    const result = await db.insert(checklistCards).values(checklistCard).returning();
    return result[0];
  }

  // User Card Ownership (propriété individuelle)
  async getUserCardOwnership(userId: number, cardId: number): Promise<UserCardOwnership | undefined> {
    const result = await db
      .select()
      .from(userCardOwnership)
      .where(and(eq(userCardOwnership.userId, userId), eq(userCardOwnership.cardId, cardId)))
      .limit(1);
    return result[0];
  }

  async getUserCardOwnerships(userId: number): Promise<UserCardOwnership[]> {
    return await db
      .select()
      .from(userCardOwnership)
      .where(eq(userCardOwnership.userId, userId));
  }

  async setUserCardOwnership(userId: number, cardId: number, owned: boolean): Promise<UserCardOwnership> {
    // D'abord essayer de mettre à jour l'enregistrement existant
    const existingResult = await db
      .update(userCardOwnership)
      .set({ owned, updatedAt: new Date() })
      .where(and(eq(userCardOwnership.userId, userId), eq(userCardOwnership.cardId, cardId)))
      .returning();

    if (existingResult.length > 0) {
      return existingResult[0];
    }

    // Si pas d'enregistrement existant, en créer un nouveau
    const newResult = await db
      .insert(userCardOwnership)
      .values({ userId, cardId, owned })
      .returning();
    
    return newResult[0];
  }
}

export const storage = new DatabaseStorage();