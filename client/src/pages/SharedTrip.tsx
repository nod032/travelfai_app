import React, { useEffect, useState } from 'react';
import TripPlanDisplay from '@/components/TripPlanDisplay'; 
import { TripResponse } from '@shared/schema';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Frown } from 'lucide-react';

export default function SharedTrip() {
  const [tripData, setTripData] = useState<TripResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    
    // Use window.location.search to get the query string directly
    const queryString = window.location.search; 

    if (queryString) {
      // URLSearchParams automatically handles the leading '?'
      const queryParams = new URLSearchParams(queryString); 
      const encodedData = queryParams.get('data');

      if (encodedData) {
        try {
          const decodedData = atob(encodedData);
          const parsedData: TripResponse = JSON.parse(decodedData);
          setTripData(parsedData);
          setError(null); 
        } catch (e) {
          setError("Failed to load trip data. The link might be corrupted or too old.");
        }
      } else {
        setError("No trip data found in the URL parameter 'data'.");
      }
    } else {
      setError("No query parameters found in the URL. Is the URL missing '?data=...'?");
    }
  }, []); 
  if (error) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center h-[calc(100vh-100px)]">
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <Frown className="w-12 h-12 text-destructive mx-auto mb-4" />
            <CardTitle className="text-2xl">Oops! Something Went Wrong</CardTitle>
          </CardHeader>
          <CardContent>
            <CardDescription className="text-lg text-red-600">
              {error}
            </CardDescription>
            <p className="mt-4 text-muted-foreground">
              Please ensure you have the correct and complete sharing link.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!tripData) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center h-[calc(100vh-100px)]">
        <Card className="w-full max-w-md text-center">
            <CardContent className="py-8">
                <p className="text-lg text-muted-foreground">Loading trip data...</p>
            </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <TripPlanDisplay tripResult={tripData} />
    </div>
  );
}