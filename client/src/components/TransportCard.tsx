import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFavorites } from "@/hooks/useFavorites";
import { Train, Plane, Bus, Car, Clock, Euro, Calendar, Heart } from "lucide-react";

interface TransportCardProps {
  transport: {
    from: string;
    to: string;
    option: {
      mode: string;
      durationHrs: number;
      cost: number;
      departureTime?: string;
      arrivalTime?: string;
    };
  };
}

export default function TransportCard({ transport }: TransportCardProps) {
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();

  const getTransportIcon = (mode: string) => {
    switch (mode) {
      case 'train': return <Train className="w-6 h-6" />;
      case 'flight': return <Plane className="w-6 h-6" />;
      case 'bus': return <Bus className="w-6 h-6" />;
      case 'car': return <Car className="w-6 h-6" />;
      default: return <Train className="w-6 h-6" />;
    }
  };

  const getModeColor = (mode: string) => {
    switch (mode) {
      case 'train': return 'text-blue-600 bg-blue-100';
      case 'flight': return 'text-purple-600 bg-purple-100';
      case 'bus': return 'text-green-600 bg-green-100';
      case 'car': return 'text-orange-600 bg-orange-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  const transportId = `${transport.from}-${transport.to}-${transport.option.mode}`;
  const isInFavorites = isFavorite('transport', transportId);

  const handleToggleFavorite = () => {
    if (isInFavorites) {
      removeFavorite('transport', transportId);
    } else {
      addFavorite('transport', transportId, {
        ...transport.option,
        from: transport.from,
        to: transport.to
      });
    }
  };

  return (
    <Card className="shadow-material-1">
      <CardContent className="p-6">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${getModeColor(transport.option.mode)}`}>
            {getTransportIcon(transport.option.mode)}
          </div>
          
          <div className="flex-grow">
            <div className="flex items-center space-x-2 mb-1">
              <h4 className="font-medium text-gray-900 capitalize">
                {transport.option.mode === 'flight' ? 'Flight' : 
                 transport.option.mode === 'train' ? 'High-Speed Train' :
                 transport.option.mode.charAt(0).toUpperCase() + transport.option.mode.slice(1)}
              </h4>
              <Badge className="bg-blue-100 text-blue-800">Recommended</Badge>
            </div>
            <p className="text-sm text-gray-600">
              {transport.from.charAt(0).toUpperCase() + transport.from.slice(1)} → {transport.to.charAt(0).toUpperCase() + transport.to.slice(1)}
            </p>
            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
              <span className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{transport.option.durationHrs}h {Math.round((transport.option.durationHrs % 1) * 60)}min</span>
              </span>
              <span className="flex items-center space-x-1">
                <Euro className="w-4 h-4" />
                <span>€{transport.option.cost}</span>
              </span>
              {transport.option.departureTime && (
                <span className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{transport.option.departureTime}</span>
                </span>
              )}
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleFavorite}
            className={`${isInFavorites ? 'text-red-500 hover:text-red-700' : 'text-gray-400 hover:text-red-500'} hover:bg-red-50`}
          >
            <Heart className={`w-5 h-5 ${isInFavorites ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
