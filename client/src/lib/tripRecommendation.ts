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

  constructor(transportData: TransportData, citiesData: CityData[], poisData: PoiData, toast?: ReturnType<typeof useToast>['toast']) {
    this.transportData = transportData;
    this.citiesData = citiesData;
    this.poisData = poisData;
    this.toast = toast || null;
  }

  /**
   * Generates a comprehensive trip plan based on user requests.
   */
  generateRecommendation(request: TripRequest): TripResponse {
    const { origin, durationDays, maxBudget, transportPreference, interests, departureDate } = request;

    let currentCity = origin.toLowerCase();
    let remainingBudget = maxBudget;
    let totalTravelTime = 0;
    const tripDays: TripDay[] = [];
    const visitedCities = new Set<string>([currentCity]);
    const visitedPois = new Set<string>(); // Tracks all POIs added to the trip to prevent repetition

    // Variables for dynamic transport flexibility
    const MIN_DAYS_FOR_FLEXIBILITY = 4; // Trip duration after which flexibility is considered
    const STICKY_CITY_THRESHOLD = 2; // Consecutive days in same city before considering other transport
    let consecutiveDaysInSameCity = 0;
    let flexibleTransportActivated = false;
    const originalTransportPreference = [...transportPreference]; // Store original user preferences

    // Iterate for each day of the requested trip duration
    for (let day = 1; day <= durationDays; day++) {
      // Calculate the specific date for the current trip day
      const currentDate = new Date(departureDate);
      currentDate.setDate(currentDate.getDate() + day - 1);

      let nextCity = currentCity;
      let transport = null;
      let dailyTransportCost = 0;

      let currentTransportPreference = [...originalTransportPreference]; // Use original by default

      // Dynamic Transport Preference Logic: Activate broader transport for longer trips if "stuck"
      if (
        durationDays >= MIN_DAYS_FOR_FLEXIBILITY &&
        consecutiveDaysInSameCity >= STICKY_CITY_THRESHOLD &&
        !flexibleTransportActivated // Ensures activation happens once per "stuck" scenario
      ) {
        currentTransportPreference = ["flight", "train", "bus", "car"]; // Expand to all available modes
        flexibleTransportActivated = true; // Mark as activated
        console.log(`Day ${day}: Activating flexible transport to find new cities.`);
        if (this.toast) {
          this.toast({
            title: "Exploring New Horizons!",
            description: `For longer trips, we're expanding transport options to find more unique destinations.`,
            duration: 3000
          });
        }
      } else if (flexibleTransportActivated && nextCity !== currentCity) {
          // If flexibility was active and we successfully moved to a new city, reset
          flexibleTransportActivated = false;
          consecutiveDaysInSameCity = 0;
      }

      // For days after the first, attempt to find transport to a new city
      if (day > 1) {
        const candidateCities = this.findCandidateCities(
          currentCity,
          visitedCities,
          currentTransportPreference, // Use the potentially expanded preference
          remainingBudget
        );

        if (candidateCities.length > 0) {
          // Score and select the best next city based on interests and POI availability
          const bestCity = this.scoreCities(candidateCities, interests);
          if (bestCity) {
            nextCity = bestCity.city;
            transport = bestCity.transport;
            dailyTransportCost = transport.cost;
            remainingBudget -= dailyTransportCost; // Deduct transport cost from budget
            totalTravelTime += transport.durationHrs;
            visitedCities.add(nextCity);
          }
        }
      }

      // Update consecutive days counter
      if (nextCity === currentCity) {
        consecutiveDaysInSameCity++;
      } else {
        consecutiveDaysInSameCity = 0; // Reset if we successfully moved to a new city
      }

      // Select activities for the current city, ensuring no duplicate POIs
      const activities = this.selectActivitiesForCity(nextCity, interests, remainingBudget, visitedPois, day);
      // Add newly selected activity IDs to the master list of visited POIs
      activities.forEach(activity => visitedPois.add(activity.id));

      // Calculate the total cost incurred for activities on this specific day
      const dailyActivityCost = activities.reduce((sum, activity) => sum + (activity.cost || 0), 0);
      const dailyTotalCost = dailyActivityCost + dailyTransportCost;
      remainingBudget -= dailyActivityCost; // Deduct activity cost from budget

      tripDays.push({
        day,
        city: nextCity,
        date: currentDate.toISOString().split('T')[0], // Format date to YYYY-MM-DD
        transport: transport ? {
          from: currentCity,
          to: nextCity,
          option: transport
        } : undefined,
        activities: activities.map(activity => ({
          id: activity.id,
          name: activity.name,
          category: activity.category,
          time: this.generateTimeSlot(activities.indexOf(activity)), // Assigns a fixed time slot based on order
          duration: activity.duration || 120 // Default activity duration in minutes
        })),
        dailyCost: dailyTotalCost
      });

      currentCity = nextCity; // Set the current city for the next day's planning iteration
    }

    return {
      tripDays,
      totalCost: maxBudget - remainingBudget, // Actual total cost spent during the trip
      totalTravelTime, // Total hours spent on inter-city travel
      remainingBudget // Remaining budget after planning the trip
    };
  }

  /**
   * Filters and ranks cities reachable from the current location,
   * considering user transport preferences and remaining budget.
   */
  private findCandidateCities(
    currentCity: string,
    visitedCities: Set<string>,
    transportPreference: string[], // This param is now potentially dynamic
    remainingBudget: number
  ) {
    const candidates = [];

    for (const [route, options] of Object.entries(this.transportData)) {
      const [from, to] = route.split('→');

      if (from.toLowerCase() === currentCity && !visitedCities.has(to.toLowerCase())) {
        const validOptions = options.filter(option =>
          transportPreference.includes(option.mode) &&
          option.cost <= remainingBudget * 0.3 // Limit transport cost to 30% of remaining budget
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

  /**
   * Scores candidate cities based on how well their POIs align with user interests.
   * Increased bonus for unvisited cities to encourage more exploration.
   */
  private scoreCities(candidateCities: any[], interests: string[]) {
    let bestScore = -Infinity;
    let bestCity = null;

    for (const candidate of candidateCities) {
      const cityPois = this.poisData[candidate.city] || [];
      let score = 0;

      // Sum popularity scores for POIs matching user interests
      cityPois.forEach((poi: Poi) => {
        if (interests.includes(poi.category.toLowerCase())) {
          score += poi.popularityScore || 1;
        }
      });

      score += 50; // Significant bonus to strongly encourage visiting new cities

      if (score > bestScore) {
        bestScore = score;
        bestCity = candidate;
      }
    }
    return bestCity;
  }

  /**
   * Selects up to 3 diverse activities for a given city based on user interests, budget,
   * avoiding activities already added to the trip, and adapting selection if options are limited.
   */
  private selectActivitiesForCity(city: string, interests: string[], budget: number, visitedPois: Set<string>, currentDay: number) {
    const cityPois = this.poisData[city] || [];
    const numActivitiesDesired = 3;
    const selectedActivities: Poi[] = [];

    // Phase 1: Try to get interest-matching, unvisited, popular POIs
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

    // Phase 2: If not enough, fill with unvisited, popular POIs regardless of interest match
    if (selectedActivities.length < numActivitiesDesired) {
      const generalPopularPois = cityPois
        .filter(poi => !visitedPois.has(poi.id) && !selectedActivities.includes(poi))
        .sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0));

      for (const poi of generalPopularPois) {
        if (selectedActivities.length < numActivitiesDesired) {
          selectedActivities.push(poi);
        } else {
          break;
        }
      }
    }

    // Phase 3: If still not enough, take any remaining unvisited POIs (less popular, ensures variety)
    if (selectedActivities.length < numActivitiesDesired) {
      const anyUnvisitedPois = cityPois
        .filter(poi => !visitedPois.has(poi.id) && !selectedActivities.includes(poi));
      anyUnvisitedPois.sort(() => 0.5 - Math.random()); // Simple shuffle for more diverse picks if many low-priority options

      for (const poi of anyUnvisitedPois) {
        if (selectedActivities.length < numActivitiesDesired) {
          selectedActivities.push(poi);
        } else {
          break;
        }
      }
    }

    // Phase 4 (Last Resort for longer trips): If still insufficient, allow picking from any POI in city,
    // even if previously visited, but only after initial days to avoid immediate repetition.
    if (selectedActivities.length < numActivitiesDesired && currentDay > 1) {
        const allCityPoisNotCurrentlySelected = cityPois
            .filter(poi => !selectedActivities.includes(poi)); // Exclude only those picked *for this specific day*
        allCityPoisNotCurrentlySelected.sort(() => 0.5 - Math.random()); // Randomize for variety

        for (const poi of allCityPoisNotCurrentlySelected) {
            if (selectedActivities.length < numActivitiesDesired) {
                selectedActivities.push(poi);
            } else {
                break;
            }
        }
    }

    return selectedActivities.map((poi: Poi) => ({
      ...poi,
      cost: this.estimateActivityCost(poi.category)
    }));
  }

  /**
   * Provides a rough cost estimate for an activity based on its category.
   */
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

    return Math.floor(baseCost + (Math.random() * 10) - 5); // Adds small random variation
  }

  /**
   * Generates a fixed time slot string (e.g., "9:00 AM - 12:00 PM") based on an index,
   * used for scheduling activities within a day.
   */
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

  /**
   * Validates the structure and content of a TripRequest object.
   * Returns an array of error messages if any validation rules are violated.
   */
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

  /**
   * Calculates an estimated range for the total trip cost (min, max, average)
   * based on duration and transport preferences, before full generation.
   */
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

  /**
   * Retrieves popular routes between cities based on the transport data,
   * calculating a simple popularity score.
   */
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

  /**
   * Recommends cities based on how well their Points of Interest (POIs) align with user interests,
   * assigning a score based on matching POIs and their popularity.
   */
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

/**
 * Utility functions for formatting and performing calculations related to trip data, primarily for display purposes.
 */
export const TripUtils = {
  /**
   * Formats a city ID (e.g., "paris") into a display name (e.g., "Paris").
   */
  formatCityName: (cityId: string): string => {
    return cityId.charAt(0).toUpperCase() + cityId.slice(1);
  },

  /**
   * Calculates the total duration of the trip, combining days and estimated travel/activity hours.
   */
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

  /**
   * Extracts a list of unique cities visited within the trip itinerary.
   */
  getUniqueCities: (tripDays: TripDay[]): string[] => {
    return Array.from(new Set(tripDays.map(day => day.city)));
  },

  /**
   * Provides a simplified breakdown of estimated transport and activity costs for the trip.
   */
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

  /**
   * Generates a concise human-readable summary string of the trip's destinations and duration.
   */
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

  /**
   * Validates the integrity of a generated TripResponse object, checking for common missing data.
   */
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