# HireGrid Keep-Alive & Cold Start Strategy

This document outlines the architecture, trade-offs, and procedures for keeping the HireGrid backend and database warm on free-tier infrastructure.

---

## 1. The Problem with Free Tiers

1. **Render Free Tier (Web Services)**:
   - Spins down the Node.js/Express server process after **~15 minutes** of no incoming web traffic.
   - The first request after sleep takes **15–30 seconds** (cold start) while Render provisions compute resources.
2. **Neon Serverless PostgreSQL Free Tier**:
   - Suspends the database compute engine after **~5 minutes** of no active SQL queries.
   - The first query after compute suspension incurs a **500ms–2.5s** wake-up latency.

---

## 2. Implemented Architecture & Keep-Alive Strategy

### A. Lightweight Backend Keep-Alive (`/health` & `/ping`)
- **Endpoint**: `GET /health` or `GET /ping`
- **Behavior**: Instantly responds with `200 OK` (JSON: `{ status: "ok" }`) without executing any SQL queries or accessing the database.
- **Purpose**: Pings the Node.js process every 14 minutes to keep Render awake **without consuming Neon free compute hours**.

### B. Database Keep-Warm Endpoint (`/ready`)
- **Endpoint**: `GET /ready`
- **Behavior**: Executes `SELECT 1` against the PostgreSQL database.
- **Trade-off Note**: Neon free tier provides **100 compute-hours/month**. Continuously pinging the database every minute would burn ~720 compute-hours, which exceeds the free tier quota. Therefore, keep-alive jobs should **only ping `/health`**, while `/ready` is reserved for readiness probes and user-initiated connections.

### C. Connection Pooling & Exponential Backoff
- The database connection string automatically routes to Neon's **pooled endpoint** (`-pooler.neon.tech`).
- Query/connection wrappers in `src/config/database.js` retry on socket drop/sleep with exponential backoff (`300ms`, `700ms`, `1500ms`).

### D. Server-Side Request Timeout & Response Caching
- **Timeout Middleware**: Caps request execution at 18 seconds, returning a structured `504 SERVER_TIMEOUT` JSON before upstream gateway timeouts occur.
- **In-Memory Cache**: Automatically caches read-heavy endpoints (`/api/branches/active`, `/api/plans`, `/api/companies`, `/api/modules`, `/api/stats`) with TTL and cache invalidation on write methods.

### E. Frontend Cold-Start Aware UX
- If any request exceeds 3 seconds, a friendly notice informs the user: *"Waking up the server, this may take up to 20 seconds..."*.
- Skeleton loaders (`DashboardSkeleton`, `CompanyCardSkeleton`, `PlanCardSkeleton`, `TableSkeleton`) prevent layout flickering and empty state flashes.

---

## 3. GitHub Actions Cron Setup

A scheduled workflow is provided in [`.github/workflows/keep_alive.yml`](.github/workflows/keep_alive.yml) which runs every 14 minutes.

### Setting the Secret:
1. Navigate to your GitHub repository: **Settings > Secrets and variables > Actions**.
2. Click **New repository secret**.
3. Name: `BACKEND_URL`
4. Value: `https://your-backend-app.onrender.com` (your live Render backend URL).

---

## 4. How to Disable Keep-Alive When Upgrading to Paid Tiers

If you upgrade to Render Paid / Starter tier ($7/mo) or Neon Paid compute:
1. In your GitHub repository, go to the **Actions** tab.
2. Select **Render Backend Keep-Alive** workflow.
3. Click the **...** menu on the right and select **Disable workflow**.
4. Since paid Render instances do not sleep, the `/health` keep-alive cron is no longer necessary.
