import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/text_styles.dart';
import '../../data/models/module_model.dart';
import '../../shared/widgets/stat_widgets.dart';
import '../../shared/widgets/app_buttons.dart';
import '../../shared/widgets/utility_widgets.dart';
import '../../providers/app_providers.dart';

class ModuleDetailScreen extends ConsumerWidget {
  final String moduleId;

  const ModuleDetailScreen({super.key, required this.moduleId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final moduleAsync = ref.watch(moduleDetailProvider(moduleId));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Module Detail'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: moduleAsync.when(
          loading: () => const Padding(
            padding: EdgeInsets.all(20),
            child: ShimmerCard(height: 300),
          ),
          error: (err, _) => EmptyStateWidget(
            title: 'Failed to load module',
            message: err.toString(),
            actionText: 'Back',
            onAction: () => context.pop(),
          ),
          data: (module) {
            if (module == null) {
              return const EmptyStateWidget(
                title: 'Module not found',
                message: 'This module is currently unavailable.',
              );
            }

            return SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Module Header Card
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: AppColors.cardGradient,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: AppColors.borderSubtle),
                    ),
                    child: Column(
                      children: [
                        Container(
                          width: 56,
                          height: 56,
                          decoration: BoxDecoration(
                            color: AppColors.primaryGreen.withOpacity(0.12),
                            borderRadius: BorderRadius.circular(14),
                          ),
                          child: const Center(
                            child: Icon(Icons.psychology_outlined, color: AppColors.primaryGreen, size: 28),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(module.title, style: AppTextStyles.h2, textAlign: TextAlign.center),
                        const SizedBox(height: 4),
                        Text(
                          '${module.category} • 20 Qs • 30 mins',
                          style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary),
                        ),
                        const SizedBox(height: 10),
                        TierBadge(isPremium: module.isPremium),
                      ],
                    ),
                  ).animate().fadeIn(duration: 400.ms),
                  const SizedBox(height: 20),

                  // About Section
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
                        Text('About', style: AppTextStyles.h3),
                        const SizedBox(height: 8),
                        Text(
                          module.description,
                          style: AppTextStyles.bodyMd.copyWith(color: AppColors.textSecondary),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          children: [
                            Expanded(
                              child: SecondaryButton(
                                text: 'View Syllabus',
                                onPressed: () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    SnackBar(
                                      content: Text('Syllabus PDF will open in reader', style: AppTextStyles.bodySm),
                                      backgroundColor: AppColors.surfaceCardElevated,
                                    ),
                                  );
                                },
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: PrimaryButton(
                                text: 'Start Test',
                                onPressed: () => context.push('/exam/att_${module.id}'),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ).animate().fadeIn(delay: 150.ms),
                  const SizedBox(height: 24),

                  // Module Tests List
                  Text('Module Tests', style: AppTextStyles.h2).animate().fadeIn(delay: 200.ms),
                  const SizedBox(height: 12),

                  ...module.tests.map((test) {
                    final isLocked = test.isLocked;
                    Color starColor = AppColors.accentYellow;
                    if (isLocked) starColor = AppColors.textMuted;

                    return Container(
                      margin: const EdgeInsets.only(bottom: 12),
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
                              color: isLocked ? AppColors.surfaceInput : AppColors.accentYellow.withOpacity(0.12),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Icon(
                              isLocked ? Icons.lock_outline_rounded : Icons.star_rounded,
                              color: starColor,
                              size: 22,
                            ),
                          ),
                          const SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  test.title,
                                  style: AppTextStyles.bodyMd.copyWith(
                                    fontWeight: FontWeight.w700,
                                    color: isLocked ? AppColors.textMuted : AppColors.textPrimary,
                                  ),
                                ),
                                const SizedBox(height: 2),
                                Text(
                                  '${test.questionCount} Qs • ${test.durationMinutes} mins',
                                  style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary),
                                ),
                              ],
                            ),
                          ),
                          if (isLocked)
                            IconButton(
                              icon: const Icon(Icons.lock_rounded, color: AppColors.accentYellow, size: 20),
                              onPressed: () => context.push('/plans'),
                            )
                          else
                            IconButton(
                              icon: const Icon(Icons.play_circle_fill_rounded, color: AppColors.primaryGreen, size: 32),
                              onPressed: () => context.push('/exam/att_${test.id}'),
                            ),
                        ],
                      ),
                    ).animate().fadeIn(delay: 250.ms);
                  }),
                  const SizedBox(height: 24),
                ],
              ),
            );
          },
        ),
      ),
    );
  }
}
