import { Link, useLocation } from "wouter"
import { Plane, Heart, Map } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function AppHeader() {
  const [location] = useLocation()

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

          <div className="flex items-center space-x-3">
            <Link href="/favorites">
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex items-center space-x-2"
              >
                <Heart className="w-4 h-4" />
                <span>Favorites</span>
              </Button>
            </Link>

            <Link href="/saved-trips">
              <Button
                variant="outline"
                size="sm"
                className="hidden md:flex items-center space-x-2"
              >
                <Map className="w-4 h-4" />
                <span>Saved Trips</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
