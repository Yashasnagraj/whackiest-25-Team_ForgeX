# TripGuard OS - Complete Implementation Plan

> **Team ForgeX** | Whackiest'25 IDEATHON | Ramaiah Institute of Technology

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Tech Stack](#tech-stack)
3. [System Architecture](#system-architecture)
4. [Database Schema](#database-schema)
5. [Phase 1: Foundation](#phase-1-foundation-weeks-1-4)
6. [Phase 2: Signal-Cleanse Engine](#phase-2-signal-cleanse-engine-weeks-5-8)
7. [Phase 3: Safety Sentinel](#phase-3-safety-sentinel-weeks-9-12)
8. [Phase 4: Elastic Itinerary](#phase-4-elastic-itinerary-weeks-13-16)
9. [Phase 5: Hyperlocal Discovery](#phase-5-hyperlocal-discovery-weeks-17-18)
10. [Phase 6: Cinematic Memories](#phase-6-cinematic-memories-weeks-19-20)
11. [Deployment Strategy](#deployment-strategy)
12. [Cost Estimates](#cost-estimates)
13. [Timeline Summary](#timeline-summary)

---

## Project Overview

**TripGuard OS** is an AI-powered travel operating system that transforms how people plan, experience, and remember their trips.

### Core Features

| Feature | Description |
|---------|-------------|
| **Signal-Cleanse Engine** | AI extracts decisions from chaotic group chats |
| **Safety Sentinel** | Proactive anomaly detection and emergency alerts |
| **Elastic Itinerary** | Real-time adaptive trip planning |
| **Hyperlocal Discovery** | "Ungoogled" hidden gems and authentic places |
| **Cinematic Memories** | AI-generated trip documentaries |

### Target Users

- College students planning group trips
- Solo travelers seeking safety
- Weekend travelers and backpackers
- Families planning vacations

---

## Tech Stack

### Final Technology Choices

| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Mobile App** | React Native (Expo) | Cross-platform, single codebase, rapid development |
| **Web App** | Next.js 14 | SSR, excellent performance, React ecosystem |
| **Backend API** | FastAPI (Python) | Async support, ML-friendly, fast development |
| **Real-time** | Socket.io + Redis | Live updates, pub/sub messaging |
| **AI Orchestration** | LangChain + CrewAI | Multi-agent coordination, tool integration |
| **LLM Provider** | OpenAI GPT-4 / Claude | Chat, summarization, planning, vision |
| **Database** | PostgreSQL (Supabase) | Relational data, built-in auth, real-time |
| **Vector Database** | Pinecone | Semantic search for hyperlocal discovery |
| **Cache** | Redis | Session management, rate limiting |
| **File Storage** | AWS S3 / Cloudflare R2 | Media files, chat exports |
| **Maps & Location** | Google Maps Platform | Routing, places, geocoding, traffic |
| **Weather** | OpenWeather API | Real-time weather data |
| **Push Notifications** | Firebase Cloud Messaging | Cross-platform push notifications |
| **SMS Alerts** | Twilio | Emergency SMS notifications |
| **Deployment** | Vercel + Railway/AWS | Web on Vercel, API on Railway/AWS |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                   │
├────────────────────┬────────────────────┬───────────────────────────────┤
│   React Native     │      Next.js       │      WhatsApp Export          │
│   Mobile App       │      Web App       │      Parser                   │
│   (iOS + Android)  │                    │                               │
└─────────┬──────────┴─────────┬──────────┴──────────────┬────────────────┘
          │                    │                         │
          ▼                    ▼                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         API GATEWAY (FastAPI)                            │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐          │
│  │ Authentication  │  │  Rate Limiting  │  │ Request Routing │          │
│  │ (JWT + Supabase)│  │                 │  │                 │          │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘          │
└─────────┬───────────────────────────────────────────────┬───────────────┘
          │                                               │
          ▼                                               ▼
┌─────────────────────────────┐       ┌───────────────────────────────────┐
│      CORE SERVICES          │       │        AI ORCHESTRATOR            │
├─────────────────────────────┤       │       (LangChain + CrewAI)        │
│  • User Service             │       ├───────────────────────────────────┤
│  • Trip Service             │       │  • Signal-Cleanse Agent          │
│  • Group Chat Service       │       │  • Safety Sentinel Agent         │
│  • Location Service         │       │  • Itinerary Planner Agent       │
│  • Notification Service     │       │  • Discovery Agent               │
│  • Booking Service          │       │  • Narrative Director Agent      │
└─────────┬───────────────────┘       └──────────────┬────────────────────┘
          │                                          │
          ▼                                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           DATA LAYER                                     │
├─────────────────────┬─────────────────────┬─────────────────────────────┤
│     PostgreSQL      │       Redis         │      Pinecone/Qdrant        │
│     (Supabase)      │      (Cache)        │     (Vector Search)         │
│  • Users, Trips     │  • Sessions         │  • Place embeddings         │
│  • Messages         │  • Real-time state  │  • Semantic search          │
│  • Itineraries      │  • Rate limits      │                             │
│  • Locations        │                     │                             │
└─────────────────────┴─────────────────────┴─────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                       EXTERNAL SERVICES                                  │
├──────────────┬──────────────┬──────────────┬──────────────┬─────────────┤
│ Google Maps  │ OpenWeather  │ OpenAI/Claude│   Firebase   │   Twilio    │
│  Platform    │     API      │     API      │    (FCM)     │   (SMS)     │
└──────────────┴──────────────┴──────────────┴──────────────┴─────────────┘
```

---

## Database Schema

### Core Tables

```sql
-- =============================================
-- USERS & AUTHENTICATION
-- =============================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    name VARCHAR(255) NOT NULL,
    avatar_url TEXT,
    preferences JSONB DEFAULT '{}',
    -- Preferences: { travel_style, budget_range, interests[], dietary[] }
    emergency_contacts JSONB DEFAULT '[]',
    -- Emergency contacts: [{ name, phone, email, relationship }]
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TRIPS & GROUP MANAGEMENT
-- =============================================

CREATE TABLE trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    destination VARCHAR(255),
    destination_coordinates JSONB,
    -- { lat, lng }
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'planning',
    -- planning, active, completed, cancelled
    trip_type VARCHAR(50) DEFAULT 'leisure',
    -- leisure, adventure, cultural, business
    settings JSONB DEFAULT '{}',
    -- { safety_enabled, share_location, budget_tracking }
    cover_image_url TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE trip_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    -- admin, member
    status VARCHAR(50) DEFAULT 'active',
    -- invited, active, left
    location_sharing BOOLEAN DEFAULT true,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(trip_id, user_id)
);

-- =============================================
-- GROUP CHAT (Signal-Cleanse)
-- =============================================

CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    content TEXT NOT NULL,
    message_type VARCHAR(50) DEFAULT 'text',
    -- text, image, voice, poll, decision, system
    metadata JSONB DEFAULT '{}',
    -- For polls: { options[], votes{} }
    -- For decisions: { decision_id }
    reply_to UUID REFERENCES messages(id),
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_trip_id ON messages(trip_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Extracted decisions from chat
CREATE TABLE decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    -- date, accommodation, transport, activity, budget, food
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'proposed',
    -- proposed, confirmed, rejected
    confidence_score DECIMAL(3, 2),
    -- AI confidence 0.00 - 1.00
    source_message_ids UUID[],
    -- References to original messages
    extracted_data JSONB,
    -- { dates, prices, locations, participants }
    extracted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    confirmed_by UUID REFERENCES users(id)
);

CREATE INDEX idx_decisions_trip_id ON decisions(trip_id);

-- =============================================
-- ITINERARY (Elastic Itinerary)
-- =============================================

CREATE TABLE itineraries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    generated_by VARCHAR(50) DEFAULT 'ai',
    -- ai, manual
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE itinerary_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    itinerary_id UUID REFERENCES itineraries(id) ON DELETE CASCADE,
    day_number INTEGER NOT NULL,
    date DATE NOT NULL,
    theme VARCHAR(255),
    -- "Cultural Exploration", "Adventure Day"
    weather_forecast JSONB,
    notes TEXT,
    UNIQUE(itinerary_id, day_number)
);

CREATE TABLE itinerary_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_id UUID REFERENCES itinerary_days(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL,
    -- activity, transport, meal, rest, accommodation, free_time
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location JSONB,
    -- { lat, lng, address, place_id, place_name }
    start_time TIME,
    end_time TIME,
    duration_minutes INTEGER,
    estimated_cost DECIMAL(10, 2),
    currency VARCHAR(3) DEFAULT 'INR',
    status VARCHAR(50) DEFAULT 'planned',
    -- planned, in_progress, completed, skipped, rescheduled
    booking_reference VARCHAR(255),
    booking_url TEXT,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    -- { crowd_level, weather_suitable, accessibility }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_itinerary_items_day_id ON itinerary_items(day_id);

-- =============================================
-- SAFETY (Safety Sentinel)
-- =============================================

CREATE TABLE location_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy DECIMAL(10, 2),
    altitude DECIMAL(10, 2),
    speed DECIMAL(10, 2),
    heading DECIMAL(5, 2),
    battery_level INTEGER,
    -- 0-100
    is_charging BOOLEAN,
    network_type VARCHAR(50),
    -- wifi, cellular, none
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_location_user_trip ON location_history(user_id, trip_id);
CREATE INDEX idx_location_recorded_at ON location_history(recorded_at DESC);

-- Partition by month for performance
-- CREATE TABLE location_history_2025_01 PARTITION OF location_history
--     FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE safety_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    trip_id UUID REFERENCES trips(id),
    alert_type VARCHAR(100) NOT NULL,
    -- silence, unusual_detour, stationary_unknown, low_battery_remote,
    -- off_route, sos_triggered, missed_checkin
    severity VARCHAR(50) NOT NULL,
    -- low, medium, high, critical
    status VARCHAR(50) DEFAULT 'active',
    -- active, acknowledged, resolved, false_alarm
    details JSONB NOT NULL,
    -- { location, description, last_known_activity, triggered_checks }
    triggered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledged_by UUID REFERENCES users(id),
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT
);

CREATE INDEX idx_alerts_user_trip ON safety_alerts(user_id, trip_id);
CREATE INDEX idx_alerts_status ON safety_alerts(status) WHERE status = 'active';

CREATE TABLE checkins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    trip_id UUID REFERENCES trips(id),
    type VARCHAR(50) NOT NULL,
    -- manual, scheduled, sos_response, auto
    status VARCHAR(50) NOT NULL,
    -- safe, need_help, sos
    location JSONB,
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- DISCOVERY (Hyperlocal Places)
-- =============================================

CREATE TABLE places (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id VARCHAR(255),
    -- Google Place ID if available
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    -- restaurant, cafe, attraction, viewpoint, hidden_gem, local_market
    subcategory VARCHAR(100),
    location JSONB NOT NULL,
    -- { lat, lng, address, city, state, country }
    source VARCHAR(100) NOT NULL,
    -- google, local_blog, youtube, instagram, user_submitted, curated
    source_url TEXT,
    source_language VARCHAR(10),
    tags TEXT[],
    price_level INTEGER,
    -- 1-4
    rating DECIMAL(3, 2),
    review_count INTEGER DEFAULT 0,
    photos TEXT[],
    opening_hours JSONB,
    contact JSONB,
    -- { phone, website, instagram }
    is_verified BOOLEAN DEFAULT false,
    is_hidden_gem BOOLEAN DEFAULT false,
    accessibility JSONB,
    -- { wheelchair, parking, restrooms }
    best_time_to_visit VARCHAR(255),
    local_tip TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_places_category ON places(category);
CREATE INDEX idx_places_location ON places USING GIST (
    ll_to_earth(
        (location->>'lat')::float,
        (location->>'lng')::float
    )
);

-- For semantic search (if using pgvector)
-- ALTER TABLE places ADD COLUMN embedding vector(1536);
-- CREATE INDEX idx_places_embedding ON places USING ivfflat (embedding vector_cosine_ops);

CREATE TABLE place_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    place_id UUID REFERENCES places(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    trip_id UUID REFERENCES trips(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    photos TEXT[],
    visited_at DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- MEMORIES (Cinematic Memories)
-- =============================================

CREATE TABLE trip_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    media_type VARCHAR(50) NOT NULL,
    -- photo, video, audio
    file_url TEXT NOT NULL,
    thumbnail_url TEXT,
    location JSONB,
    captured_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    -- { width, height, duration, device }
    ai_analysis JSONB,
    -- { objects[], faces[], emotions[], scene, quality_score }
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE trip_stories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    title VARCHAR(255),
    narrative_style VARCHAR(50),
    -- documentary, highlight_reel, day_by_day, emotional
    chapters JSONB NOT NULL,
    -- [{ title, narration, media_ids[], music_suggestion, duration }]
    video_url TEXT,
    thumbnail_url TEXT,
    duration_seconds INTEGER,
    status VARCHAR(50) DEFAULT 'generating',
    -- generating, ready, failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- EXPENSES & BUDGET
-- =============================================

CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES trips(id) ON DELETE CASCADE,
    paid_by UUID REFERENCES users(id),
    category VARCHAR(100),
    -- accommodation, transport, food, activity, shopping, other
    title VARCHAR(255) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    split_type VARCHAR(50) DEFAULT 'equal',
    -- equal, custom, individual
    split_details JSONB,
    -- { user_id: amount }
    receipt_url TEXT,
    location JSONB,
    expense_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- NOTIFICATIONS & ACTIVITY
-- =============================================

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT,
    data JSONB,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
```

---

## Phase 1: Foundation (Weeks 1-4)

### Week 1-2: Project Setup

#### 1.1 Initialize Monorepo Structure

```
tripguard/
├── apps/
│   ├── mobile/                 # React Native (Expo)
│   │   ├── app/               # Expo Router screens
│   │   ├── components/        # UI components
│   │   ├── hooks/             # Custom hooks
│   │   ├── services/          # API services
│   │   ├── store/             # Zustand stores
│   │   └── utils/             # Utilities
│   │
│   ├── web/                    # Next.js 14
│   │   ├── app/               # App router
│   │   ├── components/        # UI components
│   │   └── lib/               # Utilities
│   │
│   └── api/                    # FastAPI Backend
│       ├── routers/           # API routes
│       ├── services/          # Business logic
│       ├── models/            # Pydantic models
│       ├── db/                # Database utilities
│       └── agents/            # AI agents
│
├── packages/
│   ├── shared/                 # Shared TypeScript types
│   ├── ui/                     # Shared UI components
│   └── ai-agents/              # LangChain agents (Python)
│
├── infrastructure/
│   ├── docker/
│   ├── terraform/
│   └── scripts/
│
├── docs/
│   ├── api/                    # API documentation
│   └── architecture/           # Architecture docs
│
├── turbo.json                  # Turborepo config
├── package.json
└── README.md
```

#### 1.2 Setup Commands

```bash
# Initialize monorepo
npx create-turbo@latest tripguard

# Setup mobile app
cd apps/mobile
npx create-expo-app@latest . --template tabs

# Setup web app
cd ../web
npx create-next-app@latest . --typescript --tailwind --app

# Setup Python backend
cd ../api
python -m venv venv
pip install fastapi uvicorn sqlalchemy supabase langchain openai
```

#### 1.3 Supabase Setup

1. Create project at supabase.com
2. Run database schema (SQL above)
3. Enable Row Level Security
4. Configure authentication providers (Email, Phone, Google)

#### 1.4 Environment Variables

```env
# apps/api/.env
DATABASE_URL=postgresql://...
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=eyJ...
OPENAI_API_KEY=sk-...
GOOGLE_MAPS_API_KEY=AIza...
REDIS_URL=redis://...
JWT_SECRET=...

# apps/mobile/.env
EXPO_PUBLIC_API_URL=https://api.tripguard.app
EXPO_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_GOOGLE_MAPS_KEY=AIza...
```

### Week 3-4: Core Features

#### 1.5 FastAPI Backend Structure

```python
# apps/api/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import auth, users, trips, messages, itinerary, safety, discovery

app = FastAPI(
    title="TripGuard API",
    version="1.0.0",
    description="AI-Powered Travel Operating System"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(trips.router, prefix="/api/trips", tags=["Trips"])
app.include_router(messages.router, prefix="/api/messages", tags=["Messages"])
app.include_router(itinerary.router, prefix="/api/itinerary", tags=["Itinerary"])
app.include_router(safety.router, prefix="/api/safety", tags=["Safety"])
app.include_router(discovery.router, prefix="/api/discovery", tags=["Discovery"])

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}
```

#### 1.6 API Endpoints - Phase 1

```
Authentication:
POST   /api/auth/register              # Register new user
POST   /api/auth/login                 # Login with email/phone
POST   /api/auth/verify-otp            # Verify phone OTP
POST   /api/auth/refresh               # Refresh JWT token
POST   /api/auth/logout                # Logout

Users:
GET    /api/users/me                   # Get current user
PATCH  /api/users/me                   # Update profile
POST   /api/users/me/avatar            # Upload avatar
GET    /api/users/me/preferences       # Get preferences
PATCH  /api/users/me/preferences       # Update preferences
POST   /api/users/me/emergency-contacts # Add emergency contact
DELETE /api/users/me/emergency-contacts/:id

Trips:
POST   /api/trips                      # Create trip
GET    /api/trips                      # List user's trips
GET    /api/trips/:id                  # Get trip details
PATCH  /api/trips/:id                  # Update trip
DELETE /api/trips/:id                  # Delete trip
POST   /api/trips/:id/members          # Add member
DELETE /api/trips/:id/members/:userId  # Remove member
POST   /api/trips/:id/leave            # Leave trip
```

#### 1.7 Mobile App Screens - Phase 1

```
├── (auth)/
│   ├── welcome.tsx         # Welcome/onboarding
│   ├── login.tsx           # Email/phone login
│   ├── register.tsx        # Registration
│   └── verify-otp.tsx      # OTP verification
│
├── (tabs)/
│   ├── index.tsx           # Home - Trip list
│   ├── explore.tsx         # Discover places (placeholder)
│   ├── safety.tsx          # Safety dashboard (placeholder)
│   └── profile.tsx         # User profile
│
├── trip/
│   ├── create.tsx          # Create new trip
│   ├── [id]/
│   │   ├── index.tsx       # Trip details
│   │   ├── members.tsx     # Manage members
│   │   ├── chat.tsx        # Group chat (Phase 2)
│   │   ├── itinerary.tsx   # Itinerary (Phase 4)
│   │   └── settings.tsx    # Trip settings
```

---

## Phase 2: Signal-Cleanse Engine (Weeks 5-8)

### Week 5-6: Group Chat Implementation

#### 2.1 Real-time Chat Architecture

```
┌──────────────┐     WebSocket     ┌──────────────┐
│    Mobile    │◄────────────────►│   FastAPI    │
│     App      │                   │   Server     │
└──────────────┘                   └──────┬───────┘
                                          │
                                          ▼
                                   ┌──────────────┐
                                   │    Redis     │
                                   │   Pub/Sub    │
                                   └──────────────┘
```

#### 2.2 WebSocket Handler

```python
# apps/api/routers/chat.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from services.chat_service import ChatService
import json

router = APIRouter()
chat_service = ChatService()

@router.websocket("/ws/{trip_id}")
async def chat_websocket(websocket: WebSocket, trip_id: str):
    await websocket.accept()
    user_id = await authenticate_websocket(websocket)

    # Subscribe to trip channel
    await chat_service.connect(trip_id, user_id, websocket)

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)

            if message["type"] == "message":
                await chat_service.send_message(
                    trip_id=trip_id,
                    user_id=user_id,
                    content=message["content"],
                    message_type=message.get("message_type", "text")
                )
            elif message["type"] == "typing":
                await chat_service.broadcast_typing(trip_id, user_id)

    except WebSocketDisconnect:
        await chat_service.disconnect(trip_id, user_id)
```

#### 2.3 Chat Service

```python
# apps/api/services/chat_service.py
from typing import Dict, Set
import redis.asyncio as redis
import json
from datetime import datetime

class ChatService:
    def __init__(self):
        self.redis = redis.from_url(REDIS_URL)
        self.connections: Dict[str, Dict[str, WebSocket]] = {}

    async def connect(self, trip_id: str, user_id: str, websocket: WebSocket):
        if trip_id not in self.connections:
            self.connections[trip_id] = {}
        self.connections[trip_id][user_id] = websocket

        # Subscribe to Redis channel
        pubsub = self.redis.pubsub()
        await pubsub.subscribe(f"trip:{trip_id}:messages")

        # Start listening in background
        asyncio.create_task(self._listen(pubsub, websocket))

    async def send_message(self, trip_id: str, user_id: str, content: str, message_type: str):
        # Save to database
        message = await self.db.create_message(
            trip_id=trip_id,
            user_id=user_id,
            content=content,
            message_type=message_type
        )

        # Broadcast via Redis
        await self.redis.publish(
            f"trip:{trip_id}:messages",
            json.dumps({
                "type": "new_message",
                "message": message.dict()
            })
        )

        # Trigger Signal-Cleanse analysis (async)
        await self._queue_analysis(trip_id, message.id)

    async def _queue_analysis(self, trip_id: str, message_id: str):
        """Queue message for decision extraction"""
        await self.redis.lpush(
            "signal_cleanse:queue",
            json.dumps({"trip_id": trip_id, "message_id": message_id})
        )
```

### Week 7-8: AI Decision Extraction

#### 2.4 WhatsApp Export Parser

```python
# apps/api/services/whatsapp_parser.py
import re
from datetime import datetime
from typing import List, Dict, Optional

class WhatsAppParser:
    """Parse WhatsApp chat exports"""

    # Multiple date formats to handle different locales
    DATE_PATTERNS = [
        r'(\d{1,2}/\d{1,2}/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?)(?:\s*(?:AM|PM|am|pm))?\s*-\s*([^:]+):\s*(.+)',
        r'\[(\d{1,2}/\d{1,2}/\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?)(?:\s*(?:AM|PM|am|pm))?\]\s*([^:]+):\s*(.+)',
    ]

    SYSTEM_MESSAGES = [
        "Messages and calls are end-to-end encrypted",
        "created group",
        "added you",
        "changed the subject",
        "changed this group's icon",
        "left",
        "removed",
    ]

    def parse(self, content: str) -> List[Dict]:
        """Parse exported chat content"""
        messages = []
        lines = content.split('\n')
        current_message = None

        for line in lines:
            parsed = self._parse_line(line)

            if parsed:
                if current_message:
                    messages.append(current_message)
                current_message = parsed
            elif current_message:
                # Multi-line message continuation
                current_message['content'] += '\n' + line.strip()

        if current_message:
            messages.append(current_message)

        # Filter out system messages
        messages = [m for m in messages if not self._is_system_message(m['content'])]

        return messages

    def _parse_line(self, line: str) -> Optional[Dict]:
        for pattern in self.DATE_PATTERNS:
            match = re.match(pattern, line.strip())
            if match:
                date_str, time_str, sender, content = match.groups()
                return {
                    'timestamp': self._parse_datetime(date_str, time_str),
                    'sender': sender.strip(),
                    'content': content.strip(),
                }
        return None

    def _parse_datetime(self, date_str: str, time_str: str) -> datetime:
        # Handle various date formats
        for fmt in ['%d/%m/%y', '%d/%m/%Y', '%m/%d/%y', '%m/%d/%Y']:
            try:
                date = datetime.strptime(date_str, fmt)
                time_parts = time_str.split(':')
                return date.replace(
                    hour=int(time_parts[0]),
                    minute=int(time_parts[1])
                )
            except ValueError:
                continue
        return datetime.now()

    def _is_system_message(self, content: str) -> bool:
        content_lower = content.lower()
        return any(sys_msg.lower() in content_lower for sys_msg in self.SYSTEM_MESSAGES)
```

#### 2.5 Signal-Cleanse AI Agent

```python
# packages/ai-agents/signal_cleanse/agent.py
from langchain.chat_models import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.output_parsers import PydanticOutputParser
from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum

class DecisionCategory(str, Enum):
    DATE = "date"
    ACCOMMODATION = "accommodation"
    TRANSPORT = "transport"
    ACTIVITY = "activity"
    FOOD = "food"
    BUDGET = "budget"
    MEETING_POINT = "meeting_point"
    PACKING = "packing"

class DecisionStatus(str, Enum):
    PROPOSED = "proposed"
    CONFIRMED = "confirmed"
    REJECTED = "rejected"
    PENDING_VOTE = "pending_vote"

class ExtractedDecision(BaseModel):
    category: DecisionCategory
    title: str = Field(description="Short title of the decision")
    description: str = Field(description="Detailed description")
    status: DecisionStatus
    confidence: float = Field(ge=0, le=1, description="Confidence score")
    participants: List[str] = Field(description="People involved in this decision")
    source_indices: List[int] = Field(description="Indices of source messages")
    extracted_values: Optional[dict] = Field(
        default=None,
        description="Specific extracted values like dates, prices, locations"
    )

class DecisionExtractionResult(BaseModel):
    decisions: List[ExtractedDecision]
    summary: str
    pending_questions: List[str]

class SignalCleanseAgent:
    def __init__(self):
        self.llm = ChatOpenAI(
            model="gpt-4-turbo-preview",
            temperature=0
        )
        self.parser = PydanticOutputParser(pydantic_object=DecisionExtractionResult)

    async def extract_decisions(self, messages: List[dict]) -> DecisionExtractionResult:
        """Extract travel decisions from chat messages"""

        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an AI assistant specialized in extracting travel planning decisions from group chat conversations.

Your task is to analyze the chat messages and identify:

1. **DATE decisions**: When the trip is happening (dates, duration)
2. **ACCOMMODATION decisions**: Where to stay (hotels, hostels, Airbnb)
3. **TRANSPORT decisions**: How to travel (flights, trains, buses, car rental)
4. **ACTIVITY decisions**: What to do (places to visit, experiences)
5. **FOOD decisions**: Where to eat, dietary preferences
6. **BUDGET decisions**: Cost estimates, who pays what
7. **MEETING_POINT decisions**: Where to meet before/during trip
8. **PACKING decisions**: What to bring

For each decision, determine:
- **Status**:
  - "proposed" = someone suggested it
  - "confirmed" = group clearly agreed
  - "rejected" = group said no
  - "pending_vote" = needs more discussion

- **Confidence**: How confident you are (0.0 to 1.0)

- **Extracted values**: Specific data like:
  - Dates: {{"start": "2025-01-15", "end": "2025-01-18"}}
  - Prices: {{"amount": 5000, "currency": "INR", "per_person": true}}
  - Locations: {{"name": "Zostel Hampi", "type": "hostel"}}

Also identify:
- Overall summary of planning progress
- Questions that still need answers

{format_instructions}

Important:
- Only extract real decisions, not casual mentions
- Look for agreement signals: "done", "booked", "confirmed", "okay", "let's do it", "+1", emoji reactions
- Look for rejection signals: "no", "can't", "too expensive", "let's not"
- Ignore memes, jokes, off-topic messages
- Handle Hindi/Hinglish mixed with English"""),

            ("human", """Analyze these chat messages and extract travel decisions:

{messages}

Remember to output valid JSON matching the schema.""")
        ])

        formatted_messages = self._format_messages(messages)

        chain = prompt | self.llm | self.parser

        result = await chain.ainvoke({
            "messages": formatted_messages,
            "format_instructions": self.parser.get_format_instructions()
        })

        return result

    def _format_messages(self, messages: List[dict]) -> str:
        """Format messages for LLM input"""
        formatted = []
        for i, msg in enumerate(messages):
            timestamp = msg.get('timestamp', '')
            sender = msg.get('sender', 'Unknown')
            content = msg.get('content', '')
            formatted.append(f"[{i}] {timestamp} - {sender}: {content}")
        return '\n'.join(formatted)

    async def generate_timeline(self, decisions: List[ExtractedDecision]) -> str:
        """Generate human-readable decision timeline"""

        prompt = ChatPromptTemplate.from_messages([
            ("system", """Create a clear, organized Decision Timeline from these extracted decisions.

Format it as:
## Confirmed
- [Category] Title - Details

## In Discussion
- [Category] Title - Details (who proposed, current status)

## Still Needed
- What decisions are still pending?

Keep it concise and scannable. Use bullet points."""),

            ("human", "{decisions}")
        ])

        chain = prompt | self.llm

        result = await chain.ainvoke({
            "decisions": [d.dict() for d in decisions]
        })

        return result.content
```

#### 2.6 API Endpoints - Phase 2

```
Messages:
POST   /api/trips/:id/chat/messages        # Send message
GET    /api/trips/:id/chat/messages        # Get messages (paginated)
WS     /api/trips/:id/chat/ws              # Real-time WebSocket
DELETE /api/trips/:id/chat/messages/:msgId # Delete message

Import:
POST   /api/trips/:id/chat/import          # Import WhatsApp export
GET    /api/trips/:id/chat/import/status   # Check import status

Decisions:
GET    /api/trips/:id/decisions            # Get extracted decisions
GET    /api/trips/:id/decisions/timeline   # Get decision timeline
POST   /api/trips/:id/decisions/:id/confirm # Confirm decision
POST   /api/trips/:id/decisions/:id/reject  # Reject decision
POST   /api/trips/:id/decisions/refresh    # Re-run extraction
```

---

## Phase 3: Safety Sentinel (Weeks 9-12)

### Week 9-10: Location Tracking

#### 3.1 Mobile Location Service

```typescript
// apps/mobile/services/LocationService.ts
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import * as Battery from 'expo-battery';
import { api } from './api';

const BACKGROUND_LOCATION_TASK = 'background-location-task';
const LOCATION_INTERVAL = 5 * 60 * 1000; // 5 minutes
const DISTANCE_INTERVAL = 100; // 100 meters

// Define background task
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Location task error:', error);
    return;
  }

  const { locations } = data as { locations: Location.LocationObject[] };
  const location = locations[0];

  if (!location) return;

  try {
    // Get battery info
    const batteryLevel = await Battery.getBatteryLevelAsync();
    const batteryState = await Battery.getBatteryStateAsync();

    // Send to backend
    await api.post('/api/safety/location', {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      accuracy: location.coords.accuracy,
      altitude: location.coords.altitude,
      speed: location.coords.speed,
      heading: location.coords.heading,
      battery_level: Math.round(batteryLevel * 100),
      is_charging: batteryState === Battery.BatteryState.CHARGING,
      timestamp: new Date(location.timestamp).toISOString(),
    });
  } catch (err) {
    console.error('Failed to send location:', err);
  }
});

export class LocationService {
  private static instance: LocationService;
  private isTracking = false;
  private tripId: string | null = null;

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService();
    }
    return LocationService.instance;
  }

  async requestPermissions(): Promise<boolean> {
    const { status: foreground } = await Location.requestForegroundPermissionsAsync();
    if (foreground !== 'granted') return false;

    const { status: background } = await Location.requestBackgroundPermissionsAsync();
    return background === 'granted';
  }

  async startTracking(tripId: string): Promise<boolean> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return false;

    this.tripId = tripId;

    await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
      accuracy: Location.Accuracy.Balanced,
      timeInterval: LOCATION_INTERVAL,
      distanceInterval: DISTANCE_INTERVAL,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'TripGuard Safety Active',
        notificationBody: 'Keeping you safe during your trip',
        notificationColor: '#4F46E5',
      },
    });

    this.isTracking = true;
    return true;
  }

  async stopTracking(): Promise<void> {
    if (this.isTracking) {
      await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
      this.isTracking = false;
      this.tripId = null;
    }
  }

  async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      return await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
    } catch {
      return null;
    }
  }

  async triggerSOS(tripId: string): Promise<void> {
    const location = await this.getCurrentLocation();

    await api.post('/api/safety/sos', {
      trip_id: tripId,
      location: location ? {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      } : null,
    });
  }
}
```

### Week 11-12: Anomaly Detection

#### 3.2 Safety Sentinel Engine

```python
# packages/ai-agents/safety_sentinel/engine.py
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from enum import Enum
import math

class AlertSeverity(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class AlertType(str, Enum):
    SILENCE = "silence"
    UNUSUAL_STOP = "unusual_stop"
    UNUSUAL_DETOUR = "unusual_detour"
    OFF_ROUTE = "off_route"
    LOW_BATTERY_REMOTE = "low_battery_remote"
    RAPID_MOVEMENT = "rapid_movement"
    SOS_TRIGGERED = "sos_triggered"
    MISSED_CHECKIN = "missed_checkin"

@dataclass
class Anomaly:
    type: AlertType
    severity: AlertSeverity
    details: Dict[str, Any]
    confidence: float

class SafetySentinelEngine:
    """Core anomaly detection engine"""

    # Configurable thresholds
    THRESHOLDS = {
        "silence_hours_low": 2,
        "silence_hours_medium": 4,
        "silence_hours_high": 6,
        "stationary_minutes": 60,
        "low_battery_percent": 20,
        "critical_battery_percent": 10,
        "remote_area_poi_radius_km": 10,
        "unusual_speed_kmh": 150,
        "off_route_deviation_km": 5,
    }

    def __init__(self, db_session):
        self.db = db_session

    async def analyze_user(
        self,
        user_id: str,
        trip_id: str
    ) -> List[Anomaly]:
        """Run all anomaly checks for a user"""

        anomalies = []

        # Get user data
        user = await self.db.get_user(user_id)
        trip = await self.db.get_trip(trip_id)

        # Run checks
        checks = [
            self._check_silence(user_id, trip_id),
            self._check_stationary(user_id, trip_id),
            self._check_route_deviation(user_id, trip_id),
            self._check_battery_risk(user_id, trip_id),
            self._check_unusual_movement(user_id, trip_id),
        ]

        for check in checks:
            anomaly = await check
            if anomaly:
                anomalies.append(anomaly)

        return anomalies

    async def _check_silence(
        self,
        user_id: str,
        trip_id: str
    ) -> Optional[Anomaly]:
        """Check for prolonged communication silence"""

        # Get last activity (message, checkin, or location update)
        last_message = await self.db.get_last_message(user_id, trip_id)
        last_checkin = await self.db.get_last_checkin(user_id, trip_id)
        last_location = await self.db.get_last_location(user_id, trip_id)

        # Find most recent activity
        activities = [
            last_message.created_at if last_message else None,
            last_checkin.created_at if last_checkin else None,
            last_location.recorded_at if last_location else None,
        ]
        activities = [a for a in activities if a]

        if not activities:
            return None

        last_activity = max(activities)
        hours_silent = (datetime.utcnow() - last_activity).total_seconds() / 3600

        # Determine severity
        if hours_silent >= self.THRESHOLDS["silence_hours_high"]:
            severity = AlertSeverity.HIGH
        elif hours_silent >= self.THRESHOLDS["silence_hours_medium"]:
            severity = AlertSeverity.MEDIUM
        elif hours_silent >= self.THRESHOLDS["silence_hours_low"]:
            severity = AlertSeverity.LOW
        else:
            return None

        return Anomaly(
            type=AlertType.SILENCE,
            severity=severity,
            details={
                "hours_silent": round(hours_silent, 1),
                "last_activity": last_activity.isoformat(),
                "last_activity_type": self._get_activity_type(
                    last_message, last_checkin, last_location
                ),
            },
            confidence=0.9
        )

    async def _check_stationary(
        self,
        user_id: str,
        trip_id: str
    ) -> Optional[Anomaly]:
        """Check for unusual stationary behavior"""

        # Get recent locations
        locations = await self.db.get_recent_locations(
            user_id, trip_id, hours=2
        )

        if len(locations) < 3:
            return None

        # Calculate movement
        total_distance = 0
        for i in range(1, len(locations)):
            total_distance += self._haversine(
                locations[i-1].latitude, locations[i-1].longitude,
                locations[i].latitude, locations[i].longitude
            )

        # Time span
        time_span = (
            locations[-1].recorded_at - locations[0].recorded_at
        ).total_seconds() / 60  # minutes

        # Check if stationary
        if total_distance < 0.1 and time_span >= self.THRESHOLDS["stationary_minutes"]:
            # Check if this is a planned location
            itinerary = await self.db.get_current_itinerary_item(trip_id)
            last_loc = locations[-1]

            if itinerary and self._is_near_planned_location(last_loc, itinerary):
                return None  # Expected to be stationary here

            # Check if it's a populated area
            is_remote = await self._is_remote_area(
                last_loc.latitude, last_loc.longitude
            )

            severity = AlertSeverity.MEDIUM if is_remote else AlertSeverity.LOW

            return Anomaly(
                type=AlertType.UNUSUAL_STOP,
                severity=severity,
                details={
                    "location": {
                        "lat": float(last_loc.latitude),
                        "lng": float(last_loc.longitude),
                    },
                    "stationary_minutes": round(time_span),
                    "is_remote": is_remote,
                },
                confidence=0.7
            )

        return None

    async def _check_battery_risk(
        self,
        user_id: str,
        trip_id: str
    ) -> Optional[Anomaly]:
        """Check for low battery in risky situations"""

        last_location = await self.db.get_last_location(user_id, trip_id)

        if not last_location or last_location.battery_level is None:
            return None

        battery = last_location.battery_level

        if battery > self.THRESHOLDS["low_battery_percent"]:
            return None

        # Check if in remote area
        is_remote = await self._is_remote_area(
            last_location.latitude, last_location.longitude
        )

        if not is_remote:
            return None  # Low battery in populated area is less concerning

        severity = (
            AlertSeverity.HIGH
            if battery <= self.THRESHOLDS["critical_battery_percent"]
            else AlertSeverity.MEDIUM
        )

        return Anomaly(
            type=AlertType.LOW_BATTERY_REMOTE,
            severity=severity,
            details={
                "battery_level": battery,
                "is_charging": last_location.is_charging,
                "location": {
                    "lat": float(last_location.latitude),
                    "lng": float(last_location.longitude),
                },
            },
            confidence=0.85
        )

    async def _check_unusual_movement(
        self,
        user_id: str,
        trip_id: str
    ) -> Optional[Anomaly]:
        """Check for unusual movement patterns (too fast, erratic)"""

        locations = await self.db.get_recent_locations(
            user_id, trip_id, hours=1
        )

        if len(locations) < 2:
            return None

        # Calculate speeds between points
        speeds = []
        for i in range(1, len(locations)):
            distance = self._haversine(
                locations[i-1].latitude, locations[i-1].longitude,
                locations[i].latitude, locations[i].longitude
            )
            time_hours = (
                locations[i].recorded_at - locations[i-1].recorded_at
            ).total_seconds() / 3600

            if time_hours > 0:
                speed_kmh = distance / time_hours
                speeds.append(speed_kmh)

        if not speeds:
            return None

        max_speed = max(speeds)

        if max_speed > self.THRESHOLDS["unusual_speed_kmh"]:
            return Anomaly(
                type=AlertType.RAPID_MOVEMENT,
                severity=AlertSeverity.LOW,
                details={
                    "max_speed_kmh": round(max_speed),
                    "avg_speed_kmh": round(sum(speeds) / len(speeds)),
                },
                confidence=0.6
            )

        return None

    async def _is_remote_area(self, lat: float, lng: float) -> bool:
        """Check if location is in a remote area"""
        # Use Google Places API to check for nearby POIs
        # If very few POIs within radius, consider it remote

        # Simplified version - in production, use actual API
        nearby_pois = await self.maps_service.get_nearby_places(
            lat, lng,
            radius=self.THRESHOLDS["remote_area_poi_radius_km"] * 1000
        )

        return len(nearby_pois) < 3

    def _haversine(
        self,
        lat1: float, lon1: float,
        lat2: float, lon2: float
    ) -> float:
        """Calculate distance between two points in km"""
        R = 6371  # Earth's radius in km

        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1

        a = (
            math.sin(dlat/2)**2 +
            math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        )
        c = 2 * math.asin(math.sqrt(a))

        return R * c

    def _is_near_planned_location(
        self,
        location,
        itinerary_item
    ) -> bool:
        """Check if current location is near planned itinerary item"""
        if not itinerary_item.location:
            return False

        planned_lat = itinerary_item.location.get('lat')
        planned_lng = itinerary_item.location.get('lng')

        if not planned_lat or not planned_lng:
            return False

        distance = self._haversine(
            float(location.latitude), float(location.longitude),
            planned_lat, planned_lng
        )

        return distance < 0.5  # Within 500 meters
```

#### 3.3 Alert Service

```python
# apps/api/services/alert_service.py
from firebase_admin import messaging
from twilio.rest import Client
from typing import List
import asyncio

class AlertService:
    def __init__(self):
        self.twilio = Client(TWILIO_SID, TWILIO_AUTH_TOKEN)

    async def process_anomalies(
        self,
        user_id: str,
        trip_id: str,
        anomalies: List[Anomaly]
    ):
        """Process detected anomalies and trigger appropriate alerts"""

        for anomaly in anomalies:
            # Check if similar alert already exists
            existing = await self.db.get_active_alert(
                user_id, trip_id, anomaly.type
            )

            if existing:
                # Update existing alert if severity increased
                if self._severity_rank(anomaly.severity) > \
                   self._severity_rank(existing.severity):
                    await self._escalate_alert(existing, anomaly)
                continue

            # Create new alert
            alert = await self.db.create_alert(
                user_id=user_id,
                trip_id=trip_id,
                alert_type=anomaly.type,
                severity=anomaly.severity,
                details=anomaly.details
            )

            # Trigger notifications based on severity
            await self._handle_alert(alert)

    async def _handle_alert(self, alert):
        """Handle alert based on severity"""

        user = await self.db.get_user(alert.user_id)
        trip = await self.db.get_trip(alert.trip_id)

        if alert.severity == AlertSeverity.LOW:
            # Just send check-in request to user
            await self._send_checkin_request(user, alert)

        elif alert.severity == AlertSeverity.MEDIUM:
            # Send check-in request + notify trip members
            await asyncio.gather(
                self._send_checkin_request(user, alert),
                self._notify_trip_members(trip, user, alert)
            )

        elif alert.severity == AlertSeverity.HIGH:
            # Full escalation
            await asyncio.gather(
                self._send_checkin_request(user, alert),
                self._notify_trip_members(trip, user, alert),
                self._notify_emergency_contacts(user, alert)
            )

        elif alert.severity == AlertSeverity.CRITICAL:
            # Critical escalation with SMS
            await asyncio.gather(
                self._send_checkin_request(user, alert),
                self._notify_trip_members(trip, user, alert),
                self._notify_emergency_contacts(user, alert),
                self._send_sms_alert(user, alert)
            )

    async def _send_checkin_request(self, user, alert):
        """Send push notification asking user to check in"""

        title_map = {
            AlertType.SILENCE: "Are you okay?",
            AlertType.UNUSUAL_STOP: "Everything alright?",
            AlertType.LOW_BATTERY_REMOTE: "Low battery warning",
        }

        body_map = {
            AlertType.SILENCE: "We haven't heard from you in a while. Tap to check in.",
            AlertType.UNUSUAL_STOP: "You've been in the same spot for a while. Tap to confirm you're safe.",
            AlertType.LOW_BATTERY_REMOTE: "Your battery is low and you're in a remote area. Check in to let others know you're okay.",
        }

        message = messaging.Message(
            notification=messaging.Notification(
                title=title_map.get(alert.alert_type, "Safety Check"),
                body=body_map.get(alert.alert_type, "Please check in to confirm you're safe."),
            ),
            data={
                "type": "checkin_request",
                "alert_id": str(alert.id),
                "trip_id": str(alert.trip_id),
            },
            token=user.fcm_token,
            android=messaging.AndroidConfig(
                priority="high",
                notification=messaging.AndroidNotification(
                    channel_id="safety_alerts",
                    priority="max",
                ),
            ),
            apns=messaging.APNSConfig(
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(
                        alert=messaging.ApsAlert(
                            title=title_map.get(alert.alert_type, "Safety Check"),
                            body=body_map.get(alert.alert_type, "Please check in."),
                        ),
                        sound="critical_alert.wav",
                        category="SAFETY_CHECKIN",
                    ),
                ),
            ),
        )

        messaging.send(message)

    async def _notify_emergency_contacts(self, user, alert):
        """Notify user's emergency contacts"""

        for contact in user.emergency_contacts:
            if contact.get('fcm_token'):
                # Push notification if they have the app
                message = messaging.Message(
                    notification=messaging.Notification(
                        title=f"Safety Alert for {user.name}",
                        body=self._get_alert_description(alert),
                    ),
                    data={
                        "type": "emergency_alert",
                        "user_id": str(user.id),
                        "alert_id": str(alert.id),
                    },
                    token=contact['fcm_token'],
                )
                messaging.send(message)

    async def _send_sms_alert(self, user, alert):
        """Send SMS to emergency contacts for critical alerts"""

        location_str = ""
        if alert.details.get('location'):
            loc = alert.details['location']
            location_str = f"\nLast location: https://maps.google.com/?q={loc['lat']},{loc['lng']}"

        message_body = (
            f"TripGuard ALERT: {user.name} may need help.\n"
            f"Reason: {self._get_alert_description(alert)}"
            f"{location_str}\n"
            f"Contact them immediately."
        )

        for contact in user.emergency_contacts:
            if contact.get('phone'):
                self.twilio.messages.create(
                    body=message_body,
                    from_=TWILIO_PHONE_NUMBER,
                    to=contact['phone']
                )

    def _get_alert_description(self, alert) -> str:
        """Get human-readable alert description"""

        descriptions = {
            AlertType.SILENCE: f"No communication for {alert.details.get('hours_silent', '?')} hours",
            AlertType.UNUSUAL_STOP: f"Stationary in unfamiliar location for {alert.details.get('stationary_minutes', '?')} minutes",
            AlertType.LOW_BATTERY_REMOTE: f"Battery at {alert.details.get('battery_level', '?')}% in remote area",
            AlertType.SOS_TRIGGERED: "SOS button pressed",
        }

        return descriptions.get(alert.alert_type, "Safety concern detected")
```

#### 3.4 API Endpoints - Phase 3

```
Safety:
POST   /api/safety/location                # Report location update
GET    /api/safety/status/:tripId          # Get safety status for trip
GET    /api/safety/status/:tripId/members  # Get all members' safety status
POST   /api/safety/checkin                 # Manual check-in
POST   /api/safety/sos                     # Trigger SOS alert
GET    /api/safety/alerts                  # Get user's active alerts
GET    /api/safety/alerts/:tripId          # Get trip's active alerts
PATCH  /api/safety/alerts/:id/acknowledge  # Acknowledge alert
PATCH  /api/safety/alerts/:id/resolve      # Resolve alert
PATCH  /api/safety/alerts/:id/false-alarm  # Mark as false alarm
GET    /api/safety/settings                # Get safety preferences
PATCH  /api/safety/settings                # Update safety preferences
```

---

## Phase 4: Elastic Itinerary (Weeks 13-16)

### Week 13-14: AI Itinerary Generation

#### 4.1 Itinerary Planner Agent

```python
# packages/ai-agents/itinerary_planner/agent.py
from langchain.chat_models import ChatOpenAI
from langchain.tools import Tool
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain.prompts import ChatPromptTemplate, MessagesPlaceholder
from typing import List, Dict
import httpx

class ItineraryPlannerAgent:
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4-turbo-preview", temperature=0.7)
        self.tools = self._create_tools()

    def _create_tools(self) -> List[Tool]:
        return [
            Tool(
                name="search_places",
                description="Search for places and attractions. Input: query string and location.",
                func=self.search_places,
            ),
            Tool(
                name="get_place_details",
                description="Get detailed information about a specific place. Input: place_id.",
                func=self.get_place_details,
            ),
            Tool(
                name="get_distance_matrix",
                description="Get travel time and distance between places. Input: origins and destinations.",
                func=self.get_distance_matrix,
            ),
            Tool(
                name="get_weather_forecast",
                description="Get weather forecast for a location and date. Input: lat, lng, date.",
                func=self.get_weather_forecast,
            ),
            Tool(
                name="search_restaurants",
                description="Search for restaurants. Input: location, cuisine type, price level.",
                func=self.search_restaurants,
            ),
        ]

    async def generate_itinerary(
        self,
        trip: Dict,
        preferences: Dict,
        decisions: List[Dict] = None
    ) -> Dict:
        """Generate a complete trip itinerary"""

        # Build context from decisions (if from Signal-Cleanse)
        decision_context = ""
        if decisions:
            confirmed = [d for d in decisions if d['status'] == 'confirmed']
            decision_context = f"""
            The group has already confirmed these decisions:
            {self._format_decisions(confirmed)}

            Incorporate these into the itinerary.
            """

        prompt = ChatPromptTemplate.from_messages([
            ("system", """You are an expert travel planner creating detailed, realistic itineraries.

Your task is to create a day-by-day itinerary for the trip.

Guidelines:
1. **Realistic timing**: Account for travel time between locations, rest periods, and meal times
2. **Balance**: Mix popular attractions with hidden gems, active with relaxed activities
3. **Flow**: Organize geographically to minimize backtracking
4. **Flexibility**: Build in buffer time for spontaneity
5. **Local insight**: Include local food spots, not just tourist restaurants
6. **Weather awareness**: Check forecasts and plan accordingly
7. **Group dynamics**: Consider the group size and preferences

For each activity, provide:
- Time slot (start and end)
- Location with coordinates
- Description and why it's recommended
- Estimated cost
- Tips for the visit
- Backup option in case of issues

{decision_context}"""),
            ("human", """Create an itinerary for this trip:

**Destination**: {destination}
**Dates**: {start_date} to {end_date}
**Group size**: {group_size} people
**Budget**: {budget}
**Interests**: {interests}
**Travel style**: {travel_style}
**Dietary preferences**: {dietary}
**Mobility considerations**: {mobility}

Use the available tools to research places, distances, and weather.
Return a structured itinerary."""),
            MessagesPlaceholder(variable_name="agent_scratchpad"),
        ])

        agent = create_openai_functions_agent(self.llm, self.tools, prompt)
        executor = AgentExecutor(agent=agent, tools=self.tools, verbose=True)

        result = await executor.ainvoke({
            "destination": trip['destination'],
            "start_date": trip['start_date'],
            "end_date": trip['end_date'],
            "group_size": len(trip.get('members', [])) or 1,
            "budget": preferences.get('budget', 'moderate'),
            "interests": ', '.join(preferences.get('interests', [])),
            "travel_style": preferences.get('travel_style', 'balanced'),
            "dietary": ', '.join(preferences.get('dietary', [])),
            "mobility": preferences.get('mobility', 'no restrictions'),
            "decision_context": decision_context,
        })

        return self._parse_itinerary(result['output'])

    async def search_places(self, query: str, location: str) -> List[Dict]:
        """Search Google Places API"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://maps.googleapis.com/maps/api/place/textsearch/json",
                params={
                    "query": f"{query} in {location}",
                    "key": GOOGLE_MAPS_API_KEY,
                }
            )
            data = response.json()

            return [
                {
                    "place_id": p["place_id"],
                    "name": p["name"],
                    "address": p.get("formatted_address"),
                    "rating": p.get("rating"),
                    "price_level": p.get("price_level"),
                    "location": p["geometry"]["location"],
                    "types": p.get("types", []),
                }
                for p in data.get("results", [])[:10]
            ]

    async def get_weather_forecast(
        self,
        lat: float,
        lng: float,
        date: str
    ) -> Dict:
        """Get weather forecast from OpenWeather"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.openweathermap.org/data/2.5/forecast",
                params={
                    "lat": lat,
                    "lon": lng,
                    "appid": OPENWEATHER_API_KEY,
                    "units": "metric",
                }
            )
            data = response.json()

            # Find forecast for requested date
            # ... (parse and return relevant forecast)

            return {
                "date": date,
                "condition": "sunny",  # simplified
                "temperature": {"min": 20, "max": 32},
                "precipitation_chance": 10,
            }
```

### Week 15-16: Real-time Optimization

#### 4.2 Itinerary Optimizer

```python
# packages/ai-agents/itinerary_planner/optimizer.py
from datetime import datetime, time
from typing import List, Dict, Optional
from langchain.chat_models import ChatOpenAI

class ItineraryOptimizer:
    """Real-time itinerary optimization engine"""

    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4-turbo-preview", temperature=0.3)

    async def optimize(
        self,
        itinerary: Dict,
        current_context: Dict
    ) -> Dict:
        """Optimize itinerary based on real-time conditions"""

        # Detect issues
        issues = await self._detect_issues(itinerary, current_context)

        if not issues:
            return itinerary  # No optimization needed

        # Generate optimized plan
        optimized = await self._generate_optimized_plan(
            itinerary, current_context, issues
        )

        return optimized

    async def _detect_issues(
        self,
        itinerary: Dict,
        context: Dict
    ) -> List[Dict]:
        """Detect issues that require re-planning"""

        issues = []
        current_time = context.get('current_time', datetime.now())

        # Get remaining items for today
        today_items = self._get_remaining_items(itinerary, current_time)

        # Check weather
        if context.get('weather'):
            weather = context['weather']
            for item in today_items:
                if self._is_outdoor(item) and weather.get('condition') in ['rain', 'storm', 'extreme_heat']:
                    issues.append({
                        'type': 'weather',
                        'severity': 'high',
                        'item_id': item['id'],
                        'description': f"Bad weather ({weather['condition']}) affects {item['title']}",
                        'weather': weather,
                    })

        # Check crowd levels
        if context.get('crowd_data'):
            for item in today_items:
                crowd = context['crowd_data'].get(item.get('place_id'))
                if crowd and crowd > 0.8:  # 80%+ crowded
                    issues.append({
                        'type': 'crowd',
                        'severity': 'medium',
                        'item_id': item['id'],
                        'description': f"{item['title']} is very crowded ({int(crowd*100)}%)",
                        'crowd_level': crowd,
                    })

        # Check delays
        if context.get('current_location') and context.get('delays'):
            for delay in context['delays']:
                issues.append({
                    'type': 'delay',
                    'severity': 'medium',
                    'description': f"Running {delay['minutes']} minutes behind schedule",
                    'delay_minutes': delay['minutes'],
                })

        # Check user state
        user_state = context.get('user_state', {})
        if user_state.get('energy_level', 100) < 30:
            issues.append({
                'type': 'fatigue',
                'severity': 'medium',
                'description': "Group energy is low",
                'energy_level': user_state['energy_level'],
            })

        # Check if running late
        if context.get('current_location'):
            next_item = today_items[0] if today_items else None
            if next_item and next_item.get('start_time'):
                eta = await self._calculate_eta(
                    context['current_location'],
                    next_item['location']
                )

                scheduled_time = datetime.combine(
                    current_time.date(),
                    time.fromisoformat(next_item['start_time'])
                )

                arrival_time = current_time + timedelta(minutes=eta)

                if arrival_time > scheduled_time:
                    delay_mins = int((arrival_time - scheduled_time).total_seconds() / 60)
                    issues.append({
                        'type': 'running_late',
                        'severity': 'low' if delay_mins < 15 else 'medium',
                        'item_id': next_item['id'],
                        'description': f"Will arrive {delay_mins} minutes late to {next_item['title']}",
                        'delay_minutes': delay_mins,
                    })

        return issues

    async def _generate_optimized_plan(
        self,
        itinerary: Dict,
        context: Dict,
        issues: List[Dict]
    ) -> Dict:
        """Use LLM to generate optimized plan"""

        prompt = f"""
        The current itinerary needs adjustment due to these issues:
        {self._format_issues(issues)}

        Current situation:
        - Time: {context.get('current_time')}
        - Location: {context.get('current_location')}
        - Weather: {context.get('weather')}
        - Group energy: {context.get('user_state', {}).get('energy_level', 'unknown')}

        Remaining planned activities:
        {self._format_items(self._get_remaining_items(itinerary, context.get('current_time')))}

        Please suggest an optimized plan that:
        1. Addresses all identified issues
        2. Keeps the day enjoyable
        3. Is realistic with timing
        4. Maintains key experiences where possible

        For weather issues: Suggest indoor alternatives or reschedule
        For crowd issues: Reorder to visit crowded places at better times
        For fatigue: Add rest time or lighter activities
        For delays: Compress or skip lower-priority items

        Return a restructured itinerary with explanations for changes.
        """

        response = await self.llm.ainvoke(prompt)

        return self._parse_optimized_response(response.content, itinerary)
```

#### 4.3 API Endpoints - Phase 4

```
Itinerary:
POST   /api/itinerary/generate             # Generate new itinerary
GET    /api/trips/:tripId/itinerary        # Get trip itinerary
GET    /api/trips/:tripId/itinerary/today  # Get today's plan
POST   /api/trips/:tripId/itinerary/optimize  # Trigger optimization
PATCH  /api/itinerary/items/:itemId        # Update item
POST   /api/itinerary/items/:itemId/complete  # Mark completed
POST   /api/itinerary/items/:itemId/skip   # Skip item
POST   /api/itinerary/items/:itemId/reschedule  # Reschedule
POST   /api/trips/:tripId/itinerary/feedback  # Submit context (fatigue, etc.)
GET    /api/itinerary/suggestions          # Get activity suggestions
```

---

## Phase 5: Hyperlocal Discovery (Weeks 17-18)

### 5.1 Discovery Engine Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA INGESTION                            │
├─────────────────┬─────────────────┬─────────────────────────┤
│  Local Blogs    │    YouTube      │    Instagram            │
│  Scraper        │    Transcripts  │    Location Tags        │
└────────┬────────┴────────┬────────┴──────────┬──────────────┘
         │                 │                   │
         ▼                 ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                   AI EXTRACTION                              │
│           (Extract places, descriptions, tips)               │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                   VECTOR DATABASE                            │
│              (Embeddings for semantic search)                │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                   SEARCH & RANKING                           │
│         (Semantic search + filters + personalization)        │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Content Ingestion Pipeline

```python
# packages/ai-agents/discovery/ingestion.py
from langchain.chat_models import ChatOpenAI
from langchain.embeddings import OpenAIEmbeddings
from youtube_transcript_api import YouTubeTranscriptApi
import httpx
from bs4 import BeautifulSoup

class DiscoveryIngestionPipeline:
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4-turbo-preview")
        self.embeddings = OpenAIEmbeddings()
        self.vector_db = PineconeClient()

    async def ingest_blog(self, url: str, region: str):
        """Ingest places from a travel blog"""

        # Scrape content
        async with httpx.AsyncClient() as client:
            response = await client.get(url)
            soup = BeautifulSoup(response.text, 'html.parser')

            # Extract main content
            content = self._extract_blog_content(soup)

        # Extract places using LLM
        places = await self._extract_places(content, source_type="blog", source_url=url)

        # Generate embeddings and store
        for place in places:
            await self._store_place(place, region)

    async def ingest_youtube(self, video_id: str, region: str):
        """Ingest places from YouTube video transcript"""

        try:
            # Get transcript (supports multiple languages)
            transcript_list = YouTubeTranscriptApi.list_transcripts(video_id)

            # Try to get transcript in regional language first, then English
            transcript = None
            for lang in ['hi', 'kn', 'ta', 'te', 'ml', 'en']:
                try:
                    transcript = transcript_list.find_transcript([lang])
                    break
                except:
                    continue

            if not transcript:
                return

            text = ' '.join([t['text'] for t in transcript.fetch()])

            # Extract places
            places = await self._extract_places(
                text,
                source_type="youtube",
                source_url=f"https://youtube.com/watch?v={video_id}"
            )

            for place in places:
                await self._store_place(place, region)

        except Exception as e:
            print(f"Error processing YouTube video: {e}")

    async def _extract_places(
        self,
        content: str,
        source_type: str,
        source_url: str
    ) -> List[Dict]:
        """Use LLM to extract places from content"""

        prompt = f"""
        Extract travel-worthy places mentioned in this content.

        For each place, provide:
        1. Name (in English and local language if mentioned)
        2. Type (restaurant, cafe, viewpoint, temple, hidden_gem, local_market, etc.)
        3. Description (what makes it special)
        4. Location hints (area, nearby landmarks)
        5. Best time to visit
        6. Local tip (if mentioned)
        7. Price indication (if mentioned)

        Only extract places that:
        - Are specific locations (not general areas)
        - Have enough detail to be useful
        - Seem authentic/recommended (not ads)

        Content:
        {content[:8000]}

        Return as JSON array.
        """

        response = await self.llm.ainvoke(prompt)
        places = self._parse_places_response(response.content)

        # Add source info
        for place in places:
            place['source'] = source_type
            place['source_url'] = source_url

        return places

    async def _store_place(self, place: Dict, region: str):
        """Store place with embedding in vector DB"""

        # Create rich text for embedding
        embed_text = f"""
        {place['name']}
        Type: {place.get('type', 'attraction')}
        Description: {place.get('description', '')}
        Location: {place.get('location_hints', '')}
        Best time: {place.get('best_time', '')}
        Local tip: {place.get('local_tip', '')}
        """

        # Generate embedding
        embedding = await self.embeddings.aembed_query(embed_text)

        # Store in vector DB
        await self.vector_db.upsert(
            vectors=[{
                'id': place.get('id', str(uuid.uuid4())),
                'values': embedding,
                'metadata': {
                    **place,
                    'region': region,
                    'indexed_at': datetime.utcnow().isoformat(),
                }
            }]
        )
```

### 5.3 Semantic Search

```python
# packages/ai-agents/discovery/search.py
class HyperlocalSearch:
    def __init__(self):
        self.embeddings = OpenAIEmbeddings()
        self.vector_db = PineconeClient()

    async def search(
        self,
        query: str,
        location: Dict,
        filters: Dict = None,
        limit: int = 20
    ) -> List[Dict]:
        """Semantic search for places"""

        # Generate query embedding
        query_embedding = await self.embeddings.aembed_query(query)

        # Build filter
        filter_dict = {}
        if filters:
            if filters.get('type'):
                filter_dict['type'] = {'$in': filters['type']}
            if filters.get('price_level'):
                filter_dict['price_level'] = {'$lte': filters['price_level']}

        # Search vector DB
        results = await self.vector_db.query(
            vector=query_embedding,
            top_k=limit * 2,  # Get more for re-ranking
            filter=filter_dict,
            include_metadata=True,
        )

        # Re-rank by distance if location provided
        if location:
            results = self._rank_by_distance(results, location)

        return results[:limit]

    async def get_recommendations(
        self,
        user_preferences: Dict,
        current_location: Dict,
        time_of_day: str,
        already_visited: List[str] = None
    ) -> List[Dict]:
        """Get personalized recommendations"""

        # Build recommendation query from preferences
        query_parts = []

        if user_preferences.get('interests'):
            query_parts.extend(user_preferences['interests'])

        if time_of_day == 'morning':
            query_parts.append('breakfast cafe morning')
        elif time_of_day == 'afternoon':
            query_parts.append('lunch restaurant activity')
        elif time_of_day == 'evening':
            query_parts.append('dinner sunset viewpoint nightlife')

        query = ' '.join(query_parts)

        # Search
        results = await self.search(
            query=query,
            location=current_location,
            filters={'price_level': user_preferences.get('budget_level', 3)}
        )

        # Filter out already visited
        if already_visited:
            results = [r for r in results if r['id'] not in already_visited]

        return results
```

---

## Phase 6: Cinematic Memories (Weeks 19-20)

### 6.1 Narrative Generation Engine

```python
# packages/ai-agents/memories/narrative_engine.py
from langchain.chat_models import ChatOpenAI
from openai import OpenAI
import json

class CinematicMemoriesEngine:
    def __init__(self):
        self.llm = ChatOpenAI(model="gpt-4-turbo-preview")
        self.vision_client = OpenAI()

    async def generate_trip_story(self, trip_id: str) -> Dict:
        """Generate a cinematic narrative from trip data"""

        # Gather all trip data
        trip = await self.db.get_trip(trip_id)
        photos = await self.db.get_trip_photos(trip_id)
        itinerary = await self.db.get_trip_itinerary(trip_id)
        chat_highlights = await self._get_chat_highlights(trip_id)

        # Analyze photos
        photo_analyses = await self._analyze_photos(photos)

        # Build timeline
        timeline = self._build_timeline(photos, itinerary, photo_analyses)

        # Generate narrative structure
        narrative = await self._generate_narrative(
            trip=trip,
            timeline=timeline,
            highlights=chat_highlights,
            photo_analyses=photo_analyses
        )

        return {
            'title': narrative['title'],
            'chapters': narrative['chapters'],
            'duration_seconds': narrative['estimated_duration'],
            'music_suggestions': narrative['music'],
        }

    async def _analyze_photos(self, photos: List[Dict]) -> List[Dict]:
        """Analyze photos using vision model"""

        analyses = []

        for photo in photos:
            response = self.vision_client.chat.completions.create(
                model="gpt-4-vision-preview",
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "text",
                                "text": """Analyze this travel photo:
                                1. What's happening in this photo?
                                2. What emotions are visible? (joy, wonder, peace, excitement, etc.)
                                3. Is this a group shot, landscape, food, activity, or selfie?
                                4. Rate the photo quality (1-10)
                                5. What makes this moment special?

                                Return as JSON."""
                            },
                            {
                                "type": "image_url",
                                "image_url": {"url": photo['url']}
                            }
                        ]
                    }
                ],
                max_tokens=500
            )

            analysis = json.loads(response.choices[0].message.content)
            analysis['photo_id'] = photo['id']
            analysis['timestamp'] = photo['captured_at']
            analyses.append(analysis)

        return analyses

    async def _generate_narrative(
        self,
        trip: Dict,
        timeline: List[Dict],
        highlights: List[Dict],
        photo_analyses: List[Dict]
    ) -> Dict:
        """Generate story narrative using LLM"""

        prompt = f"""
        Create a cinematic narrative for this trip to {trip['destination']}.

        Trip dates: {trip['start_date']} to {trip['end_date']}
        Group size: {len(trip.get('members', []))} people

        Timeline of moments:
        {json.dumps(timeline, indent=2)}

        Photo emotions detected:
        {self._summarize_emotions(photo_analyses)}

        Chat highlights:
        {json.dumps(highlights, indent=2)}

        Create a story structure with:

        1. **Opening** (10-15 seconds)
           - Set the scene
           - Build anticipation
           - Suggested photos: establishing shots, departure

        2. **Journey** (main content, varies)
           - Key experiences by day
           - Emotional peaks
           - Group moments
           - Each chapter: 15-30 seconds

        3. **Climax** (15-20 seconds)
           - The highlight moment
           - Most emotional photos
           - Peak of the trip

        4. **Resolution** (10-15 seconds)
           - Reflection
           - Final group shot
           - Closing sentiment

        For each chapter provide:
        - Title
        - Narration text (2-3 sentences, conversational, emotional)
        - Which photo IDs to use
        - Mood (for music selection)
        - Transition style (fade, slide, zoom)
        - Duration in seconds

        Also suggest:
        - Overall title for the video
        - Music mood for each chapter (upbeat, reflective, adventurous, etc.)
        """

        response = await self.llm.ainvoke(prompt)
        return self._parse_narrative_response(response.content)

    def _summarize_emotions(self, analyses: List[Dict]) -> str:
        """Summarize detected emotions across photos"""
        emotions = {}
        for a in analyses:
            for emotion in a.get('emotions', []):
                emotions[emotion] = emotions.get(emotion, 0) + 1

        sorted_emotions = sorted(emotions.items(), key=lambda x: x[1], reverse=True)
        return ', '.join([f"{e[0]} ({e[1]})" for e in sorted_emotions[:5]])
```

---

## Deployment Strategy

### Docker Configuration

```dockerfile
# apps/api/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Run with uvicorn
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose (Development)

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: ./apps/api
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=redis://redis:6379
      - OPENAI_API_KEY=${OPENAI_API_KEY}
    depends_on:
      - redis
    volumes:
      - ./apps/api:/app

  redis:
    image: redis:alpine
    ports:
      - "6379:6379"

  web:
    build: ./apps/web
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Production Deployment

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-api:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Railway
        uses: bervProject/railway-deploy@main
        with:
          railway_token: ${{ secrets.RAILWAY_TOKEN }}
          service: tripguard-api

  deploy-web:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./apps/web
```

---

## Cost Estimates

### Monthly Infrastructure Costs

| Service | Tier | Cost (USD) |
|---------|------|------------|
| **Supabase** | Pro | $25 |
| **Vercel** | Pro | $20 |
| **Railway** (API hosting) | Usage | $20-50 |
| **Redis** (Upstash) | Pay-as-you-go | $10-30 |
| **OpenAI API** | Usage | $100-500 |
| **Google Maps** | Usage | $50-200 |
| **Pinecone** | Starter | $70 |
| **Firebase** (FCM) | Free tier | $0 |
| **Twilio** (SMS) | Usage | $20-50 |
| **AWS S3** | Usage | $10-30 |
| **Domain + SSL** | Annual | $15/year |

### Estimated Monthly Total

| Stage | Users | Cost |
|-------|-------|------|
| **Development** | 0 | $100-150 |
| **Beta** | 100-500 | $200-400 |
| **Launch** | 1,000-5,000 | $400-800 |
| **Growth** | 10,000+ | $800-2,000+ |

---

## Timeline Summary

| Phase | Weeks | Key Deliverables |
|-------|-------|------------------|
| **1. Foundation** | 1-4 | Auth, users, trips, mobile app shell |
| **2. Signal-Cleanse** | 5-8 | Group chat, WhatsApp import, AI decision extraction |
| **3. Safety Sentinel** | 9-12 | Location tracking, anomaly detection, alerts |
| **4. Elastic Itinerary** | 13-16 | AI planner, real-time optimizer |
| **5. Discovery** | 17-18 | Hyperlocal search, content ingestion |
| **6. Cinematic Memories** | 19-20 | Photo analysis, narrative generation |
| **7. Polish & Launch** | 21-24 | Testing, optimization, beta launch |

---

## Getting Started

### Immediate Next Steps

1. **Set up development environment**
   ```bash
   git clone <repo>
   cd tripguard
   npm install
   ```

2. **Create Supabase project**
   - Go to supabase.com
   - Create new project
   - Run database schema

3. **Set up environment variables**
   - Copy `.env.example` to `.env`
   - Add API keys

4. **Start development**
   ```bash
   npm run dev
   ```

---

## Team Responsibilities

| Member | Primary Focus |
|--------|--------------|
| **Yashas N** | Backend API, AI Agents |
| **Naveen G P** | Mobile App (React Native) |
| **Jeeth K** | Web App (Next.js), UI/UX |
| **Shrajan Prabhu** | Infrastructure, DevOps, Testing |

---

*Document created for Team ForgeX - Whackiest'25 IDEATHON*
*Ramaiah Institute of Technology, Department of CSE*
