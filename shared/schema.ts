import { pgTable, text, serial, integer, boolean, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const cities = pgTable("cities", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  latitude: text("latitude"),
  longitude: text("longitude"),
});

export const interests = pgTable("interests", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category"),
});

export const cityInterests = pgTable("city_interests", {
  id: serial("id").primaryKey(),
  cityId: integer("city_id").references(() => cities.id),
  interestId: integer("interest_id").references(() => interests.id),
  relevanceScore: integer("relevance_score"),
});

export const userInterests = pgTable("user_interests", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  interestId: integer("interest_id").references(() => interests.id),
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
  itemType: text("item_type").notNull(),
  itemId: text("item_id").notNull(),
  itemData: json("item_data").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
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

export interface CityRecommendation {
  cityName: string;
  recommendations: string;
  highlights: string[];
}

export const cityRecommendationSchema = z.object({
  cityName: z.string(),
  recommendations: z.string(),
  highlights: z.array(z.string()),
});

export const cityRecommendationRequestSchema = z.object({
  cityName: z.string(),
  userInterests: z.array(z.string()),
  budget: z.number(),
  duration: z.number(),
});

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

export const insertCitySchema = createInsertSchema(cities).omit({
  id: true,
});

export const insertInterestSchema = createInsertSchema(interests).omit({
  id: true,
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
export type City = typeof cities.$inferSelect;
export type InsertCity = z.infer<typeof insertCitySchema>;
export type Interest = typeof interests.$inferSelect;
export type InsertInterest = z.infer<typeof insertInterestSchema>;
export type Trip = typeof trips.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
