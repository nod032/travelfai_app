# TravelfAI Complete File Export

## Core Application Files

Copy these files exactly into your local project structure.

### server/index.ts
```typescript
import express from "express";
import { createServer } from "http";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { existsSync } from "fs";
import vite from "./vite.js";
import routes from "./routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// API routes
app.use("/api", routes);

if (process.env.NODE_ENV === "production") {
  const publicPath = join(__dirname, "../dist/public");
  if (existsSync(publicPath)) {
    app.use(express.static(publicPath));
  }
  
  app.get("*", (_req, res) => {
    const indexPath = join(publicPath, "index.html");
    if (existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).send("Not Found");
    }
  });
} else {
  // Development: use Vite middleware
  vite(app);
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, "0.0.0.0", () => {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [express] serving on port ${PORT}`);
});
```

### server/vite.ts
```typescript
import { createServer } from "vite";

export default async function setupVite(app: any) {
  const vite = await createServer({
    server: { middlewareMode: true },
  });
  app.use(vite.ssrFixStacktrace);
  app.use(vite.middlewares);
}
```

### shared/schema.ts
```typescript
import { pgTable, text, serial, integer, boolean, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const trips = pgTable("trips", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  origin: text("origin").notNull(),
  duration: integer("duration").notNull(),
  budget: integer("budget").notNull(),
  transportPreferences: json("transport_preferences").$type<string[]>().notNull(),
  interests: json("interests").$type<string[]>().notNull(),
  departureDate: text("departure_date").notNull(),
  tripDays: json("trip_days").$type<TripDay[]>().notNull(),
  totalCost: integer("total_cost").notNull(),
  totalTravelTime: integer("total_travel_time").notNull(),
  remainingBudget: integer("remaining_budget").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const favorites = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: integer("user_id"),
  itemType: text("item_type").notNull(), // 'activity' or 'transport'
  itemId: text("item_id").notNull(),
  itemData: json("item_data").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// TypeScript interfaces for the trip recommendation system
export interface TransportOption {
  mode: string;
  durationHrs: number;
  cost: number;
  departureTime?: string;
  arrivalTime?: string;
}

export interface Poi {
  id: string;
  name: string;
  category: string;
  popularityScore: number;
  description?: string;
  duration?: number;
}

export interface TripDay {
  day: number;
  city: string;
  date: string;
  transport?: {
    from: string;
    to: string;
    option: TransportOption;
  };
  activities: Array<{
    id: string;
    name: string;
    category: string;
    time: string;
    duration?: number;
  }>;
  dailyCost: number;
}

export interface TripRequest {
  origin: string;
  durationDays: number;
  maxBudget: number;
  transportPreference: string[];
  interests: string[];
  departureDate: string;
}

export interface TripResponse {
  tripDays: TripDay[];
  totalCost: number;
  totalTravelTime: number;
  remainingBudget: number;
}

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertTripSchema = createInsertSchema(trips).omit({
  id: true,
  createdAt: true,
  userId: true,
});

export const insertFavoriteSchema = createInsertSchema(favorites).omit({
  id: true,
  createdAt: true,
  userId: true,
});

export const tripRequestSchema = z.object({
  origin: z.string().min(1, "Origin city is required"),
  durationDays: z.number().min(1).max(30),
  maxBudget: z.number().min(100),
  transportPreference: z.array(z.string()).min(1, "Select at least one transport option"),
  interests: z.array(z.string()).min(1, "Select at least one interest"),
  departureDate: z.string().min(1, "Departure date is required"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Trip = typeof trips.$inferSelect;
export type InsertTrip = z.infer<typeof insertTripSchema>;
export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = z.infer<typeof insertFavoriteSchema>;
```

## Frontend Entry Files

### client/index.html
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>TravelfAI - AI-Powered European Trip Planner</title>
    <meta name="description" content="Plan amazing multi-city European trips with AI-powered recommendations. Get personalized itineraries, transport options, and activity suggestions." />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### client/src/main.tsx
```typescript
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import App from "./App.tsx";
import "./index.css";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <App />
    </TooltipProvider>
  </QueryClientProvider>
);
```

### client/src/App.tsx
```typescript
import { Router, Route } from "wouter";
import AppHeader from "./components/AppHeader";
import HomePage from "./pages/home";
import FavoritesPage from "./pages/favorites";

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <Route path="/" component={HomePage} />
        <Route path="/favorites" component={FavoritesPage} />
      </div>
    </Router>
  );
}

export default App;
```

Continue with the remaining files... This is getting quite long. Would you like me to create separate files for each component, or would you prefer a ZIP file download approach instead?