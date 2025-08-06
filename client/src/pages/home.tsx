// client/src/pages/home.tsx

import { useState } from "react";
import { useRecentTrips } from "@/hooks/useRecentTrips";
import { Loader2, Plane } from "lucide-react";

import TripRequestForm from "@/components/TripRequestForm";
import TripPlanDisplay from "@/components/TripPlanDisplay";
import { LastTripCard } from "@/components/LastTripCard"; 
import TrendingThemesCarousel from "@/components/TrendingThemesCarousel";
import { Card } from "@/components/ui/card";

import type { TripRequest, TripResponse } from "@shared/schema";

export default function Home() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [tripResult, setTripResult] = useState<TripResponse | null>(null);
  const [tripRequest, setTripRequest] = useState<TripRequest | null>(null);
  const { recentTrips } = useRecentTrips();

  const hasRecentTrips = recentTrips.length > 0;

  function handleTripGenerated(result: TripResponse, request: TripRequest) {
    setTripResult(result);
    setTripRequest(request);
    setIsGenerating(false);
  }

  function handleGeneratingStart() {
    setIsGenerating(true);
    setTripResult(null);
    setTripRequest(null);
  }

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        {/* Hero Section */}
        <section className="text-center py-12">
          <h1 className="text-5xl font-playfair font-bold text-gray-900 mb-4">
            Plan Your Perfect European Adventure
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Discover some amazing European cities with our AI-powered trip planner.
            Get personalized itineraries based on your interests, budget, and time.
          </p>

          {/* European Cities Showcase */}
          <div className="travel-grid mt-12">
            {/* ... your existing city cards ... */}
          </div>
        </section>

        {/* Recent Trip or Trending Themes */}
        {hasRecentTrips ? (
          <LastTripCard
            onGeneratingStart={handleGeneratingStart}
            onTripGenerated={handleTripGenerated}
          />
        ) : (
          <TrendingThemesCarousel />
        )}

        {/* Trip Request Form */}
        <TripRequestForm
          onTripGenerated={handleTripGenerated}
          onGeneratingStart={handleGeneratingStart}
        />

        {/* Loading State */}
        {isGenerating && (
          <Card className="p-8 text-center animate-fade-in">
            <div className="flex flex-col items-center space-y-4">
              <div className="animate-spin text-primary">
                <Plane className="w-16 h-16" />
              </div>
              <h3 className="text-xl font-playfair font-semibold text-gray-900">
                Creating Your Perfect Trip
              </h3>
              <p className="text-gray-600">
                Our AI is analyzing the best routes, activities, and experiences
                for you...
              </p>
              <div className="w-64 bg-gray-200 rounded-full h-2">
                <div className="bg-primary h-2 rounded-full animate-pulse w-3/4" />
              </div>
            </div>
          </Card>
        )}

        {/* Trip Results */}
        {tripResult && tripRequest && (
          <TripPlanDisplay
            tripResult={tripResult}
            tripRequest={tripRequest}
          />
        )}
      </div>
    </main>
  );
}
