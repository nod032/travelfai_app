import { users, cities, interests, cityInterests, trips, favorites, type User, type InsertUser, type City, type Interest, type Trip, type InsertTrip, type Favorite, type InsertFavorite } from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createTrip(trip: InsertTrip): Promise<Trip>;
  getTripsByUser(userId: number): Promise<Trip[]>;
  getTrip(id: number): Promise<Trip | undefined>;
  createFavorite(favorite: InsertFavorite): Promise<Favorite>;
  getFavoritesByUser(userId: number): Promise<Favorite[]>;
  deleteFavorite(id: number): Promise<void>;
  getCities(): Promise<City[]>;
  getInterests(): Promise<Interest[]>;
  getCityInterests(cityId: number): Promise<any[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private trips: Map<number, Trip>;
  private favorites: Map<number, Favorite>;
  private currentUserId: number;
  private currentTripId: number;
  private currentFavoriteId: number;

  constructor() {
    this.users = new Map();
    this.trips = new Map();
    this.favorites = new Map();
    this.currentUserId = 1;
    this.currentTripId = 1;
    this.currentFavoriteId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async createTrip(insertTrip: InsertTrip): Promise<Trip> {
    const id = this.currentTripId++;
    const trip: Trip = { 
      id,
      userId: null,
      createdAt: new Date(),
      origin: insertTrip.origin,
      duration: insertTrip.duration,
      budget: insertTrip.budget,
      transportPreferences: insertTrip.transportPreferences as string[],
      interests: insertTrip.interests as string[],
      departureDate: insertTrip.departureDate,
      tripDays: insertTrip.tripDays as any,
      totalCost: insertTrip.totalCost,
      totalTravelTime: insertTrip.totalTravelTime,
      remainingBudget: insertTrip.remainingBudget
    };
    this.trips.set(id, trip);
    return trip;
  }

  async getTripsByUser(userId: number): Promise<Trip[]> {
    return Array.from(this.trips.values()).filter(
      (trip) => trip.userId === userId,
    );
  }

  async getTrip(id: number): Promise<Trip | undefined> {
    return this.trips.get(id);
  }

  async createFavorite(insertFavorite: InsertFavorite): Promise<Favorite> {
    const id = this.currentFavoriteId++;
    const favorite: Favorite = {
      id,
      userId: null,
      createdAt: new Date(),
      itemType: insertFavorite.itemType,
      itemId: insertFavorite.itemId,
      itemData: insertFavorite.itemData
    };
    this.favorites.set(id, favorite);
    return favorite;
  }

  async getFavoritesByUser(userId: number): Promise<Favorite[]> {
    return Array.from(this.favorites.values()).filter(
      (favorite) => favorite.userId === userId,
    );
  }

  async deleteFavorite(id: number): Promise<void> {
    this.favorites.delete(id);
  }

  async getCities(): Promise<City[]> {
    // Return sample European cities for the travel planner
    return [
      { id: 1, name: "Paris", country: "France", description: "City of Light", imageUrl: "", latitude: "48.8566", longitude: "2.3522" },
      { id: 2, name: "Rome", country: "Italy", description: "Eternal City", imageUrl: "", latitude: "41.9028", longitude: "12.4964" },
      { id: 3, name: "Barcelona", country: "Spain", description: "Mediterranean charm", imageUrl: "", latitude: "41.3851", longitude: "2.1734" },
      { id: 4, name: "Amsterdam", country: "Netherlands", description: "Canal city", imageUrl: "", latitude: "52.3676", longitude: "4.9041" },
      { id: 5, name: "Prague", country: "Czech Republic", description: "Golden city", imageUrl: "", latitude: "50.0755", longitude: "14.4378" },
      { id: 6, name: "Vienna", country: "Austria", description: "Imperial city", imageUrl: "", latitude: "48.2082", longitude: "16.3738" },
      { id: 7, name: "Berlin", country: "Germany", description: "Cultural hub", imageUrl: "", latitude: "52.5200", longitude: "13.4050" },
      { id: 8, name: "London", country: "United Kingdom", description: "Historic capital", imageUrl: "", latitude: "51.5074", longitude: "-0.1278" }
    ];
  }

  async getInterests(): Promise<Interest[]> {
    // Return sample interests for travel planning
    return [
      { id: 1, name: "Art & Culture", category: "cultural" },
      { id: 2, name: "Food & Dining", category: "culinary" },
      { id: 3, name: "Nightlife", category: "entertainment" },
      { id: 4, name: "Museums", category: "cultural" },
      { id: 5, name: "Architecture", category: "cultural" },
      { id: 6, name: "Shopping", category: "leisure" },
      { id: 7, name: "Parks & Nature", category: "outdoor" },
      { id: 8, name: "History", category: "cultural" },
      { id: 9, name: "Music", category: "entertainment" },
      { id: 10, name: "Photography", category: "leisure" }
    ];
  }

  async getCityInterests(cityId: number): Promise<any[]> {
    return [];
  }
}

import { db } from './db';
import { eq } from 'drizzle-orm';

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createTrip(insertTrip: InsertTrip): Promise<Trip> {
    const [trip] = await db.insert(trips).values({
      ...insertTrip,
      transportPreferences: insertTrip.transportPreferences as any,
      interests: insertTrip.interests as any,
      tripDays: insertTrip.tripDays as any
    }).returning();
    return trip;
  }

  async getTripsByUser(userId: number): Promise<Trip[]> {
    return await db.select().from(trips).where(eq(trips.userId, userId));
  }

  async getTrip(id: number): Promise<Trip | undefined> {
    const [trip] = await db.select().from(trips).where(eq(trips.id, id));
    return trip || undefined;
  }

  async createFavorite(insertFavorite: InsertFavorite): Promise<Favorite> {
    const [favorite] = await db.insert(favorites).values(insertFavorite).returning();
    return favorite;
  }

  async getFavoritesByUser(userId: number): Promise<Favorite[]> {
    return await db.select().from(favorites).where(eq(favorites.userId, userId));
  }

  async deleteFavorite(id: number): Promise<void> {
    await db.delete(favorites).where(eq(favorites.id, id));
  }

  async getCities(): Promise<City[]> {
    return await db.select().from(cities);
  }

  async getInterests(): Promise<Interest[]> {
    return await db.select().from(interests);
  }

  async getCityInterests(cityId: number): Promise<any[]> {
    return await db.select({
      interest: interests,
      relevanceScore: cityInterests.relevanceScore
    })
    .from(cityInterests)
    .innerJoin(interests, eq(cityInterests.interestId, interests.id))
    .where(eq(cityInterests.cityId, cityId));
  }
}

// Use database storage for production data
export const storage = new DatabaseStorage();
