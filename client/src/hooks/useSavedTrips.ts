import { useState, useEffect } from "react";
import type { TripResponse } from "@shared/schema";

export interface SavedTrip extends TripResponse {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = "travelai_saved_trips";
const MAX_SAVED_TRIPS = 20;

export function useSavedTrips() {
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setSavedTrips(JSON.parse(stored));
      } catch (error) {
        console.error("Error parsing saved trips:", error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const saveTripsToStorage = (trips: SavedTrip[]) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
  };

  const saveTrip = (tripResult: TripResponse, name?: string): SavedTrip => {
    const generatedName = name ?? generateTripName(tripResult);
    const now = new Date().toISOString();

    const savedTrip: SavedTrip = {
      ...tripResult,
      id: `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: generatedName,
      createdAt: now,
      updatedAt: now,
    };

    setSavedTrips((prev) => {
      const newTrips = [savedTrip, ...prev].slice(0, MAX_SAVED_TRIPS);
      saveTripsToStorage(newTrips);
      return newTrips;
    });

    return savedTrip;
  };

  const updateTrip = (tripId: string, updates: Partial<SavedTrip>) => {
    setSavedTrips((prev) => {
      const newTrips = prev.map((trip) =>
        trip.id === tripId ? { ...trip, ...updates, updatedAt: new Date().toISOString() } : trip
      );
      saveTripsToStorage(newTrips);
      return newTrips;
    });
  };

  const deleteTrip = (tripId: string) => {
    setSavedTrips((prev) => {
      const newTrips = prev.filter((trip) => trip.id !== tripId);
      saveTripsToStorage(newTrips);
      return newTrips;
    });
  };

  const getTrip = (tripId: string): SavedTrip | undefined => {
    return savedTrips.find((trip) => trip.id === tripId);
  };

  const duplicateTrip = (tripId: string): SavedTrip | null => {
    const original = getTrip(tripId);
    if (!original) return null;

    const copy: SavedTrip = {
      ...original,
      id: `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${original.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSavedTrips((prev) => {
      const newTrips = [copy, ...prev].slice(0, MAX_SAVED_TRIPS);
      saveTripsToStorage(newTrips);
      return newTrips;
    });

    return copy;
  };

  const clearSavedTrips = () => {
    setSavedTrips([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Helper: new naming logic
  function generateTripName(trip: TripResponse): string {
    const cities = Array.from(new Set(trip.tripDays.map((d) => d.city)));
    const days = trip.tripDays.length;

    if (cities.length === 1) {
      return `${capitalize(cities[0])} (${days} days)`;
    }
    if (cities.length === 2) {
      return `${capitalize(cities[0])} & ${capitalize(cities[1])} (${days} days)`;
    }
    // 3+ cities: use first→last
    const first = capitalize(cities[0]);
    const last = capitalize(cities[cities.length - 1]);
    return `${first}→${last} (${cities.length} cities, ${days} days)`;
  }

  function capitalize(s: string) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  return {
    savedTrips,
    saveTrip,
    updateTrip,
    deleteTrip,
    getTrip,
    duplicateTrip,
    clearSavedTrips,
  };
}
