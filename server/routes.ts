import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { tripRequestSchema, type TripRequest, type TripResponse, cityRecommendationRequestSchema } from "@shared/schema";
import { getCityRecommendations } from "./openai";
import fs from "fs/promises";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  app.post("/api/recommendTrip", async (req, res) => {
    try {
      const tripRequest = tripRequestSchema.parse(req.body) as TripRequest;
      
      const [transportData, citiesData, trendingThemesData] = await Promise.all([
        loadJsonFile("transportOptions.json"),
        loadJsonFile("cities.json"),
        loadJsonFile("trendingThemes.json")
      ]);

      const tripResponse = await generateTripRecommendation(tripRequest, transportData, citiesData);
      
      res.json(tripResponse);
    } catch (error) {
      console.error("Error generating trip recommendation:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to generate trip recommendation" 
      });
    }
  });

  app.get("/api/pois/:city", async (req, res) => {
    try {
      const { city } = req.params;
      const poisData = await loadJsonFile(`pois_${city.toLowerCase()}.json`);
      res.json(poisData);
    } catch (error) {
      console.error(`Error loading POIs for ${req.params.city}:`, error);
      res.status(404).json({ message: "POIs not found for this city" });
    }
  });

  app.get("/api/trending-themes", async (req, res) => {
    try {
      const trendingThemes = await loadJsonFile("trendingThemes.json");
      res.json(trendingThemes);
    } catch (error) {
      console.error("Error loading trending themes:", error);
      res.status(500).json({ message: "Failed to load trending themes" });
    }
  });

  app.get("/api/transport", async (req, res) => {
    try {
      const transportOptions = await loadJsonFile("transportOptions.json");
      res.json(transportOptions);
    } catch (error) {
      console.error("Error loading transport options:", error);
      res.status(500).json({ message: "Failed to load transport options" });
    }
  });

  app.get("/api/cities", async (req, res) => {
    try {
      const cities = await storage.getCities();
      res.json(cities);
    } catch (error) {
      console.error("Error loading cities from database:", error);
      res.status(500).json({ message: "Failed to load cities" });
    }
  });

  app.get("/api/interests", async (req, res) => {
    try {
      const interests = await storage.getInterests();
      res.json(interests);
    } catch (error) {
      console.error("Error loading interests from database:", error);
      res.status(500).json({ message: "Failed to load interests" });
    }
  });

  app.post("/api/city-recommendations", async (req, res) => {
    try {
      const { cityName, userInterests, budget, duration } = cityRecommendationRequestSchema.parse(req.body);
      
      const recommendations = await getCityRecommendations(
        cityName,
        userInterests,
        budget,
        duration
      );
      
      res.json(recommendations);
    } catch (error) {
      console.error("Error getting city recommendations:", error);
      res.status(400).json({ 
        message: error instanceof Error ? error.message : "Failed to get city recommendations" 
      });
    }
  });

  app.get("/api/city/:cityId/interests", async (req, res) => {
    try {
      const cityId = parseInt(req.params.cityId);
      const cityInterests = await storage.getCityInterests(cityId);
      res.json(cityInterests);
    } catch (error) {
      console.error("Error loading city interests:", error);
      res.status(500).json({ message: "Failed to load city interests" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function loadJsonFile(filename: string) {
  const filePath = path.resolve(process.cwd(), "client", "public", "data", filename);
  const fileContent = await fs.readFile(filePath, "utf-8");
  return JSON.parse(fileContent);
}

async function generateTripRecommendation(
  request: TripRequest, 
  transportData: any, 
  citiesData: any
): Promise<TripResponse> {
  const { origin, durationDays, maxBudget, transportPreference, interests, departureDate } = request;
  
  let currentCity = origin;
  let remainingBudget = maxBudget;
  let totalTravelTime = 0;
  const tripDays = [];
  const visitedCities = new Set([origin]);

  for (let day = 1; day <= durationDays; day++) {
    const currentDate = new Date(departureDate);
    currentDate.setDate(currentDate.getDate() + day - 1);
    
    let nextCity = currentCity;
    let transport = null;

    if (day > 1) {
      const candidateCities = findCandidateCities(
        currentCity, 
        visitedCities, 
        transportData, 
        transportPreference, 
        remainingBudget
      );
      
      if (candidateCities.length > 0) {
        const bestCity = await scoreCities(candidateCities, interests);
        if (bestCity) {
          nextCity = bestCity.city;
          transport = bestCity.transport;
          remainingBudget -= transport.cost;
          totalTravelTime += transport.durationHrs;
          visitedCities.add(nextCity);
        }
      }
    }

    const activities = await selectActivitiesForCity(nextCity, interests, remainingBudget);
    
    const dailyCost = (transport?.cost || 0) + activities.reduce((sum: number, activity: any) => sum + (activity.cost || 0), 0);
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
      activities: activities.map((activity: any) => ({
        id: activity.id,
        name: activity.name,
        category: activity.category,
        time: generateTimeSlot(activities.indexOf(activity)),
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

function findCandidateCities(
  currentCity: string, 
  visitedCities: Set<string>, 
  transportData: any, 
  transportPreference: string[], 
  remainingBudget: number
) {
  const candidates = [];
  
  for (const [route, options] of Object.entries(transportData)) {
    const [from, to] = (route as string).split('→');
    
    if (from.toLowerCase() === currentCity.toLowerCase() && !visitedCities.has(to.toLowerCase())) {
      const validOptions = (options as any[]).filter(option => 
        transportPreference.includes(option.mode) && 
        option.cost <= remainingBudget * 0.3
      );
      
      if (validOptions.length > 0) {
        candidates.push({
          city: to.toLowerCase(),
          transport: validOptions[0]
        });
      }
    }
  }
  
  return candidates;
}

async function scoreCities(candidateCities: any[], interests: string[]) {
  let bestScore = 0;
  let bestCity = null;

  for (const candidate of candidateCities) {
    try {
      const poisData = await loadJsonFile(`pois_${candidate.city}.json`);
      let score = 0;
      
      poisData.forEach((poi: any) => {
        if (interests.includes(poi.category.toLowerCase())) {
          score += poi.popularityScore || 1;
        }
      });
      
      if (score > bestScore) {
        bestScore = score;
        bestCity = candidate;
      }
    } catch (error) {
      console.warn(`Could not load POIs for ${candidate.city}`);
    }
  }
  
  return bestCity;
}

async function selectActivitiesForCity(city: string, interests: string[], budget: number) {
  try {
    const poisData = await loadJsonFile(`pois_${city}.json`);
    
    const relevantPois = poisData
      .filter((poi: any) => interests.some(interest => 
        poi.category.toLowerCase().includes(interest.toLowerCase())
      ))
      .sort((a: any, b: any) => (b.popularityScore || 0) - (a.popularityScore || 0))
      .slice(0, 3);
    
    return relevantPois.map((poi: any) => ({
      ...poi,
      cost: Math.floor(Math.random() * 20) + 10
    }));
  } catch (error) {
    console.warn(`Could not load POIs for ${city}`);
    return [];
  }
}

function generateTimeSlot(index: number): string {
  const startHours = [9, 13, 16];
  const endHours = [12, 15, 18];
  
  const start = startHours[index] || 9;
  const end = endHours[index] || 12;
  
  return `${start}:00 ${start < 12 ? 'AM' : 'PM'} - ${end}:00 ${end < 12 ? 'AM' : 'PM'}`;
}
