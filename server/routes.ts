import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import authRoutes from "./authRoutes";
import chatRoutes from "./chatRoutes";
import { authenticateToken, optionalAuth, type AuthRequest } from "./auth";
import { CardRecognitionEngine } from "./cardRecognition";
// import { performHealthCheck } from "./healthcheck";
import type { Card, PersonalCard, InsertPersonalCard } from "@shared/schema";
import { db } from "./db";
import { cards, posts, users, personalCards, insertPersonalCardSchema } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

// Initialize sample data in database
const initializeSampleData = async () => {
  try {
    // Check if conversation already exists
    const existingConv = await storage.getConversation(1, 999);
    if (!existingConv) {
      // Create sample conversation
      const conversation = await storage.createConversation({
        user1Id: 1,
        user2Id: 999
      });
      
      // Create sample messages
      await storage.createMessage({
        conversationId: conversation.id,
        senderId: 999,
        content: "Salut ! J'ai vu ta collection, elle est impressionnante !"
      });
      
      await storage.createMessage({
        conversationId: conversation.id,
        senderId: 999,
        content: "Tu as des cartes rares que j'aimerais bien avoir dans ma collection"
      });
    }
  } catch (error) {
    console.log("Sample data initialization skipped:", (error as Error).message);
  }
};

// Initialize on startup
initializeSampleData();

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.use('/api/auth', authRoutes);
  
  // Routes pour les cartes personnelles (Mes cartes)
  app.get("/api/personal-cards", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const personalCards = await storage.getPersonalCardsByUserId(userId);
      res.json(personalCards);
    } catch (error) {
      console.error("Error fetching personal cards:", error);
      res.status(500).json({ error: "Failed to fetch personal cards" });
    }
  });

  app.post("/api/personal-cards", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      
      // Valider les données avec le schéma Zod
      const validatedData = insertPersonalCardSchema.parse({
        ...req.body,
        userId
      });

      const personalCard = await storage.createPersonalCard(validatedData);
      res.status(201).json(personalCard);
    } catch (error) {
      console.error("Error creating personal card:", error);
      res.status(500).json({ error: "Failed to create personal card" });
    }
  });

  app.delete("/api/personal-cards/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const personalCardId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      console.log(`DELETE /api/personal-cards/${personalCardId} called by user ${userId}`);
      
      if (isNaN(personalCardId)) {
        return res.status(400).json({ error: "Invalid personal card ID" });
      }

      // Vérifier que la carte personnelle appartient à l'utilisateur
      const personalCard = await storage.getPersonalCard(personalCardId);
      if (!personalCard) {
        console.log(`Personal card ${personalCardId} not found`);
        return res.status(404).json({ error: "Personal card not found" });
      }

      if (personalCard.userId !== userId) {
        console.log(`Personal card ${personalCardId} does not belong to user ${userId}`);
        return res.status(403).json({ error: "You don't own this card" });
      }

      console.log(`Found personal card: ${personalCard.playerName} (User: ${personalCard.userId})`);

      const deleted = await storage.deletePersonalCard(personalCardId);
      console.log(`Personal card deletion result: ${deleted}`);
      
      if (deleted) {
        res.json({ success: true, deletedCardId: personalCardId });
      } else {
        res.status(500).json({ error: "Failed to delete personal card" });
      }
    } catch (error) {
      console.error("Error deleting personal card:", error);
      res.status(500).json({ error: "Failed to delete personal card" });
    }
  });

  // Chat routes (commented out to avoid conflicts)
  // app.use('/api/chat', chatRoutes);

  // Get conversation between two users
  app.get("/api/chat/conversations/user/:userId", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const currentUserId = req.user?.id || 1;
      const otherUserId = parseInt(req.params.userId);
      
      const conversation = await storage.getConversation(currentUserId, otherUserId);
      res.json(conversation);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });



  // Production test endpoint for collection 23/24
  app.get("/api/test-collection/:id", async (req, res) => {
    try {
      const collectionId = parseInt(req.params.id);
      console.log(`🧪 Testing collection ${collectionId} load performance`);
      
      const startTime = Date.now();
      
      // Test with progressive limits
      const limits = [100, 500, 1000, 2000];
      const results = [];
      
      for (const limit of limits) {
        const testStart = Date.now();
        try {
          const testCards = await storage.getCardsByCollectionId(collectionId);
          
          const testTime = Date.now() - testStart;
          results.push({
            limit,
            count: testCards.length,
            timeMs: testTime,
            status: 'success'
          });
          
          // Stop if we're taking too long
          if (testTime > 15000) break;
          
        } catch (error) {
          results.push({
            limit,
            count: 0,
            timeMs: Date.now() - testStart,
            status: 'error',
            error: error instanceof Error ? error.message : String(error)
          });
          break;
        }
      }
      
      const totalTime = Date.now() - startTime;
      
      res.json({
        collectionId,
        environment: process.env.NODE_ENV || 'unknown',
        database: process.env.DATABASE_URL ? 'configured' : 'missing',
        totalTestTimeMs: totalTime,
        progressiveTests: results,
        recommendation: results.length > 0 ? 
          `Use limit of ${results.find(r => r.status === 'success' && r.timeMs < 10000)?.limit || 100}` :
          'Database connection issues'
      });
      
    } catch (error) {
      console.error("Test endpoint error:", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : String(error),
        collectionId: parseInt(req.params.id),
        environment: process.env.NODE_ENV || 'unknown'
      });
    }
  });

  // Simple diagnostic endpoint
  app.get("/api/diagnostic", async (req, res) => {
    try {
      const startTime = Date.now();
      
      // Test database connection
      const collections = await storage.getCollectionsByUserId(1);
      const dbTime = Date.now() - startTime;
      
      // Test specific collection
      let collectionTest = null;
      if (collections.length > 0) {
        const testCollection = collections.find(c => c.id === 23) || collections[0];
        const testStart = Date.now();
        const testCards = await storage.getCardsByCollectionId(testCollection.id);
        const testTime = Date.now() - testStart;
        
        collectionTest = {
          collectionId: testCollection.id,
          collectionName: testCollection.name,
          cardsCount: testCards.length,
          loadTimeMs: testTime
        };
      }
      
      res.json({
        status: "ok",
        environment: process.env.NODE_ENV || "unknown",
        databaseConnection: dbTime < 5000 ? "good" : "slow",
        collectionsFound: collections.length,
        dbLoadTimeMs: dbTime,
        collectionTest,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      res.status(500).json({
        status: "error",
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString()
      });
    }
  });

  // Search all users
  // Card recognition endpoint
  app.post("/api/recognize-card", async (req, res) => {
    try {
      const { imageData, availableCards } = req.body;
      
      if (!imageData || !availableCards) {
        return res.status(400).json({ error: "Image data and available cards required" });
      }

      // Import the recognition engine
      const { CardRecognitionEngine } = await import('./cardRecognition');
      const recognitionEngine = new CardRecognitionEngine(availableCards);
      
      // Perform recognition
      const result = recognitionEngine.recognizeCard(imageData);
      
      res.json({
        playerName: result.playerName,
        teamName: result.teamName,
        confidence: result.confidence,
        matchedCard: result.matchedCard
      });
    } catch (error) {
      console.error("Card recognition error:", error);
      res.status(500).json({ error: "Recognition failed" });
    }
  });

  app.get("/api/users/search", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const users = await storage.getAllUsers();
      const publicUsers = users.map(user => ({
        id: user.id,
        username: user.username,
        name: user.name,
        avatar: user.avatar,
        bio: user.bio,
        totalCards: user.totalCards,
        collectionsCount: user.collectionsCount,
        completionPercentage: user.completionPercentage
      }));
      res.json(publicUsers);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get posts from followed users (À la une) - MUST be before /:id routes
  app.get("/api/users/feed", (req, res) => {
    // Only return posts from other users (not the current user)
    res.json([
      {
        id: 17,
        userId: 2,
        content: "Qui a la carte Ronaldo Juventus rare ? Je propose un trade avec ma Messi Barcelona dorée ✨",
        type: "text", 
        cardId: null,
        isVisible: true,
        createdAt: "2024-06-22T14:15:00Z",
        updatedAt: "2024-06-22T14:15:00Z",
        user: {
          id: 2,
          name: "Max C.",
          username: "maxcollector",
          avatar: null
        }
      },
      {
        id: 16,
        userId: 999,
        content: "🔥 EXCLUSIF ! Je vends ma carte Mbappé PSG autographée ! Prix spécial pour les vrais collectionneurs. Première offre sérieuse 💎⚽",
        type: "text", 
        cardId: null,
        isVisible: true,
        createdAt: "2024-06-22T12:30:00Z",
        updatedAt: "2024-06-22T12:30:00Z",
        user: {
          id: 999,
          name: "Max la menace",
          username: "maxlamenace",
          avatar: null
        }
      },
      {
        id: 14,
        userId: 2,
        content: "Nouvelle collection SCORE 2023/24 disponible ! 🔥",
        type: "text", 
        cardId: null,
        isVisible: true,
        createdAt: "2024-06-19T15:45:00Z",
        updatedAt: "2024-06-19T15:45:00Z",
        user: {
          id: 2,
          name: "Max C.",
          username: "maxcollector",
          avatar: null
        }
      },
      {
        id: 15,
        userId: 999,
        content: "Échange possible contre une carte Haaland ! Contactez-moi en MP 📩",
        type: "text", 
        cardId: null,
        isVisible: true,
        createdAt: "2024-06-18T14:22:00Z",
        updatedAt: "2024-06-18T14:22:00Z",
        user: {
          id: 999,
          name: "Max la menace",
          username: "maxlamenace",
          avatar: null
        }
      }
    ]);
  });

  // Get user profile
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

  // Update user profile
  app.put("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const updates = req.body;
      
      // Don't allow updating sensitive fields
      delete updates.id;
      delete updates.password;
      
      const updatedUser = await storage.updateUser(userId, updates);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

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

  // Delete a collection
  app.delete("/api/collections/:id", async (req, res) => {
    try {
      const collectionId = parseInt(req.params.id);
      
      // Prevent deletion of the default Score Ligue 1 collection
      if (collectionId === 1) {
        return res.status(403).json({ message: "Cannot delete the default collection" });
      }
      
      const collection = await storage.getCollection(collectionId);
      if (!collection) {
        return res.status(404).json({ message: "Collection not found" });
      }
      
      // Check if it's the Score Ligue 1 collection by name
      if (collection.name?.includes("SCORE LIGUE 1")) {
        return res.status(403).json({ message: "Cannot delete the Score Ligue 1 collection" });
      }
      
      const success = await storage.deleteCollection(collectionId);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete collection" });
      }
      
      res.json({ message: "Collection deleted successfully" });
    } catch (error) {
      console.error("Error deleting collection:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get cards in collection with pagination for production
  app.get("/api/collections/:id/cards", async (req, res) => {
    try {
      const collectionId = parseInt(req.params.id);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || (process.env.NODE_ENV === 'production' ? 500 : 2000);
      const offset = (page - 1) * limit;
      
      console.log(`API: Loading collection ${collectionId}, page ${page}, limit ${limit}`);
      const startTime = Date.now();
      
      // For pagination, we need to modify the storage method or create a new one
      let cards: Card[];
      let totalCount = 0;
      
      if (page === 1 && !req.query.page) {
        // First load - get all cards with optimized limit
        cards = await storage.getCardsByCollectionId(collectionId);
        totalCount = cards.length;
      } else {
        // Paginated load - we'll implement this differently
        cards = await storage.getCardsByCollectionId(collectionId);
        totalCount = cards.length;
        
        // Apply pagination manually
        cards = cards.slice(offset, offset + limit);
      }
      
      const endTime = Date.now();
      console.log(`API: Loaded ${cards.length}/${totalCount} cards in ${endTime - startTime}ms`);
      
      // Set cache headers for production
      if (process.env.NODE_ENV === 'production') {
        res.setHeader('Cache-Control', 'public, max-age=180'); // 3 minutes cache
      }
      
      res.json({
        cards,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasMore: offset + limit < totalCount
        }
      });
    } catch (error) {
      console.error("API: Error loading cards:", error);
      
      res.status(500).json({ 
        message: "Database temporarily unavailable",
        error: process.env.NODE_ENV === 'development' ? (error instanceof Error ? error.message : String(error)) : undefined,
        cards: [],
        pagination: { page: 1, limit: 0, total: 0, totalPages: 0, hasMore: false }
      });
    }
  });

  // Get all cards from all collections
  app.get("/api/cards/all", async (req, res) => {
    try {
      // Get all collections first
      const collections = await storage.getCollectionsByUserId(1); // Assuming user ID 1
      let allCards: any[] = [];
      
      // Get cards from each collection
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

  // Get marketplace cards (cards for trade/sale)
  app.get("/api/cards/marketplace", async (req, res) => {
    try {
      // Get all cards that are marked for trade
      const allCards = await storage.getCardsByCollectionId(1); // For now, get from first collection
      const marketplaceCards = allCards.filter(card => card.isForTrade);
      
      // Add seller information for sold cards
      const cardsWithSellerInfo = marketplaceCards.map(card => {
        if (card.isSold) {
          return {
            ...card,
            seller: {
              id: 999,
              name: "Max la menace",
              username: "maxlamenace",
              avatar: null
            },
            soldDate: "2025-06-21T16:30:00.000Z",
            soldPrice: "50€"
          };
        }
        return card;
      });
      
      res.json(cardsWithSellerInfo);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update card featured status
  app.patch("/api/cards/:id/featured", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const cardId = parseInt(req.params.id);
      const { isFeatured } = req.body;
      
      const updatedCard = await storage.updateCard(cardId, { isFeatured });
      if (!updatedCard) {
        return res.status(404).json({ message: "Card not found" });
      }
      res.json(updatedCard);
    } catch (error) {
      console.error('Error updating card featured status:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update card sale settings for personal cards
  app.patch("/api/personal-cards/:id/sale-settings", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const personalCardId = parseInt(req.params.id);
      const userId = req.user!.id;
      const { salePrice, saleDescription, tradeOnly, isForTrade, tradePrice, tradeDescription, isSold } = req.body;
      
      console.log(`PATCH /api/personal-cards/${personalCardId}/sale-settings called by user ${userId}`, req.body);
      
      // Vérifier que la carte personnelle appartient à l'utilisateur
      const personalCard = await storage.getPersonalCard(personalCardId);
      if (!personalCard) {
        return res.status(404).json({ message: "Personal card not found" });
      }

      if (personalCard.userId !== userId) {
        return res.status(403).json({ error: "You don't own this card" });
      }
      
      const updateData: any = {};
      
      if (isForTrade !== undefined) updateData.isForTrade = isForTrade;
      if (tradePrice !== undefined) updateData.tradePrice = tradePrice;
      if (tradeDescription !== undefined) updateData.tradeDescription = tradeDescription;
      if (tradeOnly !== undefined) updateData.tradeOnly = tradeOnly;
      if (isSold !== undefined) updateData.isSold = isSold;
      
      console.log('Updating personal card with data:', updateData);
      
      const updatedCard = await storage.updatePersonalCard(personalCardId, updateData);
      
      if (!updatedCard) {
        return res.status(404).json({ message: "Personal card not found after update" });
      }
      
      console.log('Personal card updated successfully:', updatedCard.id, updatedCard.isForTrade, updatedCard.tradePrice);
      
      res.json(updatedCard);
    } catch (error) {
      console.error('Error updating personal card sale settings:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update card sale settings for collection cards
  app.patch("/api/cards/:id/sale-settings", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const cardId = parseInt(req.params.id);
      const userId = req.user!.id;
      const { salePrice, saleDescription, tradeOnly, isForTrade, tradePrice, tradeDescription, isSold } = req.body;
      
      console.log(`PATCH /api/cards/${cardId}/sale-settings called by user ${userId}`, req.body);
      
      // Vérifier que la carte appartient à l'utilisateur
      const card = await storage.getCard(cardId);
      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }

      const collections = await storage.getCollectionsByUserId(userId);
      const ownsCard = collections.some(collection => collection.id === card.collectionId);
      
      if (!ownsCard) {
        return res.status(403).json({ error: "You don't own this card" });
      }
      
      const updateData: any = {};
      
      if (salePrice !== undefined) updateData.salePrice = salePrice;
      if (saleDescription !== undefined) updateData.saleDescription = saleDescription;
      if (tradeOnly !== undefined) updateData.tradeOnly = tradeOnly;
      if (isForTrade !== undefined) updateData.isForTrade = isForTrade;
      if (tradePrice !== undefined) updateData.tradePrice = tradePrice;
      if (tradeDescription !== undefined) updateData.tradeDescription = tradeDescription;
      if (isSold !== undefined) updateData.isSold = isSold;
      
      console.log('Updating card with data:', updateData);
      
      const updatedCard = await storage.updateCard(cardId, updateData);
      
      if (!updatedCard) {
        return res.status(404).json({ message: "Card not found after update" });
      }
      
      console.log('Card updated successfully:', updatedCard.id, updatedCard.isForTrade, updatedCard.tradePrice);
      
      res.json(updatedCard);
    } catch (error) {
      console.error('Error updating card sale settings:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Toggle card ownership
  app.patch("/api/cards/:id/toggle", async (req, res) => {
    try {
      const cardId = parseInt(req.params.id);
      const card = await storage.toggleCardOwnership(cardId);
      
      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }
      
      res.json(card);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all cards for autocomplete
  app.get("/api/cards/all", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const allCards = await storage.getAllCards();
      res.json(allCards);
    } catch (error) {
      console.error("Error fetching all cards:", error);
      res.status(500).json({ error: "Failed to fetch cards" });
    }
  });

  // Create new card
  app.post("/api/cards", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const cardData = req.body;
      
      // Validate required fields
      if (!cardData.collectionId || !cardData.cardType) {
        return res.status(400).json({ error: "Collection ID and card type are required" });
      }

      const newCard = await storage.createCard(cardData);
      res.status(201).json(newCard);
    } catch (error) {
      console.error("Error creating card:", error);
      res.status(500).json({ error: "Failed to create card" });
    }
  });

  // Card recognition route
  app.post("/api/cards/recognize", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const { imageData } = req.body;
      
      if (!imageData) {
        return res.status(400).json({ message: "Image data is required" });
      }

      // Get all cards for recognition
      const allCards = await storage.getAllCards();
      const recognitionEngine = new CardRecognitionEngine(allCards);
      
      const result = recognitionEngine.recognizeCard(imageData);
      
      res.json(result);
    } catch (error) {
      console.error("Card recognition error:", error);
      res.status(500).json({ message: "Recognition failed" });
    }
  });

  // Update card image
  app.patch("/api/cards/:id/image", async (req, res) => {
    try {
      const cardId = parseInt(req.params.id);
      const { imageUrl, imageData } = req.body;
      
      // Accept either imageUrl or imageData (for compatibility)
      let finalImageUrl;
      
      // If imageUrl is provided (even if empty string), use it
      if (req.body.hasOwnProperty('imageUrl')) {
        finalImageUrl = imageUrl;
      } else if (req.body.hasOwnProperty('imageData')) {
        finalImageUrl = imageData;
      } else {
        return res.status(400).json({ message: "Image URL or image data is required" });
      }
      
      // finalImageUrl can now be an empty string for deletion
      
      // Allow empty string for deletion
      const card = await storage.updateCardImage(cardId, finalImageUrl);
      
      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }
      
      res.json(card);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Card recognition endpoint
  app.post("/api/cards/recognize", async (req, res) => {
    try {
      const { imageData, collectionId } = req.body;
      
      if (!imageData || !collectionId) {
        return res.status(400).json({ message: "Image data and collection ID are required" });
      }

      // Get all cards from the collection for recognition
      const cards = await storage.getCardsByCollectionId(parseInt(collectionId));
      
      // Initialize the recognition engine with the collection's cards
      const recognitionEngine = new CardRecognitionEngine(cards);
      
      // Perform recognition
      const result = recognitionEngine.recognizeCard(imageData);
      
      res.json(result);
    } catch (error) {
      console.error("Card recognition error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update card ownership
  app.post("/api/cards/:id/ownership", async (req, res) => {
    try {
      const cardId = parseInt(req.params.id);
      const { isOwned } = req.body;
      
      if (typeof isOwned !== 'boolean') {
        return res.status(400).json({ message: "isOwned must be a boolean" });
      }

      const card = await storage.updateCard(cardId, { isOwned });
      
      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }

      res.json(card);
    } catch (error) {
      console.error("Error updating card ownership:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Social network endpoints
  app.get('/api/social/users', async (req, res) => {
    try {
      // Mock data for social users
      const socialUsers = [
        {
          id: 2,
          username: "maxcollector",
          name: "Max Dubois",
          bio: "Passionné de cartes Ligue 1 depuis 2010",
          totalCards: 1250,
          collectionsCount: 3,
          completionPercentage: 78,
          followersCount: 45,
          followingCount: 32,
          isFollowing: false
        },
        {
          id: 3,
          username: "cardmaster",
          name: "Julie Martin",
          bio: "Collectionneuse professionnelle",
          totalCards: 2100,
          collectionsCount: 5,
          completionPercentage: 92,
          followersCount: 123,
          followingCount: 67,
          isFollowing: true
        },
        {
          id: 4,
          username: "psgfan",
          name: "Thomas Leroy",
          bio: "Fan du PSG et des cartes rares",
          totalCards: 890,
          collectionsCount: 2,
          completionPercentage: 65,
          followersCount: 28,
          followingCount: 41,
          isFollowing: false
        }
      ];
      res.json(socialUsers);
    } catch (error) {
      console.error("Error fetching social users:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/social/activities', async (req, res) => {
    try {
      // Activity data with only Max la menace sale from yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(16, 30, 0, 0); // 16h30 hier
      
      const activities = [
        {
          id: 1,
          type: "marked_for_sale",
          user: {
            id: 999,
            username: "maxlamenace",
            name: "Max la menace"
          },
          card: {
            id: 125,
            reference: "012",
            playerName: "Erling Haaland",
            teamName: "Manchester City",
            imageUrl: null
          },
          createdAt: yesterday.toISOString()
        }
      ];
      res.json(activities);
    } catch (error) {
      console.error("Error fetching activities:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get('/api/social/notifications', async (req, res) => {
    try {
      // Mock data for notifications
      const notifications = [
        {
          id: 1,
          type: "new_follower",
          title: "Nouveau follower",
          message: "Julie Martin a commencé à vous suivre",
          isRead: false,
          fromUser: {
            id: 3,
            name: "Julie Martin"
          },
          createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString()
        },
        {
          id: 2,
          type: "card_for_trade",
          title: "Carte disponible",
          message: "Max Dubois propose Mbappé en échange",
          isRead: true,
          fromUser: {
            id: 2,
            name: "Max Dubois"
          },
          card: {
            id: 123,
            reference: "045",
            playerName: "Kylian Mbappé"
          },
          createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString()
        }
      ];
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Subscription system endpoints
  app.post("/api/subscriptions", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { followingId } = req.body;
      const followerId = req.user!.id;

      if (followerId === followingId) {
        return res.status(400).json({ message: "Tu ne peux pas te suivre toi-même" });
      }

      const subscription = await storage.createSubscription({
        followerId,
        followingId,
        status: "accepted"
      });

      res.json(subscription);
    } catch (error) {
      console.error("Error creating subscription:", error);
      res.status(500).json({ message: "Erreur interne du serveur" });
    }
  });

  app.get("/api/users/:id/subscriptions", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      const subscriptions = await storage.getUserSubscriptions(userId);
      res.json(subscriptions);
    } catch (error) {
      console.error("Error fetching subscriptions:", error);
      res.status(500).json({ message: "Erreur interne du serveur" });
    }
  });

  app.delete("/api/subscriptions/:followingId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const followingId = parseInt(req.params.followingId);
      const followerId = req.user!.id;
      
      await storage.deleteSubscription(followerId, followingId);
      res.json({ success: true, message: "Abonnement supprimé" });
    } catch (error) {
      console.error("Error deleting subscription:", error);
      res.status(500).json({ message: "Erreur interne du serveur" });
    }
  });

  app.get("/api/users/:id/subscribers", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      const subscribers = await storage.getUserSubscribers(userId);
      res.json(subscribers);
    } catch (error) {
      console.error("Error fetching subscribers:", error);
      res.status(500).json({ message: "Erreur interne du serveur" });
    }
  });



  app.post('/api/social/users/:userId/follow', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      // Mock follow action
      res.json({ success: true, message: "User followed successfully" });
    } catch (error) {
      console.error("Error following user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post('/api/social/users/:userId/unfollow', async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      // Mock unfollow action
      res.json({ success: true, message: "User unfollowed successfully" });
    } catch (error) {
      console.error("Error unfollowing user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update card trade information with automatic post creation
  app.post("/api/cards/:id/trade", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const cardId = parseInt(req.params.id);
      const { tradeDescription, tradePrice, tradeOnly, isForTrade } = req.body;
      const userId = req.user!.id;
      
      const updatedCard = await storage.updateCardTrade(cardId, {
        tradeDescription,
        tradePrice,
        tradeOnly,
        isForTrade
      });
      
      if (!updatedCard) {
        return res.status(404).json({ message: "Card not found" });
      }

      // Auto-create post when card is put for trade or sale
      if (isForTrade && updatedCard.playerName) {
        const content = tradeOnly 
          ? `Je cherche à échanger ma carte ${updatedCard.playerName} !`
          : `Je mets ma carte ${updatedCard.playerName} sur le marché !`;
        
        const postType = tradeOnly ? "card_trade" : "card_sale";
        
        // Create post
        const post = await storage.createPost({
          userId,
          content,
          type: postType,
          cardId
        });
        
        // Create activity
        await storage.createActivity({
          userId,
          type: postType,
          cardId,
          postId: post.id,
          metadata: JSON.stringify({ 
            cardName: updatedCard.playerName, 
            teamName: updatedCard.teamName,
            price: tradePrice 
          })
        });
      }
      
      res.json(updatedCard);
    } catch (error) {
      console.error("Error updating card trade info:", error);
      res.status(500).json({ message: "Failed to update card trade info" });
    }
  });

  // Get conversation with specific user
  app.get("/api/chat/conversations/user/:targetUserId", async (req, res) => {
    try {
      const targetUserId = parseInt(req.params.targetUserId);
      const currentUserId = 1;
      
      // Find existing conversation
      let conversation = await storage.getConversation(currentUserId, targetUserId);
      
      // If no conversation exists, create one
      if (!conversation) {
        conversation = await storage.createConversation({
          user1Id: Math.min(currentUserId, targetUserId),
          user2Id: Math.max(currentUserId, targetUserId),
        });
      }
      
      res.json(conversation);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Generic messages for any conversation
  app.get("/api/chat/conversations/:conversationId/messages", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.conversationId);
      const messages = await storage.getMessages(conversationId);
      
      // Format messages for frontend
      const formattedMessages = messages.map(msg => ({
        id: msg.id,
        conversationId: msg.conversationId,
        senderId: msg.senderId,
        senderName: msg.senderId === 1 ? "Floflow87" : "Max la menace",
        content: msg.content,
        timestamp: msg.createdAt,
        createdAt: msg.createdAt,
        isRead: msg.isRead
      }));
      
      res.json(formattedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all conversations with last message
  app.get("/api/chat/conversations", async (req, res) => {
    try {
      const currentUserId = 1; // Current user ID
      const conversations = await storage.getConversations(currentUserId);
      
      const result = [];
      for (const conv of conversations) {
        const messages = await storage.getMessages(conv.id);
        const lastMessage = messages[messages.length - 1];
        
        // Get other user info
        const otherUserId = conv.user1Id === currentUserId ? conv.user2Id : conv.user1Id;
        const otherUser = await storage.getUser(otherUserId);
        
        if (otherUser) {
          const unreadCount = messages.filter(m => m.senderId !== currentUserId && !m.isRead).length;
          
          const conversation = {
            id: conv.id,
            user: {
              id: otherUser.id,
              name: otherUser.name,
              username: otherUser.username,
            },
            lastMessage: lastMessage ? {
              content: lastMessage.content.startsWith('data:image/') ? '📷 Image' : lastMessage.content,
              timestamp: lastMessage.createdAt,
              isRead: lastMessage.senderId === currentUserId
            } : {
              content: 'Nouvelle conversation',
              timestamp: conv.createdAt || new Date().toISOString(),
              isRead: true
            },
            unreadCount: unreadCount
          };
          result.push(conversation);
        }
      }
      
      // Sort by last message timestamp (most recent first)
      result.sort((a, b) => 
        new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
      );
      
      res.json(result);
    } catch (error) {
      console.error("Error fetching conversations:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Send message to specific user
  app.post("/api/messages/send", async (req, res) => {
    try {
      const { content, recipientId } = req.body;
      
      if (!content?.trim()) {
        return res.status(400).json({ message: "Message content is required" });
      }

      if (!recipientId) {
        return res.status(400).json({ message: "Recipient ID is required" });
      }

      const currentUserId = 1; // Current user sending the message
      
      // Find or create conversation between current user and recipient
      let conversation = await storage.getConversation(currentUserId, recipientId);
      
      if (!conversation) {
        conversation = await storage.createConversation({
          user1Id: Math.min(currentUserId, recipientId),
          user2Id: Math.max(currentUserId, recipientId),
        });
      }

      // Create the message
      const newMessage = await storage.createMessage({
        conversationId: conversation.id,
        senderId: currentUserId,
        content: content.trim()
      });

      // Update conversation's last message timestamp using storage
      // await storage.updateConversationTimestamp(conversation.id);

      // Format for frontend
      const formattedMessage = {
        id: newMessage.id,
        conversationId: newMessage.conversationId,
        senderId: newMessage.senderId,
        senderName: "Floflow87",
        content: newMessage.content,
        timestamp: newMessage.createdAt,
        createdAt: newMessage.createdAt,
        isRead: false
      };

      res.status(201).json(formattedMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Mark conversation messages as read
  app.post("/api/chat/conversations/:conversationId/read", async (req, res) => {
    try {
      const conversationId = parseInt(req.params.conversationId);
      const currentUserId = 1; // Current user ID
      
      await storage.markMessagesAsRead(conversationId, currentUserId);
      
      res.json({ success: true, message: "Messages marked as read" });
    } catch (error) {
      console.error("Error marking messages as read:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Block user
  app.post("/api/users/:userId/block", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      // Mock implementation - in real app, save to database
      res.json({ success: true, message: "User blocked successfully" });
    } catch (error) {
      console.error("Error blocking user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Unblock user
  app.post("/api/users/:userId/unblock", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      // Mock implementation - in real app, save to database
      res.json({ success: true, message: "User unblocked successfully" });
    } catch (error) {
      console.error("Error unblocking user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Social network endpoints
  
  // Get user's posts
  app.get("/api/users/:id/posts", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      const posts = await storage.getUserPosts(userId);
      res.json(posts);
    } catch (error) {
      console.error('Error fetching user posts:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create a new post
  app.post("/api/posts", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { content, type, cardId } = req.body;
      const userId = req.user!.id;
      
      const post = await storage.createPost({
        userId,
        content,
        type: type || "text",
        cardId: cardId || null
      });
      
      // Create activity for the post
      await storage.createActivity({
        userId,
        type: "post",
        postId: post.id,
        metadata: JSON.stringify({ content: content.substring(0, 100) })
      });
      
      res.json(post);
    } catch (error) {
      console.error('Error creating post:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete a post
  app.delete("/api/posts/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const postId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      // First, get the post to verify ownership
      const post = await storage.getPost(postId);
      if (!post) {
        return res.status(404).json({ message: "Post not found" });
      }
      
      // Check if the user owns this post
      if (post.userId !== userId) {
        return res.status(403).json({ message: "You can only delete your own posts" });
      }
      
      // Delete the post
      const success = await storage.deletePost(postId);
      if (!success) {
        return res.status(500).json({ message: "Failed to delete post" });
      }
      
      res.json({ message: "Post deleted successfully" });
    } catch (error) {
      console.error('Error deleting post:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get user's followers
  app.get("/api/users/:id/followers", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      const followers = await storage.getUserFollowers(userId);
      res.json(followers);
    } catch (error) {
      console.error('Error fetching followers:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Follow/unfollow user
  app.post("/api/users/:id/follow", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const followingId = parseInt(req.params.id);
      const followerId = req.user!.id;
      
      if (followerId === followingId) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }
      
      const success = await storage.followUser(followerId, followingId);
      if (success) {
        res.json({ message: "User followed successfully", isFollowing: true });
      } else {
        res.status(500).json({ message: "Failed to follow user" });
      }
    } catch (error) {
      console.error('Error following user:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.delete("/api/users/:id/follow", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const followingId = parseInt(req.params.id);
      const followerId = req.user!.id;
      
      const success = await storage.unfollowUser(followerId, followingId);
      if (success) {
        res.json({ message: "User unfollowed successfully", isFollowing: false });
      } else {
        res.status(500).json({ message: "Failed to unfollow user" });
      }
    } catch (error) {
      console.error('Error unfollowing user:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Check if following user
  app.get("/api/users/:id/following-status", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const followingId = parseInt(req.params.id);
      const followerId = req.user!.id;
      
      const isFollowing = await storage.isFollowing(followerId, followingId);
      res.json({ isFollowing });
    } catch (error) {
      console.error('Error checking follow status:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });



  // Get user's following
  app.get("/api/users/:id/following", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      const following = await storage.getUserFollowing(userId);
      res.json(following);
    } catch (error) {
      console.error('Error fetching following:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get pending subscription requests
  app.get("/api/users/:id/subscription-requests", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (userId !== req.user!.id) {
        return res.status(403).json({ message: "Forbidden" });
      }
      
      const requests = await storage.getPendingSubscriptionRequests(userId);
      res.json(requests);
    } catch (error) {
      console.error('Error fetching subscription requests:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create subscription request
  app.post("/api/subscriptions", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { followingId } = req.body;
      const followerId = req.user!.id;
      
      if (followerId === followingId) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }
      
      const subscription = await storage.createSubscription({
        followerId,
        followingId,
        status: "pending"
      });
      
      res.json(subscription);
    } catch (error) {
      console.error('Error creating subscription:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Update subscription status (accept/reject)
  app.patch("/api/subscriptions/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const subscriptionId = parseInt(req.params.id);
      const { status } = req.body;
      
      if (!["accepted", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const subscription = await storage.updateSubscription(subscriptionId, { status });
      if (!subscription) {
        return res.status(404).json({ message: "Subscription not found" });
      }
      
      res.json(subscription);
    } catch (error) {
      console.error('Error updating subscription:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });



  const httpServer = createServer(app);
  return httpServer;
}
