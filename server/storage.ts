// server/storage.ts

import {
  type User,
  type InsertUser,
  type City,
  type Interest,
  type Trip,
  type InsertTrip,
  type Favorite,
  type InsertFavorite
} from "@shared/schema";

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

  // newly added:
  saveTrip(trip: Trip): Promise<Trip>;
  getTrips(): Promise<Trip[]>;
}

export class MemStorage implements IStorage {
  private users = new Map<number, User>();
  private tripsByUser = new Map<number, Trip[]>();
  private allTrips: Trip[] = [];
  private favoritesByUser = new Map<number, Favorite[]>();
  private currentUserId = 1;
  private currentTripId = 1;
  private currentFavoriteId = 1;

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { id, ...insertUser };
    this.users.set(id, user);
    return user;
  }

  async createTrip(insertTrip: InsertTrip): Promise<Trip> {
    const id = this.currentTripId++;
    const trip: Trip = {
      id,
      userId: insertTrip.userId ?? null,
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
    this.allTrips.unshift(trip);
    if (trip.userId != null) {
      const list = this.tripsByUser.get(trip.userId) || [];
      list.unshift(trip);
      this.tripsByUser.set(trip.userId, list);
    }
    return trip;
  }

  async getTripsByUser(userId: number): Promise<Trip[]> {
    return this.tripsByUser.get(userId) || [];
  }

  async getTrip(id: number): Promise<Trip | undefined> {
    return this.allTrips.find(t => t.id === id);
  }

  async createFavorite(insertFavorite: InsertFavorite): Promise<Favorite> {
    const fav: Favorite = {
      id: this.currentFavoriteId++,
      userId: insertFavorite.userId ?? null,
      createdAt: new Date(),
      itemType: insertFavorite.itemType,
      itemId: insertFavorite.itemId,
      itemData: insertFavorite.itemData
    };
    if (fav.userId != null) {
      const list = this.favoritesByUser.get(fav.userId) || [];
      list.unshift(fav);
      this.favoritesByUser.set(fav.userId, list);
    }
    return fav;
  }

  async getFavoritesByUser(userId: number): Promise<Favorite[]> {
    return this.favoritesByUser.get(userId) || [];
  }

  async deleteFavorite(id: number): Promise<void> {
    this.favoritesByUser.forEach((list: Favorite[], uid: number) => {
      const filtered = list.filter((fav: Favorite) => fav.id !== id);
      this.favoritesByUser.set(uid, filtered);
    });
  }

  async getCities(): Promise<City[]> {
    return [
      { id: 1, name: "Paris", country: "France", description: "", imageUrl: "", latitude: "48.8566", longitude: "2.3522" },
      { id: 2, name: "Rome", country: "Italy", description: "", imageUrl: "", latitude: "41.9028", longitude: "12.4964" },
      // add remaining cities...
    ];
  }

  async getInterests(): Promise<Interest[]> {
    return [
      { id: 1, name: "Museums", category: "culture" },
      { id: 2, name: "Food", category: "culinary" },
      // add remaining interests...
    ];
  }

  async getCityInterests(cityId: number): Promise<any[]> {
    return []; // or hardcode per city
  }

  // Persist or update a full trip
  async saveTrip(trip: Trip): Promise<Trip> {
    const idx = this.allTrips.findIndex(t => t.id === trip.id);
    if (idx >= 0) {
      this.allTrips[idx] = trip;
    } else {
      this.allTrips.unshift(trip);
    }
    if (trip.userId != null) {
      const list = this.tripsByUser.get(trip.userId) || [];
      const i2 = list.findIndex(t => t.id === trip.id);
      if (i2 >= 0) {
        list[i2] = trip;
      } else {
        list.unshift(trip);
      }
      this.tripsByUser.set(trip.userId, list);
    }
    return trip;
  }

  async getTrips(): Promise<Trip[]> {
    return [...this.allTrips];
  }
}

export const storage = new MemStorage();
