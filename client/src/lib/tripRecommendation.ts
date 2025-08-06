import type { TripRequest, TripResponse, TripDay, TransportOption, Poi } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Defines the structure for city data
export interface CityData {
  id: string;
  name: string;
  country: string;
}

// Defines the structure for transport route data (e.g., "Rome→Barcelona": [options])
export interface TransportData {
  [route: string]: TransportOption[];
}

// Defines the structure for Points of Interest (POIs) data, organized by city
export interface PoiData {
  [city: string]: Poi[];
}

/**
 * Core engine for generating trip recommendations.
 * Implements a greedy algorithm to plan the itinerary day by day.
 */
export class TripRecommendationEngine {
  private transportData: TransportData;
  private citiesData: CityData[];
  private poisData: PoiData; // Points of Interest data for each city
  private toast: ReturnType<typeof useToast>['toast'] | null; // Allow toast to be passed in, or be null

  // For smart POI rotation:
  private poiRotationIndex: Record<string, number> = {};

  constructor(transportData: TransportData, citiesData: CityData[], poisData: PoiData, toast?: ReturnType<typeof useToast>['toast']) {
    this.transportData = transportData;
    this.citiesData = citiesData;
    this.poisData = poisData;
    this.toast = toast || null;
  }

  generateRecommendation(request: TripRequest): TripResponse {
    const { origin, durationDays, maxBudget, transportPreference, interests, departureDate } = request;

    let currentCity = origin.toLowerCase();
    let remainingBudget = maxBudget;
    let totalTravelTime = 0;
    const tripDays: TripDay[] = [];
    const visitedCities = new Set<string>([currentCity]);
    const visitedPois = new Set<string>();

    const MIN_DAYS_FOR_FLEXIBILITY = 4;
    const STICKY_CITY_THRESHOLD = 2;
    let consecutiveDaysInSameCity = 0;
    let flexibleTransportActivated = false;
    const originalTransportPreference = [...transportPreference];

    // RESET poiRotationIndex at the start
    this.poiRotationIndex = {};

    for (let day = 1; day <= durationDays; day++) {
      const currentDate = new Date(departureDate);
      currentDate.setDate(currentDate.getDate() + day - 1);

      let nextCity = currentCity;
      let transport = null;
      let dailyTransportCost = 0;

      let currentTransportPreference = [...originalTransportPreference];

      if (
        durationDays >= MIN_DAYS_FOR_FLEXIBILITY &&
        consecutiveDaysInSameCity >= STICKY_CITY_THRESHOLD &&
        !flexibleTransportActivated
      ) {
        currentTransportPreference = ["flight", "train", "bus", "car"];
        flexibleTransportActivated = true;
        console.log(`Day ${day}: Activating flexible transport to find new cities.`);
        if (this.toast) {
          this.toast({
            title: "Exploring New Horizons!",
            description: `For longer trips, we're expanding transport options to find more unique destinations.`,
            duration: 3000
          });
        }
      } else if (flexibleTransportActivated && nextCity !== currentCity) {
        flexibleTransportActivated = false;
        consecutiveDaysInSameCity = 0;
      }

      if (day > 1) {
        const candidateCities = this.findCandidateCities(
          currentCity,
          visitedCities,
          currentTransportPreference,
          remainingBudget
        );

        if (candidateCities.length > 0) {
          const bestCity = this.scoreCities(candidateCities, interests);
          if (bestCity) {
            nextCity = bestCity.city;
            transport = bestCity.transport;
            dailyTransportCost = transport.cost;
            remainingBudget -= dailyTransportCost;
            totalTravelTime += transport.durationHrs;
            visitedCities.add(nextCity);
          }
        }
      }

      if (nextCity === currentCity) {
        consecutiveDaysInSameCity++;
      } else {
        consecutiveDaysInSameCity = 0;
      }

      const activities = this.selectActivitiesForCity(nextCity, interests, remainingBudget, visitedPois, day);
      activities.forEach(activity => visitedPois.add(activity.id));

      const dailyActivityCost = activities.reduce((sum, activity) => sum + (activity.cost || 0), 0);
      const dailyTotalCost = dailyActivityCost + dailyTransportCost;
      remainingBudget -= dailyActivityCost;

      tripDays.push({
        day,
        city: nextCity,
        date: currentDate.toISOString().split('T')[0],
        transport: transport ? {
          from: currentCity,
          to: nextCity,
          option: transport
        } : undefined,
        activities: activities.map(activity => ({
          id: activity.id,
          name: activity.name,
          category: activity.category,
          time: this.generateTimeSlot(activities.indexOf(activity)),
          duration: activity.duration || 120
        })),
        dailyCost: dailyTotalCost
      });

      currentCity = nextCity;
    }

    return {
      tripDays,
      totalCost: maxBudget - remainingBudget,
      totalTravelTime,
      remainingBudget
    };
  }

  private findCandidateCities(
    currentCity: string,
    visitedCities: Set<string>,
    transportPreference: string[],
    remainingBudget: number
  ) {
    const candidates = [];

    for (const [route, options] of Object.entries(this.transportData)) {
      const [from, to] = route.split('→');

      if (from.toLowerCase() === currentCity && !visitedCities.has(to.toLowerCase())) {
        const validOptions = options.filter(option =>
          transportPreference.includes(option.mode) &&
          option.cost <= remainingBudget * 0.3
        );

        if (validOptions.length > 0) {
          const bestOption = validOptions.sort((a, b) => {
            const scoreA = a.cost + (a.durationHrs * 10);
            const scoreB = b.cost + (b.durationHrs * 10);
            return scoreA - scoreB;
          })[0];

          candidates.push({
            city: to.toLowerCase(),
            transport: bestOption
          });
        }
      }
    }
    return candidates;
  }

  private scoreCities(candidateCities: any[], interests: string[]) {
    let bestScore = -Infinity;
    let bestCity = null;

    for (const candidate of candidateCities) {
      const cityPois = this.poisData[candidate.city] || [];
      let score = 0;

      cityPois.forEach((poi: Poi) => {
        if (interests.includes(poi.category.toLowerCase())) {
          score += poi.popularityScore || 1;
        }
      });

      score += 50;

      if (score > bestScore) {
        bestScore = score;
        bestCity = candidate;
      }
    }
    return bestCity;
  }

  /**
   * Improved: Rotates "filler" activities, and shuffles for max variety per city.
   * Guarantees new combos for each day in same city, and only repeats if all POIs are exhausted.
   */
  private selectActivitiesForCity(
    city: string,
    interests: string[],
    budget: number,
    visitedPois: Set<string>,
    currentDay: number
  ) {
    const cityPois = this.poisData[city] || [];
    const numActivitiesDesired = 3;
    const selectedActivities: Poi[] = [];

    // Phase 1: Get interest-matching, unvisited, popular POIs
    const interestPois = cityPois
      .filter(poi => interests.some(interest => poi.category.toLowerCase().includes(interest.toLowerCase())) && !visitedPois.has(poi.id))
      .sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0));

    for (const poi of interestPois) {
      if (selectedActivities.length < numActivitiesDesired) {
        selectedActivities.push(poi);
      } else {
        break;
      }
    }

    // PHASE 2+: If not enough, rotate/shuffle fillers for max variety.
    if (selectedActivities.length < numActivitiesDesired) {
      // Get all unvisited, not already picked
      let generalPopularPois = cityPois
        .filter(poi => !visitedPois.has(poi.id) && !selectedActivities.some(sel => sel.id === poi.id))
        .sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0));

      // Shuffle for extra randomness
      for (let i = generalPopularPois.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [generalPopularPois[i], generalPopularPois[j]] = [generalPopularPois[j], generalPopularPois[i]];
      }

      // Add as many as needed
      for (const poi of generalPopularPois) {
        if (selectedActivities.length < numActivitiesDesired) {
          selectedActivities.push(poi);
        } else {
          break;
        }
      }
    }

    // PHASE 3: If still not enough, rotate through ALL POIs for city (even visited), so same POIs do not repeat in the same order.
    if (selectedActivities.length < numActivitiesDesired) {
      // Ensure rotation state for this city
      if (!this.poiRotationIndex[city]) this.poiRotationIndex[city] = 0;

      const remaining = cityPois
        .filter(poi => !selectedActivities.some(sel => sel.id === poi.id));
      if (remaining.length > 0) {
        // Rotate: take slice starting at current index
        const start = this.poiRotationIndex[city] % remaining.length;
        for (let i = 0; i < remaining.length && selectedActivities.length < numActivitiesDesired; i++) {
          const idx = (start + i) % remaining.length;
          selectedActivities.push(remaining[idx]);
        }
        // Bump rotation index so next time the set is different
        this.poiRotationIndex[city] = (this.poiRotationIndex[city] + numActivitiesDesired) % remaining.length;
      }
    }

    // Safety: never repeat POI in the same day, always at least shuffle the order
    for (let i = selectedActivities.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [selectedActivities[i], selectedActivities[j]] = [selectedActivities[j], selectedActivities[i]];
    }

    return selectedActivities.slice(0, numActivitiesDesired).map((poi: Poi) => ({
      ...poi,
      cost: this.estimateActivityCost(poi.category)
    }));
  }

  private estimateActivityCost(category: string): number {
    const baseCosts: Record<string, number> = {
      museums: 15,
      art: 12,
      history: 10,
      architecture: 5,
      food: 25,
      shopping: 0,
      nature: 0,
      nightlife: 30,
      entertainment: 20
    };

    const baseCategory = category.toLowerCase();
    const baseCost = baseCosts[baseCategory] || 15;

    return Math.floor(baseCost + (Math.random() * 10) - 5);
  }

  private generateTimeSlot(index: number): string {
    const timeSlots = [
      { start: 9, end: 12, period: 'AM' },
      { start: 1, end: 3, period: 'PM' },
      { start: 4, end: 6, period: 'PM' }
    ];

    const slot = timeSlots[index] || timeSlots[0];
    const startPeriod = slot.start < 12 ? 'AM' : 'PM';
    const endPeriod = slot.end < 12 ? 'AM' : 'PM';

    return `${slot.start}:00 ${startPeriod} - ${slot.end}:00 ${endPeriod}`;
  }

  static validateTripRequest(request: TripRequest): string[] {
    const errors: string[] = [];

    if (!request.origin) {
      errors.push("Origin city is required");
    }

    if (request.durationDays < 1 || request.durationDays > 30) {
      errors.push("Duration must be between 1 and 30 days");
    }

    if (request.maxBudget < 100) {
      errors.push("Budget must be at least €100");
    }

    if (request.transportPreference.length === 0) {
      errors.push("At least one transport option must be selected");
    }

    if (request.interests.length === 0) {
      errors.push("At least one interest must be selected");
    }

    if (!request.departureDate) {
      errors.push("Departure date is required");
    }

    return errors;
  }

  static estimateTripCost(request: TripRequest): { min: number; max: number; average: number } {
    const { durationDays, transportPreference } = request;

    const dailyCostEstimate = {
      budget: 80,
      mid: 150,
      luxury: 300
    };

    const transportCosts = {
      bus: 30,
      train: 80,
      flight: 120,
      car: 60
    };

    const avgTransportCost = transportPreference.length > 0
      ? transportPreference.reduce((sum, mode) => sum + (transportCosts[mode as keyof typeof transportCosts] || 80), 0) / transportPreference.length
      : 80;

    const estimatedTransportDays = Math.max(1, durationDays - 1);
    const totalTransportCost = avgTransportCost * estimatedTransportDays;
    const totalDailyCost = dailyCostEstimate.budget * durationDays;

    const minCost = totalDailyCost + (totalTransportCost * 0.7);
    const maxCost = totalDailyCost * 2 + (totalTransportCost * 1.3);
    const avgCost = (minCost + maxCost) / 2;

    return {
      min: Math.round(minCost),
      max: Math.round(maxCost),
      average: Math.round(avgCost)
    };
  }

  getPopularRoutes(): Array<{ from: string; to: string; popularity: number }> {
    const routes = [];

    for (const [route, options] of Object.entries(this.transportData)) {
      const [from, to] = route.split('→');
      const avgCost = options.reduce((sum, opt) => sum + opt.cost, 0) / options.length;
      const avgDuration = options.reduce((sum, opt) => sum + opt.durationHrs, 0) / options.length;

      const popularity = (100 - avgCost / 10) + (10 - avgDuration) + (options.length * 5);

      routes.push({
        from: from.toLowerCase(),
        to: to.toLowerCase(),
        popularity: Math.max(0, popularity)
      });
    }

    return routes.sort((a, b) => b.popularity - a.popularity);
  }

  getCityRecommendations(interests: string[]): Array<{ city: string; score: number; matchingPois: number }> {
    const cityScores = [];

    for (const [city, pois] of Object.entries(this.poisData)) {
      let score = 0;
      let matchingPois = 0;

      pois.forEach((poi: Poi) => {
        if (interests.includes(poi.category.toLowerCase())) {
          score += poi.popularityScore || 1;
          matchingPois++;
        }
      });

      if (matchingPois > 0) {
        cityScores.push({
          city,
          score,
          matchingPois
        });
      }
    }

    return cityScores.sort((a, b) => b.score - a.score);
  }
}

export const TripUtils = {
  formatCityName: (cityId: string): string => {
    return cityId.charAt(0).toUpperCase() + cityId.slice(1);
  },
  calculateTotalDuration: (tripDays: TripDay[]): { days: number; hours: number } => {
    const totalHours = tripDays.reduce((sum, day) => {
      const travelTime = day.transport?.option.durationHrs || 0;
      const activityTime = day.activities.reduce((actSum, activity) =>
        actSum + (activity.duration || 120), 0) / 60;
      return sum + travelTime + activityTime;
    }, 0);

    return {
      days: tripDays.length,
      hours: Math.round(totalHours)
    };
  },
  getUniqueCities: (tripDays: TripDay[]): string[] => {
    return Array.from(new Set(tripDays.map(day => day.city)));
  },
  calculateCostBreakdown: (tripDays: TripDay[]) => {
    let transportCost = 0;
    let activityCost = 0;

    tripDays.forEach(day => {
      if (day.transport) {
        transportCost += day.transport.option.cost;
      }
      day.activities.forEach(() => {
        activityCost += 15;
      });
    });

    return {
      transport: transportCost,
      activities: activityCost,
      total: transportCost + activityCost
    };
  },
  generateTripSummary: (tripResult: TripResponse): string => {
    const cities = TripUtils.getUniqueCities(tripResult.tripDays);
    const duration = tripResult.tripDays.length;

    if (cities.length === 1) {
      return `${TripUtils.formatCityName(cities[0])} (${duration} ${duration === 1 ? 'day' : 'days'})`;
    } else if (cities.length === 2) {
      return `${TripUtils.formatCityName(cities[0])} & ${TripUtils.formatCityName(cities[1])} (${duration} days)`;
    } else {
      const cityNames = cities.map(TripUtils.formatCityName);
      return `${cityNames.slice(0, -1).join(', ')} & ${cityNames[cityNames.length - 1]} (${duration} days)`;
    }
  },
  validateTripData: (tripResult: TripResponse): string[] => {
    const errors: string[] = [];

    if (!tripResult.tripDays || tripResult.tripDays.length === 0) {
      errors.push("Trip must have at least one day");
    }

    if (tripResult.totalCost < 0) {
      errors.push("Total cost cannot be negative");
    }

    if (tripResult.remainingBudget < 0) {
      errors.push("Trip exceeds budget");
    }

    tripResult.tripDays.forEach((day, index) => {
      if (!day.city) {
        errors.push(`Day ${index + 1} is missing city information`);
      }

      if (!day.date) {
        errors.push(`Day ${index + 1} is missing date information`);
      }

      if (!day.activities || day.activities.length === 0) {
        errors.push(`Day ${index + 1} has no activities planned`);
      }
    });

    return errors;
  }
};

export default TripRecommendationEngine;
