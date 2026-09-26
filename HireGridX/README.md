# 🚀 HireGridX Student Mobile App

A high-performance Flutter mobile application for **HireGridX** — the placement-preparation platform.

---

## 📱 Features Built & Architecture

- **Clean Architecture & Decoupled Seams**: Repository interfaces decouple UI and State from network implementations.
- **Dark Matte Design System**: Strict adherence to the `AppColors` and `AppTextStyles` tokens (Green, Yellow, Matte Black, Deep Blue).
- **Persistent Bottom Navigation**: GoRouter `StatefulShellRoute` preserving state across Home, Learn, Missions, Plans, and Profile.
- **Full-Screen Exam Engine**: Countdown timer, interactive question palette bottom-sheet, single-select MCQs, review bookmarking, confirm dialogs, and confetti result celebration.
- **All 29 Screen Flows**:
  1. Splash Screen
  2. Login Screen
  3. Sign Up Screen
  4. OTP Verification Screen
  5. Forgot Password Screen
  6. Branch Selection Screen
  7. Student Dashboard
  8. Companies List
  9. Company Detail & Assessments
  10. My Learning (Modules / Subjects / My Progress)
  11. Module Detail
  12. Exam Screen
  13. Exam Result Screen
  14. Missions & Leaderboard
  15. Mission Detail
  16. Plans & Pricing
  17. Payment Method (UPI QR / Card / NetBanking)
  18. Payment Status Confirmation
  19. Profile Screen
  20. Edit Profile Screen
  21. Subscriptions & Payment History
  22. Settings Screen
  23. Device Management
  24. Change Branch
  25. Help & Support
  26. Send Feedback
  27. Notifications Screen
  28. Motivation & Milestone Screen
  29. No Internet / Error States

---

# 🚀 HireGridX Student Mobile App

A high-performance Flutter mobile application for **HireGridX** — the placement-preparation platform, wired directly to the real Node.js + Express backend.

---

## 🔌 Backend Integration & Endpoints

The Flutter app is connected directly to the production Node + Express backend via `Dio` with automatic JWT header injection, 3-step retry backoff (300ms → 700ms → 1500ms) for Neon database cold-starts, 18s server timeout guard, stable hardware-backed device ID generation, single-device lock enforcement, and 401 session clearing.

### Configured Endpoint Contracts (Inspected from Express routes)

| Category | Method | Endpoint | Request / Response Details |
|---|---|---|---|
| **Auth** | `POST` | `/api/auth/signup` | Body: `{ name, email, password, branch, semester, role: "student" }` |
| **Auth** | `POST` | `/api/auth/login` | Body: `{ email, password, isAdminLogin: false, deviceId, deviceName }`. Handles device-switch limit status (HTTP 403 `deviceLimitReached`). |
| **Auth** | `GET` | `/api/auth/me` | Fetches active student profile & subscription state. Cached locally for instant cold start. |
| **Auth (OTP)** | `POST` | `/api/auth/send-otp` | Body: `{ email }`. Used for password reset and OTP verification. |
| **Auth (OTP)** | `POST` | `/api/auth/verify-otp` | Body: `{ email, otp }`. Confirmed against `authRoutes.js`. |
| **Auth (OTP)** | `POST` | `/api/auth/resend-otp` | Body: `{ email }`. Confirmed against `authRoutes.js`. |
| **Companies** | `GET` | `/api/companies` | List of company tiers, hiring tests, and logos. Offline cached. |
| **Modules** | `GET` | `/api/branches/active` | Active branch listing. Offline cached. |
| **Modules** | `GET` | `/api/modules` | Module listings by discipline/subject (`where_parentId`). |
| **Exam Engine** | `POST` | `/api/attempts/start` | Body: `{ moduleId }` → returns shuffled questions, remaining timer, and previous answers if resuming an attempt. |
| **Exam Engine** | `POST` | `/api/attempts/:id/sync` | Periodic 30s + on-change answer sync. Anti-cheat `violationCount` sent on app backgrounding. |
| **Exam Engine** | `POST` | `/api/attempts/:id/submit` | Body: `{ answers, timeTaken, violationCount }` → computes score, accuracy, XP, and result breakdown. |
| **Placement Missions** | `GET` | `/api/placement-mission/missions` | Active placement mission details & test syllabus. |
| **Placement Missions** | `GET` | `/api/placement-mission/leaderboard` | Global ranking board in `Asia/Kolkata` daily cycles. |
| **Plans & Payments** | `GET` | `/api/plans` | Pricing tiers and feature access lists. Offline cached. |
| **Plans & Payments** | `POST` | `/api/payment-requests` | Body: `{ itemId, itemType, itemName, transactionId, amount, duration }`. |
| **Storage / Media** | `POST` | `/api/storage/local-upload` & S3 presigned URL | Upload profile photos, feedback screenshots, and payment proof. |

---

## 🛠️ Running the App with Backend

### 1. Default (Localhost API / Dev)
```bash
cd HireGridX
flutter run
```

### 2. Specifying a Custom LAN IP / Ngrok / Production URL
```bash
flutter run --dart-define=API_BASE_URL=http://192.168.1.100:5000/api
```
Or for production:
```bash
flutter run --dart-define=API_BASE_URL=https://api.hiregrid.in/api
```

### 3. Running Widget and Integration Tests
```bash
flutter test
```
