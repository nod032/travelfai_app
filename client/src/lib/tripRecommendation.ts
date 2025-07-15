import type { TripRequest, TripResponse, TripDay, TransportOption, Poi } from "@shared/schema";

export interface CityData {
  id: string;
  name: string;
  country: string;
}

export interface TransportData {
  [route: string]: TransportOption[];
}

export interface PoiData {
  [city: string]: Poi[];
}

/**
 * Utility functions for trip recommendation algorithm
 */
export class TripRecommendationEngine {
  private transportData: TransportData;
  private citiesData: CityData[];
  private poisData: PoiData;

  constructor(transportData: TransportData, citiesData: CityData[], poisData: PoiData) {
    this.transportData = transportData;
    this.citiesData = citiesData;
    this.poisData = poisData;
  }

  /**
   * Generate trip recommendation using greedy algorithm
   */
  generateRecommendation(request: TripRequest): TripResponse {
    const { origin, durationDays, maxBudget, transportPreference, interests, departureDate } = request;
    
    let currentCity = origin.toLowerCase();
    let remainingBudget = maxBudget;
    let totalTravelTime = 0;
    const tripDays: TripDay[] = [];
    const visitedCities = new Set([currentCity]);

    for (let day = 1; day <= durationDays; day++) {
      const currentDate = new Date(departureDate);
      currentDate.setDate(currentDate.getDate() + day - 1);
      
      let nextCity = currentCity;
      let transport = null;

      // If not the first day, try to find next city
      if (day > 1) {
        const candidateCities = this.findCandidateCities(
          currentCity, 
          visitedCities, 
          transportPreference, 
          remainingBudget
        );
        
        if (candidateCities.length > 0) {
          // Score cities based on interests and POI matches
          const bestCity = this.scoreCities(candidateCities, interests);
          if (bestCity) {
            nextCity = bestCity.city;
            transport = bestCity.transport;
            remainingBudget -= transport.cost;
            totalTravelTime += transport.durationHrs;
            visitedCities.add(nextCity);
          }
        }
      }

      // Get POIs for current city and select best matches
      const activities = this.selectActivitiesForCity(nextCity, interests, remainingBudget);
      
      const dailyCost = (transport?.cost || 0) + activities.reduce((sum, activity) => sum + (activity.cost || 0), 0);
      remainingBudget -= dailyCost - (transport?.cost || 0);

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
        dailyCost
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

  /**
   * Find candidate cities that can be reached from current city
   */
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
          option.cost <= remainingBudget * 0.3 // Don't spend more than 30% of remaining budget on transport
        );
        
        if (validOptions.length > 0) {
          // Sort by cost and duration to get the best option
          const bestOption = validOptions.sort((a, b) => {
            const scoreA = a.cost + (a.durationHrs * 10); // Weight duration more heavily
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
   * Score cities based on POI matches with user interests
   */
  private scoreCities(candidateCities: any[], interests: string[]) {
    let bestScore = 0;
    let bestCity = null;

    for (const candidate of candidateCities) {
      const cityPois = this.poisData[candidate.city] || [];
      let score = 0;
      
      cityPois.forEach((poi: Poi) => {
        if (interests.includes(poi.category.toLowerCase())) {
          score += poi.popularityScore || 1;
        }
      });
      
      // Add bonus for unvisited cities
      score += 5;
      
      if (score > bestScore) {
        bestScore = score;
        bestCity = candidate;
      }
    }
    
    return bestCity;
  }

  /**
   * Select best activities for a city based on interests
   */
  private selectActivitiesForCity(city: string, interests: string[], budget: number) {
    const cityPois = this.poisData[city] || [];
    
    // Filter POIs by interests and sort by popularity
    const relevantPois = cityPois
      .filter((poi: Poi) => interests.some(interest => 
        poi.category.toLowerCase().includes(interest.toLowerCase())
      ))
      .sort((a: Poi, b: Poi) => (b.popularityScore || 0) - (a.popularityScore || 0));

    // If no relevant POIs found, take top-rated ones
    const selectedPois = relevantPois.length > 0 ? relevantPois : cityPois
      .sort((a: Poi, b: Poi) => (b.popularityScore || 0) - (a.popularityScore || 0));

    // Take top 3 activities per day
    const topPois = selectedPois.slice(0, 3);
    
    return topPois.map((poi: Poi) => ({
      ...poi,
      cost: this.estimateActivityCost(poi.category) // Estimate cost based on category
    }));
  }

  /**
   * Estimate activity cost based on category
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
    
    // Add some variation
    return Math.floor(baseCost + (Math.random() * 10) - 5);
  }

  /**
   * Generate time slots for activities
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
   * Validate trip request
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
   * Calculate estimated trip cost before generation
   */
  static estimateTripCost(request: TripRequest): { min: number; max: number; average: number } {
    const { durationDays, transportPreference } = request;
    
    // Base daily costs
    const dailyCostEstimate = {
      budget: 80,    // Budget accommodation + meals
      mid: 150,      // Mid-range
      luxury: 300    // Luxury
    };
    
    // Transport cost estimates
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
   * Get popular routes between cities
   */
  getPopularRoutes(): Array<{ from: string; to: string; popularity: number }> {
    const routes = [];
    
    for (const [route, options] of Object.entries(this.transportData)) {
      const [from, to] = route.split('→');
      const avgCost = options.reduce((sum, opt) => sum + opt.cost, 0) / options.length;
      const avgDuration = options.reduce((sum, opt) => sum + opt.durationHrs, 0) / options.length;
      
      // Calculate popularity score based on cost, duration, and number of options
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
   * Get city recommendations based on interests
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
 * Utility functions for working with trip data
 */
export const TripUtils = {
  /**
   * Format city name for display
   */
  formatCityName: (cityId: string): string => {
    return cityId.charAt(0).toUpperCase() + cityId.slice(1);
  },

  /**
   * Calculate total trip duration including travel time
   */
  calculateTotalDuration: (tripDays: TripDay[]): { days: number; hours: number } => {
    const totalHours = tripDays.reduce((sum, day) => {
      const travelTime = day.transport?.option.durationHrs || 0;
      const activityTime = day.activities.reduce((actSum, activity) => 
        actSum + (activity.duration || 120), 0) / 60; // Convert minutes to hours
      return sum + travelTime + activityTime;
    }, 0);

    return {
      days: tripDays.length,
      hours: Math.round(totalHours)
    };
  },

  /**
   * Get unique cities from trip
   */
  getUniqueCities: (tripDays: TripDay[]): string[] => {
    return Array.from(new Set(tripDays.map(day => day.city)));
  },

  /**
   * Calculate cost breakdown
   */
  calculateCostBreakdown: (tripDays: TripDay[]) => {
    let transportCost = 0;
    let activityCost = 0;

    tripDays.forEach(day => {
      if (day.transport) {
        transportCost += day.transport.option.cost;
      }
      day.activities.forEach(activity => {
        // This would need to be calculated based on actual activity costs
        activityCost += 15; // Average activity cost
      });
    });

    return {
      transport: transportCost,
      activities: activityCost,
      total: transportCost + activityCost
    };
  },

  /**
   * Generate trip summary text
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
   * Validate trip data
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
