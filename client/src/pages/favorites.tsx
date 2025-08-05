import { useFavorites } from "@/hooks/useFavorites";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Trash2, MapPin, Train, Plane, Bus, Car } from "lucide-react";

export default function Favorites() {
  const { favorites, removeFavoriteById } = useFavorites();

  const activityFavorites = favorites.filter(fav => fav.itemType === 'activity');
  const transportFavorites = favorites.filter(fav => fav.itemType === 'transport');

  const getTransportIcon = (mode: string) => {
    switch (mode) {
      case 'train': return <Train className="w-5 h-5" />;
      case 'flight': return <Plane className="w-5 h-5" />;
      case 'bus': return <Bus className="w-5 h-5" />;
      case 'car': return <Car className="w-5 h-5" />;
      default: return <MapPin className="w-5 h-5" />;
    }
  };

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-8">
        <div className="flex items-center space-x-3 mb-6">
          <Heart className="w-8 h-8 text-red-500" />
          <h1 className="text-3xl font-playfair font-semibold text-gray-900">
            Your Favorites
          </h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Favorite Activities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">Saved Activities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activityFavorites.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No favorite activities yet. Start planning a trip to save activities!
                </p>
              ) : (
                activityFavorites.map((favorite) => {
                  const activity = favorite.itemData as any;
                  return (
                    <div key={favorite.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-5 h-5 text-blue-500" />
                        <div>
                          <h4 className="font-medium text-gray-900">{activity.name}</h4>
                          <p className="text-sm text-gray-600">{activity.city}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFavoriteById(favorite.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
          
          {/* Favorite Transport */}
          <Card>
            <CardHeader>
              <CardTitle className="text-xl text-gray-900">Saved Transport</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {transportFavorites.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No favorite transport options yet. Save transport routes while planning!
                </p>
              ) : (
                transportFavorites.map((favorite) => {
                  const transport = favorite.itemData as any;
                  return (
                    <div key={favorite.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="text-blue-500">
                          {getTransportIcon(transport.mode)}
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900 capitalize">
                            {transport.mode}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {transport.from} → {transport.to}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFavoriteById(favorite.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}