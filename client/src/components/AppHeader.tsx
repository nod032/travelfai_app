import { Link, useLocation } from "wouter";
import { Plane, Heart, Map } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AppHeader() {
  const [location] = useLocation();

  return (
    <header className="bg-white shadow-material-1 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/">
            <div className="flex items-center space-x-2 cursor-pointer">
              <Plane className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-playfair font-bold text-gray-900">
                TravelfAI
              </h1>
            </div>
          </Link>
          
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/">
              <a className={`transition-colors duration-200 font-medium ${
                location === "/" 
                  ? "text-primary" 
                  : "text-gray-600 hover:text-primary"
              }`}>
                Plan Trip
              </a>
            </Link>
            <Link href="/favorites">
              <a className={`transition-colors duration-200 font-medium ${
                location === "/favorites" 
                  ? "text-primary" 
                  : "text-gray-600 hover:text-primary"
              }`}>
                Favorites
              </a>
            </Link>
          </nav>
          
          <div className="flex items-center space-x-3">
            <Link href="/favorites">
              <Button variant="outline" size="sm" className="hidden md:flex items-center space-x-2">
                <Heart className="w-4 h-4" />
                <span>Favorites</span>
              </Button>
            </Link>
            <Button className="bg-primary text-white hover:bg-primary/90">
              <span className="flex items-center space-x-2">
                <Map className="w-4 h-4" />
                <span className="hidden sm:inline">Sign In</span>
              </span>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
