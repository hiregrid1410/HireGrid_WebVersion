import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/text_styles.dart';
import '../../data/models/revision_model.dart';
import '../../providers/app_providers.dart';
import '../../shared/widgets/utility_widgets.dart';

class RevisionScreen extends ConsumerStatefulWidget {
  const RevisionScreen({super.key});

  @override
  ConsumerState<RevisionScreen> createState() => _RevisionScreenState();
}

class _RevisionScreenState extends ConsumerState<RevisionScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final schedulesAsync = ref.watch(revisionSchedulesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Module Revision'),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primaryGreen,
          labelColor: AppColors.primaryGreen,
          unselectedLabelColor: AppColors.textMuted,
          labelStyle: AppTextStyles.label.copyWith(fontSize: 13, fontWeight: FontWeight.w700),
          tabs: const [
            Tab(text: "Today's Due"),
            Tab(text: "Upcoming"),
            Tab(text: "Completed"),
          ],
        ),
      ),
      body: SafeArea(
        child: schedulesAsync.when(
          loading: () => const Center(
            child: CircularProgressIndicator(color: AppColors.primaryGreen),
          ),
          error: (err, _) => Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline_rounded, color: AppColors.danger, size: 48),
                  const SizedBox(height: 12),
                  Text('Failed to load revisions', style: AppTextStyles.h3),
                  const SizedBox(height: 6),
                  Text(err.toString(), style: AppTextStyles.bodySm, textAlign: TextAlign.center),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => ref.refresh(revisionSchedulesProvider),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primaryGreen,
                      foregroundColor: Colors.black,
                    ),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            ),
          ),
          data: (data) => TabBarView(
            controller: _tabController,
            children: [
              _buildDueTab(data.todayDue),
              _buildUpcomingTab(data.upcoming),
              _buildCompletedTab(data.completed),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDueTab(List<RevisionScheduleItem> items) {
    if (items.isEmpty) {
      return RefreshIndicator(
        color: AppColors.primaryGreen,
        onRefresh: () async => ref.refresh(revisionSchedulesProvider),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(32),
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const SizedBox(height: 60),
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppColors.primaryGreen.withOpacity(0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.check_circle_outline_rounded, color: AppColors.primaryGreen, size: 54),
                ),
                const SizedBox(height: 16),
                Text('All Caught Up for Today!', style: AppTextStyles.h2),
                const SizedBox(height: 8),
                Text(
                  'No revisions due right now. You can check upcoming schedules or keep learning new topics in the Learning section.',
                  style: AppTextStyles.bodyMd.copyWith(color: AppColors.textSecondary),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      );
    }

    return RefreshIndicator(
      color: AppColors.primaryGreen,
      onRefresh: () async => ref.refresh(revisionSchedulesProvider),
      child: ListView.separated(
        padding: const EdgeInsets.all(20),
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(height: 16),
        itemBuilder: (context, index) {
          final item = items[index];
          return _buildRevisionCard(item, isDue: true).animate().fadeIn(delay: (index * 50).ms);
        },
      ),
    );
  }

  Widget _buildUpcomingTab(List<RevisionScheduleItem> items) {
    if (items.isEmpty) {
      return RefreshIndicator(
        color: AppColors.primaryGreen,
        onRefresh: () async => ref.refresh(revisionSchedulesProvider),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(32),
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const SizedBox(height: 60),
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceCardElevated,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.calendar_today_rounded, color: AppColors.textMuted, size: 54),
                ),
                const SizedBox(height: 16),
                Text('No Upcoming Revisions', style: AppTextStyles.h2),
                const SizedBox(height: 8),
                Text(
                  'Complete topics and tests in the Learning tab to automatically trigger Day 1, Day 3, and Day 7 spaced revisions.',
                  style: AppTextStyles.bodyMd.copyWith(color: AppColors.textSecondary),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      );
    }

    return RefreshIndicator(
      color: AppColors.primaryGreen,
      onRefresh: () async => ref.refresh(revisionSchedulesProvider),
      child: ListView.separated(
        padding: const EdgeInsets.all(20),
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(height: 16),
        itemBuilder: (context, index) {
          final item = items[index];
          return _buildRevisionCard(item, isDue: false).animate().fadeIn(delay: (index * 50).ms);
        },
      ),
    );
  }

  Widget _buildCompletedTab(List<RevisionScheduleItem> items) {
    if (items.isEmpty) {
      return RefreshIndicator(
        color: AppColors.primaryGreen,
        onRefresh: () async => ref.refresh(revisionSchedulesProvider),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(32),
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const SizedBox(height: 60),
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceCardElevated,
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.history_rounded, color: AppColors.textMuted, size: 54),
                ),
                const SizedBox(height: 16),
                Text('No Completed Revisions', style: AppTextStyles.h2),
                const SizedBox(height: 8),
                Text(
                  'Complete your due revision tests to lock in concepts and see your mastery history here.',
                  style: AppTextStyles.bodyMd.copyWith(color: AppColors.textSecondary),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      );
    }

    return RefreshIndicator(
      color: AppColors.primaryGreen,
      onRefresh: () async => ref.refresh(revisionSchedulesProvider),
      child: ListView.separated(
        padding: const EdgeInsets.all(20),
        itemCount: items.length,
        separatorBuilder: (_, __) => const SizedBox(height: 16),
        itemBuilder: (context, index) {
          final item = items[index];
          return _buildCompletedCard(item).animate().fadeIn(delay: (index * 50).ms);
        },
      ),
    );
  }

  Widget _buildRevisionCard(RevisionScheduleItem item, {required bool isDue}) {
    Color badgeColor = AppColors.primaryGreen;
    if (item.stage == 'day3') badgeColor = const Color(0xFF38BDF8);
    if (item.stage == 'day7') badgeColor = const Color(0xFFA855F7);

    final isLocked = !item.isUnlocked;

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: AppColors.cardGradient,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isDue && !isLocked ? AppColors.primaryGreen.withOpacity(0.4) : AppColors.borderSubtle,
        ),
        boxShadow: isDue && !isLocked
            ? [
                BoxShadow(
                  color: AppColors.primaryGreen.withOpacity(0.08),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                )
              ]
            : null,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header: Stage Badge + MCQ count
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: badgeColor.withOpacity(0.15),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: badgeColor.withOpacity(0.3)),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      item.stage == 'day7'
                          ? Icons.offline_bolt_rounded
                          : (item.stage == 'day3' ? Icons.menu_book_rounded : Icons.radar_rounded),
                      color: badgeColor,
                      size: 14,
                    ),
                    const SizedBox(width: 5),
                    Text(
                      item.stageLabel ?? 'Day 1',
                      style: AppTextStyles.label.copyWith(color: badgeColor, fontSize: 11, fontWeight: FontWeight.w800),
                    ),
                  ],
                ),
              ),
              Row(
                children: [
                  const Icon(Icons.quiz_outlined, size: 14, color: AppColors.textMuted),
                  const SizedBox(width: 4),
                  Text(
                    '${item.mcqCount} Random MCQs',
                    style: AppTextStyles.label.copyWith(color: AppColors.textSecondary, fontSize: 11),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 12),

          // Title & Hierarchy
          Text(
            item.title,
            style: AppTextStyles.h2.copyWith(fontSize: 16),
          ),
          const SizedBox(height: 4),
          Text(
            '${item.subjectName ?? 'Subject'}  ›  ${item.topicName ?? 'Topic'}',
            style: AppTextStyles.bodySm.copyWith(color: AppColors.textMuted),
          ),

          if (isLocked) ...[
            const SizedBox(height: 14),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.surfaceCardElevated,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.borderSubtle),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.lock_outline_rounded, color: AppColors.accentYellow, size: 16),
                      const SizedBox(width: 6),
                      Expanded(
                        child: Text(
                          'Subject Completion Required',
                          style: AppTextStyles.label.copyWith(color: AppColors.accentYellow, fontSize: 11),
                        ),
                      ),
                      Text(
                        '${item.completedModules}/${item.totalModules} modules',
                        style: AppTextStyles.label.copyWith(color: AppColors.textSecondary, fontSize: 11),
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: item.totalModules > 0 ? (item.completedModules / item.totalModules).clamp(0.0, 1.0) : 1.0,
                      backgroundColor: Colors.white.withOpacity(0.05),
                      valueColor: const AlwaysStoppedAnimation<Color>(AppColors.accentYellow),
                      minHeight: 5,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Finish all modules under "${item.subjectName}" in the Learning tab to unlock this spaced revision.',
                    style: AppTextStyles.bodySm.copyWith(color: AppColors.textMuted, fontSize: 10),
                  ),
                ],
              ),
            ),
          ],

          const SizedBox(height: 16),

          // Action Button
          if (!isLocked) ...[
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  final targetId = item.topicId ?? item.revisionModuleId;
                  context.push('/exam/rev_$targetId');
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: isDue ? AppColors.primaryGreen : AppColors.surfaceCardElevated,
                  foregroundColor: isDue ? Colors.black : Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                    side: isDue ? BorderSide.none : const BorderSide(color: AppColors.borderSubtle),
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      isDue ? Icons.play_arrow_rounded : Icons.flash_on_rounded,
                      size: 18,
                      color: isDue ? Colors.black : AppColors.primaryGreen,
                    ),
                    const SizedBox(width: 6),
                    Text(
                      isDue ? 'Start Revision Test' : 'Early Practice (${item.stageLabel})',
                      style: AppTextStyles.button.copyWith(
                        color: isDue ? Colors.black : Colors.white,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildCompletedCard(RevisionScheduleItem item) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: AppColors.cardGradient,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.borderSubtle),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.primaryGreen.withOpacity(0.12),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.done_all_rounded, color: AppColors.primaryGreen, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.title,
                  style: AppTextStyles.h3.copyWith(fontSize: 15),
                ),
                const SizedBox(height: 3),
                Text(
                  '${item.subjectName ?? 'Subject'}  ›  ${item.stageLabel ?? 'Day 1'} Completed',
                  style: AppTextStyles.bodySm.copyWith(color: AppColors.textMuted),
                ),
              ],
            ),
          ),
          OutlinedButton(
            onPressed: () {
              final targetId = item.topicId ?? item.revisionModuleId;
              context.push('/exam/rev_$targetId');
            },
            style: OutlinedButton.styleFrom(
              side: const BorderSide(color: AppColors.borderSubtle),
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: Text(
              'Retake',
              style: AppTextStyles.button.copyWith(fontSize: 12, color: AppColors.primaryGreen),
            ),
          ),
        ],
      ),
    );
  }
}
