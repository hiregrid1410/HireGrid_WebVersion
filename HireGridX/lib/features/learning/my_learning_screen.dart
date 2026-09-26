import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/text_styles.dart';
import '../../shared/widgets/card_widgets.dart';
import '../../shared/widgets/utility_widgets.dart';
import '../../providers/app_providers.dart';

class MyLearningScreen extends ConsumerStatefulWidget {
  const MyLearningScreen({super.key});

  @override
  ConsumerState<MyLearningScreen> createState() => _MyLearningScreenState();
}

class _MyLearningScreenState extends ConsumerState<MyLearningScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  Widget build(BuildContext context) {
    final modulesAsync = ref.watch(modulesListProvider(null));
    final subjectsAsync = ref.watch(subjectsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Learning'),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: AppColors.primaryGreen,
          indicatorWeight: 3,
          labelColor: AppColors.primaryGreen,
          unselectedLabelColor: AppColors.textSecondary,
          labelStyle: AppTextStyles.bodyMd.copyWith(fontWeight: FontWeight.w700),
          unselectedLabelStyle: AppTextStyles.bodyMd,
          tabs: const [
            Tab(text: 'Modules'),
            Tab(text: 'Subjects'),
            Tab(text: 'My Progress'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // TAB 1: MODULES
          _buildModulesTab(modulesAsync),

          // TAB 2: SUBJECTS (Initial-Avatar Cards)
          _buildSubjectsTab(subjectsAsync),

          // TAB 3: MY PROGRESS
          _buildProgressTab(modulesAsync),
        ],
      ),
    );
  }

  Widget _buildModulesTab(AsyncValue modulesAsync) {
    return modulesAsync.when(
      loading: () => ListView.separated(
        padding: const EdgeInsets.all(20),
        itemCount: 4,
        separatorBuilder: (_, __) => const SizedBox(height: 12),
        itemBuilder: (_, __) => const ShimmerCard(height: 100, borderRadius: 18),
      ),
      error: (err, _) => EmptyStateWidget(
        title: 'Error loading modules',
        message: err.toString(),
        actionText: 'Retry',
        onAction: () => ref.refresh(modulesListProvider(null)),
      ),
      data: (modules) {
        return ListView.separated(
          padding: const EdgeInsets.all(20),
          itemCount: modules.length,
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final module = modules[index];
            return ModuleProgressCard(
              module: module,
              onTap: () => context.push('/learn/module/${module.id}'),
            ).animate().fadeIn(delay: (index * 60).ms).slideY(begin: 0.08, end: 0);
          },
        );
      },
    );
  }

  Widget _buildSubjectsTab(AsyncValue subjectsAsync) {
    return subjectsAsync.when(
      loading: () => const Padding(
        padding: EdgeInsets.all(20),
        child: ShimmerCard(height: 200),
      ),
      error: (err, _) => EmptyStateWidget(
        title: 'Error loading subjects',
        message: err.toString(),
      ),
      data: (subjects) {
        return SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Breadcrumb
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: AppColors.surfaceCardElevated,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.account_tree_outlined, color: AppColors.primaryGreen, size: 16),
                    const SizedBox(width: 6),
                    Text(
                      'Branches ▸ Computer Engineering',
                      style: AppTextStyles.bodySm.copyWith(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),

              // Subject Grid
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: subjects.length,
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 2,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 1.1,
                ),
                itemBuilder: (context, index) {
                  final subject = subjects[index];
                  final colors = [
                    AppColors.primaryGreen,
                    AppColors.accentYellow,
                    const Color(0xFF38BDF8),
                    const Color(0xFFA855F7),
                    const Color(0xFFEC4899),
                    const Color(0xFF10B981),
                  ];
                  final color = colors[index % colors.length];

                  return Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: AppColors.surfaceCard,
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: AppColors.borderSubtle),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: color.withOpacity(0.15),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Center(
                            child: Text(
                              subject.initial,
                              style: AppTextStyles.h2.copyWith(
                                color: color,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ),
                        const Spacer(),
                        Text(
                          subject.name,
                          style: AppTextStyles.bodyMd.copyWith(
                            fontWeight: FontWeight.w700,
                            color: AppColors.textPrimary,
                          ),
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${subject.completedModules}/${subject.totalModules} Done',
                          style: AppTextStyles.bodySm.copyWith(color: AppColors.textMuted),
                        ),
                      ],
                    ),
                  ).animate().fadeIn(delay: (index * 50).ms).scale(begin: const Offset(0.9, 0.9), end: const Offset(1, 1));
                },
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildProgressTab(AsyncValue modulesAsync) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Overall Progress Ring Card
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              gradient: AppColors.cardGradient,
              borderRadius: BorderRadius.circular(18),
              border: Border.all(color: AppColors.borderSubtle),
            ),
            child: Row(
              children: [
                SizedBox(
                  width: 80,
                  height: 80,
                  child: Stack(
                    alignment: Alignment.center,
                    children: [
                      CircularProgressIndicator(
                        value: 0.48,
                        strokeWidth: 8,
                        backgroundColor: AppColors.surfaceInput,
                        valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primaryGreen),
                      ),
                      Text(
                        '48%',
                        style: AppTextStyles.h2.copyWith(
                          color: AppColors.primaryGreen,
                          fontWeight: FontWeight.w800,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 20),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Overall Mastery', style: AppTextStyles.h2),
                      const SizedBox(height: 4),
                      Text(
                        '24 of 50 Modules completed across placement curriculum.',
                        style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ).animate().fadeIn(),
          const SizedBox(height: 24),

          Text('Category Breakdown', style: AppTextStyles.h3),
          const SizedBox(height: 12),
          _buildProgressCategoryRow('Quantitative Aptitude', 0.60, AppColors.primaryGreen),
          const SizedBox(height: 10),
          _buildProgressCategoryRow('Logical Reasoning', 0.40, AppColors.accentYellow),
          const SizedBox(height: 10),
          _buildProgressCategoryRow('Verbal Ability', 0.25, const Color(0xFF38BDF8)),
          const SizedBox(height: 10),
          _buildProgressCategoryRow('Technical Core (CS)', 0.10, const Color(0xFFA855F7)),
        ],
      ),
    );
  }

  Widget _buildProgressCategoryRow(String label, double progress, Color color) {
    final pct = (progress * 100).toInt();
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surfaceCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(label, style: AppTextStyles.bodyMd.copyWith(fontWeight: FontWeight.w600)),
              Text('$pct%', style: AppTextStyles.bodySm.copyWith(color: color, fontWeight: FontWeight.w700)),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: LinearProgressIndicator(
              value: progress,
              backgroundColor: AppColors.surfaceInput,
              valueColor: AlwaysStoppedAnimation<Color>(color),
              minHeight: 6,
            ),
          ),
        ],
      ),
    );
  }
}
