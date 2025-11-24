# FightWatchr 🥊

A Masters Project in Software Engineering

Your ultimate UFC and MMA command center. Track your favorite fighters, follow live events, and never miss a fight!

This project demonstrates modern web development practices, real-time data integration, and automated data synchronization for combat sports enthusiasts.

## 🎓 Academic Project Overview

This is a comprehensive full-stack web application developed as part of a Masters in Software Engineering program. The project showcases:

- **Modern Web Architecture** with Next.js 14 and TypeScript
- **Real-time API Integration** with ESPN MMA data sources
- **Automated Data Synchronization** with retry logic and rate limiting
- **Secure Authentication Systems** with industry-standard practices
- **Relational Database Design** with comprehensive fighter and event modeling
- **User Experience Design** with responsive, octagon-themed interfaces
- **Progressive Web App** development principles

## 🚀 Current Features

### Authentication System

- Secure Login/Signup with NextAuth.js and bcrypt password hashing
- Session Management with JWT tokens
- Protected Routes with automatic redirects
- Database Integration with PostgreSQL via Prisma

### ESPN Data Synchronization

- **Full Historical Sync** - Import 15+ years of UFC fight data
- **Incremental Sync** - Automated 6-hour updates for recent events
- **Smart Caching** - In-memory fighter cache prevents duplicate API calls
- **Rate Limiting** - Exponential backoff handles ESPN API limits
- **Resume Support** - Skip already-processed events when expanding date range
- **Retry Logic** - Automatic retry with backoff on network failures

### Fighter & Event Management

- **Real-time UFC Data** from ESPN MMA API with automated updates
- **Fighter Profiles** with records, rankings, physical stats, and fight history
- **Event Tracking** for upcoming UFC cards and fight nights
- **Weight Class Organization** from Strawweight to Heavyweight (12 divisions)
- **User Preferences** for favorite fighters and weight classes
- **Fight Records** with KO/TKO, Submission, and Decision breakdowns

### User Experience

- **Welcome Modal** for first-time users with fighter selection across all divisions
- **Weight Class Tabs** with men's and women's divisions
- **Fighter Cards** with photos, records, rankings, and win percentages
- **Loading States** with spinners and progress indicators
- **Error Handling** with fallback mechanisms
- **Responsive Design** optimized for all screen sizes

### Technical Implementation

- **TypeScript** for type safety and better development experience
- **Server-side Rendering** with Next.js 14 App Router
- **Database ORM** with Prisma for type-safe database operations
- **RESTful API Routes** for fighter data and user management
- **Modern UI** with Tailwind CSS utility framework
- **Octagon-themed Design** inspired by UFC branding

## 🛠️ Tech Stack

### Frontend

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript for better code quality
- **Tailwind CSS** - Utility-first CSS framework
- **React Hooks** - Modern state management and side effects

### Backend

- **NextAuth.js** - Authentication library with multiple providers
- **Prisma ORM** - Type-safe database toolkit
- **PostgreSQL** - Production-ready relational database
- **bcryptjs** - Secure password hashing

### External APIs

- **ESPN MMA API** - Real-time UFC fighter/event/fight data
- **Custom Sync Services** - Automated data pipeline with retry logic

## 📦 Installation & Setup

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Git

### Step-by-Step Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd fightwatchr
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Configuration**
```bash
cp .env.example .env.local
```

Configure your environment variables:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/fightwatchr"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"
CRON_SECRET="your-cron-secret"  # For automated sync
```

4. **Database Setup**
```bash
npx prisma db push
npx prisma generate
```

5. **Initial Data Sync** (optional - imports 15 years of UFC data)
```bash
# Access http://localhost:3000/admin/sync after starting the server
# Or trigger via API: POST /api/espn/sync
```

6. **Start Development Server**
```bash
npm run dev
```

7. **Access Application**
   Open http://localhost:3000 in your browser

## 🏗️ Architecture & Project Structure
```
fightwatchr/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── auth/[...nextauth]/   # NextAuth configuration
│   │   ├── signup/               # User registration endpoint
│   │   ├── fighters/             # Fighter data endpoints
│   │   ├── espn/                 # ESPN sync endpoints
│   │   │   ├── sync/             # Full historical sync
│   │   │   └── sync-recent/      # Incremental sync
│   │   ├── cron/                 # Scheduled job endpoints
│   │   │   └── sync/             # Automated sync trigger
│   │   └── user/                 # User preferences
│   │       └── preferences/      # Fighter favorites CRUD
│   ├── admin/                    # Admin panel
│   │   └── sync/                 # Manual sync trigger UI
│   ├── dashboard/                # Protected dashboard page
│   └── page.tsx                  # Landing/login page
├── lib/                          # Utility libraries
│   ├── prisma.ts                 # Database client configuration
│   └── services/                 # Business logic services
│       ├── espn-sync.ts          # ESPN API integration & sync logic
│       └── sync-scheduler.ts     # Automated sync scheduler
├── prisma/                       # Database schema and migrations
│   └── schema.prisma             # Complete database schema
└── components/                   # Reusable UI components
    └── (Various UI components)
```

## 🎯 API Design

### Authentication Endpoints

- `POST /api/signup` - User registration with validation
- `POST /api/auth/signin` - User authentication
- `POST /api/auth/signout` - Session termination

### Fighter Data Endpoints

- `GET /api/fighters` - Fetch fighters by weight class and gender
  - Query params: `weightClass`, `gender`, `limit`
  - Returns: Fighter list with records, stats, and rankings

### ESPN Sync Endpoints

- `POST /api/espn/sync` - Full historical sync (15+ years)
  - Imports all UFC events, fights, and fighters
  - Smart skip logic for already-processed events
  - Returns: Event/fight/fighter counts and errors

- `POST /api/espn/sync-recent` - Incremental sync (30 days past, 90 days future)
  - Updates recent and upcoming events
  - Refreshes fighter records and rankings
  - Returns: Update counts

- `GET /api/cron/sync` - Automated sync trigger (Bearer token protected)
  - Runs incremental sync every 6 hours
  - Vercel Cron or external scheduler compatible

### User Management Endpoints

- `GET /api/user/preferences` - Retrieve user's fighter favorites
- `POST /api/user/preferences` - Save favorite fighters
  - Body: `{ fighters: Fighter[] }`

## 🗃️ Database Design

### Core Schema
```prisma
model User {
  id            String          @id @default(cuid())
  email         String          @unique
  password      String          // bcrypt hashed
  name          String?
  image         String?
  emailVerified DateTime?
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  // MMA-specific relationships
  followedFighters      Fighter[]      @relation("UserFollowedFighters")
  followedOrganizations Organization[] @relation("UserFollowedOrgs")
  watchlist             Watchlist[]
  predictions           Prediction[]
  notifications         Notification[]
  preferences           UserPreferences?

  accounts Account[]
  sessions Session[]
}

model Organization {
  id          String    @id @default(cuid())
  name        String    @unique  // "Ultimate Fighting Championship"
  shortName   String    // "UFC"
  logo        String?
  website     String?
  active      Boolean   @default(true)
  
  events      Event[]
  fighters    Fighter[]
  rankings    Ranking[]
  followers   User[]    @relation("UserFollowedOrgs")
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Fighter {
  id             String      @id @default(cuid())
  firstName      String
  lastName       String
  nickname       String?     // "The Notorious", "BMF"
  imageUrl       String?
  dateOfBirth    DateTime?
  nationality    String?
  hometown       String?
  fightingOutOf  String?
  team           String?
  
  // Physical Attributes
  height         Int?        // in centimeters
  reach          Int?        // in centimeters
  legReach       Int?
  weight         Int?        // in pounds
  
  // Fighting Info
  stance         Stance?     // ORTHODOX, SOUTHPAW, SWITCH
  fightingStyle  String?
  weightClass    WeightClass?
  
  // Career Stats
  wins           Int         @default(0)
  losses         Int         @default(0)
  draws          Int         @default(0)
  noContests     Int         @default(0)
  
  // Detailed Win Stats
  winsByKO       Int         @default(0)
  winsBySub      Int         @default(0)
  winsByDec      Int         @default(0)
  
  // Status
  active         Boolean     @default(true)
  retired        Boolean     @default(false)
  suspended      Boolean     @default(false)
  
  organization   Organization @relation(fields: [organizationId], references: [id])
  organizationId String
  
  fightsAsFighter1 Fight[]   @relation("Fighter1")
  fightsAsFighter2 Fight[]   @relation("Fighter2")
  rankings       Ranking[]
  followers      User[]      @relation("UserFollowedFighters")
  predictions    Prediction[]
  
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
  
  @@index([organizationId])
  @@index([lastName, firstName])
  @@unique([organizationId, firstName, lastName])
}

model Event {
  id             String      @id @default(cuid())
  name           String      // "UFC 300"
  eventNumber    Int?
  eventType      EventType   // PPV, FIGHT_NIGHT, APEX
  date           DateTime
  venue          String
  city           String
  state          String?
  country        String
  
  mainCardStart  DateTime?
  prelimsStart   DateTime?
  earlyPrelimsStart DateTime?
  
  organization   Organization @relation(fields: [organizationId], references: [id])
  organizationId String
  
  fights         Fight[]
  watchlists     Watchlist[]
  
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
  
  @@index([organizationId])
  @@index([date])
  @@unique([organizationId, name])
}

model Fight {
  id             String       @id @default(cuid())
  event          Event        @relation(fields: [eventId], references: [id])
  eventId        String
  
  fighter1       Fighter      @relation("Fighter1", fields: [fighter1Id], references: [id])
  fighter1Id     String
  fighter2       Fighter      @relation("Fighter2", fields: [fighter2Id], references: [id])
  fighter2Id     String
  
  // Fight Details
  weightClass    WeightClass
  rounds         Int          @default(3)
  isMainEvent    Boolean      @default(false)
  isCoMainEvent  Boolean      @default(false)
  isTitleFight   Boolean      @default(false)
  isInterimTitle Boolean      @default(false)
  isEliminatorFight Boolean   @default(false)
  cardPosition   Int
  
  // Betting Odds
  fighter1Odds   Int?
  fighter2Odds   Int?
  
  // Results
  status         FightStatus  @default(SCHEDULED)
  winner         String?      // fighter1Id or fighter2Id
  method         FinishMethod?
  methodDetails  String?
  roundEnded     Int?
  timeEnded      String?
  
  fightStats     Json?
  predictions    Prediction[]
  
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt
  
  @@index([eventId])
  @@index([fighter1Id])
  @@index([fighter2Id])
  @@unique([eventId, fighter1Id, fighter2Id])
}

enum WeightClass {
  STRAWWEIGHT       // Women's 115 lbs
  FLYWEIGHT         // 125 lbs
  BANTAMWEIGHT      // 135 lbs
  FEATHERWEIGHT     // 145 lbs
  LIGHTWEIGHT       // 155 lbs
  WELTERWEIGHT      // 170 lbs
  MIDDLEWEIGHT      // 185 lbs
  LIGHT_HEAVYWEIGHT // 205 lbs
  HEAVYWEIGHT       // 265 lbs
  SUPER_HEAVYWEIGHT // 265+ lbs
  CATCHWEIGHT       // Custom weight
}

enum FightStatus {
  SCHEDULED
  COMPLETED
  CANCELLED
  POSTPONED
  NO_CONTEST
}

enum FinishMethod {
  KO
  TKO
  SUBMISSION
  DECISION
  DRAW
  DQ
  NO_CONTEST
}
```

### Supported Weight Classes

**Men's Divisions:**
- Flyweight (125 lbs)
- Bantamweight (135 lbs)
- Featherweight (145 lbs)
- Lightweight (155 lbs)
- Welterweight (170 lbs)
- Middleweight (185 lbs)
- Light Heavyweight (205 lbs)
- Heavyweight (265 lbs)

**Women's Divisions:**
- Strawweight (115 lbs)
- Flyweight (125 lbs)
- Bantamweight (135 lbs)
- Featherweight (145 lbs)

## 🔄 Data Synchronization Architecture

### 1. Full Historical Sync (`POST /api/espn/sync`)

**Purpose:** Import complete UFC history (15+ years of data)

**Process:**
1. **Bootstrap**
   - Upsert UFC organization
   - Collect event IDs via ESPN scoreboard API (one request per year)

2. **Build Skip List**
   - Query existing events with fight counts
   - Skip events that already have complete data

3. **Process Events** (batches of 10)
   - Fetch event details with `fetchWithRetry`
   - Upsert event (name, date, venue, city, country, type)
   - For each competition:
     - Fetch athlete details with retry logic
     - Parse physical stats (stance, height/reach in cm, weight in lbs, DOB)
     - Fetch complete fight record (wins/losses/draws, KO/Sub/Dec splits)
     - Upsert fighter with **in-memory cache** to prevent duplicates
     - Infer weight class from fighter data (fallback to CATCHWEIGHT)
     - Determine fight status (SCHEDULED/COMPLETED/CANCELLED)
     - Upsert fight with status, weight class, and winner

4. **Return Statistics**
   - Events processed, fights created, fighters cached
   - Skipped fights, errors encountered

**Reliability Features:**
- `fetchWithRetry`: Exponential backoff on 429 rate limits (up to 10s)
- Delay buffers between API calls (500ms fighters, 500ms records)
- In-memory `fighterCache` eliminates redundant athlete fetches
- Skip logic allows resuming interrupted syncs
- Network error retry with exponential backoff

**Performance:**
- 15 years: ~600 events, ~6,000 fights, ~1,200 unique fighters
- Runtime: 10-15 hours (respects ESPN rate limits)
- Cache efficiency: 80-90% reduction in fighter API calls

### 2. Incremental Sync (`POST /api/espn/sync-recent`)

**Purpose:** Keep data fresh with recent and upcoming events

**Schedule:**
- **Development:** Auto-runs every 6 hours via local scheduler
- **Production:** Triggered by Vercel Cron (`GET /api/cron/sync`)

**Process:**
1. Locate UFC organization
2. Fetch scoreboard for last 30 days → next 90 days
3. Upsert events with updated dates/venues
4. For each competition:
   - Fetch athlete with full profile
   - Extract and map weight class from ESPN data
   - Fetch complete fight records (KO/Sub/Dec splits)
   - Upsert fighters with **complete data** (not placeholders)
   - Upsert fight with status, winner, and weight class

**Key Difference from Full Sync:**
- **Scope:** 120-day window vs 15 years
- **Frequency:** Every 6 hours vs one-time
- **Data Quality:** Identical - both fetch complete records

### 3. Data Flow Diagram
```
┌─────────────────────────────────────────────────────────────┐
│                    ESPN MMA API                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Scoreboard│  │  Events  │  │ Athletes │  │  Records │  │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘  │
└────────┼─────────────┼─────────────┼─────────────┼────────┘
         │             │             │             │
         │             │             │             │
    ┌────▼─────────────▼─────────────▼─────────────▼─────┐
    │        FightWatchr Sync Services                    │
    │  ┌──────────────────────────────────────────────┐  │
    │  │  fetchWithRetry (Rate Limit + Error Handling) │  │
    │  └──────────────────────────────────────────────┘  │
    │  ┌──────────────────────────────────────────────┐  │
    │  │  Fighter Cache (In-Memory Deduplication)     │  │
    │  └──────────────────────────────────────────────┘  │
    │  ┌──────────────────────────────────────────────┐  │
    │  │  Weight Class Mapper (ESPN → Prisma Enums)  │  │
    │  └──────────────────────────────────────────────┘  │
    └────┬─────────────────────────────────────────────┘
         │
         │
    ┌────▼──────────────────────────────────────────────┐
    │             PostgreSQL Database                    │
    │  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
    │  │Organizations│  │  Events  │  │ Fighters │       │
    │  └─────┬────┘  └─────┬────┘  └─────┬────┘       │
    │        │             │             │             │
    │        └─────────────▼─────────────┘             │
    │                    Fights                         │
    └───────────────────────────────────────────────────┘
```

## 🎨 User Interface Design

### Landing Page Features

- Octagon-shaped login form inspired by UFC cage design
- Animated fight ticker with upcoming events
- Dual-mode authentication (Sign In / Sign Up)
- Form validation with user-friendly error messages
- UFC-themed color scheme (red, black, gold accents)

### Dashboard Features

- **Authentication guards** with loading states
- **First-time user onboarding** with fighter selection across all divisions
- **Gender Tabs** for Men's and Women's divisions
- **Weight Class Filters** with division-specific tabs
- **Fighter Cards** with:
  - Fighter photo and nickname
  - Win-Loss-Draw record with win percentage
  - Ranking badge (gold/silver/bronze for top 3)
  - Follow/Unfollow functionality
- **Followed Fighters** display with easy management
- **Lazy Loading** - Data loaded per division (not all at once)
- **Client-side Caching** - Tab switching is instant after first load

## 🧠 Core Features

### Implemented

✅ **User Authentication**
- Secure login/signup with session management
- Protected dashboard routes
- User preferences storage

✅ **ESPN Data Integration**
- Full historical sync (15+ years)
- Incremental sync (6-hour updates)
- Smart caching and retry logic

✅ **Fighter Management**
- Browse by weight class and gender
- View complete fight records
- Follow favorite fighters
- Win rate calculations

✅ **Event Tracking**
- Past and upcoming UFC events
- Fight cards with all matchups
- Event details (venue, date, location)

### In Development

🚧 **Live Fight Tracking**
- Real-time fight updates
- Round-by-round scoring
- Push notifications for followed fighters

🚧 **Enhanced Fighter Profiles**
- Detailed statistics (striking, grappling)
- Fighting style analysis
- Tale of the tape comparisons

## 🚀 Planned Features

### AI-Powered Analysis
- Fight prediction engine using ML
- Matchup analysis based on styles
- AI-generated fight recaps
- Power rankings algorithm

### Enhanced User Experience
- Interactive fighter comparison tool
- Event timeline views with countdowns
- Social features for predictions
- Dark mode toggle
- Progressive Web App with offline support

### Integration Opportunities
- Twitter/X for fighter news
- Reddit for community discussions
- YouTube for fight highlights
- Betting odds from major sportsbooks

## 🔧 Technical Configuration

### ESPN MMA API Integration

- **Rate Limiting:** Exponential backoff (up to 10s delay)
- **Error Handling:** Retry logic with 3 attempts per request
- **Data Normalization:** ESPN → Prisma enum mapping
- **Caching Strategy:** In-memory fighter cache during sync
- **Scheduled Jobs:** 6-hour incremental sync in development

### Security Implementation

- **Password Security:** bcrypt hashing with 12 salt rounds
- **SQL Injection Prevention:** Parameterized queries via Prisma
- **CSRF Protection:** Built-in NextAuth.js security
- **Session Security:** Secure JWT token management
- **Input Validation:** Client and server-side validation
- **Environment Security:** Sensitive data in `.env` files
- **API Rate Limiting:** Respectful ESPN API usage

## 🎯 Learning Objectives Demonstrated

- **Full-Stack Development:** End-to-end application with external API integration
- **Modern JavaScript/TypeScript:** Advanced features, typing, and async patterns
- **Database Design:** Complex relational modeling for sports data
- **API Design:** RESTful endpoints with proper error handling
- **Data Pipeline Engineering:** Automated sync with retry logic and caching
- **Authentication:** Secure user management with NextAuth.js
- **User Experience:** Responsive design with progressive enhancement
- **Real-time Data:** External API integration with rate limit handling
- **Domain Modeling:** Fighter/Event/Fight relationships
- **Production Deployment:** Vercel-ready with cron job support

## 📊 Project Metrics

- **Languages:** TypeScript (primary), JavaScript, SQL
- **Lines of Code:** ~5,000+ (including sync services)
- **Components:** 20+ React components
- **API Endpoints:** 10+ custom endpoints
- **Database Tables:** 10+ models (User, Fighter, Event, Fight, Rankings, etc.)
- **External APIs:** ESPN MMA API with comprehensive integration
- **Weight Classes:** 12 divisions tracked (8 men's, 4 women's)
- **Data Coverage:** 15+ years of UFC history (~6,000 fights)

## 🛡️ Security & Best Practices

- **OWASP Security Guidelines** implementation
- **Data Privacy** compliance (GDPR considerations)
- **Input Sanitization** and validation
- **Secure Headers** and HTTPS enforcement
- **Rate Limiting** for API endpoints and external calls
- **Error Handling** without information disclosure
- **Dependency Scanning** with `npm audit`
- **Environment Variable** protection

## 📚 Documentation & Resources

### Key Technologies Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [ESPN API Documentation](https://www.espn.com/apis)

### MMA/UFC Resources

- [UFC Official Website](https://www.ufc.com)
- [Sherdog Fighter Database](https://www.sherdog.com)
- [Tapology Event Calendar](https://www.tapology.com)
- [UFC Stats](https://www.ufcstats.com)

## 🙏 Technical Acknowledgments

- **ESPN** for providing comprehensive MMA/UFC data API
- **NextAuth.js** for robust authentication framework
- **Prisma** for type-safe database operations
- **Tailwind CSS** for utility-first styling approach
- **Vercel** for Next.js framework development
- **UFC** for inspiring the octagon-themed design

## 🥊 Why MMA/UFC Focus?

This project focuses exclusively on MMA and UFC to:

- Demonstrate domain expertise in sports data modeling
- Simplify complex relationships (fighters, events, weight classes)
- Enable real-time features for live fight tracking
- Create specialized user experience for combat sports fans
- Build automated data pipelines with external API integration
- Integrate predictive analytics for fight outcomes
- Build a portfolio piece that stands out in sports tech

---

Developed as part of **Masters in Software Engineering** coursework, demonstrating modern web development practices, automated data synchronization, external API integration, and domain-specific application design for the combat sports industry.

## 📝 License

This project is developed for academic purposes as part of a Masters program in Software Engineering.

---

**FightWatchr** - Where Fight Fans Connect 🥊