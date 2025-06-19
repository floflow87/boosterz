import { Router } from 'express';
import { authenticateToken, type AuthRequest } from './auth';
import { storage } from './storage';
import { insertConversationSchema, insertMessageSchema } from '@shared/schema';
import { z } from 'zod';

const router = Router();

// Get all conversations for current user
router.get('/conversations', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const conversations = await storage.getConversations(userId);
    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des conversations' });
  }
});

// Get or create conversation between two users
router.post('/conversations', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { otherUserId } = z.object({ otherUserId: z.number() }).parse(req.body);
    const currentUserId = req.user!.id;

    if (currentUserId === otherUserId) {
      return res.status(400).json({ message: 'Impossible de créer une conversation avec soi-même' });
    }

    // Check if conversation already exists
    let conversation = await storage.getConversation(currentUserId, otherUserId);
    
    if (!conversation) {
      // Create new conversation
      conversation = await storage.createConversation({
        user1Id: Math.min(currentUserId, otherUserId),
        user2Id: Math.max(currentUserId, otherUserId),
      });
    }

    res.json(conversation);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Données invalides', errors: error.errors });
    }
    console.error('Create conversation error:', error);
    res.status(500).json({ message: 'Erreur lors de la création de la conversation' });
  }
});

// Get messages for a conversation
router.get('/conversations/:conversationId/messages', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    const userId = req.user!.id;

    // Verify user is part of this conversation
    const conversation = await storage.getConversation(userId, 0); // This needs to be updated to check if user is in conversation
    
    const messages = await storage.getMessages(conversationId);
    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Erreur lors de la récupération des messages' });
  }
});

// Send a message
router.post('/conversations/:conversationId/messages', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    const { content } = z.object({ content: z.string().min(1) }).parse(req.body);
    const senderId = req.user!.id;

    const message = await storage.createMessage({
      conversationId,
      senderId,
      content,
    });

    res.status(201).json(message);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Données invalides', errors: error.errors });
    }
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Erreur lors de l\'envoi du message' });
  }
});

// Mark messages as read
router.put('/conversations/:conversationId/read', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const conversationId = parseInt(req.params.conversationId);
    const userId = req.user!.id;

    await storage.markMessagesAsRead(conversationId, userId);
    res.json({ message: 'Messages marqués comme lus' });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ message: 'Erreur lors du marquage des messages' });
  }
});

export default router;