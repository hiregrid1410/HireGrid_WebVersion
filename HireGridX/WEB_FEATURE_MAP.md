# WEB_FEATURE_MAP.md — HireGridX Web Architecture & Feature Map

## 1. Global Layout & Shell
- **Header Telemetry**:
  - Streak Pill: `Flame` icon + `"${stats.streak} Day Streak"`
  - Medal Tier Pill: `Award` icon + `"${medalInfo.fullName}"` (e.g., `Bronze V`, `Silver III`, `Gold I`, `Ace`, `Conqueror`)
  - User Chip: Avatar initial + User Name + Branch Name
- **Sidebar Destinations**:
  1. `Dashboard` (`activeTab: "dashboard"`)
  2. `My Learning` (`activeTab: "general"`)
  3. `Company Exams` (`activeTab: "companies"`)
  4. `Placement Mission` (`activeTab: "placement-mission"`)
  5. `Premium Plans` (`activeTab: "plans"`)
  6. `Send Feedback` (`activeTab: "feedback"`)
  7. `Operator Profile` (`activeTab: "profile"`)
  8. `Logout` (`signOut()`)
- **Bottom Motivation Rocket Card**:
  - `"Keep Going, {name}! 🚀"`
  - `"Consistency today, Success tomorrow. Access your modules and assignments."`

---

## 2. Page-by-Page Feature Specifications

### 2.1 Dashboard (`StudentDashboardView.jsx`)
- **Header**: `"Welcome back, {firstName}! 👋"` + `"Let's continue your learning journey."`
- **5 Telemetry Stat Cards**:
  1. **Enrolled Courses**: Count of general modules matching user's branch (`"Available modules"`)
  2. **Tests Attempted**: Count of completed module attempts (`"Completed attempts"`)
  3. **Average Score**: Mean percentage of all attempted modules (`"Overall accuracy"`)
  4. **XP Earned**: Total accumulated XP (`"Total XP accumulated"`)
  5. **Platform Rank**: User's rank string (`#${rank}` or `#--`) + `"Top 12%"` / `"Not ranked yet"`
- **Continue Learning Deck**:
  - Horizontal cards of branch modules with progress bar, question count, and `"Continue"` / `"Retake"` button.
  - Empty State: `"No active learning modules in your branch. Select a branch in profile settings."`
- **Your Progress Ring & XP Level Bar**:
  - Circular Progress: `(testsAttempted / enrolledLearning) * 100`%
  - XP Level Bar: `xpEarned / nextLevelXP XP` + Medal Full Name (e.g. `Bronze V`) + Current Level Tier Name.
- **Active Placement Missions Preview**:
  - List of active cycle missions with countdown timer, title, and `"Participate →"` button.
  - Empty State: `"No active missions for this week. Check back later for upcoming cycles."`
- **Recent Achievements**:
  - First Attempt (+50 XP), Test Taker (+75 XP), Consistent Learner (+25 XP), High Achiever (+100 XP).
- **Leaderboard Snapshot**: Top 3 ranking entries with avatars and XP, plus current user pinned if ranked below top 3.

### 2.2 My Learning (`StudentHierarchyView.jsx`)
- **Breadcrumbs Path Navigator**: `BRANCHES ▸ <BRANCH NAME> ▸ <SUBJECT NAME>`
- **Level 0 (Branches)**:
  - Fetches `/api/hierarchy-nodes?where_type==:general_branch`.
  - Cards with initial avatar, name, and access status.
- **Level 1 (Subjects)**:
  - Fetches `/api/hierarchy-nodes?where_parentId==:<branchId>`.
  - Displays subjects belonging strictly to that branch.
- **Level 2 (Modules / Tests)**:
  - Fetches `/api/modules?where_parentId==:<subjectId>`.
  - Assessment cards: title, description, question count, duration, access status, `"Start Module"` button.
- **Access Control & Locking**:
  - Evaluates `hasAccess(item, type, currentUser, path, activePlan, plans)` based on free/demo, granted maps, active purchased plans, or full premium.

### 2.3 Company Exams (`StudentCompaniesView.jsx`)
- **Directory Grid**:
  - Grid of companies from `GET /api/companies`.
  - Badges on top-right: `UNLOCKED` (green check), `PAID` (amber lock), or `FREE` (blue).
- **Company Detail**:
  - Logo, Name, and `"About placement criteria"` disclaimer box.
  - Company Assessments list: `MODULE-1`, `MODULE-2`, etc.
  - Badge: `PASSED (x%)`, `FAILED (x%)`, or `ACTIVE PRACTICE`.
  - Meta: Questions count, duration, pass percentage.
  - CTA: `"Start Exam"` / `"Retake Exam"`, or `"Unlock for ₹{price}"` / `"Upgrade to Unlock"`.

### 2.4 Placement Mission (`PlacementMissionView.jsx`)
- **Header**: Title + `"Current Active Cycle: {cycle.name}"` (e.g. `week_1`).
- **Sub-Tabs**: `Missions` | `Leaderboard`.
- **Missions Tab**:
  - **Free / Non-Premium User**: Shows `PREMIUM CONTENT LOCKED` card:
    - `"This section is exclusively for Premium Members. Upgrade to Premium to attempt weekly Placement Missions, test your skills in real-time constraints, and compete on the leaderboard!"`
    - CTA: `"Upgrade to Premium Membership"` (routes to Plans).
  - **Premium User**: Active vs History missions list with start/end schedule, time limit, status (`SCHEDULED`, `ACTIVE`, `SUBMITTED`, `EXPIRED`, `INVALID`), attempt score, and `"Start Attempt"` / `"Resume Attempt"`.
- **Leaderboard Tab**:
  - Table: `Rank`, `Student Name`, `Badge`, `XP Score`.
  - Badges:
    - Rank 1: 🥇 Gold Badge
    - Rank 2: 🥈 Silver Badge
    - Rank 3: 🥉 Bronze Badge
    - Rank 4–5: ⭐ Runner-Up
    - Rank 6–10: 🎖️ Top 10 Performer

### 2.5 Premium Plans & Purchase Flow (`StudentPlansView.jsx` & `PremiumPurchaseView.jsx`)
- **Plans Directory**:
  - Cards for all active plans from `GET /api/plans`.
  - Displays: Plan Name, Duration (e.g. `6 months`, `3 months`, `custom days`), Price (e.g. ₹249), Entitlement counts:
    - `{N} Learning Entitlements`
    - `{N} Company Prep Modules`
    - `{N} Free Demo tests`
  - Active Plan Badge: `Purchased (Active)` with expiry date.
  - CTA: `"Subscribe Now"` / `"Start Assessment"`.
- **Payment Request Submission**:
  - Displays UPI ID / Payment Number / QR code.
  - Fields: Full Name, Email, Transaction ID (UTR / Reference No), Payment Screenshot (upload).
  - Submits `POST /api/payment-requests`.
  - State moves to `pending` waiting for Super Admin approval.

### 2.6 Operator Profile (`StudentProfileView.jsx`)
- **Left Column**:
  - Avatar Initial, Name, Email, Specialization Branch badge.
  - `XP Rank` (XP points) and `Streak` (days).
  - **Performance Summary**:
    - Practice Modules Completed
    - Average Accuracy Score
    - Rank Level Medal (`Bronze V`, etc.)
    - Plan Subscription (`Premium Active` vs `Free Entitlement`).
- **Right Column (Operator Profile Settings)**:
  - Full Name (input)
  - Academic Semester (dropdown Semester 1–8)
  - Academic Branch with `"Switch Specialty"` expander (collapsible list of active branches from `GET /api/branches/active`)
  - College Name (input)
  - Graduation Year (input)
  - University Affiliation (input)
  - CTA: `"Save Profile Changes"` -> saves to `PUT /api/users/:id` or `POST /api/users`.

### 2.7 Send Feedback (`StudentFeedbackView.jsx`)
- **Header**: `"Send Feedback"` + description.
- **Fields**:
  - Feedback Category dropdown: `General Feedback`, `Report a Bug / Problem`, `Need Improvement`, `Feature Request`.
  - Message textarea.
- **Submission**: Sends `POST /api/feedbacks`.
- **Success State**: `"Thank you! Your feedback has been submitted successfully to system console."` with `"Send Another Message"` button.

### 2.8 Exam Engine & Scoring (`StudentDashboard.jsx`)
- **Endpoints**:
  - Start: `POST /api/attempts/start` (or `/api/placement-mission/attempts/start`)
  - Sync: `POST /api/attempts/:id/sync`
  - Submit: `POST /api/attempts/:id/submit`
- **Features**:
  - Countdown timer with auto-submit on 0.
  - Question navigation palette.
  - Mark for review toggle.
  - Anti-cheat violation counter (tab switch / backgrounding).
  - Submission confirmation with unanswered question tally.
  - Result view: Score percentage, accuracy percentage, correct/wrong/unattempted breakdown, XP gained, pass/fail status, and correct answers review.

---

## 3. Web-Only Features Intentionally Excluded from Mobile
1. Multi-column Admin CMS consoles (`/admin/*`).
2. Collapsible sidebar drag handles.
3. Light mode theme toggle (kept dark-only matching system token design).
