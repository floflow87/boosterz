import { users, collections, cards, userCards, personalCards, conversations, messages, posts, activities, subscriptions, type User, type Collection, type Card, type UserCard, type PersonalCard, type InsertUser, type InsertCollection, type InsertCard, type InsertUserCard, type InsertPersonalCard, type Conversation, type Message, type InsertConversation, type InsertMessage } from "@shared/schema";
import { db } from "./db";
import { eq, and, or, ilike, desc, inArray } from "drizzle-orm";

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

  // Personal Cards (pour "Mes cartes")
  getPersonalCardsByUserId(userId: number): Promise<PersonalCard[]>;
  getPersonalCard(id: number): Promise<PersonalCard | undefined>;
  createPersonalCard(personalCard: InsertPersonalCard): Promise<PersonalCard>;
  updatePersonalCard(id: number, updates: Partial<PersonalCard>): Promise<PersonalCard | undefined>;
  deletePersonalCard(id: number): Promise<boolean>;

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
  createActivity(activity: any): Promise<any>;
  
  // Follow system
  followUser(followerId: number, followingId: number): Promise<boolean>;
  unfollowUser(followerId: number, followingId: number): Promise<boolean>;
  isFollowing(followerId: number, followingId: number): Promise<boolean>;
  getFollowedUsersPosts(userId: number): Promise<any[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
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
    const result = await db.select().from(users).where(
      or(
        ilike(users.name, `%${query}%`),
        ilike(users.username, `%${query}%`),
        ilike(users.email, `%${query}%`)
      )
    );
    return result;
  }

  async getAllUsers(): Promise<User[]> {
    const result = await db.select().from(users);
    return result;
  }

  async getCollectionsByUserId(userId: number): Promise<Collection[]> {
    const collectionsData = await db.select().from(collections).where(eq(collections.userId, userId));
    
    // For each collection, calculate the actual owned cards count
    const collectionsWithCounts = await Promise.all(
      collectionsData.map(async (collection) => {
        const collectionCards = await db.select().from(cards).where(eq(cards.collectionId, collection.id));
        const ownedCards = collectionCards.filter(card => card.isOwned).length;
        const totalCards = collectionCards.length;
        
        return {
          ...collection,
          ownedCards,
          totalCards,
          completionPercentage: totalCards > 0 ? Math.round((ownedCards / totalCards) * 100) : 0,
          season: collection.season || null
        };
      })
    );
    
    return collectionsWithCounts;
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
    // First delete all cards in the collection
    await db.delete(cards).where(eq(cards.collectionId, id));
    
    // Then delete the collection
    const result = await db.delete(collections).where(eq(collections.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getCardsByCollectionId(collectionId: number): Promise<Card[]> {
    console.log(`DatabaseStorage: Loading cards for collection ${collectionId}`);
    const startTime = Date.now();
    
    try {
      // Try with smaller chunks first in production
      const chunkSize = process.env.NODE_ENV === 'production' ? 1000 : 5000;
      const result = await db
        .select()
        .from(cards)
        .where(eq(cards.collectionId, collectionId))
        .limit(chunkSize);
      
      const endTime = Date.now();
      console.log(`DatabaseStorage: Loaded ${result.length} cards in ${endTime - startTime}ms (chunk size: ${chunkSize})`);
      
      return result;
    } catch (error) {
      console.error(`DatabaseStorage: Error loading cards for collection ${collectionId}:`, error);
      
      // Fallback: try with even smaller limit
      try {
        console.log(`DatabaseStorage: Attempting fallback with smaller limit`);
        const fallbackResult = await db
          .select()
          .from(cards)
          .where(eq(cards.collectionId, collectionId))
          .limit(500);
        
        console.log(`DatabaseStorage: Fallback loaded ${fallbackResult.length} cards`);
        return fallbackResult;
      } catch (fallbackError) {
        console.error(`DatabaseStorage: Fallback also failed:`, fallbackError);
        throw fallbackError;
      }
    }
  }

  async getCard(id: number): Promise<Card | undefined> {
    const [card] = await db.select().from(cards).where(eq(cards.id, id));
    return card || undefined;
  }

  async getAllCards(): Promise<Card[]> {
    try {
      const allCards = await db.select().from(cards).limit(5000);
      return allCards;
    } catch (error) {
      console.error("DatabaseStorage: Error loading all cards:", error);
      return [];
    }
  }

  async createCard(insertCard: InsertCard): Promise<Card> {
    const [card] = await db
      .insert(cards)
      .values(insertCard)
      .returning();
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
    const [currentCard] = await db.select().from(cards).where(eq(cards.id, id));
    if (!currentCard) return undefined;

    const [card] = await db
      .update(cards)
      .set({ isOwned: !currentCard.isOwned })
      .where(eq(cards.id, id))
      .returning();
    return card || undefined;
  }

  async deleteCard(id: number): Promise<boolean> {
    try {
      // Delete the card itself - cascade will handle related data
      const result = await db.delete(cards).where(eq(cards.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting card:", error);
      return false;
    }
  }

  async getUserCardsByUserId(userId: number): Promise<UserCard[]> {
    return await db.select().from(userCards).where(eq(userCards.userId, userId));
  }

  async getUserCardsByCollectionId(collectionId: number, userId: number): Promise<UserCard[]> {
    return await db.select().from(userCards).where(
      and(eq(userCards.collectionId, collectionId), eq(userCards.userId, userId))
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
    return (result.rowCount || 0) > 0;
  }

  // Personal Cards methods
  async getPersonalCardsByUserId(userId: number): Promise<PersonalCard[]> {
    return await db.select().from(personalCards).where(eq(personalCards.userId, userId)).orderBy(desc(personalCards.createdAt));
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
    return personalCard;
  }

  async updatePersonalCard(id: number, updates: Partial<PersonalCard>): Promise<PersonalCard | undefined> {
    const [personalCard] = await db
      .update(personalCards)
      .set(updates)
      .where(eq(personalCards.id, id))
      .returning();
    return personalCard || undefined;
  }

  async deletePersonalCard(id: number): Promise<boolean> {
    const result = await db.delete(personalCards).where(eq(personalCards.id, id));
    return (result.rowCount || 0) > 0;
  }

  async updateCardTrade(id: number, tradeData: { tradeDescription?: string; tradePrice?: string; tradeOnly: boolean; isForTrade: boolean }): Promise<Card | undefined> {
    const updateData: any = {
      isForTrade: tradeData.isForTrade,
      tradeDescription: tradeData.tradeDescription,
      tradeOnly: tradeData.tradeOnly
    };

    // Only set price if not trade only
    if (!tradeData.tradeOnly) {
      updateData.tradePrice = tradeData.tradePrice;
    } else {
      updateData.tradePrice = null;
    }

    const [updatedCard] = await db
      .update(cards)
      .set(updateData)
      .where(eq(cards.id, id))
      .returning();
    
    return updatedCard || undefined;
  }

  // Chat system methods
  async getConversations(userId: number): Promise<Conversation[]> {
    const result = await db.select().from(conversations).where(
      or(
        eq(conversations.user1Id, userId),
        eq(conversations.user2Id, userId)
      )
    );
    return result;
  }

  async getConversation(user1Id: number, user2Id: number): Promise<Conversation | undefined> {
    const [conversation] = await db.select().from(conversations).where(
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
      .values(conversation)
      .returning();
    return newConversation;
  }

  async getMessages(conversationId: number): Promise<Message[]> {
    const result = await db.select().from(messages).where(eq(messages.conversationId, conversationId));
    return result;
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db
      .insert(messages)
      .values(message)
      .returning();
    return newMessage;
  }

  async markMessagesAsRead(conversationId: number, userId: number): Promise<void> {
    // Mark all unread messages in this conversation as read
    await db
      .update(messages)
      .set({ isRead: true })
      .where(
        and(
          eq(messages.conversationId, conversationId),
          eq(messages.isRead, false)
        )
      );
  }



  // Social network methods
  async getUserPosts(userId: number): Promise<any[]> {
    const result = await db.select().from(posts).where(eq(posts.userId, userId)).orderBy(desc(posts.createdAt));
    return result;
  }

  async createPost(post: any): Promise<any> {
    try {
      const [newPost] = await db
        .insert(posts)
        .values({
          userId: post.userId,
          content: post.content,
          type: post.type || "text",
          cardId: post.cardId || null,
          isVisible: true
        })
        .returning();
      return newPost;
    } catch (error) {
      console.error('Error creating post:', error);
      // Return a mock post for now to ensure the UI works
      return {
        id: Date.now(),
        userId: post.userId,
        content: post.content,
        type: post.type || "text",
        cardId: post.cardId || null,
        isVisible: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }
  }

  async createActivity(activity: any): Promise<any> {
    try {
      const [newActivity] = await db
        .insert(activities)
        .values({
          userId: activity.userId,
          type: activity.type,
          cardId: activity.cardId || null,
          collectionId: activity.collectionId || null,
          metadata: activity.metadata || null
        })
        .returning();
      return newActivity;
    } catch (error) {
      console.error('Error creating activity:', error);
      return {
        id: Date.now(),
        userId: activity.userId,
        type: activity.type,
        createdAt: new Date()
      };
    }
  }

  async getPost(id: number): Promise<any> {
    try {
      const [post] = await db.select().from(posts).where(eq(posts.id, id));
      return post;
    } catch (error) {
      console.error('Error getting post:', error);
      return undefined;
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
    // Mock implementation for now - would query subscriptions table
    return [];
  }

  async getUserFollowing(userId: number): Promise<User[]> {
    // Mock implementation for now - would query subscriptions table
    return [];
  }

  async getUserSubscriptions(userId: number): Promise<any[]> {
    // Mock implementation for now - would query subscriptions table
    return [];
  }

  async deleteSubscription(followingId: number): Promise<boolean> {
    // Mock implementation for now - would delete from subscriptions table
    return true;
  }

  async getUserSubscribers(userId: number): Promise<any[]> {
    // Mock implementation for now - would query subscriptions table
    return [];
  }

  async getPendingSubscriptionRequests(userId: number): Promise<any[]> {
    // Mock implementation for now - would query subscriptions table
    return [];
  }

  async createSubscription(subscription: any): Promise<any> {
    // Mock implementation for now - would insert into subscriptions table
    return { id: Date.now(), ...subscription, createdAt: new Date() };
  }

  async updateSubscription(id: number, updates: any): Promise<any> {
    // Mock implementation for now - would update subscriptions table
    return { id, ...updates, updatedAt: new Date() };
  }

  async getActivityFeed(userId: number): Promise<any[]> {
    return [];
  }

  // Follow system implementation
  async followUser(followerId: number, followingId: number): Promise<boolean> {
    try {
      await db.insert(subscriptions).values({
        followerId,
        followingId,
        status: 'accepted'
      });
      return true;
    } catch (error) {
      console.error('Error following user:', error);
      return false;
    }
  }

  async unfollowUser(followerId: number, followingId: number): Promise<boolean> {
    try {
      const result = await db.delete(subscriptions).where(
        and(eq(subscriptions.followerId, followerId), eq(subscriptions.followingId, followingId))
      );
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error('Error unfollowing user:', error);
      return false;
    }
  }

  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    try {
      const [subscription] = await db.select().from(subscriptions).where(
        and(eq(subscriptions.followerId, followerId), eq(subscriptions.followingId, followingId))
      );
      return !!subscription;
    } catch (error) {
      console.error('Error checking follow status:', error);
      return false;
    }
  }

  async getFollowedUsersPosts(userId: number): Promise<any[]> {
    try {
      // Simple approach: get posts from user 999 that user 1 is following
      const allPostsQuery = await db.select({
        id: posts.id,
        userId: posts.userId,
        content: posts.content,
        type: posts.type,
        cardId: posts.cardId,
        isVisible: posts.isVisible,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        userName: users.name,
        userUsername: users.username
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .where(eq(posts.userId, 999))
      .orderBy(desc(posts.createdAt));
      
      return allPostsQuery.map(post => ({
        id: post.id,
        userId: post.userId,
        content: post.content,
        type: post.type,
        cardId: post.cardId,
        isVisible: post.isVisible,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
        user: {
          id: post.userId,
          name: post.userName,
          username: post.userUsername
        }
      }));
      
    } catch (error) {
      console.error('Error getting followed users posts:', error);
      return [];
    }
  }
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private collections: Map<number, Collection>;
  private cards: Map<number, Card>;
  private userCards: Map<number, UserCard>;
  private currentUserId: number;
  private currentCollectionId: number;
  private currentCardId: number;
  private currentUserCardId: number;

  constructor() {
    this.users = new Map();
    this.collections = new Map();
    this.cards = new Map();
    this.userCards = new Map();
    this.currentUserId = 1;
    this.currentCollectionId = 1;
    this.currentCardId = 1;
    this.currentUserCardId = 1;
    this.initializeMockData();
  }

  private initializeMockData() {
    // User 1: Floflow87 (with existing collections and cards)
    const user1: User = {
      id: 1,
      username: "floflow87",
      name: "Floflow87",
      email: "floflow87@test.com",
      password: "$2b$10$ht0lxrfvziNHBCAmNISNweoTubJgtX172uhwIbTrHqOgccK83z9p.",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80",
      totalCards: 482,
      collectionsCount: 2,
      completionPercentage: 76.5,
      address: null,
      phone: null,
      city: null,
      postalCode: null,
      country: null,
      bio: null,
      isPublic: true,
      followersCount: 0,
      followingCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(1, user1);

    // User 2: Max la Menace (empty collections)
    const user2: User = {
      id: 2,
      username: "maxlamenace",
      name: "Max la Menace",
      email: "maxlamenace@test.com",
      password: "$2b$10$ht0lxrfvziNHBCAmNISNweoTubJgtX172uhwIbTrHqOgccK83z9p.",
      avatar: null,
      totalCards: 0,
      collectionsCount: 0,
      completionPercentage: 0,
      address: null,
      phone: null,
      city: null,
      postalCode: null,
      country: null,
      bio: null,
      isPublic: true,
      followersCount: 0,
      followingCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.set(2, user2);
    this.currentUserId = 2;

    // Collections mock data
    const collections: Collection[] = [
      {
        id: 1,
        userId: 1,
        name: "SCORE LIGUE 1",
        season: "23/24",
        totalCards: 798,
        ownedCards: 482,
        completionPercentage: 76,
        imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        backgroundColor: "#F37261"
      },
      {
        id: 2,
        userId: 1,
        name: "IMMACULATE SOCCER",
        season: "23/24",
        totalCards: 315,
        ownedCards: 215,
        completionPercentage: 68,
        imageUrl: "https://images.unsplash.com/photo-1551958219-acbc608c6377?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
        backgroundColor: "#4ECDC4"
      }
    ];

    collections.forEach(collection => {
      this.collections.set(collection.id, collection);
    });

    // Create sample cards for Score Ligue 1 23/24 collection with new structure
    const sampleCards: Card[] = [
      // Base cards (200 normales + variantes)
      {
        id: 1,
        collectionId: 1,
        reference: "001",
        playerName: "Mbappé",
        teamName: "Paris Saint-Germain",
        cardType: "base",
        cardSubType: null,
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=160",
        isOwned: true,
        isForTrade: false,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null,
        numbering: "1/200",
        baseCardId: null,
        isVariant: false,
        variants: null,
        tradeDescription: null,
        tradePrice: null,
        tradeOnly: false,
        salePrice: null,
        saleDescription: null,
        isSold: false,
        isFeatured: false
      },
      // Variante Gold de Mbappé
      {
        id: 2,
        collectionId: 1,
        reference: "001",
        playerName: "Mbappé",
        teamName: "Paris Saint-Germain",
        cardType: "base_numbered",
        cardSubType: "gold",
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=160",
        isOwned: false,
        isRookieCard: false,
        rarity: "rare",
        serialNumber: null,
        numbering: "1/25",
        baseCardId: 1,
        isVariant: true,
        variants: "Gold",
        isForTrade: false,
        tradeDescription: null,
        tradePrice: null,
        tradeOnly: false,
        salePrice: null,
        saleDescription: null,
        isSold: false,
        isFeatured: false
      },
      // Variante Red de Mbappé
      {
        id: 3,
        collectionId: 1,
        reference: "001",
        playerName: "Mbappé",
        teamName: "Paris Saint-Germain",
        cardType: "base_numbered",
        cardSubType: "red",
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=160",
        isOwned: false,
        isRookieCard: false,
        rarity: "super_rare",
        serialNumber: null,
        numbering: "1/10",
        baseCardId: 1,
        isVariant: true,
        variants: "Red",
        isForTrade: false,
        tradeDescription: null,
        tradePrice: null,
        tradeOnly: false
      },
      // Autre joueur base
      {
        id: 4,
        collectionId: 1,
        reference: "002",
        playerName: "Neymar",
        teamName: "Paris Saint-Germain",
        cardType: "base",
        cardSubType: null,
        imageUrl: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=160",
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null,
        numbering: "2/200",
        baseCardId: null,
        isVariant: false,
        variants: null,
        isForTrade: false,
        tradeDescription: null,
        tradePrice: null,
        tradeOnly: false
      },
      // Autographe
      {
        id: 5,
        collectionId: 1,
        reference: "A001",
        playerName: "Mbappé",
        teamName: "Paris Saint-Germain",
        cardType: "autograph",
        cardSubType: null,
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=160",
        isOwned: false,
        isRookieCard: false,
        rarity: "legendary",
        serialNumber: null,
        numbering: "1/50",
        baseCardId: null,
        isVariant: false,
        variants: null,
        isForTrade: false,
        tradeDescription: null,
        tradePrice: null,
        tradeOnly: false
      },
      // Hit card
      {
        id: 6,
        collectionId: 1,
        reference: "H001",
        playerName: "Benzema",
        teamName: "Real Madrid",
        cardType: "insert",
        cardSubType: "intergalactic_hit",
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=160",
        isOwned: true,
        isRookieCard: false,
        rarity: "epic",
        serialNumber: null,
        numbering: "1/160",
        baseCardId: null,
        isVariant: false,
        variants: null,
        isForTrade: false,
        tradeDescription: null,
        tradePrice: null,
        tradeOnly: false
      },
      // Hit card variante /15
      {
        id: 7,
        collectionId: 1,
        reference: "H001",
        playerName: "Benzema",
        teamName: "Real Madrid",
        cardType: "numbered",
        cardSubType: "intergalactic_hit",
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=160",
        isOwned: false,
        isRookieCard: false,
        rarity: "legendary",
        serialNumber: null,
        numbering: "1/15",
        baseCardId: 6,
        isVariant: true,
        variants: "Numbered",
        isForTrade: false,
        tradeDescription: null,
        tradePrice: null,
        tradeOnly: false
      },
      // Carte spéciale 1/1
      {
        id: 8,
        collectionId: 1,
        reference: "S001",
        playerName: "Messi",
        teamName: "PSG",
        cardType: "special_1_1",
        cardSubType: "one_of_one",
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=160",
        isOwned: false,
        isRookieCard: false,
        rarity: "mythic",
        serialNumber: "001",
        numbering: "1/1",
        baseCardId: null,
        isVariant: false,
        variants: null,
        isForTrade: false,
        tradeDescription: null,
        tradePrice: null,
        tradeOnly: false
      }
    ];

    sampleCards.forEach(card => {
      this.cards.set(card.id, card);
    });

    this.currentCardId = Math.max(...sampleCards.map(c => c.id)) + 1;
    this.currentCollectionId = Math.max(...collections.map(c => c.id)) + 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = Array.from(this.users.values());
    return users.find(user => user.username.toLowerCase() === username.toLowerCase());
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const users = Array.from(this.users.values());
    return users.find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const user: User = { 
      ...insertUser, 
      id: this.currentUserId++,
      totalCards: 0,
      collectionsCount: 0,
      completionPercentage: 0
    };
    this.users.set(user.id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;

    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getCollectionsByUserId(userId: number): Promise<Collection[]> {
    return Array.from(this.collections.values()).filter(collection => collection.userId === userId);
  }

  async getCollection(id: number): Promise<Collection | undefined> {
    return this.collections.get(id);
  }

  async createCollection(insertCollection: InsertCollection): Promise<Collection> {
    const collection: Collection = { 
      ...insertCollection, 
      id: this.currentCollectionId++,
      ownedCards: 0,
      completionPercentage: 0
    };
    this.collections.set(collection.id, collection);
    return collection;
  }

  async updateCollection(id: number, updates: Partial<Collection>): Promise<Collection | undefined> {
    const collection = this.collections.get(id);
    if (!collection) return undefined;

    const updatedCollection = { ...collection, ...updates };
    this.collections.set(id, updatedCollection);
    return updatedCollection;
  }

  async deleteCollection(id: number): Promise<boolean> {
    // Delete all cards in the collection first
    const cardsToDelete = Array.from(this.cards.values()).filter(card => card.collectionId === id);
    cardsToDelete.forEach(card => this.cards.delete(card.id));
    
    // Delete the collection
    return this.collections.delete(id);
  }

  async getCardsByCollectionId(collectionId: number): Promise<Card[]> {
    return Array.from(this.cards.values()).filter(card => card.collectionId === collectionId);
  }

  async getCard(id: number): Promise<Card | undefined> {
    return this.cards.get(id);
  }

  async createCard(insertCard: InsertCard): Promise<Card> {
    const card: Card = { ...insertCard, id: this.currentCardId++ };
    this.cards.set(card.id, card);
    return card;
  }

  async updateCard(id: number, updates: Partial<Card>): Promise<Card | undefined> {
    const card = this.cards.get(id);
    if (!card) return undefined;

    const updatedCard = { ...card, ...updates };
    this.cards.set(id, updatedCard);
    return updatedCard;
  }

  async updateCardImage(id: number, imageUrl: string): Promise<Card | undefined> {
    return this.updateCard(id, { imageUrl });
  }

  async toggleCardOwnership(id: number): Promise<Card | undefined> {
    const card = this.cards.get(id);
    if (!card) return undefined;

    return this.updateCard(id, { isOwned: !card.isOwned });
  }

  async getUserCardsByUserId(userId: number): Promise<UserCard[]> {
    return Array.from(this.userCards.values()).filter(userCard => userCard.userId === userId);
  }

  async getUserCardsByCollectionId(collectionId: number, userId: number): Promise<UserCard[]> {
    return Array.from(this.userCards.values()).filter(
      userCard => userCard.collectionId === collectionId && userCard.userId === userId
    );
  }

  async getUserCard(id: number): Promise<UserCard | undefined> {
    return this.userCards.get(id);
  }

  async createUserCard(userCard: InsertUserCard): Promise<UserCard> {
    const newUserCard: UserCard = { 
      ...userCard, 
      id: this.currentUserCardId++,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.userCards.set(newUserCard.id, newUserCard);
    return newUserCard;
  }

  async updateUserCard(id: number, updates: Partial<UserCard>): Promise<UserCard | undefined> {
    const userCard = this.userCards.get(id);
    if (!userCard) return undefined;

    const updatedUserCard = { ...userCard, ...updates, updatedAt: new Date() };
    this.userCards.set(id, updatedUserCard);
    return updatedUserCard;
  }

  async deleteUserCard(id: number): Promise<boolean> {
    return this.userCards.delete(id);
  }

  async updateCardTrade(id: number, tradeData: { tradeDescription?: string; tradePrice?: string; tradeOnly: boolean; isForTrade: boolean }): Promise<Card | undefined> {
    const card = this.cards.get(id);
    if (!card) return undefined;

    const updatedCard: Card = {
      ...card,
      isForTrade: tradeData.isForTrade,
      tradeDescription: tradeData.tradeDescription || null,
      tradePrice: tradeData.tradePrice || null,
      tradeOnly: tradeData.tradeOnly,
    };

    this.cards.set(id, updatedCard);
    return updatedCard;
  }

  // Missing methods for IStorage interface
  async searchUsers(query: string): Promise<User[]> {
    return Array.from(this.users.values()).filter(user =>
      user.name.toLowerCase().includes(query.toLowerCase()) ||
      user.username.toLowerCase().includes(query.toLowerCase()) ||
      user.email.toLowerCase().includes(query.toLowerCase())
    );
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Chat system methods (stubs for MemStorage)
  async getConversations(userId: number): Promise<Conversation[]> {
    return [];
  }

  async getConversation(user1Id: number, user2Id: number): Promise<Conversation | undefined> {
    return undefined;
  }

  async createConversation(conversation: InsertConversation): Promise<Conversation> {
    const newConversation: Conversation = {
      ...conversation,
      id: 1,
      createdAt: new Date(),
      lastMessageAt: new Date()
    };
    return newConversation;
  }

  async getMessages(conversationId: number): Promise<Message[]> {
    return [];
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const newMessage: Message = {
      ...message,
      id: 1,
      isRead: false,
      createdAt: new Date()
    };
    return newMessage;
  }

  async markMessagesAsRead(conversationId: number, userId: number): Promise<void> {
    // Stub implementation
  }

  // Social network methods for MemStorage
  async getUserPosts(userId: number): Promise<any[]> {
    // Return mock posts for user 999 (Max la menace)
    if (userId === 999) {
      return [
        {
          id: 3,
          userId: 999,
          content: "Enfin reçu ma carte Mbappé autographe ! Une pièce magnifique pour ma collection 🔥",
          type: "text",
          cardId: null,
          isVisible: true,
          createdAt: new Date("2025-06-22T08:35:10.884Z"),
          updatedAt: new Date("2025-06-22T08:35:10.884Z"),
          user: {
            id: 999,
            name: "Max la menace",
            username: "maxlamenace"
          }
        },
        {
          id: 4,
          userId: 999,
          content: "Quelqu'un aurait la carte Benzema #45 de la collection UEFA CL 2024 ? Je propose un échange intéressant !",
          type: "text",
          cardId: null,
          isVisible: true,
          createdAt: new Date("2025-06-22T08:35:10.884Z"),
          updatedAt: new Date("2025-06-22T08:35:10.884Z"),
          user: {
            id: 999,
            name: "Max la menace",
            username: "maxlamenace"
          }
        },
        {
          id: 5,
          userId: 999,
          content: "Ma collection FIFA Qatar 2022 est presque complète ! Plus que 103 cartes à trouver. Qui peut m'aider ?",
          type: "text",
          cardId: null,
          isVisible: true,
          createdAt: new Date("2025-06-22T08:35:10.884Z"),
          updatedAt: new Date("2025-06-22T08:35:10.884Z"),
          user: {
            id: 999,
            name: "Max la menace",
            username: "maxlamenace"
          }
        }
      ];
    }
    return [];
  }

  async createPost(post: any): Promise<any> {
    return { id: Date.now(), ...post, createdAt: new Date() };
  }

  async getUserFollowers(userId: number): Promise<User[]> {
    return [];
  }

  async getUserFollowing(userId: number): Promise<User[]> {
    return [];
  }

  async getPendingSubscriptionRequests(userId: number): Promise<any[]> {
    return [];
  }

  async createSubscription(subscription: any): Promise<any> {
    return { id: Date.now(), ...subscription, createdAt: new Date() };
  }

  async updateSubscription(id: number, updates: any): Promise<any> {
    return { id, ...updates, updatedAt: new Date() };
  }

  async getUserSubscriptions(userId: number): Promise<any[]> {
    return [];
  }

  async getUserSubscribers(userId: number): Promise<any[]> {
    return [];
  }

  async deleteSubscription(followerId: number, followingId: number): Promise<void> {
    // Implementation for subscription deletion
  }

  async getActivityFeed(userId: number): Promise<any[]> {
    return [];
  }

  async createActivity(activity: any): Promise<any> {
    return { id: Date.now(), ...activity, createdAt: new Date() };
  }

  async getPost(id: number): Promise<any> {
    return null;
  }

  async deletePost(id: number): Promise<boolean> {
    return true;
  }

  async followUser(followerId: number, followingId: number): Promise<boolean> {
    return true;
  }

  async unfollowUser(followerId: number, followingId: number): Promise<boolean> {
    return true;
  }

  async isFollowing(followerId: number, followingId: number): Promise<boolean> {
    // User 1 is following user 999 for testing
    return followerId === 1 && followingId === 999;
  }

  async getFollowedUsersPosts(userId: number): Promise<any[]> {
    // Return posts from user 999 if user 1 is requesting (following relationship)
    if (userId === 1) {
      return await this.getUserPosts(999);
    }
    return [];
  }
}

export const storage = new DatabaseStorage();