import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, json, integer, index, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Category enum for closet items (ALL is UI-only, not stored in DB)
export const itemCategoryEnum = pgEnum("item_category", ["TOPS", "BOTTOMS", "DRESSES", "SHOES", "ACCESSORIES"]);

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: json("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const items = pgTable("items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  photoURL: text("photo_url").notNull(),
  mediaType: text("media_type").notNull().default("photo"), // photo, video
  title: text("title"),
  dateAdded: timestamp("date_added").notNull().defaultNow(),
  memoryNote: text("memory_note"),
  tags: text("tags").array().default([]),
  clothingLinks: json("clothing_links").default([]), // Array of {name: string, url: string, timestamp?: number}
  visibility: text("visibility").notNull().default("private"), // private, friends, public
  postedAt: timestamp("posted_at"),
  scheduledDay: timestamp("scheduled_day"),
  category: itemCategoryEnum("category").notNull().default("TOPS"),
  subCategory: text("sub_category"),
  confidence: integer("confidence"), // AI classification confidence 0-100
  classificationSource: text("classification_source"), // 'AI' | 'USER' | null
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (table) => [
  index("idx_items_user_category_created").on(table.userId, table.category, table.createdAt),
]);

export const polls = pgTable("polls", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  title: text("title").notNull(),
  itemIds: text("item_ids").array().notNull(),
  votes: json("votes").default({}),
  shareLink: text("share_link").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pollVotes = pgTable("poll_votes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  pollId: varchar("poll_id").notNull(),
  voterIdentifier: text("voter_identifier").notNull(), // IP or session ID for anonymous voting
  selectedItemId: varchar("selected_item_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const friendRequests = pgTable("friend_requests", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromUserId: varchar("from_user_id").notNull(),
  toUserId: varchar("to_user_id").notNull(),
  status: text("status").notNull().default("pending"), // pending, accepted, declined
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const friends = pgTable("friends", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  friendId: varchar("friend_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const wishlistItems = pgTable("wishlist_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  name: text("name").notNull(),
  brand: text("brand"),
  store: text("store"),
  price: text("price"),
  imageUrl: text("image_url"),
  productUrl: text("product_url"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const upsertUserSchema = createInsertSchema(users).pick({
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  profileImageUrl: true,
});

export const clothingLinkSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  timestamp: z.number().optional(), // For videos: timestamp in seconds when item appears
});

// Category values for items (ALL is UI-only)
export const ITEM_CATEGORIES = ["TOPS", "BOTTOMS", "DRESSES", "SHOES", "ACCESSORIES"] as const;
export type ItemCategory = typeof ITEM_CATEGORIES[number];

export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  dateAdded: true,
  postedAt: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  userId: z.string(),
  photoURL: z.string(),
  mediaType: z.enum(["photo", "video"]).default("photo"),
  title: z.string().optional(),
  memoryNote: z.string().optional(),
  tags: z.array(z.string()).optional(),
  clothingLinks: z.array(clothingLinkSchema).optional(),
  visibility: z.enum(["private", "friends", "public"]).default("private"),
  category: z.enum(ITEM_CATEGORIES).default("TOPS"),
  subCategory: z.string().optional(),
  confidence: z.number().min(0).max(100).optional(),
  classificationSource: z.enum(["AI", "USER"]).optional(),
});

export const insertPollSchema = createInsertSchema(polls).omit({
  id: true,
  shareLink: true,
  createdAt: true,
  votes: true,
}).extend({
  userId: z.string(),
  title: z.string(),
  itemIds: z.array(z.string()).min(2).max(3),
});

export const insertPollVoteSchema = createInsertSchema(pollVotes).omit({
  id: true,
  createdAt: true,
}).extend({
  pollId: z.string(),
  voterIdentifier: z.string(),
  selectedItemId: z.string(),
});

export const insertFriendRequestSchema = createInsertSchema(friendRequests).omit({
  id: true,
  status: true,
  createdAt: true,
}).extend({
  fromUserId: z.string(),
  toUserId: z.string(),
});

export const insertFriendSchema = createInsertSchema(friends).omit({
  id: true,
  createdAt: true,
}).extend({
  userId: z.string(),
  friendId: z.string(),
});

export const insertWishlistItemSchema = createInsertSchema(wishlistItems).omit({
  id: true,
  createdAt: true,
}).extend({
  userId: z.string(),
  name: z.string().min(1),
  brand: z.string().optional(),
  store: z.string().optional(),
  price: z.string().optional(),
  imageUrl: z.string().optional(),
  productUrl: z.string().optional(),
  notes: z.string().optional(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertItem = z.infer<typeof insertItemSchema>;
export type Item = typeof items.$inferSelect;
export type InsertPoll = z.infer<typeof insertPollSchema>;
export type Poll = typeof polls.$inferSelect;
export type InsertPollVote = z.infer<typeof insertPollVoteSchema>;
export type PollVote = typeof pollVotes.$inferSelect;
export type InsertFriendRequest = z.infer<typeof insertFriendRequestSchema>;
export type FriendRequest = typeof friendRequests.$inferSelect;
export type InsertFriend = z.infer<typeof insertFriendSchema>;
export type Friend = typeof friends.$inferSelect;
export type InsertWishlistItem = z.infer<typeof insertWishlistItemSchema>;
export type WishlistItem = typeof wishlistItems.$inferSelect;
