import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRecentTrips } from "@/hooks/useRecentTrips";
import { RotateCcw, MapPin } from "lucide-react";

interface RecentTripCardProps {
  onRerunTrip: () => void;
}

export default function RecentTripCard({ onRerunTrip }: RecentTripCardProps) {
  const { recentTrips } = useRecentTrips();
  
  if (recentTrips.length === 0) {
    return null;
  }

  const lastTrip = recentTrips[0];

  return (
    <Card className="shadow-material-1 mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-playfair">Welcome Back!</CardTitle>
          <RotateCcw className="w-6 h-6 text-secondary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h3 className="font-medium text-gray-900 mb-2">Your Last Trip</h3>
          <p className="text-gray-600 text-sm mb-2 flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            Starting from {lastTrip.origin.charAt(0).toUpperCase() + lastTrip.origin.slice(1)}
          </p>
          <p className="text-gray-600 text-sm">
            Duration: {lastTrip.durationDays} days • Budget: €{lastTrip.maxBudget}
          </p>
          <p className="text-gray-600 text-sm">
            Interests: {lastTrip.interests.join(', ')}
          </p>
        </div>
        <Button 
          onClick={onRerunTrip}
          className="bg-primary text-white hover:bg-primary/90"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Re-Run This Trip
        </Button>
      </CardContent>
    </Card>
  );
}
