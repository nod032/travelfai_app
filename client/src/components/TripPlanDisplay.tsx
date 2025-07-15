import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TransportCard from "./TransportCard";
import ActivityCard from "./ActivityCard";
import { useSavedTrips } from "@/hooks/useSavedTrips";
import { useToast } from "@/hooks/use-toast";
import type { TripResponse } from "@shared/schema";
import { CheckCircle, Bookmark, Share, Download, Settings, MapPin, Clock, Euro, Calendar } from "lucide-react";

interface TripPlanDisplayProps {
  tripResult: TripResponse;
}

export default function TripPlanDisplay({ tripResult }: TripPlanDisplayProps) {
  const { saveTrip } = useSavedTrips();
  const { toast } = useToast();

  const handleSaveTrip = () => {
    saveTrip(tripResult);
    toast({
      title: "Trip Saved!",
      description: "Your trip has been saved to your collection.",
    });
  };

  const getCityImage = (city: string) => {
    const cityImages: Record<string, string> = {
      paris: "https://images.unsplash.com/photo-1549144511-f099e773c147?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
      london: "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
      rome: "https://images.unsplash.com/photo-1552832230-c0197dd311b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
      barcelona: "https://images.unsplash.com/photo-1539037116277-4db20889f2d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
      amsterdam: "https://images.unsplash.com/photo-1534351590666-13e3e96b5017?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
      prague: "https://images.unsplash.com/photo-1541849546-216549ae216d?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
      vienna: "https://images.unsplash.com/photo-1516550893923-42d28e5677af?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300",
      stockholm: "https://images.unsplash.com/photo-1509356843151-3e7d96241e11?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300"
    };
    return cityImages[city.toLowerCase()] || "https://images.unsplash.com/photo-1488646953014-85cb44e25828?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=300";
  };

  return (
    <section className="space-y-6 animate-fade-in">
      {/* Trip Summary Card */}
      <Card className="shadow-material-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CheckCircle className="w-8 h-8 text-green-500" />
              <CardTitle className="text-3xl font-playfair">Your Perfect Trip</CardTitle>
            </div>
            <Button onClick={handleSaveTrip} className="bg-primary text-white hover:bg-primary/90">
              <Bookmark className="w-4 h-4 mr-2" />
              Save This Trip
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-primary/10 rounded-lg p-4 text-center">
              <MapPin className="w-6 h-6 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-primary">
                {new Set(tripResult.tripDays.map(day => day.city)).size}
              </div>
              <div className="text-sm text-primary">Cities</div>
            </div>
            <div className="bg-secondary/10 rounded-lg p-4 text-center">
              <Clock className="w-6 h-6 text-secondary mx-auto mb-2" />
              <div className="text-2xl font-bold text-secondary">{tripResult.tripDays.length}</div>
              <div className="text-sm text-secondary">Days</div>
            </div>
            <div className="bg-green-100 rounded-lg p-4 text-center">
              <Euro className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-700">€{tripResult.totalCost}</div>
              <div className="text-sm text-green-600">Total Cost</div>
            </div>
            <div className="bg-purple-100 rounded-lg p-4 text-center">
              <Calendar className="w-6 h-6 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-purple-700">
                {tripResult.tripDays.reduce((sum, day) => sum + day.activities.length, 0)}
              </div>
              <div className="text-sm text-purple-600">Activities</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trip Days */}
      {tripResult.tripDays.map((day, index) => (
        <div key={day.day} className="space-y-4">
          {/* Transport Card (if not first day) */}
          {day.transport && index > 0 && (
            <TransportCard transport={day.transport} />
          )}

          {/* Day Card */}
          <Card className="shadow-material-1 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary to-primary/80 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-playfair">
                    Day {day.day} - {day.city.charAt(0).toUpperCase() + day.city.slice(1)}
                  </CardTitle>
                  <p className="text-primary-foreground/90">{day.date}</p>
                </div>
                <img
                  src={getCityImage(day.city)}
                  alt={`${day.city} cityscape`}
                  className="w-16 h-16 rounded-lg object-cover border-2 border-white/20"
                />
              </div>
            </CardHeader>
            
            <CardContent className="p-6 space-y-4">
              {day.activities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  city={day.city}
                />
              ))}
            </CardContent>
          </Card>
        </div>
      ))}
      
      {/* Additional Actions */}
      <Card className="shadow-material-1">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-primary text-white hover:bg-primary/90">
              <Share className="w-4 h-4 mr-2" />
              Share Trip
            </Button>
            <Button className="bg-green-500 text-white hover:bg-green-600">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
            <Button variant="outline">
              <Settings className="w-4 h-4 mr-2" />
              Modify Trip
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
