import { pgTable, text, serial, integer, boolean, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  origin: text("origin").notNull(),
  duration: integer("duration").notNull(),
  budget: integer("budget").notNull(),
  transportPreferences: json("transport_preferences").$type<string[]>().notNull(),
  interests: json("interests").$type<string[]>().notNull(),
  departureDate: text("departure_date").notNull(),
  tripDays: json("trip_days").$type<TripDay[]>().notNull(),
  totalCost: integer("total_cost").notNull(),
  totalTravelTime: integer("total_travel_time").notNull(),
  remainingBudget: integer("remaining_budget").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  itemType: text("item_type").notNull(), // 'activity' or 'transport'
  itemId: text("item_id").notNull(),
  itemData: json("item_data").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// TypeScript interfaces for the trip recommendation system
export interface TransportOption {
  mode: string;
  durationHrs: number;
  cost: number;
  departureTime?: string;
  arrivalTime?: string;
}

export interface Poi {
  id: string;
  name: string;
  category: string;
  popularityScore: number;
  description?: string;
  duration?: number;
}

export interface TripDay {
  day: number;
  city: string;
  date: string;
  transport?: {
    from: string;
    to: string;
    option: TransportOption;
  };
  activities: Array<{
    id: string;
    name: string;
    category: string;
    time: string;
    duration?: number;
  }>;
  dailyCost: number;
}

export interface TripRequest {
  origin: string;
  durationDays: number;
  maxBudget: number;
  transportPreference: string[];
  interests: string[];
  departureDate: string;
}

export interface TripResponse {
  tripDays: TripDay[];
  totalCost: number;
  totalTravelTime: number;
  remainingBudget: number;
}

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertTripSchema = createInsertSchema(trips).omit({
  id: true,
  createdAt: true,
  userId: true,
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
  userId: true,
});

export const tripRequestSchema = z.object({
  origin: z.string().min(1, "Origin city is required"),
  durationDays: z.number().min(1).max(30),
  maxBudget: z.number().min(100),
  transportPreference: z.array(z.string()).min(1, "Select at least one transport option"),
  interests: z.array(z.string()).min(1, "Select at least one interest"),
  departureDate: z.string().min(1, "Departure date is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Trip = typeof trips.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
