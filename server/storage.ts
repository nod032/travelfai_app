import { users, trips, favorites, type User, type InsertUser, type Trip, type InsertTrip, type Favorite, type InsertFavorite } from "@shared/schema";

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
      tripDays: insertTrip.tripDays,
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
}

export const storage = new MemStorage();
