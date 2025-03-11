import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password"),  // Make password optional for OAuth users
  googleId: text("google_id").unique(),  // Add Google ID field
  email: text("email").unique(),  // Add email field
  qualtricsApiToken: text("qualtrics_api_token"),
  qualtricsDatacenter: text("qualtrics_datacenter"),
  qualtricsBrandId: text("qualtrics_brand_id"),
  tokenBalance: integer("token_balance").default(10000).notNull(),  // Start with 10k tokens
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chats = pgTable("chats", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  messages: jsonb("messages").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const surveys = pgTable("surveys", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  qualtricsId: text("qualtrics_id").notNull(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const qualtricsSettingsSchema = z.object({
  qualtricsApiToken: z.string().min(1, "API Token is required"),
  qualtricsDatacenter: z.string().min(1, "Datacenter is required"),
  qualtricsBrandId: z.string().min(1, "Brand ID is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Chat = typeof chats.$inferSelect;
export type Survey = typeof surveys.$inferSelect;