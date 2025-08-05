import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { CityRecommendation } from "@shared/schema";

interface UseCityRecommendationsProps {
  cityName: string;
  userInterests: string[];
  budget: number;
  duration: number;
  enabled?: boolean;
}

export function useCityRecommendations({
  cityName,
  userInterests,
  budget,
  duration,
  enabled = true,
}: UseCityRecommendationsProps) {
  return useQuery({
    queryKey: ['city-recommendations', cityName, userInterests, budget, duration],
    queryFn: async (): Promise<CityRecommendation> => {
    //   const response = await fetch('/api/city-recommendations', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify({
    //       cityName,
    //       userInterests,
    //       budget,
    //       duration,
    //     }),
    //   });
        const response = await fetch('http://localhost:5000/api/city-recommendations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cityName, userInterests, budget, duration }),
            });

      if (!response.ok) {
        throw new Error('Failed to fetch city recommendations');
      }

      return response.json();
    },
    enabled: enabled && !!cityName,
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60 * 24, // 24 hours
  });
}