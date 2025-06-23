import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import authRoutes from "./authRoutes";
import chatRoutes from "./chatRoutes";
import { authenticateToken, optionalAuth, type AuthRequest } from "./auth";
import { CardRecognitionEngine } from "./cardRecognition";
import type { Card, PersonalCard, InsertPersonalCard } from "@shared/schema";
import { db } from "./db";
import { cards, posts, users, personalCards, insertPersonalCardSchema } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.use('/api/auth', authRoutes);
  
  // Chat routes
  app.use('/api/chat', chatRoutes);

  // Get user collections
  app.get("/api/users/:id/collections", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const collections = await storage.getCollectionsByUserId(userId);
      res.json(collections);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get collection details
  app.get("/api/collections/:id", async (req, res) => {
    try {
      const collectionId = parseInt(req.params.id);
      const collection = await storage.getCollection(collectionId);
      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
      }
      res.json(collection);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get cards in collection - load all cards for complete collection view
  app.get("/api/collections/:id/cards", async (req, res) => {
    try {
      const collectionId = parseInt(req.params.id);
      
      console.log(`API: Loading all cards for collection ${collectionId}`);
      const startTime = Date.now();
      
      // Load all cards without pagination to show complete collection
      const cards = await storage.getCardsByCollectionId(collectionId);
      const totalCount = cards.length;
      
      const endTime = Date.now();
      console.log(`API: Loaded ${cards.length} cards in ${endTime - startTime}ms`);
      
      // Return cards in the expected format
      res.json({
        cards,
        pagination: {
          total: totalCount,
          page: 1,
          limit: totalCount,
          hasMore: false
        }
      });
    } catch (error) {
      console.error("Error loading collection cards:", error);
      res.status(500).json({ error: "Failed to load cards" });
    }
  });

  // Get all cards from all collections
  app.get("/api/cards/all", async (req, res) => {
    try {
      const collections = await storage.getCollectionsByUserId(1);
      let allCards: any[] = [];
      
      for (const collection of collections) {
        const cards = await storage.getCardsByCollectionId(collection.id);
        allCards.push(...cards);
      }
      
      res.json(allCards);
    } catch (error) {
      console.error("Error fetching all cards:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get personal cards
  app.get("/api/personal-cards", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const userPersonalCards = await db
        .select()
        .from(personalCards)
        .where(eq(personalCards.userId, userId))
        .orderBy(desc(personalCards.createdAt));
      
      res.json(userPersonalCards);
    } catch (error) {
      console.error("Error fetching personal cards:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Add personal card
  app.post("/api/personal-cards", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const cardData = insertPersonalCardSchema.parse({
        ...req.body,
        userId
      });
      
      const [newCard] = await db
        .insert(personalCards)
        .values(cardData)
        .returning();
      
      res.status(201).json(newCard);
    } catch (error) {
      console.error("Error creating personal card:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get user info
  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const server = createServer(app);
  return server;
}