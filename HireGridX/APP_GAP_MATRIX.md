# APP_GAP_MATRIX.md — Mobile Parity Gap Matrix & Implementation Plan

| Web Feature / Page | Mobile Current State | Gap / Missing Elements | Planned Mobile Treatment |
|---|---|---|---|
| **Global Header** | Header with notification icon | Missing Streak pill, Medal/Rank tier pill, User info chip with initials | Add compact telemetry header row on Home & Profile with Streak (`🔥 X Day Streak`), Medal (`🎖️ Bronze V`), and Avatar Initial chip. |
| **Dashboard Stats** | Shows XP and Streak stat chips only | Missing Enrolled Courses, Tests Attempted, Average Score, Platform Rank stats (web has 5) | Implement complete 5-card telemetry row: Enrolled Courses, Tests Attempted, Average Score (%), XP Earned, Platform Rank (`#--` / `Top X%`). |
| **Dashboard Modules** | Shows static Continue Learning module | Missing real branch-scoped continue learning deck with progress bar & empty state message | Wire Continue Learning deck to real user branch modules with completion progress & "Continue"/"Retake" CTA. |
| **Dashboard Progress** | Shows static 48% progress card | Missing dynamic overall progress ring (% completed of available modules) and XP Level progression bar with medal tier thresholds | Calculate real overall completion ring + XP progress bar (e.g. `0 / 1000 XP`) with `getMedalTier` formula. |
| **Dashboard Missions** | Static banner with "View Mission" | Missing Active Placement Missions preview card with cycle countdown timer and empty state | Display real active cycle missions preview with countdown timer and participate CTA. |
| **Company Exams** | Only a horizontal row on Dashboard | Missing first-class directory grid with `PAID` / `UNLOCKED` / `FREE` tags, search, and disclaimer card | Upgrade Company Exams to a primary destination with 2-column directory grid, `UNLOCKED` (green) / `PAID` (lock) tags, criteria disclaimer card, and MODULE-1..MODULE-N list with pass %, Qs, mins, and Start/Retake buttons. |
| **Placement Mission** | Leaderboard with Weekly/Monthly chips and "pts" | Web has `Missions` \| `Leaderboard` toggle, active cycle name, `PREMIUM CONTENT LOCKED` card for free students, and leaderboard with Rank Badges (🥇 Gold, 🥈 Silver, 🥉 Bronze, ⭐ Runner-Up, 🎖️ Top 10) and `XP` score | Add `Missions` \| `Leaderboard` toggle, cycle name badge, locked premium card with upgrade CTA for free users, and leaderboard with rank badges, student names, XP scores, and pinned current user. |
| **Premium Plans** | Plans screen with 3 hardcoded tabs | Missing real plan entitlements list (Learning Entitlements, Company Prep Modules, Demo tests) and full payment proof flow | Fetch live plans from `GET /api/plans`, show real entitlements, active plan subscription badge, and full Subscribe -> Payment Proof flow (UPI/QR, UTR/Transaction ID, screenshot upload, pending state). |
| **Operator Profile** | Profile screen with basic stats | Missing full Performance Summary (Modules completed, Average Accuracy %, Rank Level Medal, Plan status) and Operator Profile Settings form (Semester dropdown, Switch Specialty modal/list, College, Graduation Year, University) | Implement 2-part Profile view with Performance Summary telemetry card, XP Rank & Streak boxes, and complete settings form with "Switch Specialty" branch selector saving to backend. |
| **Send Feedback** | Partial screen in settings | Needs web-matching category dropdown (`General`, `Bug`, `Improvement`, `Feature`), message textarea, and submission to `POST /api/feedbacks` | Implement dedicated Send Feedback page with category selector, textarea, loading/success states, and direct submission to `/api/feedbacks`. |
| **Exam Engine** | Functional basic engine | Ensure timer, question palette, mark for review, violation count on backgrounding, auto-submit, results breakdown (Score, Accuracy, Correct/Wrong/Unattempted, XP Earned), and score updates are in 100% parity with web | Verify and refine exam engine with anti-cheat backgrounding counter, answer debounced sync, review palette, and comprehensive result summary with XP gains. |
| **Terminology** | "pts", "Modules" | Inconsistent naming | Use web-exact terminology: `XP`, `Branches`, `Company Exams`, `Placement Mission`, `Bronze V` to `Conqueror` medals, `PAID` / `UNLOCKED`, `Retake Exam`. |

---

## Navigation Architecture Plan
- **5-Tab Bottom Navigation**:
  1. **Home** (`/home`): Dashboard with 5 Telemetry Stats, Continue Learning deck, Progress Ring + XP Bar, Active Missions preview, Quick Actions, Motivation card.
  2. **Learn** (`/learn`): Branches Hierarchy (`BRANCHES ▸ <BRANCH> ▸ <SUBJECT> ▸ <MODULES>`) with breadcrumbs and My Progress view.
  3. **Companies** (`/companies`): Company Exams Directory with `PAID`/`UNLOCKED` tags, search, and Company Detail with disclaimer & assessment modules.
  4. **Missions** (`/missions`): Placement Mission (`Missions` \| `Leaderboard`), Active Cycle label, Locked Premium card for free students, Leaderboard with medals/badges & XP.
  5. **Profile** (`/profile`): Operator Profile with Performance Summary, XP Rank & Streak, Settings Form, Switch Specialty, Plans/Subscription link, Send Feedback link, Device Management, Logout.
- **Plans & Upgrade Flow**:
  - Reachable from prominent Upgrade banners, locked company/mission cards, and Profile → Subscription.
  - Full Payment Proof submission modal/screen with transaction ID and image upload.
