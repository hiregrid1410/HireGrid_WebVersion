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

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.primaryGreen,
          backgroundColor: AppColors.surfaceCardElevated,
          onRefresh: () async {
            ref.refresh(currentUserProvider);
            ref.refresh(continueLearningProvider);
            ref.refresh(companiesListProvider);
          },
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Bar: User Greeting & Notification
                userAsync.when(
                  loading: () => const ShimmerCard(height: 60, borderRadius: 16),
                  error: (_, __) => const SizedBox(),
                  data: (user) {
                    final name = user?.name ?? 'Jevin';
                    return Row(
                      children: [
                        CircleAvatar(
                          radius: 22,
                          backgroundColor: AppColors.surfaceCardElevated,
                          child: Text(
                            name.substring(0, 1).toUpperCase(),
                            style: AppTextStyles.h3.copyWith(color: AppColors.primaryGreen),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Hello, $name 👋',
                                style: AppTextStyles.h2,
                              ),
                              Text(
                                'Keep going! You\'re doing great!',
                                style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary),
                              ),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: Stack(
                            children: [
                              const Icon(Icons.notifications_outlined, size: 26, color: AppColors.textPrimary),
                              Positioned(
                                right: 2,
                                top: 2,
                                child: Container(
                                  width: 8,
                                  height: 8,
                                  decoration: const BoxDecoration(
                                    color: AppColors.accentYellow,
                                    shape: BoxShape.circle,
                                  ),
                                ),
                              ),
                            ],
                          ),
                          onPressed: () => context.push('/notifications'),
                        ),
                      ],
                    );
                  },
                ).animate().fadeIn(duration: 400.ms),
                const SizedBox(height: 20),

                // Stat Chips Row: XP and Streak
                userAsync.when(
                  loading: () => const Row(
                    children: [
                      Expanded(child: ShimmerCard(height: 60)),
                      SizedBox(width: 12),
                      Expanded(child: ShimmerCard(height: 60)),
                    ],
                  ),
                  error: (_, __) => const SizedBox(),
                  data: (user) {
                    final xp = user?.totalXp ?? 2450;
                    final streak = user?.currentStreak ?? 12;
                    return Row(
                      children: [
                        Expanded(
                          child: StatChip(
                            icon: const Icon(Icons.star_rounded, color: AppColors.accentYellow, size: 24),
                            value: xp.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},'),
                            label: 'Total XP',
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: StatChip(
                            icon: const Icon(Icons.local_fire_department_rounded, color: Color(0xFFF97316), size: 24),
                            value: '$streak Days',
                            label: 'Current Streak',
                          ),
                        ),
                      ],
                    );
                  },
                ).animate().fadeIn(delay: 100.ms),
                const SizedBox(height: 20),

                // Placement Mission Banner Card
                GradientBannerCard(
                  title: 'Placement Mission',
                  subtitle: 'Join this week\'s mission and climb the leaderboard!',
                  actionText: 'View Mission →',
                  onTap: () => context.go('/missions'),
                ).animate().fadeIn(delay: 150.ms).slideY(begin: 0.1, end: 0),
                const SizedBox(height: 24),

                // Quick-Action 4-icon Row
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
                      onTap: () => context.go('/companies'),
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

                // Continue Learning Section
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
                    if (module == null) return const SizedBox();
                    return ModuleProgressCard(
                      module: module,
                      onTap: () => context.push('/learn/module/${module.id}'),
                    );
                  },
                ).animate().fadeIn(delay: 250.ms),
                const SizedBox(height: 28),

                // Top Companies Horizontal Row
                SectionHeader(
                  title: 'Top Companies',
                  actionText: 'View All',
                  onActionTap: () => context.go('/companies'),
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
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
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
