import { pgTable, text, serial, integer, boolean, real, timestamp, varchar, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  phone: varchar("phone", { length: 20 }),
  address: text("address"),
  city: varchar("city", { length: 100 }),
  postalCode: varchar("postal_code", { length: 10 }),
  country: varchar("country", { length: 100 }),
  avatar: text("avatar"),
  bio: text("bio"),
  isPublic: boolean("is_public").default(true).notNull(),
  followersCount: integer("followers_count").default(0).notNull(),
  followingCount: integer("following_count").default(0).notNull(),
  totalCards: integer("total_cards").default(0).notNull(),
  collectionsCount: integer("collections_count").default(0).notNull(),
  completionPercentage: real("completion_percentage").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  season: text("season"),
  totalCards: integer("total_cards").notNull(),
  ownedCards: integer("owned_cards").default(0).notNull(),
  completionPercentage: real("completion_percentage").default(0).notNull(),
  imageUrl: text("image_url"),
  backgroundColor: text("background_color").default("#F37261"),
});

export const cards = pgTable("cards", {
  id: serial("id").primaryKey(),
  collectionId: integer("collection_id").notNull(),
  reference: text("reference").notNull(), // Ex: "004" - remplace cardNumber
  playerName: text("player_name"),
  teamName: text("team_name"),
  cardType: text("card_type").notNull(), // "base", "base_numbered", "insert", "autographe", "numbered", "special_1_1"
  cardSubType: text("card_sub_type"), // "breakthrough", "hot_rookies", "intergalactic_hit", etc.
  season: text("season"), // "22/23", "23/24", etc.
  imageUrl: text("image_url"),
  isOwned: boolean("is_owned").default(false).notNull(),
  isForTrade: boolean("is_for_trade").default(false).notNull(),
  isRookieCard: boolean("is_rookie_card").default(false).notNull(),
  rarity: text("rarity"), // "common", "rare", "super_rare", etc.
  serialNumber: text("serial_number"), // pour les cartes numérotées
  numbering: text("numbering"), // Ex: "125/199", "15/25", "1/1"
  baseCardId: integer("base_card_id"), // Référence vers la carte de base pour les variantes
  isVariant: boolean("is_variant").default(false).notNull(),
  variants: text("variants"), // Nom des variantes (ex: "Gold", "Red", "Blue")
  tradeDescription: text("trade_description"), // Description pour trade/vente
  tradePrice: text("trade_price"), // Prix indicatif pour trade/vente
  tradeOnly: boolean("trade_only").default(false).notNull(), // Si true, pas de prix affiché
  salePrice: text("sale_price"), // Prix de vente spécifique
  saleDescription: text("sale_description"), // Description de vente
  isSold: boolean("is_sold").default(false).notNull(), // Carte vendue
  isFeatured: boolean("is_featured").default(false).notNull(), // Carte mise à la une
});

// Table pour les cartes personnelles de l'utilisateur (hors collections)
export const personalCards = pgTable("personal_cards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  playerName: text("player_name"),
  teamName: text("team_name"),
  cardType: text("card_type").notNull(),
  reference: text("reference"),
  numbering: text("numbering"),
  season: text("season"),
  imageUrl: text("image_url"),
  salePrice: text("sale_price"),
  saleDescription: text("sale_description"),
  isForSale: boolean("is_for_sale").default(false).notNull(),
  isSold: boolean("is_sold").default(false).notNull(),
  isForTrade: boolean("is_for_trade").default(false).notNull(),
  tradePrice: text("trade_price"),
  tradeDescription: text("trade_description"),
  tradeOnly: boolean("trade_only").default(false).notNull(),
  condition: text("condition"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userCards = pgTable("user_cards", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  collectionId: integer("collection_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  playerName: text("player_name"),
  teamName: text("team_name"),
  cardType: text("card_type").notNull(),
  cardSubType: text("card_sub_type"),
  rarity: text("rarity"),
  serialNumber: text("serial_number"),
  condition: text("condition"),
  estimatedValue: text("estimated_value"),
  acquisitionDate: timestamp("acquisition_date").defaultNow(),
  notes: text("notes"),
  isForTrade: boolean("is_for_trade").default(false).notNull(),
  isForSale: boolean("is_for_sale").default(false).notNull(),
  images: text("images").array(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Table pour le système de followers
export const follows = pgTable("follows", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull(),
  followingId: integer("following_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Table pour les notifications
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // "like", "comment", "message", "follow"
  title: text("title").notNull(),
  message: text("message").notNull(),
  cardId: integer("card_id"),
  postId: integer("post_id"),
  messageId: integer("message_id"),
  fromUserId: integer("from_user_id"),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Table pour les activités publiques
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // "added_card", "marked_for_trade", "completed_collection"
  cardId: integer("card_id"),
  collectionId: integer("collection_id"),
  metadata: text("metadata"), // JSON pour données supplémentaires
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Chat conversations table
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  user1Id: integer("user1_id").notNull(),
  user2Id: integer("user2_id").notNull(),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Chat messages table
export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull(),
  senderId: integer("sender_id").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// User sessions table for authentication
export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Social network subscriptions table
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  followerId: integer("follower_id").notNull(),
  followingId: integer("following_id").notNull(),
  status: text("status").notNull().default("pending"), // "pending", "accepted", "rejected"
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// User posts table
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull().default("text"), // "text", "image", "card_sale", "card_trade", "card_add"
  cardId: integer("card_id"), // Reference to card if post is about a card
  imageUrl: text("image_url"), // URL or base64 data for images
  images: text("images"), // JSON array of image URLs/base64
  taggedUsers: text("tagged_users"), // JSON array of usernames
  likesCount: integer("likes_count").default(0).notNull(),
  commentsCount: integer("comments_count").default(0).notNull(),
  isVisible: boolean("is_visible").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Post likes table
export const postLikes = pgTable("post_likes", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  uniqueUserPost: unique().on(table.postId, table.userId),
}));

// Post comments table
export const postComments = pgTable("post_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull(),
  userId: integer("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Decks table
export const decks = pgTable("decks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  coverImage: text("cover_image"), // URL or base64 for custom cover
  bannerPosition: integer("banner_position").default(50), // Position verticale de la bannière en %
  themeColors: text("theme_colors").notNull().default("main+background"), // "main+background", "white+sky", "red+navy", "navy+gold", "white+touch", "white+blue"
  backgroundColor: text("background_color").default("#1A2332").notNull(),
  accentColor: text("accent_color").default("#F37261").notNull(),
  isPublic: boolean("is_public").default(true).notNull(),
  cardCount: integer("card_count").default(0).notNull(), // max 12
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Deck cards junction table
export const deckCards = pgTable("deck_cards", {
  id: serial("id").primaryKey(),
  deckId: integer("deck_id").notNull(),
  cardId: integer("card_id"), // Reference to card from collections
  personalCardId: integer("personal_card_id"), // Reference to personal card
  position: integer("position").notNull(), // 0-11 for ordering
  createdAt: timestamp("created_at").defaultNow().notNull(),
});



// Relations
export const usersRelations = relations(users, ({ many }) => ({
  collections: many(collections),
  userCards: many(userCards),
  personalCards: many(personalCards),
  followers: many(follows, { relationName: "followers" }),
  following: many(follows, { relationName: "following" }),
  subscriptionFollowers: many(subscriptions, { relationName: "subscriptionFollowers" }),
  subscriptionFollowing: many(subscriptions, { relationName: "subscriptionFollowing" }),
  notifications: many(notifications),
  activities: many(activities),
  posts: many(posts),
  decks: many(decks),
}));

export const followsRelations = relations(follows, ({ one }) => ({
  follower: one(users, {
    fields: [follows.followerId],
    references: [users.id],
    relationName: "followers",
  }),
  following: one(users, {
    fields: [follows.followingId],
    references: [users.id],
    relationName: "following",
  }),
}));



export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
  fromUser: one(users, {
    fields: [notifications.fromUserId],
    references: [users.id],
  }),
  card: one(cards, {
    fields: [notifications.cardId],
    references: [cards.id],
  }),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
  card: one(cards, {
    fields: [activities.cardId],
    references: [cards.id],
  }),
  collection: one(collections, {
    fields: [activities.collectionId],
    references: [collections.id],
  }),
}));

export const collectionsRelations = relations(collections, ({ one, many }) => ({
  user: one(users, {
    fields: [collections.userId],
    references: [users.id],
  }),
  cards: many(cards),
  userCards: many(userCards),
}));

export const cardsRelations = relations(cards, ({ one, many }) => ({
  collection: one(collections, {
    fields: [cards.collectionId],
    references: [collections.id],
  }),
  baseCard: one(cards, {
    fields: [cards.baseCardId],
    references: [cards.id],
    relationName: "cardVariants",
  }),
  variants: many(cards, {
    relationName: "cardVariants",
  }),
}));

export const personalCardsRelations = relations(personalCards, ({ one }) => ({
  user: one(users, {
    fields: [personalCards.userId],
    references: [users.id],
  }),
}));

export const userCardsRelations = relations(userCards, ({ one }) => ({
  user: one(users, {
    fields: [userCards.userId],
    references: [users.id],
  }),
  collection: one(collections, {
    fields: [userCards.collectionId],
    references: [collections.id],
  }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  user1: one(users, {
    fields: [conversations.user1Id],
    references: [users.id],
    relationName: "user1Conversations",
  }),
  user2: one(users, {
    fields: [conversations.user2Id],
    references: [users.id],
    relationName: "user2Conversations",
  }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, {
    fields: [messages.conversationId],
    references: [conversations.id],
  }),
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const decksRelations = relations(decks, ({ one, many }) => ({
  user: one(users, {
    fields: [decks.userId],
    references: [users.id],
  }),
  deckCards: many(deckCards),
}));

export const deckCardsRelations = relations(deckCards, ({ one }) => ({
  deck: one(decks, {
    fields: [deckCards.deckId],
    references: [decks.id],
  }),
  card: one(cards, {
    fields: [deckCards.cardId],
    references: [cards.id],
  }),
  personalCard: one(personalCards, {
    fields: [deckCards.personalCardId],
    references: [personalCards.id],
  }),
}));



export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  phone: true,
  address: true,
  city: true,
  postalCode: true,
  country: true,
  avatar: true,
  bio: true,
});

export const insertConversationSchema = createInsertSchema(conversations).pick({
  user1Id: true,
  user2Id: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  conversationId: true,
  senderId: true,
  content: true,
});

export const insertSessionSchema = createInsertSchema(sessions).pick({
  userId: true,
  token: true,
  expiresAt: true,
});

export const insertCollectionSchema = createInsertSchema(collections).pick({
  userId: true,
  name: true,
  season: true,
  totalCards: true,
  imageUrl: true,
  backgroundColor: true,
});

export const insertCardSchema = createInsertSchema(cards).pick({
  collectionId: true,
  reference: true,
  playerName: true,
  teamName: true,
  cardType: true,
  cardSubType: true,
  season: true,
  imageUrl: true,
  isOwned: true,
  isRookieCard: true,
  rarity: true,
  serialNumber: true,
  numbering: true,
  baseCardId: true,
  isVariant: true,
  variants: true,
});

export const insertUserCardSchema = createInsertSchema(userCards).pick({
  userId: true,
  collectionId: true,
  title: true,
  description: true,
  playerName: true,
  teamName: true,
  cardType: true,
  cardSubType: true,
  rarity: true,
  serialNumber: true,
  condition: true,
  estimatedValue: true,
  acquisitionDate: true,
  notes: true,
  isForTrade: true,
  isForSale: true,
  images: true,
});

export const insertPersonalCardSchema = createInsertSchema(personalCards).pick({
  userId: true,
  playerName: true,
  teamName: true,
  cardType: true,
  reference: true,
  numbering: true,
  season: true,
  imageUrl: true,
  salePrice: true,
  saleDescription: true,
  isForSale: true,
  isForTrade: true,
  tradePrice: true,
  tradeDescription: true,
  tradeOnly: true,
  condition: true,
}).extend({
  // Rendre la plupart des champs optionnels sauf userId et cardType
  playerName: z.string().optional(),
  teamName: z.string().optional(),
  reference: z.string().nullable().optional(),
  numbering: z.string().optional(),
  season: z.string().optional(),
  imageUrl: z.string().optional(),
  salePrice: z.string().nullable().optional(),
  saleDescription: z.string().nullable().optional(),
  tradePrice: z.string().nullable().optional(),
  tradeDescription: z.string().nullable().optional(),
  condition: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type Collection = typeof collections.$inferSelect;
export type InsertCard = z.infer<typeof insertCardSchema>;
export type Card = typeof cards.$inferSelect;
export type InsertPersonalCard = z.infer<typeof insertPersonalCardSchema>;
export type PersonalCard = typeof personalCards.$inferSelect;
export type InsertUserCard = z.infer<typeof insertUserCardSchema>;
export type UserCard = typeof userCards.$inferSelect;

// Types pour les nouvelles tables sociales
export type Follow = typeof follows.$inferSelect;
export type InsertFollow = typeof follows.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = typeof activities.$inferInsert;

// Chat types
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversations.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Session types
export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

// Subscription schemas
export const insertSubscriptionSchema = createInsertSchema(subscriptions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type Subscription = typeof subscriptions.$inferSelect;

// Post schemas
export const insertPostSchema = createInsertSchema(posts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;

// Post likes and comments types
export type PostLike = typeof postLikes.$inferSelect;
export type InsertPostLike = typeof postLikes.$inferInsert;
export type PostComment = typeof postComments.$inferSelect;
export type InsertPostComment = typeof postComments.$inferInsert;

// Comment type for UI
export interface Comment {
  id: number;
  postId: number;
  userId: number;
  content: string;
  userName?: string;
  userAvatar?: string;
  createdAt: string;
  updatedAt?: string;
}

// Deck schemas
export const insertDeckSchema = createInsertSchema(decks).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertDeckCardSchema = createInsertSchema(deckCards).omit({
  id: true,
  createdAt: true,
});

export type InsertDeck = z.infer<typeof insertDeckSchema>;
export type Deck = typeof decks.$inferSelect;
export type InsertDeckCard = z.infer<typeof insertDeckCardSchema>;
export type DeckCard = typeof deckCards.$inferSelect;


