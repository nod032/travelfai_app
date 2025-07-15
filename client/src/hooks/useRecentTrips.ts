import { useState, useEffect } from "react";
import type { TripRequest } from "@shared/schema";

const STORAGE_KEY = "travelai_recent_trips";
const MAX_RECENT_TRIPS = 5;

export function useRecentTrips() {
  const [recentTrips, setRecentTrips] = useState<TripRequest[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setRecentTrips(JSON.parse(stored));
      } catch (error) {
        console.error("Error parsing recent trips:", error);
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const addTrip = (trip: TripRequest) => {
    setRecentTrips((prev) => {
      // Remove if already exists to avoid duplicates
      const filtered = prev.filter(t => 
        t.origin !== trip.origin || 
        t.durationDays !== trip.durationDays ||
        t.maxBudget !== trip.maxBudget
      );
      
      // Add to beginning and limit to MAX_RECENT_TRIPS
      const newTrips = [trip, ...filtered].slice(0, MAX_RECENT_TRIPS);
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newTrips));
      return newTrips;
    });
  };

  const clearRecentTrips = () => {
    setRecentTrips([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return {
    recentTrips,
    addTrip,
    clearRecentTrips,
  };
}
