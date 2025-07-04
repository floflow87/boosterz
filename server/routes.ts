import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import authRoutes from "./authRoutes";
import chatRoutes from "./chatRoutes";
import adminRoutes from "./adminRoutes";
import { authenticateToken, optionalAuth, type AuthRequest } from "./auth-production";
import { CardRecognitionEngine } from "./cardRecognition";
// import { performHealthCheck } from "./healthcheck";
import type { Card, PersonalCard, InsertPersonalCard, Deck, InsertDeck, DeckCard, InsertDeckCard } from "@shared/schema";
import { db } from "./db";
import { cards, posts, users, personalCards, insertPersonalCardSchema, decks, deckCards, insertDeckSchema, insertDeckCardSchema, follows, collections, userCards, conversations, messages, activities, subscriptions, postLikes, postComments } from "@shared/schema";
import { eq, desc, and, inArray, not, or, ilike, asc, like, sql } from "drizzle-orm";

// Initialize sample data in database
const initializeSampleData = async () => {
  try {
    // Check if conversation already exists
    const existingConv = await storage.getConversation(1, 2);
    if (!existingConv) {
      // Create sample conversation
      const conversation = await storage.createConversation({
        user1Id: 1,
        user2Id: 2
      });
      
      // Create sample messages
      await storage.createMessage({
        conversationId: conversation.id,
        senderId: 2,
        content: "Salut ! J'ai vu ta collection, elle est impressionnante !"
      });
      
      await storage.createMessage({
        conversationId: conversation.id,
        senderId: 2,
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
  app.use('/api/admin', adminRoutes);
  
  // Routes pour les cartes personnelles (Mes cartes)
  app.get("/api/personal-cards", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const collectionId = req.query.collectionId ? parseInt(req.query.collectionId as string) : undefined;
      
      console.log(`🃏 Fetching personal cards for user ${userId}, collection: ${collectionId || 'ALL'}`);
      
      let personalCards;
      if (collectionId) {
        personalCards = await storage.getPersonalCardsByCollectionId(collectionId, userId);
        console.log(`📊 Found ${personalCards.length} personal cards for collection ${collectionId}`);
      } else {
        personalCards = await storage.getPersonalCardsByUserId(userId);
        console.log(`📊 Found ${personalCards.length} total personal cards`);
      }
      
      res.json(personalCards);
    } catch (error) {
      console.error("Error fetching personal cards:", error);
      res.status(500).json({ error: "Failed to fetch personal cards" });
    }
  });

  // Route pour obtenir les cartes personnelles d'un utilisateur spécifique (pour TrophyAvatar)
  app.get("/api/users/:id/personal-cards", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const targetUserId = parseInt(req.params.id);
      if (isNaN(targetUserId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      const personalCards = await storage.getPersonalCardsByUserId(targetUserId);
      res.json(personalCards);
    } catch (error) {
      console.error("Error fetching user personal cards:", error);
      res.status(500).json({ error: "Failed to fetch user personal cards" });
    }
  });

  // Endpoint optimisé pour les statistiques de trophées de l'utilisateur connecté
  app.get("/api/users/me/trophy-stats", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const startTime = performance.now();
      
      const trophyStats = await storage.getTrophyStats(userId);
      
      const endTime = performance.now();
      console.log(`✅ Trophy stats for user ${userId} calculated in ${Math.round(endTime - startTime)}ms - ${trophyStats.totalCards} total, ${trophyStats.autographs} autos, ${trophyStats.specials} specials`);
      
      res.json(trophyStats);
    } catch (error) {
      console.error('Error fetching trophy stats:', error);
      res.status(500).json({ error: 'Failed to fetch trophy stats' });
    }
  });

  // Endpoint optimisé pour les statistiques de trophées (halos d'avatar)
  app.get("/api/users/:id/trophy-stats", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      const stats = await storage.getTrophyStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching trophy stats:", error);
      res.status(500).json({ error: "Failed to fetch trophy stats" });
    }
  });

  app.post("/api/personal-cards", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      
      console.log("Creating personal card for user:", userId);
      console.log("Request body:", req.body);
      
      // Valider les données avec le schéma Zod
      const validatedData = insertPersonalCardSchema.parse({
        ...req.body,
        userId
      });

      console.log("Validated data:", validatedData);

      const personalCard = await storage.createPersonalCard(validatedData);
      console.log("Created personal card:", personalCard);
      
      res.status(201).json(personalCard);
    } catch (error) {
      console.error("Error creating personal card:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
        console.error("Error stack:", error.stack);
        // Si c'est une erreur de validation Zod, retourner plus de détails
        if (error.name === 'ZodError') {
          return res.status(400).json({ 
            error: "Validation error", 
            details: error.message 
          });
        }
      }
      res.status(500).json({ 
        error: "Failed to create personal card",
        message: error instanceof Error ? error.message : "Unknown error"
      });
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

  // Update personal card information
  app.patch("/api/personal-cards/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const personalCardId = parseInt(req.params.id);
      const userId = req.user!.id;
      const { playerName, teamName, cardType, reference, numbering, imageUrl, season, condition } = req.body;
      
      console.log(`PATCH /api/personal-cards/${personalCardId} called by user ${userId}`, req.body);
      
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

      // Construire les données de mise à jour
      const updateData: any = {};
      if (playerName !== undefined) updateData.playerName = playerName;
      if (teamName !== undefined) updateData.teamName = teamName;
      if (cardType !== undefined) updateData.cardType = cardType;
      if (reference !== undefined) updateData.reference = reference;
      if (numbering !== undefined) updateData.numbering = numbering;
      if (imageUrl !== undefined) updateData.imageUrl = imageUrl;
      if (season !== undefined) updateData.season = season;
      if (condition !== undefined) updateData.condition = condition;
      
      console.log('Updating personal card with data:', updateData);
      
      const updatedCard = await storage.updatePersonalCard(personalCardId, updateData);
      
      if (!updatedCard) {
        return res.status(404).json({ message: "Personal card not found after update" });
      }
      
      console.log('Personal card updated successfully:', updatedCard.id, updatedCard.playerName);
      
      res.json(updatedCard);
    } catch (error) {
      console.error('Error updating personal card:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Chat routes (commented out to avoid conflicts)
  // app.use('/api/chat', chatRoutes);

  // Get conversation between two users - BILATÉRAL  
  app.get("/api/chat/conversations/user/:userId", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const currentUserId = req.user!.id; // Utilisateur authentifié
      const otherUserId = parseInt(req.params.userId);
      
      // Chercher ou créer une conversation
      let conversation = await storage.getConversation(currentUserId, otherUserId);
      
      if (!conversation) {
        // Créer une nouvelle conversation si elle n'existe pas
        conversation = await storage.createConversation({
          user1Id: Math.min(currentUserId, otherUserId),
          user2Id: Math.max(currentUserId, otherUserId)
        });
      }
      
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
  app.get("/api/users/feed", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      
      console.log(`Getting feed for user ${userId}`);
      
      // Get users that the current user follows
      const followedUsers = await db.select({ followingId: follows.followingId })
        .from(follows)
        .where(eq(follows.followerId, userId));
      
      console.log(`User ${userId} follows ${followedUsers.length} users:`, followedUsers);
      
      if (followedUsers.length === 0) {
        return res.json([]);
      }
      
      const followedUserIds = followedUsers.map((f: any) => f.followingId);
      
      // Get posts from followed users UNIQUEMENT - optimized query without subqueries
      const feedPosts = await db.select({
        id: posts.id,
        userId: posts.userId,
        content: posts.content,
        imageUrl: posts.imageUrl,
        cardId: posts.cardId,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        likesCount: posts.likesCount, // Use the cached count from the posts table
        commentsCount: posts.commentsCount, // Use the cached count from the posts table
        user: {
          id: users.id,
          username: users.username,
          name: users.name,
          avatar: users.avatar
        }
      })
      .from(posts)
      .leftJoin(users, eq(posts.userId, users.id))
      .where(
        and(
          inArray(posts.userId, followedUserIds),
          not(eq(posts.userId, userId)) // Exclure les posts de l'utilisateur courant
        )
      )
      .orderBy(desc(posts.createdAt))
      .limit(20); // Reduce limit for faster loading
      
      console.log(`Found ${feedPosts.length} posts from followed users`);
      res.json(feedPosts);
    } catch (error) {
      console.error("Error fetching user feed:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get current user profile
  app.get("/api/users/me", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUser(req.user!.id);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(user);
    } catch (error) {
      console.error("Error fetching current user:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get current user collections
  app.get("/api/users/me/collections", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const collections = await storage.getCollectionsByUserId(req.user!.id);
      res.json(collections);
    } catch (error) {
      console.error("Error fetching current user collections:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create new collection
  app.post("/api/collections", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { name, season } = req.body;
      const userId = req.user!.id;

      console.log("Creating collection:", { name, season, userId });

      if (!name || !season) {
        return res.status(400).json({ error: "Name and season are required" });
      }

      // Create new collection
      const newCollection = await storage.createCollection({
        name,
        season,
        userId,
        totalCards: 0 // Will be updated when cards are added
      });

      console.log("Collection created successfully:", newCollection);
      res.json(newCollection);
    } catch (error) {
      console.error("Error creating collection:", error);
      res.status(500).json({ error: "Failed to create collection" });
    }
  });

  // Update current user profile
  app.put("/api/auth/profile", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { name, email, bio, avatar } = req.body;
      
      // Update user in database
      const updatedUser = await storage.updateUser(req.user!.id, {
        name,
        email,
        bio,
        avatar
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({
        message: 'Profil mis à jour avec succès',
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          name: updatedUser.name,
          avatar: updatedUser.avatar,
          bio: updatedUser.bio
        }
      });
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get user profile
  app.get("/api/users/:id", optionalAuth, async (req: AuthRequest, res) => {
    try {
      console.log(`=== GET /api/users/${req.params.id} START ===`);
      const userId = parseInt(req.params.id);
      console.log(`Parsed userId: ${userId}`);
      
      const user = await storage.getUser(userId);
      console.log(`User found:`, user ? `ID ${user.id}, ${user.username}` : 'null');
      
      if (!user) {
        console.log(`User ${userId} not found, returning 404`);
        return res.status(404).json({ message: "User not found" });
      }
      
      // Get real counts from database
      console.log(`Getting followers count for user ${userId}...`);
      const followersCount = await storage.getFollowersCount(userId);
      console.log(`Followers count: ${followersCount}`);
      
      console.log(`Getting following count for user ${userId}...`);
      const followingCount = await storage.getFollowingCount(userId);
      console.log(`Following count: ${followingCount}`);
      
      // Get decks count directly from database
      const userDecks = await db.select().from(decks).where(eq(decks.userId, userId));
      const decksCount = userDecks.length;
      
      // Calculate total cards owned across all collections
      let totalCards = 0;
      let ownedCards = 0;
      
      const collections = await storage.getCollectionsByUserId(userId);
      for (const collection of collections) {
        const cards = await storage.getCardsByCollectionId(collection.id);
        totalCards += cards.length;
        ownedCards += cards.filter(card => card.isOwned).length;
      }
      
      // Add personal cards count (non-sold cards)
      const personalCards = await storage.getPersonalCardsByUserId(userId);
      const personalCardsCount = personalCards.filter(card => !card.isSold).length;
      totalCards += personalCardsCount;
      ownedCards += personalCardsCount;
      
      // Calculate completion percentage
      const completionPercentage = totalCards > 0 ? Math.round((ownedCards / totalCards) * 100) : 0;
      
      console.log(`Profile for user ${userId}: ${followersCount} followers, ${followingCount} following, ${decksCount} decks, ${ownedCards}/${totalCards} cards (${completionPercentage}%)`);
      
      // If there's a current user and they're looking at someone else's profile, include follow status
      let isFollowing = false;
      if (req.user && req.user.id !== userId) {
        isFollowing = await storage.isFollowing(req.user.id, userId);
      }
      
      res.json({
        ...user,
        followersCount,
        followingCount,
        collectionsCount: decksCount, // Use real decks count
        totalCards: ownedCards, // Only show owned cards
        completionPercentage,
        isFollowing
      });
    } catch (error) {
      console.error(`=== ERROR in GET /api/users/${req.params.id} ===`);
      console.error('Error details:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack available');
      console.error('Request params:', req.params);
      console.error('Request user:', req.user);
      console.error(`=== END ERROR ===`);
      res.status(500).json({ message: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' });
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
      
      // Enrich collections with card counts
      const enrichedCollections = await Promise.all(
        collections.map(async (collection) => {
          const cards = await storage.getCardsByCollectionId(collection.id);
          const totalCards = cards.length;
          const ownedCards = cards.filter(card => card.isOwned).length;
          
          return {
            ...collection,
            totalCards,
            ownedCards
          };
        })
      );
      
      res.json(enrichedCollections);
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

  // Get checklist cards in collection (nouvelle architecture check-lists)
  app.get("/api/collections/:id/checklist-cards", async (req, res) => {
    try {
      const collectionId = parseInt(req.params.id);
      console.log(`API: Loading checklist cards for collection ${collectionId}`);
      
      const startTime = Date.now();
      const checklistCards = await storage.getChecklistCardsByCollectionId(collectionId);
      const endTime = Date.now();
      
      console.log(`API: Loaded ${checklistCards.length} checklist cards in ${endTime - startTime}ms`);
      
      res.json({ cards: checklistCards });
    } catch (error) {
      console.error(`Error loading checklist cards for collection ${req.params.id}:`, error);
      res.status(500).json({ error: "Erreur lors du chargement des cartes de la collection" });
    }
  });

  // Get user's checklist card ownership for a collection
  app.get("/api/collections/:id/checklist-ownership", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const collectionId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      console.log(`API: Loading checklist ownership for user ${userId}, collection ${collectionId}`);
      
      const ownership = await storage.getUserChecklistCardOwnership(userId, collectionId);
      res.json({ ownership });
    } catch (error) {
      console.error('Error loading checklist ownership:', error);
      res.status(500).json({ error: "Erreur lors du chargement de la propriété des cartes" });
    }
  });

  // Update user's ownership of a checklist card
  app.patch("/api/checklist-cards/:cardId/ownership", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const cardId = parseInt(req.params.cardId);
      const userId = req.user!.id;
      const { owned } = req.body;
      
      console.log(`🎯 API OWNERSHIP UPDATE: Card ${cardId}, User ${userId}, Owned: ${owned}`);
      console.log(`📋 Request body:`, req.body);
      console.log(`🔐 User from auth:`, req.user);
      
      const ownership = await storage.updateUserChecklistCardOwnership(userId, cardId, owned);
      
      console.log(`✅ Ownership updated successfully:`, ownership);
      
      res.json({ ownership });
    } catch (error) {
      console.error('❌ Error updating checklist ownership:', error);
      res.status(500).json({ error: "Erreur lors de la mise à jour de la propriété" });
    }
  });

  // Get completion stats for a user's collection
  app.get("/api/collections/:id/completion-stats", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const collectionId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      console.log(`API: Loading completion stats for user ${userId}, collection ${collectionId}`);
      
      const stats = await storage.getCollectionCompletionStats(userId, collectionId);
      res.json({ stats });
    } catch (error) {
      console.error('Error loading completion stats:', error);
      res.status(500).json({ error: "Erreur lors du chargement des statistiques" });
    }
  });

  // Initialize user's checklist ownership for a collection
  app.post("/api/collections/:id/initialize-ownership", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const collectionId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      console.log(`API: Initializing checklist ownership for user ${userId}, collection ${collectionId}`);
      
      await storage.initializeUserChecklistOwnership(userId, collectionId);
      res.json({ success: true, message: "Propriété des cartes initialisée avec succès" });
    } catch (error) {
      console.error('Error initializing checklist ownership:', error);
      res.status(500).json({ error: "Erreur lors de l'initialisation de la propriété" });
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
  app.get("/api/cards/all", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      
      // Get all collections first
      const collections = await storage.getCollectionsByUserId(userId);
      let allCards: any[] = [];
      
      // Get cards from each collection
      for (const collection of collections) {
        const cards = await storage.getCardsByCollectionId(collection.id);
        allCards.push(...cards);
      }
      
      res.json({ cards: allCards });
    } catch (error) {
      console.error("Error fetching all cards:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get marketplace cards (cards for trade/sale)
  app.get("/api/cards/marketplace", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const currentUserId = req.user?.id;
      
      // Get all personal cards that are for sale from all users except current user
      const personalCards = await storage.getAllPersonalCards();
      
      // Filter for cards that are for sale and not from current user
      const marketplaceCards = personalCards.filter(card => 
        card.isForSale && 
        card.userId !== currentUserId
      );
      
      console.log(`Marketplace: Found ${marketplaceCards.length} cards for sale`);
      res.json(marketplaceCards);
    } catch (error) {
      console.error("Error fetching marketplace cards:", error);
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
      const { salePrice, saleDescription, tradeOnly, isForTrade, isForSale, tradePrice, tradeDescription, isSold } = req.body;
      
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
      
      if (isForSale !== undefined) updateData.isForSale = isForSale;
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
  app.patch("/api/cards/:id/toggle", authenticateToken, async (req: AuthRequest, res) => {
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

  // Remove card from deck
  app.delete("/api/decks/:id/cards/:cardPosition", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const deckId = parseInt(req.params.id);
      const cardPosition = parseInt(req.params.cardPosition);
      const userId = req.user!.id;

      console.log(`Removing card at position ${cardPosition} from deck ${deckId} for user ${userId}`);

      // Remove card and reorder positions
      await storage.removeCardFromDeck(deckId, cardPosition);
      
      res.json({ message: "Card removed successfully" });
    } catch (error) {
      console.error("Error removing card from deck:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Posts endpoints
  app.post("/api/posts", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { content, type = "featured", cardId, cardImage, cardName } = req.body;

      const post = await storage.createPost({
        userId,
        content,
        type,
        cardId,
        imageUrl: cardImage,
      });

      res.status(201).json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).json({ error: "Failed to create post" });
    }
  });

  // Social network endpoints
  app.get('/api/social/users', optionalAuth, async (req: AuthRequest, res) => {
    try {
      const currentUserId = req.user?.id;
      const searchTerm = req.query.search?.toString().toLowerCase();
      const limit = parseInt(req.query.limit?.toString() || '10');
      
      console.log('Social users endpoint - currentUserId:', currentUserId);
      
      let users = await storage.getAllUsers();
      
      // Always remove current user from results (including default user ID 1)
      users = users.filter(user => user.id !== currentUserId);
      
      // Apply search filter if provided
      if (searchTerm) {
        users = users.filter(user => 
          user.name?.toLowerCase().includes(searchTerm) ||
          user.username?.toLowerCase().includes(searchTerm) ||
          user.email?.toLowerCase().includes(searchTerm)
        );
      }
      
      // Get follow status and counts for each user
      const socialUsers = await Promise.all(users.map(async user => {
        const collections = await storage.getCollectionsByUserId(user.id);
        const followersCount = await storage.getFollowersCount(user.id);
        const isFollowing = currentUserId ? await storage.isFollowing(currentUserId, user.id) : false;
        
        return {
          id: user.id,
          username: user.username,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          bio: user.bio,
          followersCount: followersCount,
          collectionsCount: collections.length,
          isFollowing
        };
      }));
      
      console.log(`Returning ${socialUsers.length} users (excluded current user ${currentUserId})`);
      res.json(socialUsers.slice(0, limit));
    } catch (error) {
      console.error('Error fetching social users:', error);
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
      
      await storage.deleteSubscription(followingId);
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



  // Social follow/unfollow endpoints (for compatibility) - CORRIGÉ
  app.post("/api/social/users/:userId/:action", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const targetUserId = parseInt(req.params.userId);
      const action = req.params.action;
      const currentUserId = req.user!.id;
      
      console.log(`Social action: ${action} from user ${currentUserId} to user ${targetUserId}`);
      
      if (targetUserId === currentUserId) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }

      // Vérifier si l'utilisateur cible existe
      const targetUser = await storage.getUser(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }

      let success = false;
      if (action === "follow") {
        // Vérifier si déjà suivi
        const isAlreadyFollowing = await storage.isFollowing(currentUserId, targetUserId);
        if (!isAlreadyFollowing) {
          success = await storage.followUser(currentUserId, targetUserId);
        } else {
          return res.status(400).json({ message: "Already following this user" });
        }
      } else if (action === "unfollow") {
        success = await storage.unfollowUser(currentUserId, targetUserId);
      } else {
        return res.status(400).json({ message: "Invalid action" });
      }

      if (success) {
        console.log(`Successfully ${action}ed user ${targetUserId}`);
        res.json({ message: `User ${action}ed successfully` });
      } else {
        res.status(500).json({ message: `Failed to ${action} user` });
      }
    } catch (error) {
      console.error(`Error ${req.params.action}ing user:`, error);
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

  // Messages for any conversation - BILATÉRAL
  app.get("/api/chat/conversations/:conversationId/messages", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const conversationId = parseInt(req.params.conversationId);
      const currentUserId = req.user!.id;
      const messages = await storage.getMessages(conversationId);
      
      // Récupérer les infos des utilisateurs pour les noms
      const userCache = new Map();
      for (const msg of messages) {
        if (!userCache.has(msg.senderId)) {
          const user = await storage.getUser(msg.senderId);
          userCache.set(msg.senderId, user);
        }
      }
      
      // Format messages for frontend
      const formattedMessages = messages.map(msg => {
        const sender = userCache.get(msg.senderId);
        return {
          id: msg.id,
          conversationId: msg.conversationId,
          senderId: msg.senderId,
          senderName: sender ? sender.name || sender.username : "Utilisateur",
          content: msg.content,
          timestamp: msg.createdAt,
          createdAt: msg.createdAt,
          isRead: msg.isRead
        };
      });
      
      res.json(formattedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get all conversations with last message - BILATÉRAL
  app.get("/api/chat/conversations", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const currentUserId = req.user!.id; // Utilisateur authentifié
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
              avatar: otherUser.avatar,
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

  // Send message to specific user - BILATÉRAL
  app.post("/api/messages/send", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { content, recipientId } = req.body;
      
      console.log('=== SEND MESSAGE DEBUG ===');
      console.log('NODE_ENV:', process.env.NODE_ENV);
      console.log('req.user:', req.user);
      console.log('Request body:', { content: content?.substring(0, 50) + '...', recipientId });
      
      if (!content?.trim()) {
        console.log('ERROR: Message content is required');
        return res.status(400).json({ message: "Message content is required" });
      }

      if (!recipientId) {
        console.log('ERROR: Recipient ID is required');
        return res.status(400).json({ message: "Recipient ID is required" });
      }

      // Fallback d'authentification pour la production si req.user n'est pas défini
      let currentUserId = req.user?.id;
      if (!currentUserId && process.env.NODE_ENV === 'production') {
        console.log('PRODUCTION FALLBACK: Using user ID 1 as sender');
        currentUserId = 1; // Fallback temporaire pour la production
      }

      if (!currentUserId) {
        console.log('ERROR: No current user ID available');
        return res.status(401).json({ message: "Authentication required" });
      }

      console.log('Using currentUserId:', currentUserId);
      
      // Find or create conversation between current user and recipient
      let conversation = await storage.getConversation(currentUserId, recipientId);
      
      if (!conversation) {
        conversation = await storage.createConversation({
          user1Id: Math.min(currentUserId, recipientId),
          user2Id: Math.max(currentUserId, recipientId)
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

      // Format for frontend avec nom dynamique
      const sender = await storage.getUser(currentUserId);
      const formattedMessage = {
        id: newMessage.id,
        conversationId: newMessage.conversationId,
        senderId: newMessage.senderId,
        senderName: sender ? sender.name || sender.username : "Utilisateur",
        content: newMessage.content,
        timestamp: newMessage.createdAt,
        createdAt: newMessage.createdAt,
        isRead: false
      };

      res.status(201).json(formattedMessage);
    } catch (error) {
      console.error("Error sending message:", error);
      if (error instanceof Error) {
        console.error("Error details:", error.message);
        console.error("Error stack:", error.stack);
        return res.status(500).json({ 
          message: "Internal server error",
          error: error.message 
        });
      }
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
  
  // Get user's posts - AVEC AUTHENTIFICATION
  app.get("/api/users/:id/posts", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const requestedUserId = parseInt(req.params.id);
      const currentUserId = req.user!.id;
      
      console.log(`Fetching posts for user ${requestedUserId}, current user: ${currentUserId}`);
      
      // Si on demande les posts de l'utilisateur courant, s'assurer qu'on utilise le bon ID
      const targetUserId = requestedUserId === currentUserId ? currentUserId : requestedUserId;
      
      const posts = await storage.getUserPosts(targetUserId);
      
      console.log(`Found ${posts.length} posts for user ${targetUserId}`);
      res.json(posts);
    } catch (error) {
      console.error('Error fetching user posts:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create a new post
  app.post("/api/posts", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { content, type, cardId, imageUrl } = req.body;
      const userId = req.user!.id;
      
      const post = await storage.createPost({
        userId,
        content,
        type: type || "text",
        cardId: cardId || null,
        imageUrl: imageUrl || null
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

  // Follow user - CORRIGÉ
  app.post("/api/users/:id/follow", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const followingId = parseInt(req.params.id);
      const followerId = req.user!.id;
      
      console.log(`User ${followerId} wants to follow user ${followingId}`);
      
      if (followerId === followingId) {
        return res.status(400).json({ message: "Cannot follow yourself" });
      }
      
      // Vérifier si l'utilisateur cible existe
      const targetUser = await storage.getUser(followingId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Vérifier si déjà suivi
      const isAlreadyFollowing = await storage.isFollowing(followerId, followingId);
      if (isAlreadyFollowing) {
        return res.status(400).json({ message: "Already following this user" });
      }
      
      // Utiliser la méthode storage
      const success = await storage.followUser(followerId, followingId);
      
      if (success) {
        console.log(`Successfully added follow relationship: ${followerId} -> ${followingId}`);
        res.json({ message: "User followed successfully", isFollowing: true });
      } else {
        res.status(500).json({ message: "Failed to follow user" });
      }
    } catch (error) {
      console.error('Error following user:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Unfollow user - CORRIGÉ
  app.delete("/api/users/:id/follow", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const followingId = parseInt(req.params.id);
      const followerId = req.user!.id;
      
      console.log(`User ${followerId} wants to unfollow user ${followingId}`);
      
      if (followerId === followingId) {
        return res.status(400).json({ message: "Cannot unfollow yourself" });
      }
      
      // Vérifier si l'utilisateur cible existe
      const targetUser = await storage.getUser(followingId);
      if (!targetUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Utiliser la méthode storage
      const success = await storage.unfollowUser(followerId, followingId);
      
      if (success) {
        console.log(`Successfully removed follow relationship: ${followerId} -> ${followingId}`);
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



  // Deck routes
  
  // Get user's decks
  app.get("/api/decks", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const userDecks = await db.select().from(decks).where(eq(decks.userId, userId));
      res.json(userDecks);
    } catch (error) {
      console.error("Error fetching decks:", error);
      res.status(500).json({ message: "Erreur interne du serveur" });
    }
  });

  // Get decks for a specific user
  app.get("/api/users/:id/decks", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      const userDecks = await db.select().from(decks).where(eq(decks.userId, userId));
      res.json(userDecks);
    } catch (error) {
      console.error("Error fetching user decks:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get sale cards for a specific user
  app.get("/api/users/:id/sale-cards", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      const saleCards = await db.select().from(personalCards).where(
        and(eq(personalCards.userId, userId), eq(personalCards.isForSale, true))
      );
      res.json(saleCards);
    } catch (error) {
      console.error("Error fetching user sale cards:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Delete deck
  app.delete("/api/decks/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const deckId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      console.log(`Attempting to delete deck ${deckId} for user ${userId}`);
      
      // Vérifier que le deck appartient à l'utilisateur
      const [existingDeck] = await db.select().from(decks).where(eq(decks.id, deckId));
      if (!existingDeck) {
        console.log(`Deck ${deckId} not found`);
        return res.status(404).json({ message: "Deck not found" });
      }
      
      if (existingDeck.userId !== userId) {
        console.log(`Deck ${deckId} does not belong to user ${userId}`);
        return res.status(403).json({ message: "Unauthorized" });
      }
      
      // Supprimer d'abord les cartes du deck
      const deletedCards = await db.delete(deckCards).where(eq(deckCards.deckId, deckId));
      console.log(`Deleted cards from deck ${deckId}`);
      
      // Supprimer le deck
      const deletedDeck = await db.delete(decks).where(eq(decks.id, deckId));
      console.log(`Deleted deck ${deckId}`);
      
      res.json({ message: "Deck deleted successfully" });
    } catch (error) {
      console.error('Error deleting deck:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Create new deck
  app.post("/api/decks", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { name, themeColors, backgroundColor, accentColor, coverImage, cards } = req.body;
      
      if (!name?.trim()) {
        return res.status(400).json({ message: "Le nom du deck est requis" });
      }
      
      if (cards && cards.length > 12) {
        return res.status(400).json({ message: "Un deck ne peut contenir que 12 cartes maximum" });
      }

      // Create deck
      const [newDeck] = await db.insert(decks).values({
        userId,
        name: name.trim(),
        themeColors: themeColors || "main+background",
        backgroundColor: backgroundColor || "#1A2332",
        accentColor: accentColor || "#F37261",
        coverImage,
        cardCount: cards?.length || 0,
        isPublic: true
      }).returning();

      // Add cards to deck if provided
      if (cards && cards.length > 0) {
        const deckCardData = cards.map((card: any) => ({
          deckId: newDeck.id,
          cardId: card.cardId,
          personalCardId: card.personalCardId,
          position: card.position
        }));
        
        await db.insert(deckCards).values(deckCardData);
      }

      res.json(newDeck);
    } catch (error) {
      console.error("Error creating deck:", error);
      res.status(500).json({ message: "Erreur lors de la création du deck" });
    }
  });

  // Get deck details with cards
  app.get("/api/decks/:id", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const deckId = parseInt(req.params.id);
      
      // Get deck
      const [deck] = await db.select().from(decks).where(eq(decks.id, deckId));
      if (!deck) {
        return res.status(404).json({ message: "Deck non trouvé" });
      }

      // Get deck cards with associated card/personal card data
      const deckCardsList = await db.select().from(deckCards).where(eq(deckCards.deckId, deckId));
      
      const cardsWithData = [];
      for (const deckCard of deckCardsList) {
        let cardData = null;
        
        if (deckCard.cardId) {
          const [card] = await db.select().from(cards).where(eq(cards.id, deckCard.cardId));
          if (card) cardData = { type: 'collection', card };
        } else if (deckCard.personalCardId) {
          const [personalCard] = await db.select().from(personalCards).where(eq(personalCards.id, deckCard.personalCardId));
          if (personalCard) cardData = { type: 'personal', card: personalCard };
        }
        
        if (cardData) {
          cardsWithData.push({
            ...cardData,
            position: deckCard.position
          });
        }
      }

      // Sort by position
      cardsWithData.sort((a, b) => a.position - b.position);

      res.json({
        ...deck,
        cards: cardsWithData
      });
    } catch (error) {
      console.error("Error fetching deck:", error);
      res.status(500).json({ message: "Erreur interne du serveur" });
    }
  });

  // Update deck information
  app.patch("/api/decks/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const deckId = parseInt(req.params.id);
      const userId = req.user!.id;
      const { name, themeColors, coverImage, bannerPosition } = req.body;

      console.log(`Updating deck ${deckId}:`, { name, themeColors, coverImage: coverImage ? 'present' : 'null', bannerPosition });

      // Check if deck belongs to user
      const [existingDeck] = await db.select().from(decks).where(eq(decks.id, deckId));
      if (!existingDeck || existingDeck.userId !== userId) {
        return res.status(404).json({ message: "Deck non trouvé" });
      }

      // Prepare update data
      const updateData: any = {};
      if (name !== undefined) updateData.name = name;
      if (themeColors !== undefined) updateData.themeColors = themeColors;
      if (coverImage !== undefined) updateData.coverImage = coverImage;
      if (bannerPosition !== undefined) updateData.bannerPosition = bannerPosition;

      // Update deck
      const [updatedDeck] = await db.update(decks)
        .set(updateData)
        .where(eq(decks.id, deckId))
        .returning();

      console.log('Deck updated successfully:', updatedDeck.id);
      res.json(updatedDeck);
    } catch (error) {
      console.error("Error updating deck:", error);
      res.status(500).json({ message: "Erreur lors de la mise à jour du deck" });
    }
  });

  // Add cards to existing deck
  app.post("/api/decks/:id/cards", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const deckId = parseInt(req.params.id);
      const userId = req.user!.id;
      const { cards } = req.body;

      // Check if deck belongs to user
      const [existingDeck] = await db.select().from(decks).where(eq(decks.id, deckId));
      if (!existingDeck || existingDeck.userId !== userId) {
        return res.status(404).json({ message: "Deck non trouvé" });
      }

      // Get current card count
      const currentCards = await db.select().from(deckCards).where(eq(deckCards.deckId, deckId));
      
      if (currentCards.length + cards.length > 12) {
        return res.status(400).json({ message: "Un deck ne peut contenir que 12 cartes maximum" });
      }

      // Add new cards
      if (cards && cards.length > 0) {
        const newDeckCards = cards.map((card: any, index: number) => ({
          deckId: deckId,
          cardId: card.cardId,
          personalCardId: card.personalCardId,
          position: currentCards.length + index
        }));
        
        await db.insert(deckCards).values(newDeckCards);
        
        // Update deck card count
        await db.update(decks)
          .set({ cardCount: currentCards.length + cards.length })
          .where(eq(decks.id, deckId));
      }

      res.json({ message: "Cartes ajoutées avec succès", cardCount: currentCards.length + cards.length });
    } catch (error) {
      console.error("Error adding cards to deck:", error);
      res.status(500).json({ message: "Erreur lors de l'ajout des cartes" });
    }
  });

  // Reorder deck cards
  app.patch("/api/decks/:id/reorder", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const deckId = parseInt(req.params.id);
      const userId = req.user!.id;
      const { positions } = req.body;

      // Check if deck belongs to user
      const [existingDeck] = await db.select().from(decks).where(eq(decks.id, deckId));
      if (!existingDeck || existingDeck.userId !== userId) {
        return res.status(404).json({ message: "Deck non trouvé" });
      }

      // Update positions
      for (const pos of positions) {
        if (pos.cardId) {
          await db.update(deckCards)
            .set({ position: pos.position })
            .where(and(eq(deckCards.deckId, deckId), eq(deckCards.cardId, pos.cardId)));
        } else if (pos.personalCardId) {
          await db.update(deckCards)
            .set({ position: pos.position })
            .where(and(eq(deckCards.deckId, deckId), eq(deckCards.personalCardId, pos.personalCardId)));
        }
      }

      res.json({ message: "Positions mises à jour avec succès" });
    } catch (error) {
      console.error("Error reordering deck cards:", error);
      res.status(500).json({ message: "Erreur lors de la réorganisation des cartes" });
    }
  });

  // Delete deck
  app.delete("/api/decks/:id", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const deckId = parseInt(req.params.id);
      const userId = req.user!.id;

      // Check if deck belongs to user
      const [existingDeck] = await db.select().from(decks).where(eq(decks.id, deckId));
      if (!existingDeck || existingDeck.userId !== userId) {
        return res.status(404).json({ message: "Deck non trouvé" });
      }

      // Delete deck cards first
      await db.delete(deckCards).where(eq(deckCards.deckId, deckId));
      
      // Delete deck
      await db.delete(decks).where(eq(decks.id, deckId));

      res.json({ message: "Deck supprimé avec succès" });
    } catch (error) {
      console.error("Error deleting deck:", error);
      res.status(500).json({ message: "Erreur lors de la suppression du deck" });
    }
  });

  // Like/Unlike a post
  app.post("/api/posts/:id/like", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const postId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      console.log(`Like request - postId: ${postId}, userId: ${userId}`);
      
      // Vérifier si le post existe
      const post = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
      if (post.length === 0) {
        return res.status(404).json({ message: "Post non trouvé" });
      }
      
      // Vérifier si l'utilisateur a déjà liké
      const existingLike = await db.select().from(postLikes)
        .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)))
        .limit(1);
      
      let liked = false;
      if (existingLike.length > 0) {
        // Unlike - supprimer le like
        console.log(`Removing like for post ${postId} by user ${userId}`);
        await db.delete(postLikes)
          .where(and(eq(postLikes.postId, postId), eq(postLikes.userId, userId)));
        liked = false;
      } else {
        // Like - ajouter le like
        console.log(`Adding like for post ${postId} by user ${userId}`);
        await db.insert(postLikes).values({
          postId,
          userId
        });
        liked = true;
      }

      // Compter le nombre total de likes pour ce post
      const likesCountResult = await db.select({ count: sql<number>`count(*)::int` })
        .from(postLikes)
        .where(eq(postLikes.postId, postId));

      const likesCount = parseInt(likesCountResult[0]?.count?.toString() || '0');
      console.log(`Post ${postId} now has ${likesCount} likes, user ${userId} liked: ${liked}`);

      // Mettre à jour le compteur de likes dans la table posts
      await db.update(posts)
        .set({ likesCount })
        .where(eq(posts.id, postId));

      console.log(`Updated likes_count in posts table for post ${postId}: ${likesCount}`);

      res.json({ liked, likesCount });
    } catch (error) {
      console.error("Erreur lors du like/unlike:", error);
      res.status(500).json({ message: "Erreur interne du serveur" });
    }
  });

  // Get user's liked posts
  app.get("/api/posts/likes", authenticateToken, async (req: AuthRequest, res) => {
    try {
      console.log('GET /api/posts/likes - req.user:', req.user);
      
      if (!req.user) {
        console.log('No user found in request');
        return res.status(404).json({ message: "User not found" });
      }
      
      const userId = req.user.id;
      console.log('Fetching likes for user:', userId);
      
      const userLikes = await db.select({ postId: postLikes.postId })
        .from(postLikes)
        .where(eq(postLikes.userId, userId));
      
      const likedPostIds = userLikes.map((like: any) => like.postId);
      console.log('User likes found:', likedPostIds);
      res.json(likedPostIds);
    } catch (error) {
      console.error("Erreur lors de la récupération des likes:", error);
      res.status(500).json({ message: "Erreur interne du serveur" });
    }
  });

  // Get comments for a post
  app.get("/api/posts/:id/comments", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const postId = parseInt(req.params.id);
      
      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }

      const commentsData = await db.select({
        id: postComments.id,
        content: postComments.content,
        createdAt: postComments.createdAt,
        userId: users.id,
        username: users.username,
        name: users.name,
        avatar: users.avatar
      })
      .from(postComments)
      .innerJoin(users, eq(postComments.userId, users.id))
      .where(eq(postComments.postId, postId))
      .orderBy(desc(postComments.createdAt));

      // Restructurer les données pour inclure l'objet user
      const comments = commentsData.map((comment: any) => ({
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        user: {
          id: comment.userId,
          username: comment.username,
          name: comment.name,
          avatar: comment.avatar
        }
      }));

      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ message: "Erreur interne du serveur" });
    }
  });

  // Add comment to a post
  app.post("/api/posts/:id/comments", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const postId = parseInt(req.params.id);
      const userId = req.user!.id;
      const { content } = req.body;

      if (isNaN(postId)) {
        return res.status(400).json({ message: "Invalid post ID" });
      }

      if (!content || content.trim().length === 0) {
        return res.status(400).json({ message: "Comment content is required" });
      }

      // Vérifier si le post existe
      const post = await db.select().from(posts).where(eq(posts.id, postId)).limit(1);
      if (post.length === 0) {
        return res.status(404).json({ message: "Post not found" });
      }

      // Ajouter le commentaire
      const newComment = await db.insert(postComments).values({
        postId,
        userId,
        content: content.trim()
      }).returning();

      // Récupérer le commentaire avec les infos utilisateur
      const commentWithUser = await db.select({
        id: postComments.id,
        content: postComments.content,
        createdAt: postComments.createdAt,
        user: {
          id: users.id,
          username: users.username,
          name: users.name,
          avatar: users.avatar
        }
      })
      .from(postComments)
      .innerJoin(users, eq(postComments.userId, users.id))
      .where(eq(postComments.id, newComment[0].id))
      .limit(1);

      // Compter le nombre total de commentaires
      const commentsCountResult = await db.select({ count: sql<number>`count(*)::int` })
        .from(postComments)
        .where(eq(postComments.postId, postId));

      const commentsCount = parseInt(commentsCountResult[0]?.count?.toString() || '0');

      // Update the posts table with the new comment count
      await db.update(posts)
        .set({ commentsCount })
        .where(eq(posts.id, postId));

      res.json({
        comment: commentWithUser[0],
        commentsCount
      });
    } catch (error) {
      console.error("Error adding comment:", error);
      res.status(500).json({ message: "Erreur interne du serveur" });
    }
  });

  // ====================
  // NOTIFICATION ROUTES
  // ====================

  // Get user notifications
  app.get("/api/notifications", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const notifications = await storage.getNotifications(userId);
      res.json(notifications);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      res.status(500).json({ message: "Erreur interne du serveur" });
    }
  });

  // Mark notification as read
  app.patch("/api/notifications/:id/read", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const notificationId = parseInt(req.params.id);
      await storage.markNotificationAsRead(notificationId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
      res.status(500).json({ message: "Erreur interne du serveur" });
    }
  });

  // Mark all notifications as read
  app.patch("/api/notifications/read-all", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      await storage.markAllNotificationsAsRead(userId);
      res.json({ success: true });
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      res.status(500).json({ message: "Erreur interne du serveur" });
    }
  });

  // ====================
  // TROPHY ROUTES
  // ====================

  // Get unlocked trophies for user
  app.get("/api/trophies/unlocked", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const trophies = await storage.getUnlockedTrophies(userId);
      res.json(trophies);
    } catch (error) {
      console.error('Error fetching unlocked trophies:', error);
      res.status(500).json({ error: 'Failed to fetch trophies' });
    }
  });

  // Unlock a trophy for user
  app.post("/api/trophies/unlock", authenticateToken, async (req: AuthRequest, res) => {
    try {
      const userId = req.user!.id;
      const { trophyId, category, color } = req.body;
      
      if (!trophyId || !category || !color) {
        return res.status(400).json({ error: 'Trophy ID, category, and color are required' });
      }
      
      const trophy = await storage.unlockTrophy(userId, trophyId, category, color);
      
      if (trophy) {
        // Return success with animation data
        res.json({
          ...trophy,
          isNew: true,
          showAnimation: true
        });
      } else {
        // Trophy already exists
        res.json({
          trophyId,
          category,
          color,
          isNew: false,
          showAnimation: false
        });
      }
    } catch (error) {
      console.error('Error unlocking trophy:', error);
      res.status(500).json({ error: 'Failed to unlock trophy' });
    }
  });

  // Get highest trophy color for user (for avatar halo)
  app.get("/api/users/:id/highest-trophy", optionalAuth, async (req: AuthRequest, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid user ID' });
      }
      
      const color = await storage.getHighestTrophyColor(userId);
      res.json({ color });
    } catch (error) {
      console.error('Error getting highest trophy:', error);
      res.status(500).json({ error: 'Failed to get highest trophy' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
