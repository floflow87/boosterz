import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import authRoutes from "./authRoutes";
import chatRoutes from "./chatRoutes";
import { authenticateToken, optionalAuth, type AuthRequest } from "./auth";
import { CardRecognitionEngine } from "./cardRecognition";

export async function registerRoutes(app: Express): Promise<Server> {
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

  // Get cards in collection
  app.get("/api/collections/:id/cards", async (req, res) => {
    try {
      const collectionId = parseInt(req.params.id);
      const cards = await storage.getCardsByCollectionId(collectionId);
      res.json(cards);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Get marketplace cards (cards for trade/sale)
  app.get("/api/cards/marketplace", async (req, res) => {
    try {
      // Get all cards that are marked for trade
      const allCards = await storage.getCardsByCollectionId(1); // For now, get from first collection
      const marketplaceCards = allCards.filter(card => card.isForTrade);
      res.json(marketplaceCards);
    } catch (error) {
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
      // Mock data for activities
      const activities = [
        {
          id: 1,
          type: "added_card",
          user: {
            id: 2,
            username: "maxcollector",
            name: "Max Dubois"
          },
          card: {
            id: 123,
            reference: "045",
            playerName: "Kylian Mbappé",
            teamName: "Paris Saint-Germain",
            imageUrl: null
          },
          createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString()
        },
        {
          id: 2,
          type: "marked_for_trade",
          user: {
            id: 3,
            username: "cardmaster",
            name: "Julie Martin"
          },
          card: {
            id: 124,
            reference: "078",
            playerName: "Neymar Jr",
            teamName: "Paris Saint-Germain",
            imageUrl: null
          },
          createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 3,
          type: "completed_collection",
          user: {
            id: 4,
            username: "psgfan",
            name: "Thomas Leroy"
          },
          collection: {
            id: 1,
            name: "Score Ligue 1 2023"
          },
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
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

  // Update card trade information
  app.post("/api/cards/:id/trade", async (req, res) => {
    try {
      const cardId = parseInt(req.params.id);
      const { tradeDescription, tradePrice, tradeOnly, isForTrade } = req.body;
      
      // For now, just update the basic card properties we can handle
      const card = await storage.updateCard(cardId, {
        isForTrade: isForTrade || false
      });
      
      if (!card) {
        return res.status(404).json({ message: "Card not found" });
      }
      
      res.json(card);
    } catch (error) {
      console.error("Error updating card trade info:", error);
      res.status(500).json({ message: "Failed to update card trade info" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
