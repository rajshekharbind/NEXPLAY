# NEXPLAY — Unified Entertainment Platform

> **Brand Identity:** *One Account. Every Entertainment Destination.*  
> **Mission:** Unified entertainment discovery, subscription tracking, and intelligent AI navigation across 40+ streaming, music, video, anime, and podcast services.

---

## 🌟 Key Features

1. **One Account & Universal Profile:** Single identity to discover content across global and regional entertainment providers.
2. **Universal 40+ Platform Directory:** Pre-seeded with 43+ services across 6 distinct categories (OTT & Movies, Music & Audio, Video & Creators, Anime & Animation, Audiobooks & Podcasts, Personal Media).
3. **Where to Watch & Listen:** Instant resolution of streaming availability (Subscription, Free, Rent, Buy) with verified official deep links.
4. **AI Entertainment Copilot & MCP Tools:** Natural language recommendations, contextual discovery, and standardized Model Context Protocol (MCP) server integration.
5. **Subscription Intelligence & Credit Wallet:** Transparent usage-based billing for premium AI features and monthly spending tracking.

---

## 🏗️ 6-Layer Modular Architecture

- **Layer 1: Frontend Web App** — Next.js 14+, React 18, TypeScript, Tailwind CSS, Lucide icons, Dark Cinematic Theme.
- **Layer 2: API & Gateway** — FastAPI, Pydantic v2, CORS Middleware, SlowAPI Rate Limiting, Versioned Router (`/api/v1`).
- **Layer 3: Core Domain Services** — Platforms, Content, Watchlist, Subscriptions, Credit Wallet, Audit Logging.
- **Layer 4: AI & Automation** — LangGraph, Anthropic Model Context Protocol (MCP), Playwright Health Checks.
- **Layer 5: Database & Cache** — PostgreSQL 15+, SQLAlchemy 2.0 Async, Alembic Migrations, Redis 7+ Cache.
- **Layer 6: External Integrations** — Official platform deep links, TMDB metadata, Spotify Web API, YouTube v3, Razorpay / Stripe.

---

## 📂 Project Structure

```
NEXPLAY/
├── backend/
│   ├── alembic/              # Database migration versions and environment
│   ├── app/
│   │   ├── api/v1/           # API routes (health, platforms, auth, etc.)
│   │   ├── core/             # Configuration, logging, security
│   │   ├── db/               # SQLAlchemy engine, base model, seeds
│   │   ├── models/           # Declarative DB models (User, Platform, Content, Billing, AI)
│   │   └── schemas/          # Pydantic v2 request/response validation schemas
│   ├── tests/                # Pytest async test suite
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── app/                  # Next.js App Router (cinematic layout, dashboard, directory)
│   ├── components/           # Reusable UI components (Navbar, Sidebar)
│   ├── lib/                  # API client & utility helpers
│   ├── types/                # TypeScript interfaces
│   ├── Dockerfile
│   └── package.json
├── infrastructure/
│   ├── nginx/                # Reverse proxy configuration
│   └── docker/
├── docker-compose.yml        # Multi-container orchestration (PostgreSQL, Redis, Backend, Frontend)
├── .env.example
├── .gitignore
└── README.md
```

---

## 🚀 Quickstart & Local Development

### 1. Prerequisites
- **Python 3.10+**
- **Node.js 18+ & npm / pnpm**
- **Docker & Docker Compose** (Optional for containerized run)

### 2. Backend Setup
```bash
cd backend
python -m venv .venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt

# Run backend development server
uvicorn app.main:app --reload --port 8000
```
- Interactive API Docs: `http://localhost:8000/docs`
- Health Diagnostic: `http://localhost:8000/api/v1/health`
- Platforms Directory API: `http://localhost:8000/api/v1/platforms`

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
- Open `http://localhost:3000` to access the NEXPLAY dashboard.

### 4. Running with Docker Compose
```bash
docker-compose up --build
```

### 5. Running Backend Automated Tests
```bash
cd backend
.venv\Scripts\pytest tests -v
```

---

## 📜 10-Phase Roadmap Summary

- [x] **Phase 1: Foundation & Setup** — Complete project scaffolding, dual database config (Postgres/SQLite), Alembic migrations, 40+ platforms database seed, Next.js 14 dark theme UI, health API, and test suite.
- [ ] **Phase 2: Authentication & RBAC** — JWT rotation, password hashing, user profiles, role enforcement.
- [ ] **Phase 3: Platform Catalog & Admin** — Admin CRUD for platforms, category management.
- [ ] **Phase 4: Content Catalog & Search** — Multi-category search engine, availability indicators.
- [ ] **Phase 5: Dashboard & Watchlist** — Personalized dashboard, private user watchlists, deep linking.
- [ ] **Phase 6: AI Recommendation Engine** — LangGraph copilot, semantic vector recommendations.
- [ ] **Phase 7: MCP Server & Tools** — Anthropic Model Context Protocol server exposing 10+ entertainment tools.
- [ ] **Phase 8: Playwright Automation & Celery** — Deep link audits, background task workers.
- [ ] **Phase 9: Billing & Credit Wallet** — Razorpay payment integration, credit balance management, usage metering.
- [ ] **Phase 10: DevOps, Production CI/CD & Testing** — Security auditing, E2E tests, cloud deployment.
