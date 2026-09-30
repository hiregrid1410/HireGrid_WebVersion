import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

// Splash & Auth
import '../../features/splash/splash_screen.dart';
import '../../features/auth/login_screen.dart';
import '../../features/auth/signup_screen.dart';
import '../../features/auth/otp_verify_screen.dart';
import '../../features/auth/forgot_password_screen.dart';
import '../../features/onboarding/branch_selection_screen.dart';

// Core Tabs & Shell
import '../../features/common/app_shell_screen.dart';
import '../../features/dashboard/dashboard_screen.dart';
import '../../features/learning/my_learning_screen.dart';
import '../../features/learning/module_detail_screen.dart';
import '../../features/companies/companies_screen.dart';
import '../../features/companies/company_detail_screen.dart';
import '../../features/missions/missions_leaderboard_screen.dart';
import '../../features/missions/mission_detail_screen.dart';
import '../../features/plans/plans_screen.dart';
import '../../features/plans/payment_method_screen.dart';
import '../../features/plans/payment_status_screen.dart';
import '../../features/profile/profile_screen.dart';
import '../../features/profile/edit_profile_screen.dart';
import '../../features/profile/subscriptions_history_screen.dart';
import '../../features/settings/settings_screen.dart';
import '../../features/settings/device_management_screen.dart';
import '../../features/support/help_support_screen.dart';
import '../../features/support/send_feedback_screen.dart';
import '../../features/notifications/notifications_screen.dart';
import '../../features/common/motivation_screen.dart';

// Exam
import '../../features/exam/exam_screen.dart';
import '../../features/exam/exam_result_screen.dart';

final GlobalKey<NavigatorState> _rootNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'root');
final GlobalKey<NavigatorState> _homeNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'homeBranch');
final GlobalKey<NavigatorState> _learnNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'learnBranch');
final GlobalKey<NavigatorState> _missionsNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'missionsBranch');
final GlobalKey<NavigatorState> _plansNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'plansBranch');
final GlobalKey<NavigatorState> _profileNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'profileBranch');

final appRouter = GoRouter(
  navigatorKey: _rootNavigatorKey,
  initialLocation: '/splash',
  routes: [
    GoRoute(
      path: '/splash',
      builder: (context, state) => const SplashScreen(),
    ),
    GoRoute(
      path: '/login',
      builder: (context, state) => const LoginScreen(),
    ),
    GoRoute(
      path: '/signup',
      builder: (context, state) => const SignUpScreen(),
    ),
    GoRoute(
      path: '/otp-verify',
      builder: (context, state) {
        final email = state.uri.queryParameters['email'] ?? '';
        return OtpVerifyScreen(email: email);
      },
    ),
    GoRoute(
      path: '/forgot-password',
      builder: (context, state) => const ForgotPasswordScreen(),
    ),
    GoRoute(
      path: '/branch-selection',
      builder: (context, state) => const BranchSelectionScreen(isFromSettings: false),
    ),

    // Bottom Navigation Shell
    StatefulShellRoute.indexedStack(
      builder: (context, state, navigationShell) {
        return AppShellScreen(navigationShell: navigationShell);
      },
      branches: [
        // Tab 0: Home / Dashboard
        StatefulShellBranch(
          navigatorKey: _homeNavigatorKey,
          routes: [
            GoRoute(
              path: '/home',
              builder: (context, state) => const DashboardScreen(),
            ),
          ],
        ),

        // Tab 1: Learn
        StatefulShellBranch(
          navigatorKey: _learnNavigatorKey,
          routes: [
            GoRoute(
              path: '/learn',
              builder: (context, state) => const MyLearningScreen(),
              routes: [
                GoRoute(
                  path: 'module/:id',
                  parentNavigatorKey: _rootNavigatorKey,
                  builder: (context, state) {
                    final id = state.pathParameters['id'] ?? 'mod_apt';
                    return ModuleDetailScreen(moduleId: id);
                  },
                ),
              ],
            ),
          ],
        ),

        // Tab 2: Missions & Leaderboard
        StatefulShellBranch(
          navigatorKey: _missionsNavigatorKey,
          routes: [
            GoRoute(
              path: '/missions',
              builder: (context, state) => const MissionsLeaderboardScreen(),
              routes: [
                GoRoute(
                  path: ':id',
                  parentNavigatorKey: _rootNavigatorKey,
                  builder: (context, state) {
                    final id = state.pathParameters['id'] ?? 'mis_w38';
                    return MissionDetailScreen(missionId: id);
                  },
                ),
              ],
            ),
          ],
        ),

        // Tab 3: Plans & Pricing
        StatefulShellBranch(
          navigatorKey: _plansNavigatorKey,
          routes: [
            GoRoute(
              path: '/plans',
              builder: (context, state) => const PlansScreen(),
              routes: [
                GoRoute(
                  path: 'checkout/:planId',
                  parentNavigatorKey: _rootNavigatorKey,
                  builder: (context, state) {
                    final planId = state.pathParameters['planId'] ?? 'plan_premium';
                    return PaymentMethodScreen(planId: planId);
                  },
                ),
                GoRoute(
                  path: 'status',
                  parentNavigatorKey: _rootNavigatorKey,
                  builder: (context, state) {
                    final planId = state.uri.queryParameters['planId'] ?? 'plan_premium';
                    return PaymentStatusScreen(planId: planId);
                  },
                ),
              ],
            ),
          ],
        ),

        // Tab 4: Profile
        StatefulShellBranch(
          navigatorKey: _profileNavigatorKey,
          routes: [
            GoRoute(
              path: '/profile',
              builder: (context, state) => const ProfileScreen(),
              routes: [
                GoRoute(
                  path: 'edit',
                  parentNavigatorKey: _rootNavigatorKey,
                  builder: (context, state) => const EditProfileScreen(),
                ),
                GoRoute(
                  path: 'subscriptions',
                  parentNavigatorKey: _rootNavigatorKey,
                  builder: (context, state) => const SubscriptionsHistoryScreen(),
                ),
              ],
            ),
          ],
        ),
      ],
    ),

    // Companies Sub-stack
    GoRoute(
      path: '/companies',
      builder: (context, state) => const CompaniesScreen(),
      routes: [
        GoRoute(
          path: ':id',
          builder: (context, state) {
            final id = state.pathParameters['id'] ?? 'tcs';
            return CompanyDetailScreen(companyId: id);
          },
        ),
      ],
    ),

    // Settings Sub-stack
    GoRoute(
      path: '/settings',
      builder: (context, state) => const SettingsScreen(),
      routes: [
        GoRoute(
          path: 'devices',
          builder: (context, state) => const DeviceManagementScreen(),
        ),
        GoRoute(
          path: 'branch',
          builder: (context, state) => const BranchSelectionScreen(isFromSettings: true),
        ),
      ],
    ),

    // Support Sub-stack
    GoRoute(
      path: '/support',
      builder: (context, state) => const HelpSupportScreen(),
      routes: [
        GoRoute(
          path: 'feedback',
          builder: (context, state) => const SendFeedbackScreen(),
        ),
      ],
    ),

    // Notifications & Motivation
    GoRoute(
      path: '/notifications',
      builder: (context, state) => const NotificationsScreen(),
    ),
    GoRoute(
      path: '/motivation',
      builder: (context, state) => const MotivationEndScreen(),
    ),

    // Full Screen Exam Engine
    GoRoute(
      path: '/exam/:attemptId',
      builder: (context, state) {
        final attemptId = state.pathParameters['attemptId'] ?? 'att_1';
        return ExamScreen(attemptId: attemptId);
      },
      routes: [
        GoRoute(
          path: 'result',
          builder: (context, state) {
            final attemptId = state.pathParameters['attemptId'] ?? 'att_1';
            return ExamResultScreen(attemptId: attemptId);
          },
        ),
      ],
    ),
  ],
);
