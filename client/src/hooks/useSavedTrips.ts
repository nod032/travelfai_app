import { useState, useEffect } from "react";
import type { TripResponse } from "@shared/schema";

export interface SavedTrip extends TripResponse {
  id: string;
  name?: string;
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
    const savedTrip: SavedTrip = {
      ...tripResult,
      id: `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: name || generateTripName(tripResult),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSavedTrips((prev) => {
      // Add to beginning and limit to MAX_SAVED_TRIPS
      const newTrips = [savedTrip, ...prev].slice(0, MAX_SAVED_TRIPS);
      saveTripsToStorage(newTrips);
      return newTrips;
    });

    return savedTrip;
  };

  const updateTrip = (tripId: string, updates: Partial<SavedTrip>) => {
    setSavedTrips((prev) => {
      const newTrips = prev.map(trip => 
        trip.id === tripId 
          ? { ...trip, ...updates, updatedAt: new Date().toISOString() }
          : trip
      );
      saveTripsToStorage(newTrips);
      return newTrips;
    });
  };

  const deleteTrip = (tripId: string) => {
    setSavedTrips((prev) => {
      const newTrips = prev.filter(trip => trip.id !== tripId);
      saveTripsToStorage(newTrips);
      return newTrips;
    });
  };

  const getTrip = (tripId: string): SavedTrip | undefined => {
    return savedTrips.find(trip => trip.id === tripId);
  };

  const duplicateTrip = (tripId: string): SavedTrip | null => {
    const originalTrip = getTrip(tripId);
    if (!originalTrip) return null;

    const duplicatedTrip: SavedTrip = {
      ...originalTrip,
      id: `trip_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${originalTrip.name} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSavedTrips((prev) => {
      const newTrips = [duplicatedTrip, ...prev].slice(0, MAX_SAVED_TRIPS);
      saveTripsToStorage(newTrips);
      return newTrips;
    });

    return duplicatedTrip;
  };

  const clearSavedTrips = () => {
    setSavedTrips([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  // Helper function to generate a trip name from the trip data
  const generateTripName = (tripResult: TripResponse): string => {
    const cities = Array.from(new Set(tripResult.tripDays.map(day => day.city)));
    const duration = tripResult.tripDays.length;
    
    if (cities.length === 1) {
      return `${cities[0].charAt(0).toUpperCase() + cities[0].slice(1)} (${duration} days)`;
    } else if (cities.length === 2) {
      return `${cities[0].charAt(0).toUpperCase() + cities[0].slice(1)} & ${cities[1].charAt(0).toUpperCase() + cities[1].slice(1)}`;
    } else if (cities.length <= 4) {
      const cityNames = cities.map(city => city.charAt(0).toUpperCase() + city.slice(1));
      return `${cityNames.slice(0, -1).join(', ')} & ${cityNames[cityNames.length - 1]}`;
    } else {
      return `European Adventure (${cities.length} cities, ${duration} days)`;
    }
  };

  const getTripsByDateRange = (startDate: Date, endDate: Date): SavedTrip[] => {
    return savedTrips.filter(trip => {
      const tripDate = new Date(trip.createdAt);
      return tripDate >= startDate && tripDate <= endDate;
    });
  };

  const getTripStats = () => {
    const totalTrips = savedTrips.length;
    const totalCities = Array.from(
      new Set(savedTrips.flatMap(trip => trip.tripDays.map(day => day.city)))
    ).length;
    const totalDays = savedTrips.reduce((sum, trip) => sum + trip.tripDays.length, 0);
    const totalCost = savedTrips.reduce((sum, trip) => sum + trip.totalCost, 0);
    const averageCost = totalTrips > 0 ? Math.round(totalCost / totalTrips) : 0;

    return {
      totalTrips,
      totalCities,
      totalDays,
      totalCost,
      averageCost,
    };
  };

  return {
    savedTrips,
    saveTrip,
    updateTrip,
    deleteTrip,
    getTrip,
    duplicateTrip,
    clearSavedTrips,
    getTripsByDateRange,
    getTripStats,
  };
}
