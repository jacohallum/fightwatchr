FightWatchr 🥊

A Masters Project in Software Engineering

Your ultimate UFC and MMA command center. Track your favorite fighters, follow live events, and never miss a fight!

This project demonstrates modern web development practices, real-time data integration, and user experience design for combat sports enthusiasts.
🎓 Academic Project Overview

This is a comprehensive full-stack web application developed as part of a Masters in Software Engineering program. The project showcases:

    Modern Web Architecture with Next.js 14 and TypeScript
    Real-time API Integration with ESPN MMA and UFC data sources
    Secure Authentication Systems with industry-standard practices
    Relational Database Design with fighter and event modeling
    User Experience Design with responsive, octagon-themed interfaces
    Progressive Web App development principles

🚀 Current Features
Authentication System

    Secure Login/Signup with NextAuth.js and bcrypt password hashing
    Session Management with JWT tokens
    Protected Routes with automatic redirects
    Database Integration with PostgreSQL via Prisma

Fighter & Event Management

    Real-time UFC Data from ESPN MMA API
    Fighter Profiles with records, rankings, and statistics
    Event Tracking for upcoming UFC cards and fight nights
    Weight Class Organization from Flyweight to Heavyweight
    User Preferences for favorite fighters and weight classes

User Experience

    Welcome Modal for first-time users with fighter selection
    Collapsible Interface with expandable weight class categories
    Fighter Cards with photos, records, and fighting styles
    Loading States with spinners and progress indicators
    Error Handling with fallback mechanisms
    Responsive Design optimized for all screen sizes

Technical Implementation

    TypeScript for type safety and better development experience
    Server-side Rendering with Next.js 14 App Router
    Database ORM with Prisma for type-safe database operations
    RESTful API Routes for fighter data and user management
    Modern UI with Tailwind CSS utility framework
    Octagon-themed Design inspired by UFC branding

🛠️ Tech Stack
Frontend

    Next.js 14 - React framework with App Router
    TypeScript - Type-safe JavaScript for better code quality
    Tailwind CSS - Utility-first CSS framework
    React Hooks - Modern state management and side effects

Backend

    NextAuth.js - Authentication library with multiple providers
    Prisma ORM - Type-safe database toolkit
    PostgreSQL - Production-ready relational database
    bcryptjs - Secure password hashing

External APIs

    ESPN MMA API - Real-time UFC and MMA fighter/event data
    Custom API Routes - User preferences and fighter management

📦 Installation & Setup
Prerequisites

    Node.js 18+ and npm
    PostgreSQL database
    Git

Step-by-Step Installation

Clone the repository

git clone <repository-url>
cd fightwatchr

Install dependencies

npm install

Environment Configuration

cp .env.example .env.local

Configure your environment variables:

DATABASE_URL="postgresql://username:password@localhost:5432/fightwatchr"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
ESPN_API_KEY="your-espn-api-key" # If required

Database Setup

npx prisma db push
npx prisma generate

Start Development Server

npm run dev

    Access Application Open http://localhost:3000 in your browser

🏗️ Architecture & Project Structure

fightwatchr/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/[...nextauth]/   # NextAuth configuration
│   │   ├── signup/               # User registration endpoint
│   │   ├── fighters/             # Fighter data endpoints
│   │   ├── events/               # Event and fight card endpoints
│   │   └── user/                 # User preferences and following
│   │       ├── preferences/      # User settings CRUD
│   │       └── following/        # Followed fighters management
│   ├── dashboard/                # Protected dashboard page
│   └── page.tsx                  # Landing/login page
├── lib/                          # Utility libraries
│   ├── prisma.ts                 # Database client configuration
│   └── services/                 # Business logic services
│       ├── espn.ts               # ESPN API integration
│       └── fighters.ts           # Fighter data services
├── hooks/                        # Custom React hooks
├── prisma/                       # Database schema and migrations
│   └── schema.prisma             # Database schema definition
└── components/                   # Reusable UI components
    ├── FighterCard.tsx           # Individual fighter display
    ├── EventCard.tsx             # UFC event display
    └── WeightClassFilter.tsx     # Weight class navigation

🎯 API Design
Authentication Endpoints

    POST /api/signup - User registration with validation
    POST /api/auth/signin - User authentication
    POST /api/auth/signout - Session termination

Fighter Data Endpoints

    GET /api/fighters - Fetch all fighters or search by name/weight class
    GET /api/fighters/:id - Get detailed fighter profile
    GET /api/fighters/rankings - Current UFC rankings by weight class

Event Endpoints

    GET /api/events - Upcoming and past UFC events
    GET /api/events/:id - Detailed event card with all fights
    GET /api/events/live - Live fight tracking and results

User Management Endpoints

    GET /api/user/following - Retrieve user's followed fighters
    POST /api/user/following - Follow a fighter
    DELETE /api/user/following/:fighterId - Unfollow a fighter
    GET /api/user/preferences - Retrieve user preferences
    PUT /api/user/preferences - Update notification and display settings

🗃️ Database Design
Core Schema

model User {
  id                    String    @id @default(cuid())
  email                 String    @unique
  password              String    // bcrypt hashed
  favoriteFighters      Fighter[] @relation("UserFighters")
  favoriteWeightClasses String[]  // ["Lightweight", "Welterweight"]
  notificationSettings  Json?     // Email/push preferences
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
}

model Fighter {
  id          String   @id @default(cuid())
  espnId      String?  @unique
  name        String
  nickname    String?  // "The Notorious", "BMF"
  record      String   // "25-3-0" (Wins-Losses-Draws)
  weightClass String   // "Lightweight", "Welterweight", etc.
  ranking     Int?     // Current UFC ranking in division
  imageUrl    String?
  height      String?  // "5'9\""
  reach       String?  // "74\""
  stance      String?  // "Orthodox", "Southpaw", "Switch"
  wins        Int      @default(0)
  losses      Int      @default(0)
  draws       Int      @default(0)
  followers   User[]   @relation("UserFighters")
  fights      Fight[]  @relation("FighterFights")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Event {
  id          String   @id @default(cuid())
  espnId      String?  @unique
  name        String   // "UFC 300: Pereira vs. Hill"
  eventType   String   // "PPV", "Fight Night", "Numbered"
  date        DateTime
  location    String
  venue       String?
  fights      Fight[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model Fight {
  id           String   @id @default(cuid())
  event        Event    @relation(fields: [eventId], references: [id])
  eventId      String
  fighter1     Fighter  @relation("FighterFights", fields: [fighter1Id], references: [id])
  fighter1Id   String
  fighter2     Fighter  @relation("FighterFights", fields: [fighter2Id], references: [id])
  fighter2Id   String
  weightClass  String
  isMainEvent  Boolean  @default(false)
  isTitleFight Boolean  @default(false)
  rounds       Int      @default(3) // 3 or 5
  result       String?  // "fighter1", "fighter2", "draw", "no-contest"
  method       String?  // "KO/TKO", "Submission", "Decision"
  endRound     Int?
  endTime      String?  // "4:32"
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}

Supported Weight Classes

    Men's Divisions:
        Flyweight (125 lbs)
        Bantamweight (135 lbs)
        Featherweight (145 lbs)
        Lightweight (155 lbs)
        Welterweight (170 lbs)
        Middleweight (185 lbs)
        Light Heavyweight (205 lbs)
        Heavyweight (265 lbs)

    Women's Divisions:
        Strawweight (115 lbs)
        Flyweight (125 lbs)
        Bantamweight (135 lbs)
        Featherweight (145 lbs)

🎨 User Interface Design
Landing Page Features

    Octagon-shaped login form inspired by UFC cage design
    Animated fight ticker with upcoming events
    Dual-mode authentication (Sign In / Sign Up)
    Form validation with user-friendly error messages
    UFC-themed color scheme (red, black, gold accents)

Dashboard Features

    Authentication guards with loading states
    First-time user onboarding with fighter/weight class selection
    Weight class filters with collapsible sections
    Fighter cards with:
        Fighter photo and nickname
        Win-Loss-Draw record
        Current ranking
        Next scheduled fight
        Follow/Unfollow button
    Upcoming Events widget with fight cards
    Followed Fighters feed with latest news
    Preferences management with real-time updates

🧠 Core Features (In Development)
Live Fight Night Tracker

    Real-time Fight Updates with round-by-round scoring
    Live Event Cards with fight order and timing
    Push Notifications for followed fighters' bouts
    Post-Fight Results with method and round information

Fighter Profiles

    Comprehensive Statistics (striking, grappling, cardio)
    Fight History with complete record
    Upcoming Bouts with opponent information
    Tale of the Tape comparisons
    Fighting Style Analysis (striker, grappler, wrestler)

Event Management

    UFC Calendar with all scheduled events
    Fight Card Breakdown with main and prelim fights
    Venue Information and event timing
    Streaming/Broadcast Details for events

🚀 Planned Features (Future Development)
AI-Powered Analysis

    Fight Prediction Engine using machine learning
    Matchup Analysis based on fighting styles and stats
    AI-Generated Fight Recaps with GPT integration
    Power Rankings Algorithm with weekly updates
    Fight IQ Scoring based on technique and strategy

Enhanced User Experience

    Interactive Fighter Comparison Tool
    Event Timeline Views with countdowns
    Live Strike/Grapple Statistics during fights
    Social Features for fight predictions and discussions
    Fantasy MMA Integration for leagues

Advanced Features

    Dark Mode Toggle with system preference detection
    Accessibility Compliance (WCAG 2.1 AA standards)
    Progressive Web App with offline fight cards
    Multi-language Support for international fans
    Dashboard Customization with widget arrangement
    Email Digest with weekly fight schedule

Integration Opportunities

    Twitter/X API for fighter tweets and news
    Reddit Integration for community discussions
    YouTube for fight highlights and analysis
    Sherdog/Tapology for additional fighter data
    Betting Odds from major sportsbooks

🔧 Technical Configuration
ESPN MMA API Integration

    Rate Limiting and error handling for external API calls
    Data Normalization for consistent fighter information
    Caching Strategy to minimize API requests (Redis recommended)
    Fallback Mechanisms with mock data for development
    Scheduled Jobs for rankings and event updates

Security Implementation

    Password Security: bcrypt hashing with 12 salt rounds
    SQL Injection Prevention: Parameterized queries via Prisma
    CSRF Protection: Built-in NextAuth.js security
    Session Security: Secure JWT token management
    Input Validation: Client and server-side validation
    Environment Security: Sensitive data in environment variables
    Rate Limiting: API endpoint throttling to prevent abuse

🎯 Learning Objectives Demonstrated

    Full-Stack Development: End-to-end application development
    Modern JavaScript/TypeScript: Advanced language features and typing
    Database Design: Relational modeling for sports data
    API Design: RESTful API development and external integration
    Authentication: Secure user management and session handling
    User Experience: Responsive design and accessibility
    Real-time Data: External API integration and data processing
    Domain Modeling: Complex relationships (fighters, events, fights)
    Deployment: Production deployment strategies
    Version Control: Git workflow and project management

📊 Project Metrics

    Languages: TypeScript (primary), JavaScript, SQL
    Lines of Code: ~3,500+ (estimated)
    Components: 20+ React components
    API Endpoints: 12+ custom endpoints
    Database Tables: 4 core models (User, Fighter, Event, Fight)
    External APIs: ESPN MMA API integration
    Weight Classes: 12 divisions tracked
    Testing Coverage: Unit and integration tests (planned)

🛡️ Security & Best Practices

    OWASP Security Guidelines implementation
    Data Privacy compliance (GDPR considerations)
    Input Sanitization and validation
    Secure Headers and HTTPS enforcement
    Rate Limiting for API endpoints
    Error Handling without information disclosure
    Dependency Scanning with npm audit
    Environment Variable Protection

📚 Documentation & Resources
Key Technologies Documentation

    Next.js Documentation
    Prisma Documentation
    NextAuth.js Documentation
    Tailwind CSS Documentation
    ESPN API Documentation

MMA/UFC Resources

    UFC Official Website
    Sherdog Fighter Database
    Tapology Event Calendar
    UFC Stats

Academic References

    Modern web development practices and architecture patterns
    Database design principles and normalization
    User experience design for web applications
    Security best practices for web applications
    Real-time data integration patterns

Technical Acknowledgments

    ESPN for providing comprehensive MMA/UFC data API
    NextAuth.js for robust authentication framework
    Prisma for type-safe database operations
    Tailwind CSS for utility-first styling approach
    Vercel for Next.js framework development
    UFC for inspiring the octagon-themed design

🥊 Why MMA/UFC Focus?

This project focuses exclusively on MMA and UFC to:

    Demonstrate domain expertise in sports data modeling
    Simplify complex relationships (fighters, events, weight classes)
    Enable real-time features for live fight tracking
    Create specialized user experience for combat sports fans
    Integrate predictive analytics for fight outcomes
    Build a portfolio piece that stands out in sports tech

Developed as part of Masters in Software Engineering coursework, demonstrating modern web development practices, real-time data integration, and domain-specific application design for the combat sports industry.
📝 License

This project is developed for academic purposes as part of a Masters program in Software Engineering.

FightWatchr - Where Fight Fans Connect 🥊