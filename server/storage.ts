import { 
  users, collections, cards, userCards, personalCards, conversations, messages, 
  posts, activities, follows, decks, deckCards, postLikes, postComments, type User, type InsertUser,
  type Collection, type InsertCollection, type Card, type InsertCard,
  type UserCard, type InsertUserCard, type PersonalCard, type InsertPersonalCard,
  type Conversation, type InsertConversation, type Message, type InsertMessage,
  type Post, type Activity, type Follow, type Deck, type DeckCard
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, sql, desc, asc, inArray } from "drizzle-orm";

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
  getAllPersonalCards(): Promise<PersonalCard[]>;
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

  async getCardsByCollectionId(collectionId: number): Promise<Card[]> {
    return await db.select().from(cards).where(eq(cards.collectionId, collectionId));
  }

  async getCard(id: number): Promise<Card | undefined> {
    const [card] = await db.select().from(cards).where(eq(cards.id, id));
    return card || undefined;
  }

  async getAllCards(): Promise<Card[]> {
    return await db.select().from(cards);
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
    return (result.rowCount || 0) > 0;
  }

  async getPersonalCardsByUserId(userId: number): Promise<PersonalCard[]> {
    return await db.select().from(personalCards).where(eq(personalCards.userId, userId));
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
    const [newMessage] = await db
      .insert(messages)
      .values({
        conversationId: message.conversationId,
        senderId: message.senderId,
        content: message.content,
        isRead: false
      })
      .returning();

    // Update last message timestamp in conversation
    await db
      .update(conversations)
      .set({ lastMessageAt: new Date() })
      .where(eq(conversations.id, message.conversationId));

    return newMessage;
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
}

export const storage = new DatabaseStorage();