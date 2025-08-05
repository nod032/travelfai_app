import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import TripRequestForm from "@/components/TripRequestForm";
import TripPlanDisplay from "@/components/TripPlanDisplay";
import RecentTripCard from "@/components/RecentTripCard";
import TrendingThemesCarousel from "@/components/TrendingThemesCarousel";
import { Card } from "@/components/ui/card";
import { useRecentTrips } from "@/hooks/useRecentTrips";
import { Loader2, Plane } from "lucide-react";
import type { TripRequest, TripResponse } from "@shared/schema";

export default function Home() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [tripResult, setTripResult] = useState<TripResponse | null>(null);
  const [tripRequest, setTripRequest] = useState<TripRequest | null>(null);
  const { recentTrips } = useRecentTrips();

  const hasRecentTrips = recentTrips.length > 0;

  const handleTripGenerated = (result: TripResponse, request: TripRequest) => {
    setTripResult(result);
    setTripRequest(request);
    setIsGenerating(false);
  };

  const handleGeneratingStart = () => {
    setIsGenerating(true);
    setTripResult(null);
    setTripRequest(null);
  };

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
            <div className="city-card group">
              <img 
                src="https://images.unsplash.com/photo-1549144511-f099e773c147?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300" 
                alt="Paris Notre-Dame Cathedral" 
              />
              <div className="city-overlay"></div>
              <div className="city-name">Paris</div>
            </div>
            
            <div className="city-card group">
              <img 
                src="https://images.unsplash.com/photo-1552832230-c0197dd311b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300" 
                alt="Rome Colosseum" 
              />
              <div className="city-overlay"></div>
              <div className="city-name">Rome</div>
            </div>
            
            <div className="city-card group">
              <img 
                src="https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300" 
                alt="London Tower Bridge" 
              />
              <div className="city-overlay"></div>
              <div className="city-name">London</div>
            </div>
            
            <div className="city-card group">
              <img 
                src="https://images.unsplash.com/photo-1534351590666-13e3e96b5017?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300" 
                alt="Amsterdam canals" 
              />
              <div className="city-overlay"></div>
              <div className="city-name">Amsterdam</div>
            </div>
            
            <div className="city-card group">
              <img 
                src="https://images.unsplash.com/photo-1541849546-216549ae216d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300" 
                alt="Prague Castle" 
              />
              <div className="city-overlay"></div>
              <div className="city-name">Prague</div>
            </div>
            
            <div className="city-card group">
              <img 
                src="https://images.unsplash.com/photo-1539037116277-4db20889f2d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300" 
                alt="Barcelona Sagrada Familia" 
              />
              <div className="city-overlay"></div>
              <div className="city-name">Barcelona</div>
            </div>
            
            <div className="city-card group">
              <img 
                src="https://images.unsplash.com/photo-1516550893923-42d28e5677af?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300" 
                alt="Vienna Schönbrunn Palace" 
              />
              <div className="city-overlay"></div>
              <div className="city-name">Vienna</div>
            </div>
            
            <div className="city-card group">
              <img 
                src="https://images.unsplash.com/photo-1509356843151-3e7d96241e11?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300" 
                alt="Stockholm waterfront" 
              />
              <div className="city-overlay"></div>
              <div className="city-name">Stockholm</div>
            </div>
          </div>
        </section>

        {/* Recent Trip or Trending Themes */}
        {hasRecentTrips ? (
          <RecentTripCard onRerunTrip={handleGeneratingStart} />
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
                Our AI is analyzing the best routes, activities, and experiences for you...
              </p>
              <div className="w-64 bg-gray-200 rounded-full h-2">
                <div className="bg-primary h-2 rounded-full animate-pulse w-3/4"></div>
              </div>
            </div>
          </Card>
        )}

        {/* Trip Results */}
        {tripResult && tripRequest && (
          <TripPlanDisplay tripResult={tripResult} tripRequest={tripRequest} />
        )}
      </div>
    </main>
  );
}
