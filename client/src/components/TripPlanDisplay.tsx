import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import TransportCard from "./TransportCard";
import ActivityCard from "./ActivityCard";
import CityRecommendationCard from "@/components/CityRecommendationCard";
import { useSavedTrips } from "@/hooks/useSavedTrips";
import { useToast } from "@/hooks/use-toast";
import type { TripResponse, TripRequest } from "@shared/schema";
import { CheckCircle, Bookmark, Share, Download, Settings, MapPin, Clock, Euro, Calendar } from "lucide-react";

interface TripPlanDisplayProps {
  tripResult: TripResponse;
  tripRequest?: TripRequest;
}

export default function TripPlanDisplay({ tripResult, tripRequest }: TripPlanDisplayProps) {
  console.log('TripPlanDisplay', { tripRequest });

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

  const handleShareTrip = () => {
    // Encode the tripResult into a base64 string to handle special characters in URL
    const tripDataEncoded = btoa(JSON.stringify(tripResult)); // Base64 encode
    // Get the current base URL 
    const baseUrl = window.location.origin;
    const shareableUrl = `${baseUrl}/shared-trip?data=${tripDataEncoded}`;

    navigator.clipboard.writeText(shareableUrl).then(() => {
      toast({
        title: "Trip URL Copied!",
        description: "The trip itinerary URL has been copied to your clipboard. Note: This link is long and contains all trip data directly.",
      });
    }).catch(err => {
      console.error("Failed to copy URL: ", err);
      toast({
        title: "Failed to Copy URL",
        description: "Could not copy the trip URL to your clipboard.",
        variant: "destructive",
      });
    });
  };

  const handleExportPdf = () => {
    const input = document.getElementById("trip-plan-section");
    if (input) {
      // Ensure images are fully loaded before capturing
      const images = input.querySelectorAll('img');
      const promises = Array.from(images).filter(img => !img.complete).map(img => {
        return new Promise(resolve => {
          img.onload = img.onerror = resolve;
        });
      });

      Promise.all(promises).then(() => {
        html2canvas(input, {
          scale: 3, 
          useCORS: true, // Important if images are from different origins
          logging: true,
          backgroundColor: '#ffffff',
        }).then((canvas) => {
          const imgData = canvas.toDataURL("image/png");
          const pdf = new jsPDF({
            orientation: "portrait",
            unit: "pt",
            format: "a4",
          });

          const imgProps = pdf.getImageProperties(imgData);
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width; // Height of the image as it would fit on PDF width

          let heightLeft = pdfHeight; // Remaining height of the image to be placed
          let position = 0; // Current position from the top of the image to start clipping
          const pageHeight = pdf.internal.pageSize.getHeight(); 

          while (heightLeft > 0) {
              // If not the first page, add a new one
              if (position !== 0) {
                  pdf.addPage();
              }

              pdf.saveGraphicsState();

              pdf.rect(0, 0, pdfWidth, pageHeight);
              pdf.clip();

              // This makes it look like we're "scrolling" the image up each page
              pdf.addImage(imgData, "PNG", 0, -position, pdfWidth, pdfHeight);

              pdf.restoreGraphicsState();

              heightLeft -= pageHeight;
              position += pageHeight;
          }

          pdf.save(`TravelfAI_Trip_to_${tripResult.tripDays[0].city}.pdf`);
          toast({
            title: "PDF Exported!",
            description: "Your trip itinerary has been downloaded as a PDF.",
          });
        }).catch(err => {
            console.error("html2canvas error: ", err);
            toast({
                title: "Export Failed",
                description: "There was an issue capturing the trip plan for PDF. Please try again.",
                variant: "destructive",
            });
        });
      });
    } else {
      toast({
        title: "Export Failed",
        description: "Could not find the trip plan section to export.",
        variant: "destructive",
      });
    }
  };

  return (
    <section id="trip-plan-section" className="space-y-6 animate-fade-in">
      {/* Trip Summary Card */}
      <Card className="shadow-material-2" style={{ backgroundColor: '#ffffff' }}>
        <CardHeader style={{ backgroundColor: '#ffffff' }}>
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
            <div className="rounded-lg p-4 text-center" style={{ backgroundColor: '#EFF6FF' }}>
              <MapPin className="w-6 h-6 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-primary">
                {new Set(tripResult.tripDays.map(day => day.city)).size}
              </div>
              <div className="text-sm text-primary">Cities</div>
            </div>
            <div className="rounded-lg p-4 text-center" style={{ backgroundColor: '#F0F0F0' }}>
              <Clock className="w-6 h-6 text-secondary mx-auto mb-2" />
              <div className="text-2xl font-bold text-secondary">{tripResult.tripDays.length}</div>
              <div className="text-sm text-secondary">Days</div>
            </div>
            <div className="bg-green-100 rounded-lg p-4 text-center" style={{ backgroundColor: '#D1FAE5' }}>
              <Euro className="w-6 h-6 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-green-700">€{tripResult.totalCost}</div>
              <div className="text-sm text-green-600">Total Cost</div>
            </div>
            <div className="bg-purple-100 rounded-lg p-4 text-center" style={{ backgroundColor: '#EDE9FE' }}>
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
          <Card className="shadow-material-1 overflow-hidden" style={{ backgroundColor: '#ffffff' }}>
            <CardHeader className="text-white"
                style={{ background: 'linear-gradient(to right, #6366F1, #8183F7)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-playfair">
                    Day {day.day} - {day.city.charAt(0).toUpperCase() + day.city.slice(1)}
                  </CardTitle>
                  <p className="text-primary-foreground/90">
                        {day.date}
                    </p>
                </div>
                <img
                  src={getCityImage(day.city)}
                  alt={`${day.city} cityscape`}
                  className="w-16 h-16 rounded-lg object-cover border-2 border-white/20"
                />
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4" style={{ backgroundColor: '#ffffff' }}>
              {day.activities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  city={day.city}
                />
              ))}
              
              {/* AI City Recommendations */}
              {tripRequest && (
                <CityRecommendationCard
                  cityName={day.city}
                  userInterests={tripRequest.interests}
                  budget={tripRequest.maxBudget}
                  duration={tripRequest.durationDays}
                />
              )}
            </CardContent>
          </Card>
        </div>
      ))}

      {/* Additional Actions */}
      <Card className="shadow-material-1" style={{ backgroundColor: '#ffffff' }}>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={handleShareTrip} className="bg-primary text-white hover:bg-primary/90">
              <Share className="w-4 h-4 mr-2" />
              Share Trip
            </Button>
            <Button onClick={handleExportPdf} className="bg-green-500 text-white hover:bg-green-600">
              <Download className="w-4 h-4 mr-2" />
              Export PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}