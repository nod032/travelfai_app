import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { tripRequestSchema, type TripRequest, type TripResponse } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useRecentTrips } from "@/hooks/useRecentTrips";
import { Map, Bot } from "lucide-react";

interface TripRequestFormProps {
  onTripGenerated: (result: TripResponse) => void;
  onGeneratingStart: () => void;
}

const CITIES = [
  { id: "paris", name: "Paris, France" },
  { id: "london", name: "London, UK" },
  { id: "rome", name: "Rome, Italy" },
  { id: "barcelona", name: "Barcelona, Spain" },
  { id: "amsterdam", name: "Amsterdam, Netherlands" },
  { id: "prague", name: "Prague, Czech Republic" },
  { id: "vienna", name: "Vienna, Austria" },
  { id: "berlin", name: "Berlin, Germany" },
  { id: "stockholm", name: "Stockholm, Sweden" },
  { id: "budapest", name: "Budapest, Hungary" },
  { id: "dublin", name: "Dublin, Ireland" },
  { id: "florence", name: "Florence, Italy" },
  { id: "zurich", name: "Zurich, Switzerland" },
  { id: "copenhagen", name: "Copenhagen, Denmark" },
  { id: "brussels", name: "Brussels, Belgium" },
  { id: "lisbon", name: "Lisbon, Portugal" },
  { id: "edinburgh", name: "Edinburgh, Scotland" },
  { id: "munich", name: "Munich, Germany" },
  { id: "milan", name: "Milan, Italy" },
  { id: "lyon", name: "Lyon, France" }
];

const TRANSPORT_OPTIONS = [
  { id: "train", label: "Train", icon: "🚄" },
  { id: "flight", label: "Flight", icon: "✈️" },
  { id: "bus", label: "Bus", icon: "🚌" },
  { id: "car", label: "Car", icon: "🚗" }
];

const INTEREST_OPTIONS = [
  { id: "museums", label: "Museums", icon: "🏛️" },
  { id: "food", label: "Food", icon: "🍽️" },
  { id: "architecture", label: "Architecture", icon: "🏗️" },
  { id: "nightlife", label: "Nightlife", icon: "🌃" },
  { id: "shopping", label: "Shopping", icon: "🛍️" },
  { id: "nature", label: "Nature", icon: "🌿" },
  { id: "history", label: "History", icon: "📚" },
  { id: "art", label: "Art", icon: "🎨" }
];

export default function TripRequestForm({ onTripGenerated, onGeneratingStart }: TripRequestFormProps) {
  const { toast } = useToast();
  const { addTrip } = useRecentTrips();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TripRequest>({
    resolver: zodResolver(tripRequestSchema),
    defaultValues: {
      origin: "",
      durationDays: 7,
      maxBudget: 1500,
      transportPreference: [],
      interests: [],
      departureDate: new Date().toISOString().split('T')[0]
    },
  });

  const onSubmit = async (data: TripRequest) => {
    try {
      setIsSubmitting(true);
      onGeneratingStart();

      const response = await apiRequest("POST", "/api/recommendTrip", data);
      const result = await response.json() as TripResponse;
      
      // Save to recent trips
      addTrip(data);
      
      onTripGenerated(result);
      
      toast({
        title: "Trip Generated Successfully!",
        description: "Your personalized itinerary is ready.",
      });
    } catch (error) {
      console.error("Error generating trip:", error);
      toast({
        title: "Error",
        description: "Failed to generate trip. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="shadow-material-2">
      <CardHeader>
        <CardTitle className="flex items-center space-x-3 text-3xl font-playfair">
          <Map className="w-8 h-8 text-primary" />
          <span>Plan Your Trip</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Origin City */}
              <FormField
                control={form.control}
                name="origin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Starting City</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Choose your starting point" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CITIES.map((city) => (
                          <SelectItem key={city.id} value={city.id}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Duration */}
              <FormField
                control={form.control}
                name="durationDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Trip Duration</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="3">3 days</SelectItem>
                        <SelectItem value="5">5 days</SelectItem>
                        <SelectItem value="7">1 week</SelectItem>
                        <SelectItem value="10">10 days</SelectItem>
                        <SelectItem value="14">2 weeks</SelectItem>
                        <SelectItem value="21">3 weeks</SelectItem>
                        <SelectItem value="30">1 month</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Budget */}
              <FormField
                control={form.control}
                name="maxBudget"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Budget (EUR)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 1500"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Departure Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="departureDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Departure Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Transport Preferences */}
            <FormField
              control={form.control}
              name="transportPreference"
              render={() => (
                <FormItem>
                  <FormLabel>Transport Preferences</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {TRANSPORT_OPTIONS.map((transport) => (
                      <FormField
                        key={transport.id}
                        control={form.control}
                        name="transportPreference"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={transport.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(transport.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, transport.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== transport.id
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                <span className="mr-2">{transport.icon}</span>
                                {transport.label}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Interests */}
            <FormField
              control={form.control}
              name="interests"
              render={() => (
                <FormItem>
                  <FormLabel>Your Interests</FormLabel>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {INTEREST_OPTIONS.map((interest) => (
                      <FormField
                        key={interest.id}
                        control={form.control}
                        name="interests"
                        render={({ field }) => {
                          return (
                            <FormItem
                              key={interest.id}
                              className="flex flex-row items-start space-x-3 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(interest.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([...field.value, interest.id])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== interest.id
                                          )
                                        )
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="text-sm font-normal cursor-pointer">
                                <span className="mr-2">{interest.icon}</span>
                                {interest.label}
                              </FormLabel>
                            </FormItem>
                          )
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <div className="flex justify-center pt-6">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-secondary text-white px-12 py-4 text-lg hover:bg-secondary/90 shadow-material-2"
              >
                <span className="flex items-center space-x-3">
                  <Bot className="w-5 h-5" />
                  <span>Generate My Trip with AI</span>
                </span>
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
