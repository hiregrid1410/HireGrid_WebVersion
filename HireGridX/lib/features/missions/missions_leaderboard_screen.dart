import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/text_styles.dart';
import '../../shared/widgets/exam_widgets.dart';
import '../../shared/widgets/utility_widgets.dart';
import '../../providers/app_providers.dart';

class MissionsLeaderboardScreen extends ConsumerWidget {
  const MissionsLeaderboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final missionAsync = ref.watch(currentMissionProvider);
    final leaderboardAsync = ref.watch(leaderboardProvider);
    final currentTab = ref.watch(leaderboardTabProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Missions & Leaderboard'),
      ),
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.primaryGreen,
          backgroundColor: AppColors.surfaceCardElevated,
          onRefresh: () async {
            ref.refresh(currentMissionProvider);
            ref.refresh(leaderboardProvider);
          },
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Active Mission Card
                missionAsync.when(
                  loading: () => const ShimmerCard(height: 120, borderRadius: 18),
                  error: (_, __) => const SizedBox(),
                  data: (mission) {
                    return InkWell(
                      borderRadius: BorderRadius.circular(18),
                      onTap: () => context.push('/missions/${mission.id}'),
                      child: Container(
                        padding: const EdgeInsets.all(18),
                        decoration: BoxDecoration(
                          gradient: AppColors.cardGradient,
                          borderRadius: BorderRadius.circular(18),
                          border: Border.all(color: AppColors.primaryGreen.withOpacity(0.3)),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                color: AppColors.accentYellow.withOpacity(0.15),
                                borderRadius: BorderRadius.circular(14),
                              ),
                              child: const Center(
                                child: Icon(Icons.military_tech_rounded, color: AppColors.accentYellow, size: 28),
                              ),
                            ),
                            const SizedBox(width: 14),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    mission.title,
                                    style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w700),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    mission.countdownText,
                                    style: AppTextStyles.bodySm.copyWith(
                                      color: AppColors.accentYellow,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            const Icon(Icons.arrow_forward_ios_rounded, color: AppColors.primaryGreen, size: 16),
                          ],
                        ),
                      ),
                    );
                  },
                ).animate().fadeIn(duration: 400.ms),
                const SizedBox(height: 20),

                // Leaderboard Tabs: Weekly / Monthly / Placement Cycle
                Row(
                  children: [
                    _buildTabChip(ref, 'Weekly', 'weekly', currentTab == 'weekly'),
                    const SizedBox(width: 8),
                    _buildTabChip(ref, 'Monthly', 'monthly', currentTab == 'monthly'),
                    const SizedBox(width: 8),
                    _buildTabChip(ref, 'Placement Cycle', 'cycle', currentTab == 'cycle'),
                  ],
                ).animate().fadeIn(delay: 100.ms),
                const SizedBox(height: 24),

                // Top 3 Podium Widget
                leaderboardAsync.when(
                  loading: () => const ShimmerCard(height: 160, borderRadius: 18),
                  error: (_, __) => const SizedBox(),
                  data: (entries) {
                    if (entries.length < 3) return const SizedBox();
                    final top1 = entries[0];
                    final top2 = entries[1];
                    final top3 = entries[2];

                    return Container(
                      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 16),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceCard,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: AppColors.borderSubtle),
                      ),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          // Rank #2
                          _buildPodiumAvatar(top2, 2, 48),
                          // Rank #1 (Center, Elevated, with Crown)
                          _buildPodiumAvatar(top1, 1, 60),
                          // Rank #3
                          _buildPodiumAvatar(top3, 3, 48),
                        ],
                      ),
                    );
                  },
                ).animate().fadeIn(delay: 150.ms),
                const SizedBox(height: 20),

                // Ranked List Below Top 3
                Text('All Rankings', style: AppTextStyles.h3),
                const SizedBox(height: 12),

                leaderboardAsync.when(
                  loading: () => ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: 6,
                    separatorBuilder: (_, __) => const SizedBox(height: 10),
                    itemBuilder: (_, __) => const ShimmerCard(height: 60, borderRadius: 14),
                  ),
                  error: (err, _) => EmptyStateWidget(
                    title: 'Leaderboard unavailable',
                    message: err.toString(),
                  ),
                  data: (entries) {
                    return ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: entries.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (context, index) {
                        final entry = entries[index];
                        final isUser = entry.isCurrentUser;

                        return Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                          decoration: BoxDecoration(
                            color: isUser ? AppColors.primaryGreen.withOpacity(0.12) : AppColors.surfaceCard,
                            borderRadius: BorderRadius.circular(14),
                            border: Border.all(
                              color: isUser ? AppColors.primaryGreen : AppColors.borderSubtle,
                              width: isUser ? 1.5 : 1,
                            ),
                          ),
                          child: Row(
                            children: [
                              SizedBox(
                                width: 28,
                                child: Text(
                                  '#${entry.rank}',
                                  style: AppTextStyles.bodyMd.copyWith(
                                    fontWeight: FontWeight.w700,
                                    color: isUser ? AppColors.primaryGreen : AppColors.textMuted,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 8),
                              CircleAvatar(
                                radius: 16,
                                backgroundColor: AppColors.surfaceCardElevated,
                                child: Text(
                                  entry.name.substring(0, 1),
                                  style: AppTextStyles.bodySm.copyWith(
                                    fontWeight: FontWeight.w700,
                                    color: isUser ? AppColors.primaryGreen : AppColors.textPrimary,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Row(
                                  children: [
                                    Text(
                                      entry.name,
                                      style: AppTextStyles.bodyMd.copyWith(
                                        fontWeight: isUser ? FontWeight.w700 : FontWeight.w500,
                                        color: isUser ? AppColors.primaryGreen : AppColors.textPrimary,
                                      ),
                                    ),
                                    if (isUser) ...[
                                      const SizedBox(width: 6),
                                      Container(
                                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: AppColors.primaryGreen,
                                          borderRadius: BorderRadius.circular(4),
                                        ),
                                        child: Text(
                                          'YOU',
                                          style: AppTextStyles.label.copyWith(
                                            color: Colors.black,
                                            fontSize: 9,
                                            fontWeight: FontWeight.w800,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                              Text(
                                '${entry.score} pts',
                                style: AppTextStyles.numeric.copyWith(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w700,
                                  color: isUser ? AppColors.primaryGreen : AppColors.textPrimary,
                                ),
                              ),
                            ],
                          ),
                        ).animate().fadeIn(delay: (index * 40).ms);
                      },
                    );
                  },
                ),
                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildTabChip(WidgetRef ref, String label, String value, bool isSelected) {
    return Expanded(
      child: GestureDetector(
        onTap: () => ref.read(leaderboardTabProvider.notifier).state = value,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? AppColors.primaryGreen : AppColors.surfaceCard,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: isSelected ? AppColors.primaryGreen : AppColors.borderSubtle),
          ),
          child: Center(
            child: Text(
              label,
              style: AppTextStyles.bodySm.copyWith(
                color: isSelected ? Colors.black : AppColors.textSecondary,
                fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPodiumAvatar(dynamic entry, int rank, double size) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        AvatarRing(
          rank: rank,
          name: entry.name,
          size: size,
        ),
        const SizedBox(height: 8),
        Text(
          entry.name,
          style: AppTextStyles.bodySm.copyWith(
            fontWeight: FontWeight.w700,
            color: entry.isCurrentUser ? AppColors.primaryGreen : AppColors.textPrimary,
          ),
        ),
        Text(
          '${entry.score}',
          style: AppTextStyles.numeric.copyWith(
            fontSize: 13,
            color: AppColors.accentYellow,
            fontWeight: FontWeight.w700,
          ),
        ),
      ],
    );
  }
}
