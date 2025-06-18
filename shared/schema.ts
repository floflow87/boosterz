import { pgTable, text, serial, integer, boolean, real, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  name: text("name").notNull(),
  avatar: text("avatar"),
  bio: text("bio"),
  isPublic: boolean("is_public").default(true).notNull(),
  followersCount: integer("followers_count").default(0).notNull(),
  followingCount: integer("following_count").default(0).notNull(),
  totalCards: integer("total_cards").default(0).notNull(),
  collectionsCount: integer("collections_count").default(0).notNull(),
  completionPercentage: real("completion_percentage").default(0).notNull(),
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
  cardType: text("card_type").notNull(), // "base", "base_numbered", "insert", "autograph", "numbered", "special_1_1"
  cardSubType: text("card_sub_type"), // "breakthrough", "hot_rookies", "intergalactic_hit", etc.
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
  type: text("type").notNull(), // "new_card", "card_for_trade", "new_follower"
  title: text("title").notNull(),
  message: text("message").notNull(),
  cardId: integer("card_id"),
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

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  collections: many(collections),
  userCards: many(userCards),
  followers: many(follows, { relationName: "followers" }),
  following: many(follows, { relationName: "following" }),
  notifications: many(notifications),
  activities: many(activities),
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

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  name: true,
  avatar: true,
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

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type Collection = typeof collections.$inferSelect;
export type InsertCard = z.infer<typeof insertCardSchema>;
export type Card = typeof cards.$inferSelect;
export type InsertUserCard = z.infer<typeof insertUserCardSchema>;
export type UserCard = typeof userCards.$inferSelect;

// Types pour les nouvelles tables sociales
export type Follow = typeof follows.$inferSelect;
export type InsertFollow = typeof follows.$inferInsert;
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = typeof activities.$inferInsert;
