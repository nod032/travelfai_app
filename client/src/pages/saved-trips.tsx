import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";
import TripPlanDisplay from "@/components/TripPlanDisplay";
import type { SavedTrip } from "@shared/schema";

export default function SavedTripsPage() {
  const { data: trips = [], refetch } = useQuery<SavedTrip[]>({
    queryKey: ["trips"],
    queryFn: () => apiRequest("GET", "/api/trips").then(r => r.json()),
    staleTime: 1000 * 60 * 5,
  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const activeTrip = trips.find(t => t.id.toString() === activeId);

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Saved Trips</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {trips.map(trip => (
            <div key={trip.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
              <span>{trip.name || new Date(trip.createdAt).toLocaleString()}</span>
              <div className="space-x-2">
                <Button size="sm" onClick={() => setActiveId(trip.id.toString())}>
                  View
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={async () => {
                    await apiRequest("DELETE", `/api/trips/${trip.id}`);
                    refetch();
                    if (activeId === trip.id.toString()) setActiveId(null);
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
          {trips.length === 0 && <p>No trips saved yet.</p>}
        </CardContent>
      </Card>

      {activeTrip && <TripPlanDisplay tripResult={activeTrip} />}
    </main>
  );
}
