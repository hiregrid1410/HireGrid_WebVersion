import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/text_styles.dart';
import '../../shared/widgets/stat_widgets.dart';
import '../../shared/widgets/app_buttons.dart';
import '../../shared/widgets/utility_widgets.dart';
import '../../providers/app_providers.dart';

class MissionsLeaderboardScreen extends ConsumerStatefulWidget {
  const MissionsLeaderboardScreen({super.key});

  @override
  ConsumerState<MissionsLeaderboardScreen> createState() => _MissionsLeaderboardScreenState();
}

class _MissionsLeaderboardScreenState extends ConsumerState<MissionsLeaderboardScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final missionAsync = ref.watch(currentMissionProvider);
    final leaderboardAsync = ref.watch(leaderboardProvider);
    final userAsync = ref.watch(currentUserProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Placement Mission'),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primaryGreen,
          indicatorWeight: 3,
          labelColor: AppColors.primaryGreen,
          unselectedLabelColor: AppColors.textSecondary,
          labelStyle: AppTextStyles.bodyMd.copyWith(fontWeight: FontWeight.w700),
          unselectedLabelStyle: AppTextStyles.bodyMd,
          tabs: const [
            Tab(text: 'MISSIONS'),
            Tab(text: 'LEADERBOARD'),
          ],
        ),
      ),
      body: SafeArea(
        child: TabBarView(
          controller: _tabController,
          children: [
            // TAB 1: MISSIONS
            _buildMissionsTab(context, missionAsync, userAsync),

            // TAB 2: LEADERBOARD
            _buildLeaderboardTab(context, leaderboardAsync, userAsync),
          ],
        ),
      ),
    );
  }

  Widget _buildMissionsTab(
    BuildContext context,
    AsyncValue<dynamic> missionAsync,
    AsyncValue<dynamic> userAsync,
  ) {
    final user = userAsync.value;
    final isPremium = user?.planStatus == 'premium';

    return RefreshIndicator(
      color: AppColors.primaryGreen,
      backgroundColor: AppColors.surfaceCardElevated,
      onRefresh: () async {
        ref.refresh(currentMissionProvider);
        ref.refresh(currentUserProvider);
      },
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Active Cycle Banner
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: AppColors.surfaceInput,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: AppColors.borderSubtle),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.calendar_today_rounded, size: 14, color: AppColors.primaryGreen),
                  const SizedBox(width: 8),
                  Text(
                    'Current Active Cycle: week_1',
                    style: AppTextStyles.label.copyWith(
                      color: AppColors.primaryGreen,
                      fontWeight: FontWeight.w700,
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // If Free User: Show Web-Parity PREMIUM CONTENT LOCKED Card
            if (!isPremium) ...[
              LockedContentCard(
                title: 'PREMIUM CONTENT LOCKED',
                description:
                    'Placement Missions are exclusively for Premium Members. Upgrade now to attempt weekly placement missions, test your skills under real-time constraints, and compete on the global leaderboard.',
                onUpgrade: () => context.push('/plans'),
              ).animate().fadeIn(duration: 400.ms),
            ] else ...[
              missionAsync.when(
                loading: () => const ShimmerCard(height: 180, borderRadius: 18),
                error: (err, _) => EmptyStateWidget(title: 'Mission Error', message: err.toString()),
                data: (mission) {
                  return Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: AppColors.cardGradient,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: AppColors.primaryGreen.withOpacity(0.4)),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
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
                                    style: AppTextStyles.h2.copyWith(fontWeight: FontWeight.w700),
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
                          ],
                        ),
                        const SizedBox(height: 16),
                        Text(
                          mission.description,
                          style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary),
                        ),
                        const SizedBox(height: 20),
                        SizedBox(
                          width: double.infinity,
                          child: PrimaryButton(
                            text: 'Start Placement Mission',
                            onPressed: () => context.push('/missions/${mission.id}'),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ),
            ],
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildLeaderboardTab(
    BuildContext context,
    AsyncValue<dynamic> leaderboardAsync,
    AsyncValue<dynamic> userAsync,
  ) {
    return RefreshIndicator(
      color: AppColors.primaryGreen,
      backgroundColor: AppColors.surfaceCardElevated,
      onRefresh: () async {
        ref.refresh(leaderboardProvider);
      },
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top 3 Podium
            leaderboardAsync.when(
              loading: () => const ShimmerCard(height: 160, borderRadius: 18),
              error: (_, __) => const SizedBox(),
              data: (entries) {
                if (entries.length < 3) return const SizedBox();
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
                      _buildPodiumAvatar(entries[1], 2, 48),
                      _buildPodiumAvatar(entries[0], 1, 60),
                      _buildPodiumAvatar(entries[2], 3, 48),
                    ],
                  ),
                );
              },
            ).animate().fadeIn(duration: 400.ms),
            const SizedBox(height: 24),

            // Leaderboard Table Header
            Text('PLATFORM LEADERBOARD', style: AppTextStyles.h3),
            const SizedBox(height: 12),

            // List of ranked entries
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
                final user = userAsync.value;

                return ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: entries.length,
                  separatorBuilder: (_, __) => const SizedBox(height: 8),
                  itemBuilder: (context, index) {
                    final entry = entries[index];
                    final isUser = entry.isCurrentUser || entry.name == user?.name;

                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
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
                          // Rank #
                          SizedBox(
                            width: 32,
                            child: Text(
                              '#${entry.rank}',
                              style: AppTextStyles.bodyMd.copyWith(
                                fontWeight: FontWeight.w800,
                                color: isUser ? AppColors.primaryGreen : AppColors.textMuted,
                              ),
                            ),
                          ),
                          const SizedBox(width: 8),
                          // Student Avatar
                          CircleAvatar(
                            radius: 16,
                            backgroundColor: AppColors.surfaceCardElevated,
                            child: Text(
                              entry.name.substring(0, 1).toUpperCase(),
                              style: AppTextStyles.bodySm.copyWith(
                                fontWeight: FontWeight.w700,
                                color: isUser ? AppColors.primaryGreen : AppColors.textPrimary,
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          // Student Name & Badge
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  entry.name,
                                  style: AppTextStyles.bodyMd.copyWith(
                                    fontWeight: FontWeight.w700,
                                    color: isUser ? AppColors.primaryGreen : AppColors.textPrimary,
                                  ),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                                const SizedBox(height: 2),
                                _buildRankBadge(entry.rank),
                              ],
                            ),
                          ),
                          // Score in XP
                          Text(
                            '${entry.score} XP',
                            style: AppTextStyles.bodyMd.copyWith(
                              fontWeight: FontWeight.w800,
                              color: AppColors.accentYellow,
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                );
              },
            ),
            const SizedBox(height: 24),
          ],
        ),
      ),
    );
  }

  Widget _buildRankBadge(int rank) {
    String label = 'Participant';
    Color color = AppColors.textMuted;

    if (rank == 1) {
      label = '🥇 Gold';
      color = AppColors.accentYellow;
    } else if (rank == 2) {
      label = '🥈 Silver';
      color = const Color(0xFFC0C0C0);
    } else if (rank == 3) {
      label = '🥉 Bronze';
      color = const Color(0xFFCD7F32);
    } else if (rank <= 5) {
      label = '⭐ Runner-Up';
      color = const Color(0xFF38BDF8);
    } else if (rank <= 10) {
      label = '🎖️ Top 10 Performer';
      color = const Color(0xFFA855F7);
    }

    return Text(
      label,
      style: AppTextStyles.label.copyWith(
        color: color,
        fontWeight: FontWeight.w700,
        fontSize: 10,
      ),
    );
  }

  Widget _buildPodiumAvatar(dynamic entry, int rank, double size) {
    Color ringColor = AppColors.accentYellow;
    String crown = '👑';
    if (rank == 2) {
      ringColor = const Color(0xFFC0C0C0);
      crown = '🥈';
    } else if (rank == 3) {
      ringColor = const Color(0xFFCD7F32);
      crown = '🥉';
    }

    return Column(
      children: [
        Text(crown, style: const TextStyle(fontSize: 18)),
        const SizedBox(height: 4),
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: ringColor, width: 2),
          ),
          child: Center(
            child: Text(
              entry.name.substring(0, 1),
              style: AppTextStyles.h2.copyWith(color: ringColor),
            ),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          entry.name.split(' ').first,
          style: AppTextStyles.bodySm.copyWith(fontWeight: FontWeight.w700),
          maxLines: 1,
        ),
        Text(
          '${entry.score} XP',
          style: AppTextStyles.label.copyWith(color: AppColors.accentYellow, fontSize: 10),
        ),
      ],
    );
  }
}
