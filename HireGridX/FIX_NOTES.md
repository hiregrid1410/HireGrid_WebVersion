# FIX_NOTES.md — Root Cause Analysis & Plan

## Problem 1: Slow Data Fetching
- **Measured Latency**:
  - Live Render endpoint: DNS ~2ms, Connect ~190ms, TTFB ~600ms - 1.2s when warm; ~3-4s when cold.
  - Network roundtrip is healthy (~800ms average), but screens were slow because:
    1. Redundant network fetches: Riverpod providers didn't have caching (`keepAlive` / cache-first), so every tab switch triggered refetches.
    2. Splash screen had an arbitrary `Future.delayed(1800ms)` followed by sequential token read and `loadUser()` without a warm-up ping for Render cold starts.
    3. `selectedBranchIdProvider` was rebuilding and recalculating branches on every read.
- **Fix**:
  1. Add fire-and-forget non-blocking warmup ping during splash to wake Render compute in parallel.
  2. Implement local cache-first strategy with SharedPreferences/in-memory cache for branches, subjects, companies, and plans.
  3. Ensure no duplicate fetches on screen reopen.

## Problem 2: Back Button / Navigation Stack
- **Root Causes**:
  1. `AppShellScreen` lacked `PopScope`. Tapping Android back button when on tab 1 (Learn), 2 (Missions), 3 (Plans), or 4 (Profile) abruptly exited the app instead of switching back to Tab 0 (Home).
  2. In `dashboard_screen.dart`, quick action buttons used `context.go('/learn')`, `context.go('/companies')`, etc., replacing the navigation stack instead of navigating within shell tabs or pushing full-screen sub-routes.
  3. In `company_detail_screen.dart` and `module_detail_screen.dart`, in-app back buttons called `context.pop()` without checking `Navigator.canPop(context)` fallback.
  4. Top-level routes like `/companies` were registered outside the shell without back-navigation handling to return to home.
- **Fix**:
  1. Wrap `AppShellScreen` in `PopScope(canPop: false, onPopInvokedWithResult: ...)`: if `currentIndex != 0`, switch to `0` (Home); if `currentIndex == 0`, allow app exit.
  2. Clean up `context.go` vs `context.push` across dashboard quick actions.
  3. Ensure drilldown stack: `Home -> Branches -> Branch -> Topic/Module -> Details -> Exam` unwinds correctly one step at a time.

## Problem 3: Rename "Module" -> "Branch" + Branch-Specific Hierarchy
- **Web Hierarchy Architecture**:
  1. Web `StudentHierarchyView` navigates:
     - Level 0: Branches (`type: general_branch`, `parentId: null`). E.g., `ELECTRICAL ENGINEERING` (`c3086a4d-4522-4b1f-922a-9bef8c2e23b0`) and `GENERAL SUBJECT` (`c86801a0-a1e6-40e5-8839-59ecb81f6ff5`).
     - Level 1: Subjects (`type: general_subject`, `parentId: branch.id`). E.g., `BASIC CONCEPTS`, `DC CIRCUITS`, `AC CIRCUIT`, `QUANTITATIVE APTITUDE`, `REASONING`.
     - Level 2: Topics or Modules (`where_parentId: subject.id`).
     - Level 3: Modules / Tests under Topic (`where_parentId: topic.id`).
  2. In the Flutter app:
     - Screen title was generically "Learning" with tabs "Modules", "Subjects", "My Progress".
     - The first tab was labeled "Modules" instead of allowing the student to browse by **Branch**.
- **Fix**:
  1. Rename user-facing concept: Student sees **Branches** list first (Electrical Engineering, General Subject).
  2. Tapping a branch opens that branch's subjects with breadcrumb navigation (`Branches ▸ ELECTRICAL ENGINEERING`).
  3. Tapping a subject shows that subject's topics/modules.
  4. Keep company test modules termed "Module" (matching web).
  5. Fetch real branch hierarchy from `/api/hierarchy-nodes` and `/api/modules`.

## Problem 4: UI Overflow
- **Hotspots identified**:
  1. `MyLearningScreen` subject grid: `GridView` had fixed `childAspectRatio: 1.1`, causing overflow on small screens or with multi-line subject names ("ELECTRICAL MEASUREMENTS AND MEASURING INSTRUMENTS").
  2. `CompanyCard` in `card_widgets.dart`: company name row used `Text` next to `TierBadge` without `Flexible`/`Expanded`, overflowing on long names like "Maruti Suzuki India Limited" and "BKT (Balkrishna Industries)".
  3. `PlansScreen`: `Row` of 3 segment buttons without auto-sizing/wrapping on small devices (320dp).
  4. `MissionsLeaderboardScreen`: tab chips row overflow on narrow screens.
  5. `LoginScreen`: Mountain silhouette and content with keyboard open could overflow if not inside `SingleChildScrollView` with proper padding.
- **Fix**:
  1. Fix `childAspectRatio` and text wrapping with `maxLines` + `TextOverflow.ellipsis`.
  2. Wrap company card title in `Expanded(child: Text(..., maxLines: 1, overflow: TextOverflow.ellipsis))`.
  3. Responsive chip/segment layouts.

## Problem 5: Logo-Only Splash Screen
- **Current State**:
  - `SplashScreen` had:
    1. Mountain silhouette background painter.
    2. Subtitle: "Learn · Practice · Get Placed".
    3. Tagline: "Better Skills, Bigger Opportunities\nYour Future, Our Mission".
    4. Active backend host debug badge.
    5. `Future.delayed(1800ms)`.
  - Android native splash (`launch_background.xml`) was plain white with no logo, causing a white-to-dark flash!
- **Fix**:
  1. Native splash: Update `launch_background.xml` and `styles.xml` to dark background matching app (`#0A0E14` / `@color/splash_background`).
  2. In-app `SplashScreen`: Show **only** the centered logo on the matte dark background. Remove mountain graphics, slogan, subtitle, host banner, progress dots.
  3. Make session check fast & local via token storage, with non-blocking Render warm-up in parallel.

## Verification & Test Results
- **Performance**:
  - Live Render cold TTFB: ~3.8s (mitigated by parallel non-blocking wake-up during splash). Warm TTFB: ~600-800ms.
  - Redundant fetches eliminated via `subjectsByBranchProvider` and `modulesBySubjectProvider` family providers and local caching.
- **Navigation**:
  - `PopScope` on `AppShellScreen`: Back on tabs 1-4 navigates to Tab 0 (Home); second Back on Home cleanly exits the app.
  - `context.push('/companies')` preserves navigation back to Dashboard.
  - In `MyLearningScreen`, inner `PopScope` unwinds `Subject -> Branch -> Branches -> Dashboard`.
- **Branch Hierarchy**:
  - Root branches fetched from `/hierarchy-nodes?where_type==:general_branch` (returns Electrical Engineering & General Subject).
  - Child subjects fetched from `/hierarchy-nodes?where_parentId==:<branchId>`.
  - Modules fetched from `/modules?where_parentId==:<subjectId>`.
  - Breadcrumbs navigate seamlessly: `BRANCHES ▸ ELECTRICAL ENGINEERING ▸ BASIC CONCEPTS`.
- **UI Overflow**:
  - `CompanyCard`: `Text(company.name)` wrapped in `Expanded` with `maxLines: 1` + `TextOverflow.ellipsis`.
  - `MyLearningScreen`: Subject cards use `childAspectRatio: 1.15`, `maxLines: 2` + `TextOverflow.ellipsis`.
  - `PlansScreen`: `_buildTrustItem` wrapped in `Expanded` with `textAlign: TextAlign.center`.
  - `MissionsLeaderboardScreen`: tab chips styled with `fontSize: 12`, `maxLines: 1` + `TextOverflow.ellipsis`.
- **Splash Screen**:
  - Native & in-app splash match at `#0A0E14` background with centered logo. All extra text, banners, and decorations removed.
  - Local session check runs in parallel with 1200ms display delay; zero-flash transition to `/home` or `/login`.
- **Build Status**:
  - `flutter analyze`: 0 errors.
  - `flutter test`: 100% tests passed.
  - `flutter build apk --debug`: Succeeded in 50.4s.

