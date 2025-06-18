import { users, collections, cards, userCards, type User, type InsertUser, type Collection, type InsertCollection, type Card, type InsertCard, type UserCard, type InsertUserCard } from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

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
  
  // User Cards
  getUserCardsByUserId(userId: number): Promise<UserCard[]>;
  getUserCardsByCollectionId(collectionId: number, userId: number): Promise<UserCard[]>;
  getUserCard(id: number): Promise<UserCard | undefined>;
  createUserCard(userCard: InsertUserCard): Promise<UserCard>;
  updateUserCard(id: number, updates: Partial<UserCard>): Promise<UserCard | undefined>;
  deleteUserCard(id: number): Promise<boolean>;
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

  // User Cards methods
  async getUserCardsByUserId(userId: number): Promise<UserCard[]> {
    return await db.select().from(userCards).where(eq(userCards.userId, userId));
  }

  async getUserCardsByCollectionId(collectionId: number, userId: number): Promise<UserCard[]> {
    return await db.select().from(userCards)
      .where(eq(userCards.collectionId, collectionId));
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
      avatar: null,
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
        totalCards: 133,
        ownedCards: 53,
        completionPercentage: 40,
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
        name: "Set 125 ans OM",
        season: "22/23",
        totalCards: 89,
        ownedCards: 82,
        completionPercentage: 92,
        imageUrl: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=160",
        backgroundColor: "#87CEEB"
      },
      {
        id: 4,
        userId: 1,
        name: "QUI ES-TU?",
        season: "23/24",
        totalCards: 312,
        ownedCards: 87,
        completionPercentage: 28,
        imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=160",
        backgroundColor: "#F37261"
      }
    ];

    sampleCollections.forEach(collection => {
      this.collections.set(collection.id, collection);
    });
    this.currentCollectionId = 5;

    // Create sample cards for Score Ligue 1 23/24 collection
    const sampleCards: Card[] = [
      // Paris Saint-Germain
      {
        id: 1,
        collectionId: 1,
        cardNumber: "#001",
        playerName: "Mbappé",
        teamName: "Paris Saint-Germain",
        cardType: "Base",
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
        playerName: "Hakimi",
        teamName: "Paris Saint-Germain",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      {
        id: 3,
        collectionId: 1,
        cardNumber: "#003",
        playerName: "Marquinhos",
        teamName: "Paris Saint-Germain",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      {
        id: 4,
        collectionId: 1,
        cardNumber: "#004",
        playerName: "Verratti",
        teamName: "Paris Saint-Germain",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      {
        id: 5,
        collectionId: 1,
        cardNumber: "#005",
        playerName: "Donnarumma",
        teamName: "Paris Saint-Germain",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      {
        id: 6,
        collectionId: 1,
        cardNumber: "#006",
        playerName: "Vitinha",
        teamName: "Paris Saint-Germain",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      {
        id: 7,
        collectionId: 1,
        cardNumber: "#007",
        playerName: "Ruiz",
        teamName: "Paris Saint-Germain",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      {
        id: 8,
        collectionId: 1,
        cardNumber: "#008",
        playerName: "Zaire-Emery",
        teamName: "Paris Saint-Germain",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      {
        id: 9,
        collectionId: 1,
        cardNumber: "#009",
        playerName: "Dembélé",
        teamName: "Paris Saint-Germain",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      {
        id: 10,
        collectionId: 1,
        cardNumber: "#010",
        playerName: "Barcola",
        teamName: "Paris Saint-Germain",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      // AS Monaco
      {
        id: 11,
        collectionId: 1,
        cardNumber: "#011",
        playerName: "Ben Yedder",
        teamName: "AS Monaco",
        cardType: "Base",
        cardSubType: null,
        imageUrl: "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=160",
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      {
        id: 12,
        collectionId: 1,
        cardNumber: "#012",
        playerName: "Golovin",
        teamName: "AS Monaco",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      {
        id: 13,
        collectionId: 1,
        cardNumber: "#013",
        playerName: "Minamino",
        teamName: "AS Monaco",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      {
        id: 14,
        collectionId: 1,
        cardNumber: "#014",
        playerName: "Embolo",
        teamName: "AS Monaco",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      {
        id: 15,
        collectionId: 1,
        cardNumber: "#015",
        playerName: "Diatta",
        teamName: "AS Monaco",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      // Olympique de Marseille
      {
        id: 16,
        collectionId: 1,
        cardNumber: "#016",
        playerName: "Payet",
        teamName: "Olympique de Marseille",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      {
        id: 17,
        collectionId: 1,
        cardNumber: "#017",
        playerName: "Aubameyang",
        teamName: "Olympique de Marseille",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      {
        id: 18,
        collectionId: 1,
        cardNumber: "#018",
        playerName: "Guendouzi",
        teamName: "Olympique de Marseille",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      {
        id: 19,
        collectionId: 1,
        cardNumber: "#019",
        playerName: "Veretout",
        teamName: "Olympique de Marseille",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      {
        id: 20,
        collectionId: 1,
        cardNumber: "#020",
        playerName: "López",
        teamName: "Olympique de Marseille",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      // Olympique Lyonnais
      {
        id: 21,
        collectionId: 1,
        cardNumber: "#021",
        playerName: "Lacazette",
        teamName: "Olympique Lyonnais",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      {
        id: 22,
        collectionId: 1,
        cardNumber: "#022",
        playerName: "Cherki",
        teamName: "Olympique Lyonnais",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      {
        id: 23,
        collectionId: 1,
        cardNumber: "#023",
        playerName: "Tolisso",
        teamName: "Olympique Lyonnais",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      {
        id: 24,
        collectionId: 1,
        cardNumber: "#024",
        playerName: "Tagliafico",
        teamName: "Olympique Lyonnais",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      {
        id: 25,
        collectionId: 1,
        cardNumber: "#025",
        playerName: "Lopes",
        teamName: "Olympique Lyonnais",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      // RC Lens
      {
        id: 26,
        collectionId: 1,
        cardNumber: "#026",
        playerName: "Openda",
        teamName: "RC Lens",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      {
        id: 27,
        collectionId: 1,
        cardNumber: "#027",
        playerName: "Fulgini",
        teamName: "RC Lens",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      {
        id: 28,
        collectionId: 1,
        cardNumber: "#028",
        playerName: "Frankowski",
        teamName: "RC Lens",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      {
        id: 29,
        collectionId: 1,
        cardNumber: "#029",
        playerName: "Danso",
        teamName: "RC Lens",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      {
        id: 30,
        collectionId: 1,
        cardNumber: "#030",
        playerName: "Seko Fofana",
        teamName: "RC Lens",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      // Stade Rennais
      {
        id: 31,
        collectionId: 1,
        cardNumber: "#031",
        playerName: "Terrier",
        teamName: "Stade Rennais",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      {
        id: 32,
        collectionId: 1,
        cardNumber: "#032",
        playerName: "Bourigeaud",
        teamName: "Stade Rennais",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      {
        id: 33,
        collectionId: 1,
        cardNumber: "#033",
        playerName: "Désiré Doué",
        teamName: "Stade Rennais",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      {
        id: 34,
        collectionId: 1,
        cardNumber: "#034",
        playerName: "Kalimuendo",
        teamName: "Stade Rennais",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      {
        id: 35,
        collectionId: 1,
        cardNumber: "#035",
        playerName: "Mandanda",
        teamName: "Stade Rennais",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      // LOSC Lille
      {
        id: 36,
        collectionId: 1,
        cardNumber: "#036",
        playerName: "David",
        teamName: "LOSC Lille",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      {
        id: 37,
        collectionId: 1,
        cardNumber: "#037",
        playerName: "Cabella",
        teamName: "LOSC Lille",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      {
        id: 38,
        collectionId: 1,
        cardNumber: "#038",
        playerName: "Gomes",
        teamName: "LOSC Lille",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      {
        id: 39,
        collectionId: 1,
        cardNumber: "#039",
        playerName: "Zhegrova",
        teamName: "LOSC Lille",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      {
        id: 40,
        collectionId: 1,
        cardNumber: "#040",
        playerName: "André",
        teamName: "LOSC Lille",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      // OGC Nice
      {
        id: 41,
        collectionId: 1,
        cardNumber: "#041",
        playerName: "Laborde",
        teamName: "OGC Nice",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      {
        id: 42,
        collectionId: 1,
        cardNumber: "#042",
        playerName: "Diop",
        teamName: "OGC Nice",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      {
        id: 43,
        collectionId: 1,
        cardNumber: "#043",
        playerName: "Beka Beka",
        teamName: "OGC Nice",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      {
        id: 44,
        collectionId: 1,
        cardNumber: "#044",
        playerName: "Clauss",
        teamName: "OGC Nice",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      {
        id: 45,
        collectionId: 1,
        cardNumber: "#045",
        playerName: "Schmeichel",
        teamName: "OGC Nice",
        cardType: "Base",
        cardSubType: null,
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "common",
        serialNumber: null
      },
      // Autographs and Special Cards
      {
        id: 101,
        collectionId: 1,
        cardNumber: "#A01",
        playerName: "Mbappé",
        teamName: "Paris Saint-Germain",
        cardType: "Autograph",
        cardSubType: "signature",
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=160",
        isOwned: true,
        isRookieCard: false,
        rarity: "super_rare",
        serialNumber: "1/1"
      },
      {
        id: 102,
        collectionId: 1,
        cardNumber: "#A02",
        playerName: "Messi",
        teamName: "Paris Saint-Germain",
        cardType: "Autograph",
        cardSubType: "signature",
        imageUrl: "https://images.unsplash.com/photo-1522778119026-d647f0596c20?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=160",
        isOwned: false,
        isRookieCard: false,
        rarity: "super_rare",
        serialNumber: "/1"
      },
      // Add more 1/1 Special Cards
      {
        id: 103,
        collectionId: 1,
        cardNumber: "#S01",
        playerName: "Hakimi",
        teamName: "Paris Saint-Germain",
        cardType: "Special",
        cardSubType: "1/1_gold",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "super_rare",
        serialNumber: "1/1"
      },
      {
        id: 104,
        collectionId: 1,
        cardNumber: "#S02",
        playerName: "Ben Yedder",
        teamName: "AS Monaco",
        cardType: "Special",
        cardSubType: "1/1_platinum",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "super_rare",
        serialNumber: "1/1"
      },
      {
        id: 105,
        collectionId: 1,
        cardNumber: "#S03",
        playerName: "Lacazette",
        teamName: "Olympique Lyonnais",
        cardType: "Special",
        cardSubType: "1/1_diamond",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "super_rare",
        serialNumber: "1/1"
      },
      {
        id: 106,
        collectionId: 1,
        cardNumber: "#S04",
        playerName: "Terrier",
        teamName: "Stade Rennais",
        cardType: "Special",
        cardSubType: "1/1_emerald",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "super_rare",
        serialNumber: "1/1"
      },
      {
        id: 107,
        collectionId: 1,
        cardNumber: "#S05",
        playerName: "David",
        teamName: "LOSC Lille",
        cardType: "Special",
        cardSubType: "1/1_ruby",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "super_rare",
        serialNumber: "1/1"
      },
      // Numbered Cards (Base numbered - sorted by rarity: /50, /35, /30, /25, /20, /15 swirl, /15 laser, /10 gold, /5)
      // /50 parallel
      {
        id: 108,
        collectionId: 1,
        cardNumber: "#001",
        playerName: "Mbappé",
        teamName: "Paris Saint-Germain",
        cardType: "Numbered",
        cardSubType: "parallel",
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=120&h=160",
        isOwned: false,
        isRookieCard: false,
        rarity: "rare",
        serialNumber: "15/50"
      },
      {
        id: 109,
        collectionId: 1,
        cardNumber: "#002",
        playerName: "Hakimi",
        teamName: "Paris Saint-Germain",
        cardType: "Numbered",
        cardSubType: "parallel",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "rare",
        serialNumber: "25/50"
      },
      {
        id: 110,
        collectionId: 1,
        cardNumber: "#003",
        playerName: "Marquinhos",
        teamName: "Paris Saint-Germain",
        cardType: "Numbered",
        cardSubType: "parallel",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "rare",
        serialNumber: "33/50"
      },
      // /35 parallel
      {
        id: 111,
        collectionId: 1,
        cardNumber: "#005",
        playerName: "Ben Yedder",
        teamName: "AS Monaco",
        cardType: "Numbered",
        cardSubType: "parallel",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "rare",
        serialNumber: "12/35"
      },
      {
        id: 112,
        collectionId: 1,
        cardNumber: "#006",
        playerName: "Wahi",
        teamName: "AS Monaco",
        cardType: "Numbered",
        cardSubType: "parallel",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "rare",
        serialNumber: "18/35"
      },
      // /30 parallel
      {
        id: 150,
        collectionId: 1,
        cardNumber: "#015",
        playerName: "Lacazette",
        teamName: "Olympique Lyonnais",
        cardType: "Numbered",
        cardSubType: "parallel",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "rare",
        serialNumber: "07/30"
      },
      {
        id: 151,
        collectionId: 1,
        cardNumber: "#018",
        playerName: "Terrier",
        teamName: "Stade Rennais",
        cardType: "Numbered",
        cardSubType: "parallel",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "rare",
        serialNumber: "14/30"
      },
      // /25 parallel
      {
        id: 152,
        collectionId: 1,
        cardNumber: "#025",
        playerName: "David",
        teamName: "LOSC Lille",
        cardType: "Numbered",
        cardSubType: "parallel",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "rare",
        serialNumber: "09/25"
      },
      {
        id: 153,
        collectionId: 1,
        cardNumber: "#027",
        playerName: "Fulgini",
        teamName: "RC Lens",
        cardType: "Numbered",
        cardSubType: "parallel",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "rare",
        serialNumber: "20/25"
      },
      // /20 parallel
      {
        id: 154,
        collectionId: 1,
        cardNumber: "#030",
        playerName: "Seko Fofana",
        teamName: "RC Lens",
        cardType: "Numbered",
        cardSubType: "parallel",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "super_rare",
        serialNumber: "11/20"
      },
      {
        id: 155,
        collectionId: 1,
        cardNumber: "#035",
        playerName: "Zhegrova",
        teamName: "LOSC Lille",
        cardType: "Numbered",
        cardSubType: "parallel",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "super_rare",
        serialNumber: "08/20"
      },
      // /15 swirl
      {
        id: 156,
        collectionId: 1,
        cardNumber: "#001",
        playerName: "Mbappé",
        teamName: "Paris Saint-Germain",
        cardType: "Numbered",
        cardSubType: "swirl",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "super_rare",
        serialNumber: "05/15"
      },
      {
        id: 157,
        collectionId: 1,
        cardNumber: "#011",
        playerName: "Ben Yedder",
        teamName: "AS Monaco",
        cardType: "Numbered",
        cardSubType: "swirl",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "super_rare",
        serialNumber: "12/15"
      },
      // /15 laser
      {
        id: 158,
        collectionId: 1,
        cardNumber: "#002",
        playerName: "Hakimi",
        teamName: "Paris Saint-Germain",
        cardType: "Numbered",
        cardSubType: "laser",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "super_rare",
        serialNumber: "03/15"
      },
      {
        id: 159,
        collectionId: 1,
        cardNumber: "#015",
        playerName: "Lacazette",
        teamName: "Olympique Lyonnais",
        cardType: "Numbered",
        cardSubType: "laser",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "super_rare",
        serialNumber: "09/15"
      },
      // /10 gold
      {
        id: 160,
        collectionId: 1,
        cardNumber: "#001",
        playerName: "Mbappé",
        teamName: "Paris Saint-Germain",
        cardType: "Numbered",
        cardSubType: "gold",
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "ultra_rare",
        serialNumber: "02/10"
      },
      {
        id: 161,
        collectionId: 1,
        cardNumber: "#005",
        playerName: "Ben Yedder",
        teamName: "AS Monaco",
        cardType: "Numbered",
        cardSubType: "gold",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "ultra_rare",
        serialNumber: "07/10"
      },
      // /5 platinum
      {
        id: 162,
        collectionId: 1,
        cardNumber: "#001",
        playerName: "Mbappé",
        teamName: "Paris Saint-Germain",
        cardType: "Numbered",
        cardSubType: "platinum",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "ultra_rare",
        serialNumber: "01/5"
      },
      {
        id: 163,
        collectionId: 1,
        cardNumber: "#011",
        playerName: "Ben Yedder",
        teamName: "AS Monaco",
        cardType: "Numbered",
        cardSubType: "platinum",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "ultra_rare",
        serialNumber: "03/5"
      },
      // More Autographs (Pure autographs - no numbering)
      {
        id: 113,
        collectionId: 1,
        cardNumber: "#A03",
        playerName: "Lacazette",
        teamName: "Olympique Lyonnais",
        cardType: "Autograph",
        cardSubType: "signature",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "super_rare",
        serialNumber: null
      },
      {
        id: 114,
        collectionId: 1,
        cardNumber: "#A04",
        playerName: "Ben Yedder",
        teamName: "AS Monaco",
        cardType: "Autograph",
        cardSubType: "signature",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "super_rare",
        serialNumber: null
      },
      {
        id: 115,
        collectionId: 1,
        cardNumber: "#A05",
        playerName: "Terrier",
        teamName: "Stade Rennais",
        cardType: "Autograph",
        cardSubType: "signature",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "super_rare",
        serialNumber: null
      },
      {
        id: 116,
        collectionId: 1,
        cardNumber: "#A06",
        playerName: "David",
        teamName: "LOSC Lille",
        cardType: "Autograph",
        cardSubType: "signature",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "super_rare",
        serialNumber: null
      },
      {
        id: 117,
        collectionId: 1,
        cardNumber: "#A07",
        playerName: "Laborde",
        teamName: "OGC Nice",
        cardType: "Autograph",
        cardSubType: "signature",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "super_rare",
        serialNumber: null
      },
      {
        id: 118,
        collectionId: 1,
        cardNumber: "#A08",
        playerName: "Fulgini",
        teamName: "RC Lens",
        cardType: "Autograph",
        cardSubType: "signature",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "super_rare",
        serialNumber: null
      },
      {
        id: 119,
        collectionId: 1,
        cardNumber: "#A09",
        playerName: "Frankowski",
        teamName: "RC Lens",
        cardType: "Autograph",
        cardSubType: "signature",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "super_rare",
        serialNumber: null
      },
      {
        id: 120,
        collectionId: 1,
        cardNumber: "#A10",
        playerName: "Clauss",
        teamName: "OGC Nice",
        cardType: "Autograph",
        cardSubType: "signature",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "super_rare",
        serialNumber: null
      },
      // Hit Cards (Score Team, Keepers, Hot Rookies, Pure Class, Breakthrough, Pennants, Intergalactic, Next Up)
      // Score Team (/10)
      {
        id: 200,
        collectionId: 1,
        cardNumber: "#ST01",
        playerName: "Mbappé",
        teamName: "Paris Saint-Germain",
        cardType: "Hit",
        cardSubType: "Score Team",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "ultra_rare",
        serialNumber: "3/10"
      },
      {
        id: 201,
        collectionId: 1,
        cardNumber: "#ST02",
        playerName: "Ben Yedder",
        teamName: "AS Monaco",
        cardType: "Hit",
        cardSubType: "Score Team",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "ultra_rare",
        serialNumber: "7/10"
      },
      // Keepers (/15)
      {
        id: 202,
        collectionId: 1,
        cardNumber: "#K01",
        playerName: "Donnarumma",
        teamName: "Paris Saint-Germain",
        cardType: "Hit",
        cardSubType: "Keepers",
        imageUrl: null,
        isOwned: true,
        isRookieCard: false,
        rarity: "ultra_rare",
        serialNumber: "8/15"
      },
      {
        id: 203,
        collectionId: 1,
        cardNumber: "#K02",
        playerName: "Köhn",
        teamName: "AS Monaco",
        cardType: "Hit",
        cardSubType: "Keepers",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "ultra_rare",
        serialNumber: "12/15"
      },
      // Hot Rookies (/15)
      {
        id: 204,
        collectionId: 1,
        cardNumber: "#HR01",
        playerName: "Zaire-Emery",
        teamName: "Paris Saint-Germain",
        cardType: "Hit",
        cardSubType: "Hot Rookies",
        imageUrl: null,
        isOwned: false,
        isRookieCard: true,
        rarity: "ultra_rare",
        serialNumber: "5/15"
      },
      {
        id: 205,
        collectionId: 1,
        cardNumber: "#HR02",
        playerName: "Wahi",
        teamName: "AS Monaco",
        cardType: "Hit",
        cardSubType: "Hot Rookies",
        imageUrl: null,
        isOwned: false,
        isRookieCard: true,
        rarity: "ultra_rare",
        serialNumber: "11/15"
      },
      // Pure Class (/10)
      {
        id: 206,
        collectionId: 1,
        cardNumber: "#PC01",
        playerName: "Mbappé",
        teamName: "Paris Saint-Germain",
        cardType: "Hit",
        cardSubType: "Pure Class",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "ultra_rare",
        serialNumber: "2/10"
      },
      {
        id: 207,
        collectionId: 1,
        cardNumber: "#PC02",
        playerName: "Lacazette",
        teamName: "Olympique Lyonnais",
        cardType: "Hit",
        cardSubType: "Pure Class",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "ultra_rare",
        serialNumber: "9/10"
      },
      // Breakthrough (/15)
      {
        id: 208,
        collectionId: 1,
        cardNumber: "#BT01",
        playerName: "Terrier",
        teamName: "Stade Rennais",
        cardType: "Hit",
        cardSubType: "Breakthrough",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "ultra_rare",
        serialNumber: "4/15"
      },
      {
        id: 209,
        collectionId: 1,
        cardNumber: "#BT02",
        playerName: "David",
        teamName: "LOSC Lille",
        cardType: "Hit",
        cardSubType: "Breakthrough",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "ultra_rare",
        serialNumber: "13/15"
      },
      // Pennants (non numérotées)
      {
        id: 210,
        collectionId: 1,
        cardNumber: "#P01",
        playerName: "Hakimi",
        teamName: "Paris Saint-Germain",
        cardType: "Hit",
        cardSubType: "Pennants",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "ultra_rare",
        serialNumber: null
      },
      {
        id: 211,
        collectionId: 1,
        cardNumber: "#P02",
        playerName: "Fulgini",
        teamName: "RC Lens",
        cardType: "Hit",
        cardSubType: "Pennants",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "ultra_rare",
        serialNumber: null
      },
      // Intergalactic (non numérotées)
      {
        id: 212,
        collectionId: 1,
        cardNumber: "#IG01",
        playerName: "Marquinhos",
        teamName: "Paris Saint-Germain",
        cardType: "Hit",
        cardSubType: "Intergalactic",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "ultra_rare",
        serialNumber: null
      },
      {
        id: 213,
        collectionId: 1,
        cardNumber: "#IG02",
        playerName: "Zhegrova",
        teamName: "LOSC Lille",
        cardType: "Hit",
        cardSubType: "Intergalactic",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "ultra_rare",
        serialNumber: null
      },
      // Next Up (non numérotées)
      {
        id: 214,
        collectionId: 1,
        cardNumber: "#NU01",
        playerName: "Barcola",
        teamName: "Paris Saint-Germain",
        cardType: "Hit",
        cardSubType: "Next Up",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "ultra_rare",
        serialNumber: null
      },
      {
        id: 215,
        collectionId: 1,
        cardNumber: "#NU02",
        playerName: "Laborde",
        teamName: "OGC Nice",
        cardType: "Hit",
        cardSubType: "Next Up",
        imageUrl: null,
        isOwned: false,
        isRookieCard: false,
        rarity: "ultra_rare",
        serialNumber: null
      }
    ];

    sampleCards.forEach(card => {
      this.cards.set(card.id, card);
    });
    this.currentCardId = 12;
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
    return Array.from(this.collections.values())
      .filter(collection => collection.userId === userId)
      .sort((a, b) => a.id - b.id);
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

  // User Cards methods (not implemented in memory storage)
  async getUserCardsByUserId(userId: number): Promise<UserCard[]> {
    return [];
  }

  async getUserCardsByCollectionId(collectionId: number, userId: number): Promise<UserCard[]> {
    return [];
  }

  async getUserCard(id: number): Promise<UserCard | undefined> {
    return undefined;
  }

  async createUserCard(userCard: InsertUserCard): Promise<UserCard> {
    throw new Error("User cards not supported in memory storage");
  }

  async updateUserCard(id: number, updates: Partial<UserCard>): Promise<UserCard | undefined> {
    return undefined;
  }

  async deleteUserCard(id: number): Promise<boolean> {
    return false;
  }
}

export const storage = new DatabaseStorage();
