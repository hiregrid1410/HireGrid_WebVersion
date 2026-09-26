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

## 🔌 API Swapping Guide (Plugging In Real Backend)

All Riverpod providers are located in [`lib/providers/app_providers.dart`](file:///run/media/jevin/Box%20A/HireGrid%20web%20and%20app/HireGrid_WebVersion/HireGridX/lib/providers/app_providers.dart).
Each repository provider has a clearly labeled `// TODO(api): ...` comment indicating which endpoint to connect:

| Provider | Repository Interface | Backend Endpoint | File to Edit |
|---|---|---|---|
| `authRepositoryProvider` | `AuthRepository` | `POST /api/auth/login`, `POST /api/auth/register`, `POST /api/auth/verify-otp` | `lib/data/repositories/` |
| `companyRepositoryProvider` | `CompanyRepository` | `GET /api/companies`, `GET /api/companies/:id` | `lib/data/repositories/` |
| `moduleRepositoryProvider` | `ModuleRepository` | `GET /api/modules`, `GET /api/subjects`, `GET /api/branches` | `lib/data/repositories/` |
| `examRepositoryProvider` | `ExamRepository` | `POST /api/attempts/start`, `POST /api/attempts/:id/submit`, `GET /api/attempts/:id` | `lib/data/repositories/` |
| `missionRepositoryProvider` | `MissionRepository` | `GET /api/placement-mission/current`, `GET /api/placement-mission/leaderboard` | `lib/data/repositories/` |
| `planRepositoryProvider` | `PlanRepository` | `GET /api/plans`, `POST /api/payment-requests`, `GET /api/payment-requests/my` | `lib/data/repositories/` |
| `profileRepositoryProvider` | `ProfileRepository` | `PUT /api/users/profile`, `GET /api/devices`, `GET /api/notifications` | `lib/data/repositories/` |

---

## 🛠️ Running the App

```bash
cd HireGridX
flutter pub get
flutter run
```
