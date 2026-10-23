# HireGrid Platform-Specific Content Control & Deployment Guide

## 1. Overview & How It Works

HireGrid supports granular content targeting across **Web**, **Mobile App**, and **Both** for 8 core content tables:
1. `companies`
2. `branches`
3. `hierarchy_nodes`
4. `modules`
5. `plans`
6. `revision_modules`
7. `exams`
8. `placement_mission_cycles`

### Architecture & Amendments Summary
- **Content Filtering (A1, A3, A4)**:
  - Whitelist of 8 tables only.
  - When `x-platform: web` is sent, only rows where `platform IN ('web', 'both')` are returned.
  - When `x-platform: app` is sent, only rows where `platform IN ('app', 'both')` are returned.
  - Missing `x-platform` header: defaults to `"app"` for content filtering (supporting older mobile app builds seamlessly).
  - Admin & Content Manager: Bypass platform filtering based on verified JWT role (`admin` or `content_manager`).
- **Device-Limit Security (A2)**:
  - Device-limit check bypass on login requires **BOTH**:
    1. Header `x-platform: app`
    2. Header `x-app-key: <APP_API_KEY>` matching the backend environment variable verified using constant-time `crypto.timingSafeEqual`.
  - If `APP_API_KEY` is missing on the server, or the key sent does not match, the request is treated as web and the device limit is strictly enforced.
- **Hierarchical Parent-Child Visibility (A5)**:
  - A child item (e.g., module under subject/topic/company/branch) is visible on a platform only if its own platform matches AND all ancestor nodes in its hierarchy match.
- **Student History Preservation (A6)**:
  - Past attempts, scores, leaderboards, and transactions are never hidden. If an item changes from `both` to `web`, a student on the mobile app can still view their historical score and certificate.
- **Cache Isolation (A8)**:
  - Cache keys are scoped by platform and role group: `cache:${platform}:${roleGroup}:${url}`.
  - Responses include `Vary: x-platform, x-app-key`.

---

## 2. Environment Variables & App Build

### Backend (Render Environment)
Add the following secret environment variable in Render Dashboard under Service Settings:
- `APP_API_KEY`: A secure random 64-character hex string (e.g., generated with `openssl rand -hex 32`).

### Flutter Mobile App Build
When compiling the release build of Flutter for Android (APK/AAB) or iOS, pass the key via `--dart-define`:

```bash
# Debug / Local Run
flutter run --dart-define=APP_API_KEY=your_generated_app_api_key

# Android Release Bundle (AAB for Play Store)
flutter build appbundle --release --dart-define=APP_API_KEY=your_generated_app_api_key

# Android Release APK
flutter build apk --release --dart-define=APP_API_KEY=your_generated_app_api_key

# iOS Release
flutter build ipa --release --dart-define=APP_API_KEY=your_generated_app_api_key
```

*Note on Security (Amendment A2)*: Using `--dart-define=APP_API_KEY` embeds the secret into compiled binary code, preventing casual header spoofing via web browsers or cURL. It does not replace full binary obfuscation, but satisfies zero-bypass requirements.

---

## 3. Strict Deployment Order

Follow this exact sequential order when deploying to production:

### Step 1: Backup & Snapshot Pre-migration Counts
1. Create a Neon database branch or run custom pg_dump backup:
   ```bash
   ./scripts/backup.sh
   ```
2. Run `scripts/verify_counts.sql` against the database and save the output table:
   ```bash
   psql "$DATABASE_URL" -f scripts/verify_counts.sql > pre_migration_counts.txt
   ```

### Step 2: Run Additive Migration on Production Database
Run the idempotent migration transaction:
```bash
psql "$DATABASE_URL" -f migrations/migration_v8_platform_control.sql
```
*Guarantees*: Additive only (`DEFAULT 'both'`), zero existing data lost, wrapped in a single transaction.

### Step 3: Run Verification Script & Compare Counts
```bash
psql "$DATABASE_URL" -f scripts/verify_platform_migration.sql
psql "$DATABASE_URL" -f scripts/verify_counts.sql > post_migration_counts.txt
diff pre_migration_counts.txt post_migration_counts.txt
```
*Expected*:
- Zero rows with `platform != 'both'`.
- All check constraints present.
- Every table row count matches `pre_migration_counts.txt` exactly.

### Step 4: Deploy Backend to Render & Configure Environment Variable
1. In Render Dashboard, set `APP_API_KEY=<secure_token>`.
2. Deploy the latest `hire_grid_backend` code.
3. Verify `/health` and `/ready` endpoints respond with HTTP 200.

### Step 5: Deploy React Web & Admin to Vercel
1. Deploy `hire_grid` to Vercel.
2. Verify Admin panel loads:
   - Check Companies, Branches, Hierarchy, Modules, Plans, Placement Missions, Revision Modules.
   - Test the "Show on" selector (Web / App / Both) and platform filter tabs.

### Step 6: Release the Flutter Mobile App
1. Build release binaries with `--dart-define=APP_API_KEY=<same_token_as_render>`.
2. Distribute via Google Play Console / Apple TestFlight.
3. Test login: verify device limit is bypassed on trusted app login.

---

## 4. Rollback Plan

If any issue arises during deployment:

### Rollback Step 1: React Web & Admin (Vercel)
- In Vercel Dashboard -> Deployments -> Redeploy previous production release.

### Rollback Step 2: Backend (Render)
- In Render Dashboard -> Rollback to previous deployment.

### Rollback Step 3: Database Migration
If the migration itself needs to be rolled back:
```bash
psql "$DATABASE_URL" -f migrations/rollback_v8_platform_control.sql
```
*Guarantees*: Safely drops only the `platform` columns and check constraints from the 8 tables. No other columns or tables are touched.
