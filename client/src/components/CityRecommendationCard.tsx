
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCityRecommendations } from "@/hooks/useCityRecommendations";
import { MapPin, Sparkles, AlertCircle } from "lucide-react";


interface CityRecommendationCardProps {
  cityName: string;
  userInterests: string[];
  budget: number;
  duration: number;
}


export default function CityRecommendationCard({
  cityName,
  userInterests,
  budget,
  duration,
}: CityRecommendationCardProps) {
      console.log("CityRecommendationCard is rendering for", {
    cityName,
    userInterests,
    budget,
    duration
  });

  const { data: recommendation, isLoading, error } = useCityRecommendations({
    cityName,
    userInterests,
    budget,
    duration,
  });

    console.log("AI Recommendation Data", { recommendation, isLoading, error });

  if (isLoading) {
    return (
      <Card className="border-blue-200 bg-blue-50/30">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-blue-500" />
            <CardTitle className="text-lg text-blue-700">
              AI Recommendations for {cityName.charAt(0).toUpperCase() + cityName.slice(1)}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-6 w-16" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-orange-200 bg-orange-50/30">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 text-orange-700">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">
              AI recommendations temporarily unavailable for {cityName}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!recommendation) {
    return null;
  }

  return (
    <Card className="border-blue-200 bg-gradient-to-br from-blue-50/50 to-purple-50/30">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-blue-500" />
          <CardTitle className="text-lg text-blue-700">
            Local Insider Guide for {recommendation.cityName.charAt(0).toUpperCase() + recommendation.cityName.slice(1)}
          </CardTitle>
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          Authentic local recommendations to complement your itinerary
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="prose prose-sm max-w-none text-gray-700">
          <p className="leading-relaxed whitespace-pre-line">
            {recommendation.recommendations}
          </p>
        </div>

        {recommendation.highlights.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-semibold text-blue-700 flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              Key Highlights
            </h4>
            <div className="flex flex-wrap gap-2">
              {recommendation.highlights.map((highlight, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-blue-100 text-blue-700 hover:bg-blue-200"
                >
                  {highlight}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 border-t pt-2 flex items-center">
          <Sparkles className="w-3 h-3 mr-1" />
          Local insights powered by AI - Personalized for your interests
        </div>
      </CardContent>
    </Card>
  );
}