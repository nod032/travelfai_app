import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFavorites } from "@/hooks/useFavorites";
import { Clock, Heart, Amphora, Utensils, Building, Moon, ShoppingBag, Trees, BookOpen, Palette } from "lucide-react";

interface ActivityCardProps {
  activity: {
    id: string;
    name: string;
    category: string;
    time: string;
    duration?: number;
  };
  city: string;
}

export default function ActivityCard({ activity, city }: ActivityCardProps) {
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'museums': return <Amphora className="w-5 h-5" />;
      case 'food': return <Utensils className="w-5 h-5" />;
      case 'architecture': return <Building className="w-5 h-5" />;
      case 'nightlife': return <Moon className="w-5 h-5" />;
      case 'shopping': return <ShoppingBag className="w-5 h-5" />;
      case 'nature': return <Trees className="w-5 h-5" />;
      case 'history': return <BookOpen className="w-5 h-5" />;
      case 'art': return <Palette className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'museums': return 'bg-blue-100 text-blue-800';
      case 'food': return 'bg-green-100 text-green-800';
      case 'architecture': return 'bg-orange-100 text-orange-800';
      case 'nightlife': return 'bg-purple-100 text-purple-800';
      case 'shopping': return 'bg-pink-100 text-pink-800';
      case 'nature': return 'bg-emerald-100 text-emerald-800';
      case 'history': return 'bg-gray-100 text-gray-800';
      case 'art': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const isInFavorites = isFavorite('activity', activity.id);

  const handleToggleFavorite = () => {
    if (isInFavorites) {
      removeFavorite('activity', activity.id);
    } else {
      addFavorite('activity', activity.id, {
        ...activity,
        city
      });
    }
  };

  return (
    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200">
      <div className="flex-shrink-0 text-gray-600">
        {getCategoryIcon(activity.category)}
      </div>
      
      <div className="flex-grow">
        <h4 className="font-medium text-gray-900">{activity.name}</h4>
        <p className="text-sm text-gray-600">
          {activity.category.charAt(0).toUpperCase() + activity.category.slice(1)} • {activity.time}
        </p>
        <div className="flex items-center space-x-2 mt-1">
          <Badge className={getCategoryColor(activity.category)}>
            {activity.category.charAt(0).toUpperCase() + activity.category.slice(1)}
          </Badge>
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
  );
}
