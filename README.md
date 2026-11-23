# NEXPLAY — Unified Entertainment Platform

> **Brand Identity:** *One Account. Every Entertainment Destination.*  
> **Mission:** Unified entertainment discovery, subscription tracking, and intelligent AI navigation across 40+ streaming, music, video, anime, and podcast services.

---
<img width="1888" height="975" alt="image" src="https://github.com/user-attachments/assets/ea1b7da8-c0dc-4bce-a8e6-096511848727" />

<img width="1897" height="941" alt="image" src="https://github.com/user-attachments/assets/90d8796c-3697-4eec-b567-3c5b35ecab15" />
<img width="1890" height="945" alt="image" src="https://github.com/user-attachments/assets/2c38b954-c930-4328-966e-b58ed36cbc73" />
<img width="1902" height="975" alt="image" src="https://github.com/user-attachments/assets/f56a3033-afbb-4586-bddb-1ada0744d676" />
<img width="1906" height="980" alt="image" src="https://github.com/user-attachments/assets/3f67a399-cca2-4280-8102-929073578006" />

<img width="1897" height="976" alt="image" src="https://github.com/user-attachments/assets/ba4dd6ba-1031-4ff1-852d-2e07ebecc8e3" />
<img width="1887" height="968" alt="image" src="https://github.com/user-attachments/assets/11e415f7-cb48-4e10-a555-cc331ff24b18" />
<img width="1900" height="975" alt="image" src="https://github.com/user-attachments/assets/5778043a-3e6e-4f17-8b5a-df47c1d3d846" />
<img width="1833" height="977" alt="image" src="https://github.com/user-attachments/assets/76152122-6628-4c07-957c-054621ccedd2" />
<img width="1885" height="981" alt="image" src="https://github.com/user-attachments/assets/b2baeb1f-1533-4938-b82b-1dd113d9393d" />
<img width="1897" height="975" alt="image" src="https://github.com/user-attachments/assets/50552423-28c2-4e3d-94dc-ad59f0c63989" />
<img width="1892" height="978" alt="image" src="https://github.com/user-attachments/assets/f02beaeb-18dc-4d44-a378-626a83978395" />
<img width="1895" height="973" alt="image" src="https://github.com/user-attachments/assets/409d0fde-437d-44d6-b8b4-b4f4f010fc39" />


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

1. Frontend UI Routes (http://localhost:3000)
Route URL	Page Name	Description
http://localhost:3000/	Home / Landing Portal	Hero section with streaming platform ticker, featured content spotlight, and feature highlights.
http://localhost:3000/platforms	Platform Directory	Explore all 43 entertainment platforms across 6 categories (OTT, Music, Video, Anime, Podcasts, Personal Media).
http://localhost:3000/search	Unified Catalog Search	Multi-type search across movies, TV series, songs, albums, anime, and podcasts with availability badges.
http://localhost:3000/ai	AI Entertainment Copilot	Conversational AI discovery assistant with 6 mood presets, multi-factor scoring, and instant recommendations.
http://localhost:3000/mcp	MCP Tools & Playground	Model Context Protocol interactive playground, 11 native tools, and 1-click config exporter for Claude Desktop & Cursor.
http://localhost:3000/watchlist	Private Watchlists	Personal queue with 1-click bookmarking, status filters (Planned, Watching, Completed), and official deep links.
http://localhost:3000/automation	Automation & Health Sentinel	Real-time ecosystem health monitor, Playwright link verification, background worker status, and renewal alerts.
http://localhost:3000/billing	Credit Wallet & Billing	5-tab dashboard: AI burn-rate analytics, external OTT spending tracker, 4 booster packs, and 18% GST tax invoices.
http://localhost:3000/pricing	Subscription Tiers	Plan comparison matrix (Free ₹0, Starter ₹49, Plus ₹149, Pro ₹299) with simulated checkout flow.
http://localhost:3000/login	Sign In	User login with JWT authentication, credentials validation, and role redirection.
http://localhost:3000/register	Create Account	User registration with automated profile initialization and 100 welcome credits.
http://localhost:3000/profile	User Profile	Account settings, role badge (User/Premium/Admin), country preferences, and linked accounts.
http://localhost:3000/admin	Admin Dashboard	High-level system statistics, platform counts, user activity, and admin actions.
http://localhost:3000/admin/platforms	Platform Manager	Admin CRUD panel to add, edit, toggle, or re-order platform integrations and logos.

⚡ 2. Backend Interactive API Documentation (http://localhost:8000)
Documentation URL	Engine	Description
http://localhost:8000/docs	Swagger UI	Interactive OpenAPI 3.1 interface to execute and test every API endpoint directly in your browser.
http://localhost:8000/redoc	ReDoc	Clean, responsive, three-panel documentation for all schema definitions and API endpoints.
http://localhost:8000/openapi.json	OpenAPI Spec	Raw JSON schema for API code generators and Postman/Insomnia imports.

🔌 3. Backend REST API Endpoints (http://localhost:8000/api/v1)
🛡️ System & Health
GET http://localhost:8000/ — Root status
GET http://localhost:8000/api/v1/health — Full system & database health check

👤 Authentication & Profiles
POST http://localhost:8000/api/v1/auth/register — Register a new account
POST http://localhost:8000/api/v1/auth/login — Login & receive JWT access + refresh tokens
POST http://localhost:8000/api/v1/auth/refresh — Refresh access token
GET http://localhost:8000/api/v1/users/me — Get current authenticated user profile
PUT http://localhost:8000/api/v1/users/me — Update user profile & streaming preferences

📺 Entertainment Platform Directory
GET http://localhost:8000/api/v1/platforms/categories — Get 6 categories (OTT, Music, Anime, Video, Podcasts, Personal)
GET http://localhost:8000/api/v1/platforms/ — List 43 platforms (?category=ott&search=netflix)
GET http://localhost:8000/api/v1/platforms/{slug} — Platform detail by slug (e.g. netflix, spotify)

🔍 Unified Content Catalog & Deep Links
GET http://localhost:8000/api/v1/content/genres — List 14 entertainment genres
GET http://localhost:8000/api/v1/content/featured — Get featured spotlight titles
GET http://localhost:8000/api/v1/content/search — Unified search (?q=Interstellar&content_type=MOVIE)
GET http://localhost:8000/api/v1/content/{id} — Title details with direct platform streaming links

📌 Private Watchlists
GET http://localhost:8000/api/v1/watchlists — Get user's private watchlists
POST http://localhost:8000/api/v1/watchlists — Create new custom watchlist
POST http://localhost:8000/api/v1/watchlists/toggle — 1-click toggle bookmark (add/remove)
GET http://localhost:8000/api/v1/watchlists/check/{content_id} — Check if content is in watchlist
PATCH http://localhost:8000/api/v1/watchlists/items/{item_id} — Update item status (WATCHING, COMPLETED, etc.)
DELETE http://localhost:8000/api/v1/watchlists/items/{item_id} — Remove item from watchlist

🧠 AI Recommendation Copilot
GET http://localhost:8000/api/v1/ai/moods — Get 6 preset moods (chill, hyped, mind-blown, etc.)
POST http://localhost:8000/api/v1/ai/recommend — Multi-factor scoring recommendation search
POST http://localhost:8000/api/v1/ai/chat — Conversational AI Copilot with follow-ups & credit deductions
GET http://localhost:8000/api/v1/ai/history — User recommendation history audit trail

🤖 Model Context Protocol (MCP) Server
GET http://localhost:8000/api/v1/mcp/tools — List all 11 native entertainment MCP tools
POST http://localhost:8000/api/v1/mcp/execute — Execute a native MCP tool with typed arguments
POST http://localhost:8000/api/v1/mcp/rpc — Official JSON-RPC 2.0 gateway (initialize, tools/list, tools/call)
GET http://localhost:8000/api/v1/mcp/config — JSON config snippets for Claude Desktop & Cursor

⚙️ Automation & Health Sentinel
GET http://localhost:8000/api/v1/automation/jobs — List 4 background automation worker jobs
POST http://localhost:8000/api/v1/automation/jobs/{id}/run — Manually trigger background job
GET http://localhost:8000/api/v1/automation/runs — Worker execution logs & latencies
GET http://localhost:8000/api/v1/automation/health-summary — Ecosystem health & uptime percentage
GET http://localhost:8000/api/v1/automation/platforms-health — Per-platform latency & HTTP status
GET http://localhost:8000/api/v1/automation/notifications — User notifications & renewal alerts
PATCH http://localhost:8000/api/v1/automation/notifications/{id}/read — Mark notification read
POST http://localhost:8000/api/v1/automation/notifications/read-all — Mark all notifications read

💳 Enterprise Billing & Spending Intelligence
GET http://localhost:8000/api/v1/billing/plans — List subscription plans (Free, Starter, Plus, Pro)
POST http://localhost:8000/api/v1/billing/subscribe — Subscribe or upgrade/downgrade plan
GET http://localhost:8000/api/v1/billing/subscription — User active subscription status
GET http://localhost:8000/api/v1/billing/credit-packs — 4 Volume booster packs
GET http://localhost:8000/api/v1/billing/analytics — AI credit burn runway & 7-day usage trends
POST http://localhost:8000/api/v1/billing/checkout/order — Create payment checkout order
POST http://localhost:8000/api/v1/billing/checkout/verify — Verify gateway payment & grant credits
GET http://localhost:8000/api/v1/billing/payments — Payment history records
GET http://localhost:8000/api/v1/billing/payments/{id}/invoice — Itemized 18% GST Tax Invoice
GET http://localhost:8000/api/v1/billing/transactions — Credit ledger transactions log
POST http://localhost:8000/api/v1/billing/add-credits — Instant credit top-up
GET http://localhost:8000/api/v1/billing/connected-services — Tracked external OTT subscriptions
POST http://localhost:8000/api/v1/billing/connected-services — Track new external subscription (Netflix, Spotify, etc.)
DELETE http://localhost:8000/api/v1/billing/connected-services/{id} — Untrack external subscription
GET http://localhost:8000/api/v1/billing/spending-summary — Entertainment budget & AI savings recommendations

🛠️ Admin Management (Requires ADMIN Role)
GET http://localhost:8000/api/v1/admin/stats — Admin ecosystem metrics
POST http://localhost:8000/api/v1/admin/platforms — Create new platform
PUT http://localhost:8000/api/v1/admin/platforms/{id} — Update platform details & deep link URLs
DELETE http://localhost:8000/api/v1/admin/platforms/{id} — Deactivate/delete platform

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
