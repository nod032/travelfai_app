import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/home";
import Favorites from "@/pages/favorites";
import SharedTrip from "@/pages/SharedTrip";
import AppHeader from "@/components/AppHeader";

function Router() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/favorites" component={Favorites} />
        <Route path="/shared-trip" component={SharedTrip} /> {}
        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;