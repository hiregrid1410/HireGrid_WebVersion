import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/text_styles.dart';
import '../../shared/widgets/stat_widgets.dart';
import '../../shared/widgets/card_widgets.dart';
import '../../shared/widgets/utility_widgets.dart';
import '../../providers/app_providers.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userAsync = ref.watch(currentUserProvider);
    final continueModuleAsync = ref.watch(continueLearningProvider);
    final companiesAsync = ref.watch(companiesListProvider);
    final missionAsync = ref.watch(currentMissionProvider);
    final leaderboardAsync = ref.watch(leaderboardProvider);

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.primaryGreen,
          backgroundColor: AppColors.surfaceCardElevated,
          onRefresh: () async {
            ref.refresh(currentUserProvider);
            ref.refresh(continueLearningProvider);
            ref.refresh(companiesListProvider);
            ref.refresh(currentMissionProvider);
            ref.refresh(leaderboardProvider);
          },
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. Top Bar: Greeting + Streak Pill + Medal Pill + Notification
                userAsync.when(
                  loading: () => const ShimmerCard(height: 60, borderRadius: 16),
                  error: (_, __) => const SizedBox(),
                  data: (user) {
                    final name = user?.name ?? 'Student';
                    final streak = user?.currentStreak ?? 0;
                    final medal = user?.medalTier ?? 'Bronze V';

                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            CircleAvatar(
                              radius: 20,
                              backgroundColor: AppColors.surfaceCardElevated,
                              child: Text(
                                name.isNotEmpty ? name.substring(0, 1).toUpperCase() : 'S',
                                style: AppTextStyles.h3.copyWith(color: AppColors.primaryGreen),
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Welcome back, $name! 👋',
                                    style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w700),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    user?.branch ?? 'Select a branch in profile',
                                    style: AppTextStyles.bodySm.copyWith(
                                      color: AppColors.textSecondary,
                                      fontSize: 11,
                                    ),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                            IconButton(
                              icon: const Icon(Icons.notifications_outlined, size: 24, color: AppColors.textPrimary),
                              onPressed: () => context.push('/notifications'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        // Streak Pill & Medal Pill Row (Web Header Parity)
                        Wrap(
                          spacing: 8,
                          runSpacing: 6,
                          children: [
                            StreakPill(streakDays: streak),
                            MedalRankPill(
                              medalTier: medal,
                              onTap: () => context.go('/missions'),
                            ),
                          ],
                        ),
                      ],
                    );
                  },
                ).animate().fadeIn(duration: 400.ms),
                const SizedBox(height: 20),

                // 2. Telemetry 5 Stat Cards (Enrolled Courses, Tests Attempted, Avg Score, XP Earned, Platform Rank)
                userAsync.when(
                  loading: () => const Row(
                    children: [
                      Expanded(child: ShimmerCard(height: 90)),
                      SizedBox(width: 8),
                      Expanded(child: ShimmerCard(height: 90)),
                    ],
                  ),
                  error: (_, __) => const SizedBox(),
                  data: (user) {
                    final xp = user?.totalXp ?? 0;
                    final testsAttempted = user?.moduleScores.length ?? 0;

                    // Calculate average score
                    double avgScore = 0.0;
                    if (user != null && user.moduleScores.isNotEmpty) {
                      final sum = user.moduleScores.values.fold(0.0, (prev, element) => prev + element);
                      avgScore = sum / user.moduleScores.length;
                    }

                    // Platform Rank calculation from leaderboard
                    String rankDisplay = '#--';
                    String rankSubtitle = 'Not ranked yet';
                    if (leaderboardAsync.hasValue) {
                      final list = leaderboardAsync.value ?? [];
                      final userEntry = list.where((l) => l.isCurrentUser || l.name == user?.name).toList();
                      if (userEntry.isNotEmpty) {
                        rankDisplay = '#${userEntry.first.rank}';
                        rankSubtitle = 'Global Rank';
                      }
                    }

                    return Column(
                      children: [
                        // Row 1: 3 cards
                        Row(
                          children: [
                            Expanded(
                              child: StatCardMini(
                                icon: Icons.menu_book_rounded,
                                iconColor: AppColors.primaryGreen,
                                title: 'Courses',
                                value: '25+',
                                subtitle: 'Enrolled',
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: StatCardMini(
                                icon: Icons.assignment_turned_in_rounded,
                                iconColor: const Color(0xFF38BDF8),
                                title: 'Attempted',
                                value: '$testsAttempted',
                                subtitle: 'Tests',
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: StatCardMini(
                                icon: Icons.track_changes_rounded,
                                iconColor: const Color(0xFFA855F7),
                                title: 'Avg Score',
                                value: '${avgScore.toStringAsFixed(0)}%',
                                subtitle: 'Accuracy',
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        // Row 2: 2 cards (XP Earned & Platform Rank)
                        Row(
                          children: [
                            Expanded(
                              child: StatCardMini(
                                icon: Icons.bolt_rounded,
                                iconColor: AppColors.accentYellow,
                                title: 'XP Earned',
                                value: '$xp XP',
                                subtitle: 'Total XP',
                              ),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: StatCardMini(
                                icon: Icons.emoji_events_rounded,
                                iconColor: const Color(0xFFF97316),
                                title: 'Platform Rank',
                                value: rankDisplay,
                                subtitle: rankSubtitle,
                              ),
                            ),
                          ],
                        ),
                      ],
                    );
                  },
                ).animate().fadeIn(delay: 100.ms),
                const SizedBox(height: 20),

                // 3. Your Progress Card (Overall Completion % + XP Bar)
                userAsync.when(
                  loading: () => const ShimmerCard(height: 160),
                  error: (_, __) => const SizedBox(),
                  data: (user) {
                    final xp = user?.totalXp ?? 0;
                    final completed = user?.moduleScores.length ?? 0;
                    const totalModules = 27; // Total standard modules per branch
                    final medal = user?.medalTier ?? 'Bronze V';

                    return YourProgressCard(
                      completedModules: completed,
                      totalModules: totalModules,
                      currentXp: xp,
                      medalTier: medal,
                      nextMedalTier: _getNextTierName(medal),
                    );
                  },
                ).animate().fadeIn(delay: 150.ms),
                const SizedBox(height: 24),

                // 4. Upgrade Banner for Free Accounts
                userAsync.when(
                  loading: () => const SizedBox(),
                  error: (_, __) => const SizedBox(),
                  data: (user) {
                    if (user?.planStatus == 'premium') return const SizedBox();

                    return Padding(
                      padding: const EdgeInsets.only(bottom: 24),
                      child: GradientBannerCard(
                        title: 'Unlock Full Placement Access ⚡',
                        subtitle: 'Get unlimited company mocks, weekly missions, and verified readiness badges.',
                        actionText: 'Explore Premium Plans →',
                        onTap: () => context.go('/plans'),
                      ),
                    );
                  },
                ),

                // 5. Quick-Action 4-icon Row
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildQuickAction(
                      icon: Icons.code_rounded,
                      label: 'Practice',
                      onTap: () => context.go('/learn'),
                    ),
                    _buildQuickAction(
                      icon: Icons.business_rounded,
                      label: 'Companies',
                      onTap: () => context.push('/companies'),
                    ),
                    _buildQuickAction(
                      icon: Icons.flag_rounded,
                      label: 'Missions',
                      onTap: () => context.go('/missions'),
                    ),
                    _buildQuickAction(
                      icon: Icons.leaderboard_rounded,
                      label: 'Leaderboard',
                      onTap: () => context.go('/missions'),
                    ),
                  ],
                ).animate().fadeIn(delay: 200.ms),
                const SizedBox(height: 28),

                // 6. Continue Learning Section (with web empty state parity)
                SectionHeader(
                  title: 'Continue Learning',
                  actionText: 'View All',
                  onActionTap: () => context.go('/learn'),
                ),
                const SizedBox(height: 12),
                continueModuleAsync.when(
                  loading: () => const ShimmerCard(height: 90, borderRadius: 18),
                  error: (_, __) => const SizedBox(),
                  data: (module) {
                    if (module == null) {
                      return Container(
                        width: double.infinity,
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceCard,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.borderSubtle),
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.info_outline_rounded, color: AppColors.textMuted, size: 22),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Text(
                                'No active learning modules in your branch. Select a branch in profile settings.',
                                style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary),
                              ),
                            ),
                          ],
                        ),
                      );
                    }
                    return ModuleProgressCard(
                      module: module,
                      onTap: () => context.push('/learn/module/${module.id}'),
                    );
                  },
                ).animate().fadeIn(delay: 250.ms),
                const SizedBox(height: 28),

                // 7. Active Placement Missions Section
                SectionHeader(
                  title: 'Active Placement Missions',
                  actionText: 'View All',
                  onActionTap: () => context.go('/missions'),
                ),
                const SizedBox(height: 12),
                missionAsync.when(
                  loading: () => const ShimmerCard(height: 80, borderRadius: 16),
                  error: (_, __) => const SizedBox(),
                  data: (mission) {
                    return InkWell(
                      borderRadius: BorderRadius.circular(16),
                      onTap: () => context.go('/missions'),
                      child: Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceCard,
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(color: AppColors.borderSubtle),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 44,
                              height: 44,
                              decoration: BoxDecoration(
                                color: AppColors.accentYellow.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: const Icon(Icons.military_tech_rounded, color: AppColors.accentYellow, size: 24),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    mission.title,
                                    style: AppTextStyles.h3.copyWith(fontSize: 14, fontWeight: FontWeight.w700),
                                  ),
                                  const SizedBox(height: 3),
                                  Text(
                                    mission.countdownText,
                                    style: AppTextStyles.bodySm.copyWith(color: AppColors.accentYellow, fontSize: 11),
                                  ),
                                ],
                              ),
                            ),
                            const Icon(Icons.arrow_forward_ios_rounded, color: AppColors.textMuted, size: 14),
                          ],
                        ),
                      ),
                    );
                  },
                ).animate().fadeIn(delay: 280.ms),
                const SizedBox(height: 28),

                // 8. Top Companies Horizontal Directory
                SectionHeader(
                  title: 'Top Companies',
                  actionText: 'Directory',
                  onActionTap: () => context.push('/companies'),
                ),
                const SizedBox(height: 12),
                companiesAsync.when(
                  loading: () => const ShimmerCard(height: 60, borderRadius: 14),
                  error: (_, __) => const SizedBox(),
                  data: (companies) {
                    return SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: companies.map((c) {
                          return Padding(
                            padding: const EdgeInsets.only(right: 12),
                            child: InkWell(
                              borderRadius: BorderRadius.circular(14),
                              onTap: () => context.push('/companies/${c.id}'),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                                decoration: BoxDecoration(
                                  color: AppColors.surfaceCard,
                                  borderRadius: BorderRadius.circular(14),
                                  border: Border.all(color: AppColors.borderSubtle),
                                ),
                                child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Container(
                                      width: 28,
                                      height: 28,
                                      decoration: BoxDecoration(
                                        color: AppColors.surfaceInput,
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Center(
                                        child: Text(
                                          c.name.substring(0, 1),
                                          style: AppTextStyles.h3.copyWith(
                                            color: AppColors.primaryGreen,
                                            fontSize: 13,
                                            fontWeight: FontWeight.w800,
                                          ),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    Text(
                                      c.name,
                                      style: AppTextStyles.bodyMd.copyWith(
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.textPrimary,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    );
                  },
                ).animate().fadeIn(delay: 300.ms),
                const SizedBox(height: 28),

                // 9. Keep Going Motivation Line Card (Web Sidebar Motivation Parity)
                userAsync.when(
                  loading: () => const SizedBox(),
                  error: (_, __) => const SizedBox(),
                  data: (user) {
                    final name = user?.name.split(' ').first ?? 'Student';
                    return Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceInput,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.borderSubtle),
                      ),
                      child: Row(
                        children: [
                          const Text('🚀', style: TextStyle(fontSize: 24)),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Keep Going, $name!',
                                  style: AppTextStyles.bodyMd.copyWith(
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.textPrimary,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  'Practice consistently every day to climb the platform leaderboard.',
                                  style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary, fontSize: 11),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _getNextTierName(String currentTier) {
    if (currentTier.contains('Bronze')) return 'Silver V';
    if (currentTier.contains('Silver')) return 'Gold V';
    if (currentTier.contains('Gold')) return 'Platinum V';
    if (currentTier.contains('Platinum')) return 'Diamond V';
    if (currentTier.contains('Diamond')) return 'Crown V';
    return 'Ace';
  }

  Widget _buildQuickAction({
    required IconData icon,
    required String label,
    required VoidCallback onTap,
  }) {
    return InkWell(
      borderRadius: BorderRadius.circular(14),
      onTap: onTap,
      child: Column(
        children: [
          Container(
            width: 54,
            height: 54,
            decoration: BoxDecoration(
              color: AppColors.surfaceCard,
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: AppColors.borderSubtle),
            ),
            child: Icon(icon, color: AppColors.primaryGreen, size: 24),
          ),
          const SizedBox(height: 8),
          Text(
            label,
            style: AppTextStyles.bodySm.copyWith(
              color: AppColors.textSecondary,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
