import { users, collections, cards, type User, type InsertUser, type Collection, type InsertCollection, type Card, type InsertCard } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  
  // Collections
  getCollectionsByUserId(userId: number): Promise<Collection[]>;
  getCollection(id: number): Promise<Collection | undefined>;
  createCollection(collection: InsertCollection): Promise<Collection>;
  updateCollection(id: number, updates: Partial<Collection>): Promise<Collection | undefined>;
  
  // Cards
  getCardsByCollectionId(collectionId: number): Promise<Card[]>;
  getCard(id: number): Promise<Card | undefined>;
  createCard(card: InsertCard): Promise<Card>;
  updateCard(id: number, updates: Partial<Card>): Promise<Card | undefined>;
  toggleCardOwnership(id: number): Promise<Card | undefined>;
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

  async toggleCardOwnership(id: number): Promise<Card | undefined> {
    const existingCard = await this.getCard(id);
    if (!existingCard) return undefined;
    
    const [card] = await db
      .update(cards)
      .set({ isOwned: !existingCard.isOwned })
      .where(eq(cards.id, id))
      .returning();
    return card || undefined;
  }
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private collections: Map<number, Collection>;
  private cards: Map<number, Card>;
  private currentUserId: number;
  private currentCollectionId: number;
  private currentCardId: number;

  constructor() {
    this.users = new Map();
    this.collections = new Map();
    this.cards = new Map();
    this.currentUserId = 1;
    this.currentCollectionId = 1;
    this.currentCardId = 1;
    
    // Initialize with mock data
    this.initializeMockData();
  }

  private initializeMockData() {
    // Create sample user
    const user: User = {
      id: 1,
      username: "flo87",
      name: "FLORENT MARTIN",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=150&h=150",
      totalCards: 1450,
      collectionsCount: 4,
      completionPercentage: 71
    };
    this.users.set(1, user);
    this.currentUserId = 2;

    // Create sample collections
    const sampleCollections: Collection[] = [
      {
        id: 1,
        userId: 1,
        name: "SCORE LIGUE 1",
        season: "23/24",
        totalCards: 234,
        ownedCards: 156,
        completionPercentage: 67,
        imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=160",
        backgroundColor: "#F37261"
      },
      {
        id: 2,
        userId: 1,
        name: "IMMACULATE",
        season: "23/24",
        totalCards: 156,
        ownedCards: 70,
        completionPercentage: 45,
        imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=160",
        backgroundColor: "#F37261"
      },
      {
        id: 3,
        userId: 1,
        name: "SCORE LIGUE 1",
        season: "22/23",
        totalCards: 216,
        ownedCards: 145,
        completionPercentage: 67,
        imageUrl: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=160",
        backgroundColor: "#F37261"
      },
      {
        id: 4,
        userId: 1,
        name: "COFFRET 125 ANS OM",
        season: "23/24",
        totalCards: 89,
        ownedCards: 34,
        completionPercentage: 38,
        imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=160",
        backgroundColor: "#00A0E6"
      }
    ];

    sampleCollections.forEach(collection => {
      this.collections.set(collection.id, collection);
    });
    this.currentCollectionId = 5;

    // Create sample cards for Score Ligue 1 collection
    const sampleCards: Card[] = [
      {
        id: 1,
        collectionId: 1,
        cardNumber: "#001",
        playerName: "Mbappé",
        teamName: "Paris Saint-Germain",
        cardType: "base",
        cardSubType: null,
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=160",
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      {
        id: 2,
        collectionId: 1,
        cardNumber: "#002",
        playerName: "Neymar",
        teamName: "Paris Saint-Germain",
        cardType: "base",
        cardSubType: null,
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=160",
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      {
        id: 3,
        collectionId: 1,
        cardNumber: "#003",
        playerName: "Messi",
        teamName: "Paris Saint-Germain",
        cardType: "base",
        cardSubType: null,
        imageUrl: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=160",
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      {
        id: 4,
        collectionId: 1,
        cardNumber: "#004",
        playerName: "Hakimi",
        teamName: "Paris Saint-Germain",
        cardType: "base",
        cardSubType: null,
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      {
        id: 5,
        collectionId: 1,
        cardNumber: "#005",
        playerName: "Ben Yedder",
        teamName: "AS Monaco",
        cardType: "base",
        cardSubType: null,
        imageUrl: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=160",
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      {
        id: 6,
        collectionId: 1,
        cardNumber: "#006",
        playerName: "Payet",
        teamName: "Olympique de Marseille",
        cardType: "base",
        cardSubType: null,
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      }
    ];

    sampleCards.forEach(card => {
      this.cards.set(card.id, card);
    });
    this.currentCardId = 7;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      totalCards: 0, 
      collectionsCount: 0, 
      completionPercentage: 0 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Collection methods
  async getCollectionsByUserId(userId: number): Promise<Collection[]> {
    return Array.from(this.collections.values()).filter(collection => collection.userId === userId);
  }

  async getCollection(id: number): Promise<Collection | undefined> {
    return this.collections.get(id);
  }

  async createCollection(insertCollection: InsertCollection): Promise<Collection> {
    const id = this.currentCollectionId++;
    const collection: Collection = { 
      ...insertCollection, 
      id, 
      ownedCards: 0, 
      completionPercentage: 0 
    };
    this.collections.set(id, collection);
    return collection;
  }

  async updateCollection(id: number, updates: Partial<Collection>): Promise<Collection | undefined> {
    const collection = this.collections.get(id);
    if (!collection) return undefined;
    
    const updatedCollection = { ...collection, ...updates };
    this.collections.set(id, updatedCollection);
    return updatedCollection;
  }

  // Card methods
  async getCardsByCollectionId(collectionId: number): Promise<Card[]> {
    return Array.from(this.cards.values()).filter(card => card.collectionId === collectionId);
  }

  async getCard(id: number): Promise<Card | undefined> {
    return this.cards.get(id);
  }

  async createCard(insertCard: InsertCard): Promise<Card> {
    const id = this.currentCardId++;
    const card: Card = { ...insertCard, id };
    this.cards.set(id, card);
    return card;
  }

  async updateCard(id: number, updates: Partial<Card>): Promise<Card | undefined> {
    const card = this.cards.get(id);
    if (!card) return undefined;
    
    const updatedCard = { ...card, ...updates };
    this.cards.set(id, updatedCard);
    return updatedCard;
  }

  async toggleCardOwnership(id: number): Promise<Card | undefined> {
    const card = this.cards.get(id);
    if (!card) return undefined;
    
    const updatedCard = { ...card, isOwned: !card.isOwned };
    this.cards.set(id, updatedCard);
    return updatedCard;
  }
}

export const storage = new DatabaseStorage();
