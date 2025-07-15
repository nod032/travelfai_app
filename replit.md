# TravelfAI - AI-Powered European Trip Planner

## Overview

TravelfAI is an MVP AI-powered multi-city trip planner focused on 20 European cities. It's a full-stack web application built with React frontend, Express backend, and uses static JSON data for POIs and transport options. The application generates personalized itineraries based on user preferences including budget, interests, duration, and transport preferences.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **UI Library**: shadcn/ui components (built on Radix UI primitives)
- **Styling**: Tailwind CSS with custom design system
- **State Management**: React hooks + TanStack Query for server state
- **Build Tool**: Vite for fast development and optimized builds

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **API Design**: RESTful endpoints for trip recommendations and data fetching
- **Data Storage**: In-memory storage with interface for future database integration
- **Static Data**: JSON files for cities, POIs, transport options, and trending themes

### Key Design Decisions

**Why React over Next.js**: The project uses React with client-side routing instead of Next.js for simplicity and faster development iteration for an MVP.

**Why Express over other backends**: Express provides a lightweight, familiar foundation that's easy to extend and deploy.

**Why Static JSON over Database**: For MVP speed and simplicity, static JSON files provide quick data access without database setup complexity. The architecture includes interfaces for easy migration to a database later.

## Key Components

### Trip Planning Engine
- **Algorithm**: Greedy heuristic for multi-city route optimization
- **Scoring System**: POI matching based on user interests and popularity scores
- **Budget Management**: Real-time budget tracking and feasibility checking
- **Transport Selection**: Multi-modal transport optimization (train, flight, bus, car)

### Data Models
- **Cities**: 20 European cities with metadata
- **POIs**: 5-10 points of interest per city with categories and popularity scores
- **Transport**: City-to-city connections with multiple transport modes
- **Trips**: Generated itineraries with daily activities and transport

### User Experience Features
- **Favorites System**: Save preferred activities and transport options
- **Recent Trips**: Quick access to previously generated trips
- **Trending Themes**: Curated travel themes to inspire trip planning
- **Responsive Design**: Mobile-first design with desktop optimization

## Data Flow

1. **Trip Request**: User submits preferences through form (origin, duration, budget, interests, transport preferences)
2. **Algorithm Processing**: Backend applies greedy algorithm to generate optimal itinerary
3. **Data Aggregation**: System combines transport options and POI data based on user preferences
4. **Response Generation**: Returns structured trip plan with daily activities and transport
5. **Client Storage**: Favorites and recent trips stored in browser localStorage
6. **Display**: Rich UI displays trip plan with interactive cards and save options

## External Dependencies

### Frontend Dependencies
- **React Ecosystem**: React, React DOM, React Router (Wouter)
- **UI Components**: Radix UI primitives, Lucide React icons
- **State Management**: TanStack Query for server state
- **Forms**: React Hook Form with Zod validation
- **Styling**: Tailwind CSS, Class Variance Authority
- **Utilities**: Date-fns, clsx for conditional classes

### Backend Dependencies
- **Core**: Express.js, TypeScript runtime (tsx)
- **Database ORM**: Drizzle ORM (configured for future PostgreSQL)
- **Validation**: Zod schemas shared between frontend and backend
- **Session Management**: Connect-pg-simple (for future session storage)
- **Development**: Vite integration for development server

### Build and Development
- **Build Tool**: Vite for frontend bundling
- **Backend Build**: esbuild for server compilation
- **TypeScript**: Shared configuration across frontend, backend, and shared modules
- **Development**: Hot reloading with Vite middleware integration

## Deployment Strategy

### Production Build
- **Frontend**: Vite builds optimized static assets to `dist/public`
- **Backend**: esbuild compiles server to `dist/index.js`
- **Assets**: Static JSON data served from client public directory
- **Environment**: Production mode with optimized bundles

### Development Workflow
- **Dev Server**: Express with Vite middleware for hot reloading
- **File Structure**: Monorepo structure with `client/`, `server/`, and `shared/` directories
- **Path Aliases**: Configured TypeScript paths for clean imports
- **Error Handling**: Runtime error overlay for development debugging

### Database Preparation
- **Schema Definition**: Drizzle schema ready for PostgreSQL
- **Migration System**: Configured for database migrations
- **Storage Interface**: Abstract storage layer for easy database integration
- **Session Ready**: Connect-pg-simple configured for session management

The architecture prioritizes rapid development and easy deployment while maintaining clean separation of concerns and preparing for future scalability needs.