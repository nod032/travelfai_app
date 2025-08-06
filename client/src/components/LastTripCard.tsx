import React from "react";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Clock, Euro } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRecentTrips } from "@/hooks/useRecentTrips";
import type { TripRequest, TripResponse } from "@shared/schema";

interface LastTripCardProps {
  onGeneratingStart: () => void;
  onTripGenerated: (result: TripResponse, request: TripRequest) => void;
}

export function LastTripCard({ onGeneratingStart, onTripGenerated }: LastTripCardProps) {
  const { recentTrips } = useRecentTrips();
  const { toast } = useToast();

  // Grab the most recent trip request
  const lastTrip = recentTrips[0];
  if (!lastTrip) return null;

  const handleRerun = async () => {
    try {
      onGeneratingStart();

      // Re-use the stored TripRequest exactly
      const response = await apiRequest("POST", "/api/recommendTrip", lastTrip);
      if (!response.ok) throw new Error("Failed to re-run trip");

      const result = (await response.json()) as TripResponse;
      onTripGenerated(result, lastTrip);

      toast({
        title: "Trip Re-run!",
        description: "Your last trip has been generated again.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Could not re-run your last trip. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-2xl">Welcome Back!</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 bg-gray-50">
        <div>
          <h3 className="font-semibold">Your Last Trip</h3>
          <p className="flex items-center text-sm text-gray-600">
            <MapPin className="w-4 h-4 mr-1" />
            Starting from{" "}
            <span className="ml-1 font-medium">
              {lastTrip.origin.charAt(0).toUpperCase() + lastTrip.origin.slice(1)}
            </span>
          </p>
          <p className="text-sm text-gray-700">
            Duration: {lastTrip.durationDays} days &bull; Budget: €{lastTrip.maxBudget}
          </p>
          <p className="text-sm text-gray-700">
            Interests: {lastTrip.interests.join(", ")}
          </p>
        </div>
        <Button onClick={handleRerun} className="bg-blue-500 hover:bg-blue-600 text-white">
          <MapPin className="w-4 h-4 mr-2 rotate-180" /> Re-Run This Trip
        </Button>
      </CardContent>
    </Card>
  );
}
