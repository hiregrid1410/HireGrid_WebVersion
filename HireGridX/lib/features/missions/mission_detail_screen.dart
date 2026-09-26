import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/text_styles.dart';
import '../../core/constants/dummy_assets.dart';
import '../../shared/widgets/app_buttons.dart';
import '../../shared/widgets/utility_widgets.dart';
import '../../providers/app_providers.dart';

class MissionDetailScreen extends ConsumerStatefulWidget {
  final String missionId;

  const MissionDetailScreen({super.key, required this.missionId});

  @override
  ConsumerState<MissionDetailScreen> createState() => _MissionDetailScreenState();
}

class _MissionDetailScreenState extends ConsumerState<MissionDetailScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  Widget build(BuildContext context) {
    final missionAsync = ref.watch(currentMissionProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Placement Mission'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: missionAsync.when(
          loading: () => const Padding(padding: EdgeInsets.all(20), child: ShimmerCard(height: 300)),
          error: (err, _) => EmptyStateWidget(title: 'Error', message: err.toString()),
          data: (mission) {
            return SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Hero Banner Card with Mountain Silhouette
                  Container(
                    width: double.infinity,
                    height: 180,
                    decoration: BoxDecoration(
                      gradient: AppColors.heroBlueGreenGradient,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: AppColors.primaryGreen.withOpacity(0.3)),
                    ),
                    child: Stack(
                      children: [
                        Positioned.fill(
                          child: CustomPaint(
                            painter: MountainSilhouettePainter(
                              primaryColor: AppColors.primaryGreenDark,
                              secondaryColor: AppColors.deepBlueSlate,
                              opacity: 0.8,
                            ),
                          ),
                        ),
                        Padding(
                          padding: const EdgeInsets.all(18),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    mission.bannerSubtitle,
                                    style: AppTextStyles.label.copyWith(color: AppColors.accentYellow),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    mission.title,
                                    style: AppTextStyles.h2.copyWith(fontWeight: FontWeight.w700),
                                  ),
                                ],
                              ),
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: Colors.black.withOpacity(0.4),
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: AppColors.accentYellow.withOpacity(0.5)),
                                    ),
                                    child: Text(
                                      mission.countdownText,
                                      style: AppTextStyles.bodySm.copyWith(
                                        color: AppColors.accentYellow,
                                        fontWeight: FontWeight.w700,
                                      ),
                                    ),
                                  ),
                                  const Spacer(),
                                  SizedBox(
                                    height: 38,
                                    child: PrimaryButton(
                                      text: 'Join Now',
                                      isFullWidth: false,
                                      onPressed: () {
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          SnackBar(
                                            content: Text('Joined Mission! All tests unlocked.', style: AppTextStyles.bodySm),
                                            backgroundColor: AppColors.primaryGreenDark,
                                          ),
                                        );
                                      },
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ).animate().fadeIn(duration: 400.ms),
                  const SizedBox(height: 20),

                  // Mission Description & Live Participant Count
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceCard,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.borderSubtle),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.people_alt_outlined, color: AppColors.primaryGreen, size: 20),
                            const SizedBox(width: 8),
                            Text(
                              '${mission.participantCount.toString().replaceAllMapped(RegExp(r'(\d{1,3})(?=(\d{3})+(?!\d))'), (Match m) => '${m[1]},')} Students Competing',
                              style: AppTextStyles.bodyMd.copyWith(fontWeight: FontWeight.w600),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text(
                          mission.description,
                          style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                  ).animate().fadeIn(delay: 150.ms),
                  const SizedBox(height: 20),

                  // Tab Bar (Live / Upcoming)
                  TabBar(
                    controller: _tabController,
                    indicatorColor: AppColors.primaryGreen,
                    indicatorWeight: 3,
                    labelColor: AppColors.primaryGreen,
                    unselectedLabelColor: AppColors.textSecondary,
                    labelStyle: AppTextStyles.bodyMd.copyWith(fontWeight: FontWeight.w700),
                    tabs: const [
                      Tab(text: 'Live Assessments'),
                      Tab(text: 'Upcoming'),
                    ],
                  ),
                  const SizedBox(height: 16),

                  SizedBox(
                    height: 280,
                    child: TabBarView(
                      controller: _tabController,
                      children: [
                        // Live Exams List
                        ListView.separated(
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: mission.liveExams.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 10),
                          itemBuilder: (context, index) {
                            final exam = mission.liveExams[index];
                            return _buildMissionExamCard(exam, isLive: true);
                          },
                        ),
                        // Upcoming Exams List
                        ListView.separated(
                          physics: const NeverScrollableScrollPhysics(),
                          itemCount: mission.upcomingExams.length,
                          separatorBuilder: (_, __) => const SizedBox(height: 10),
                          itemBuilder: (context, index) {
                            final exam = mission.upcomingExams[index];
                            return _buildMissionExamCard(exam, isLive: false);
                          },
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildMissionExamCard(dynamic exam, {required bool isLive}) {
    return Container(
      padding: const EdgeInsets.all(14),
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
              color: AppColors.surfaceInput,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Center(
              child: Text(
                exam.companyName.substring(0, 1),
                style: AppTextStyles.h3.copyWith(
                  color: AppColors.primaryGreen,
                  fontWeight: FontWeight.w800,
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(exam.title, style: AppTextStyles.bodyMd.copyWith(fontWeight: FontWeight.w700)),
                const SizedBox(height: 2),
                Text(
                  '${exam.typeSubtitle} • ${exam.endsInText}',
                  style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary),
                ),
              ],
            ),
          ),
          SizedBox(
            height: 36,
            child: isLive
                ? PrimaryButton(
                    text: 'Join',
                    isFullWidth: false,
                    onPressed: () => context.push('/exam/att_mis_${exam.id}'),
                  )
                : Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceInput,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text('Notify', style: AppTextStyles.bodySm.copyWith(color: AppColors.textMuted)),
                  ),
          ),
        ],
      ),
    );
  }
}
