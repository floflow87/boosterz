import { pgTable, text, serial, integer, boolean, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  name: text("name").notNull(),
  avatar: text("avatar"),
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
  cardNumber: text("card_number").notNull(),
  playerName: text("player_name"),
  teamName: text("team_name"),
  cardType: text("card_type").notNull(), // "base", "insert", "autograph", "numbered"
  cardSubType: text("card_sub_type"), // "breakthrough", "hot_rookies", "intergalactic_hit", etc.
  imageUrl: text("image_url"),
  isOwned: boolean("is_owned").default(false).notNull(),
  isRookieCard: boolean("is_rookie_card").default(false).notNull(),
  rarity: text("rarity"), // "common", "rare", "super_rare", etc.
  serialNumber: text("serial_number"), // pour les cartes numérotées
});

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
  cardNumber: true,
  playerName: true,
  teamName: true,
  cardType: true,
  cardSubType: true,
  imageUrl: true,
  isOwned: true,
  isRookieCard: true,
  rarity: true,
  serialNumber: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type Collection = typeof collections.$inferSelect;
export type InsertCard = z.infer<typeof insertCardSchema>;
export type Card = typeof cards.$inferSelect;
