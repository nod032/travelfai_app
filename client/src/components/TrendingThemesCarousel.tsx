import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Palette, Utensils, Building, BookOpen, Moon, Trees } from "lucide-react";

export default function TrendingThemesCarousel() {
  const { data: themes, isLoading } = useQuery({
    queryKey: ["/api/trending-themes"],
  });

  const getThemeIcon = (themeName: string) => {
    switch (themeName.toLowerCase()) {
      case 'art & culture': return <Palette className="w-6 h-6" />;
      case 'culinary journey': return <Utensils className="w-6 h-6" />;
      case 'architecture tour': return <Building className="w-6 h-6" />;
      case 'historic europe': return <BookOpen className="w-6 h-6" />;
      case 'nightlife & entertainment': return <Moon className="w-6 h-6" />;
      case 'natural beauty': return <Trees className="w-6 h-6" />;
      default: return <TrendingUp className="w-6 h-6" />;
    }
  };

  const getThemeGradient = (index: number) => {
    const gradients = [
      'from-blue-50 to-indigo-100 border-blue-200',
      'from-green-50 to-emerald-100 border-green-200',
      'from-orange-50 to-amber-100 border-orange-200',
      'from-purple-50 to-violet-100 border-purple-200',
      'from-pink-50 to-rose-100 border-pink-200',
      'from-cyan-50 to-teal-100 border-cyan-200'
    ];
    return gradients[index % gradients.length];
  };

  const getIconColor = (index: number) => {
    const colors = [
      'text-blue-600',
      'text-green-600',
      'text-orange-600',
      'text-purple-600',
      'text-pink-600',
      'text-cyan-600'
    ];
    return colors[index % colors.length];
  };

  if (isLoading) {
    return (
      <Card className="shadow-material-1 mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-playfair">Trending Themes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-gray-200 rounded-lg p-4 h-32 animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-material-1 mb-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-playfair">Trending Themes</CardTitle>
          <TrendingUp className="w-6 h-6 text-secondary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {themes?.map((theme: any, index: number) => (
            <div
              key={theme.name}
              className={`material-card bg-gradient-to-br ${getThemeGradient(index)} rounded-lg p-4 cursor-pointer border`}
            >
              <div className="flex items-center space-x-3 mb-3">
                <div className={getIconColor(index)}>
                  {getThemeIcon(theme.name)}
                </div>
                <h3 className="font-medium text-gray-900">{theme.name}</h3>
              </div>
              <p className="text-sm text-gray-600 mb-3">{theme.example}</p>
              <div className="text-xs font-medium text-primary">
                {theme.cities.join(' • ')}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
