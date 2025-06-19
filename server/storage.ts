import { users, collections, cards, userCards, conversations, messages, type User, type Collection, type Card, type UserCard, type InsertUser, type InsertCollection, type InsertCard, type InsertUserCard, type Conversation, type Message, type InsertConversation, type InsertMessage } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

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

  // Chat system
  getConversations(userId: number): Promise<Conversation[]>;
  getConversation(user1Id: number, user2Id: number): Promise<Conversation | undefined>;
  createConversation(conversation: InsertConversation): Promise<Conversation>;
  getMessages(conversationId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(conversationId: number, userId: number): Promise<void>;
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
    // First delete all cards in the collection
    await db.delete(cards).where(eq(cards.collectionId, id));
    
    // Then delete the collection
    const result = await db.delete(collections).where(eq(collections.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getCardsByCollectionId(collectionId: number): Promise<Card[]> {
    return await db.select().from(cards).where(eq(cards.collectionId, collectionId));
  }

  async getCard(id: number): Promise<Card | undefined> {
    const [card] = await db.select().from(cards).where(eq(cards.id, id));
    return card || undefined;
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
    return result.rowCount > 0;
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
        tradeOnly: false
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
        tradeOnly: false
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
    for (const user of this.users.values()) {
      if (user.username.toLowerCase() === username.toLowerCase()) {
        return user;
      }
    }
    return undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return undefined;
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
}

export const storage = new DatabaseStorage();