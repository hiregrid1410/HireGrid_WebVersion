import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/text_styles.dart';
import '../../data/models/company_model.dart';
import '../../shared/widgets/stat_widgets.dart';
import '../../shared/widgets/app_buttons.dart';
import '../../shared/widgets/utility_widgets.dart';
import '../../providers/app_providers.dart';

class CompanyDetailScreen extends ConsumerWidget {
  final String companyId;

  const CompanyDetailScreen({super.key, required this.companyId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final companyAsync = ref.watch(companyDetailProvider(companyId));
    final userAsync = ref.watch(currentUserProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(companyId.toUpperCase()),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: companyAsync.when(
          loading: () => const Padding(
            padding: EdgeInsets.all(20),
            child: ShimmerCard(height: 300),
          ),
          error: (err, _) => EmptyStateWidget(
            title: 'Failed to load details',
            message: err.toString(),
            actionText: 'Go Back',
            onAction: () => context.pop(),
          ),
          data: (company) {
            if (company == null) {
              return const EmptyStateWidget(
                title: 'Company not found',
                message: 'This company profile is currently unavailable.',
              );
            }

            final user = userAsync.value;
            final isUserPremium = user?.planStatus == 'premium';
            final isCompanyPaid = company.tier == CompanyTier.premium && !isUserPremium;

            return SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // 1. Company Header Banner Card
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
                          width: 64,
                          height: 64,
                          decoration: BoxDecoration(
                            color: AppColors.surfaceInput,
                            borderRadius: BorderRadius.circular(16),
                            border: Border.all(color: AppColors.borderSubtle),
                          ),
                          child: Center(
                            child: Text(
                              company.name.substring(0, company.name.length >= 3 ? 3 : company.name.length).toUpperCase(),
                              style: AppTextStyles.h2.copyWith(
                                color: isCompanyPaid ? AppColors.accentYellow : AppColors.primaryGreen,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(company.name, style: AppTextStyles.h1),
                        const SizedBox(height: 6),
                        TierBadge(
                          isPremium: isCompanyPaid,
                          customText: isCompanyPaid ? 'PAID ACCESS' : 'UNLOCKED',
                        ),
                        const SizedBox(height: 12),
                        Text(
                          company.description,
                          textAlign: TextAlign.center,
                          style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                          children: [
                            _buildMiniStat('EXAMS', '${company.totalExams}'),
                            _buildMiniStat('QUESTIONS', '${company.totalQuestions}+'),
                            _buildMiniStat('AVG PACKAGE', '${company.avgSalaryLpa} LPA'),
                          ],
                        ),
                      ],
                    ),
                  ).animate().fadeIn(duration: 400.ms),
                  const SizedBox(height: 20),

                  // 2. About Placement Criteria (Web Parity Disclaimer Card)
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
                            const Icon(Icons.info_outline_rounded, color: AppColors.accentYellow, size: 20),
                            const SizedBox(width: 8),
                            Text('About Placement Criteria', style: AppTextStyles.h3),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text(
                          'These assessments are designed for educational and practice purposes. Patterns and questions are modeled on past candidate placement experiences.',
                          style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary, height: 1.4),
                        ),
                        if (company.hiringCriteria.isNotEmpty) ...[
                          const SizedBox(height: 12),
                          ...company.hiringCriteria.map((crit) {
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 6),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('• ', style: TextStyle(color: AppColors.primaryGreen, fontSize: 16)),
                                  Expanded(
                                    child: Text(crit, style: AppTextStyles.bodySm),
                                  ),
                                ],
                              ),
                            );
                          }),
                        ],
                      ],
                    ),
                  ).animate().fadeIn(delay: 150.ms),
                  const SizedBox(height: 24),

                  // 3. COMPANY ASSESSMENTS
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text('COMPANY ASSESSMENTS', style: AppTextStyles.h2),
                      Text(
                        '${company.totalExams} Modules',
                        style: AppTextStyles.bodySm.copyWith(color: AppColors.textMuted),
                      ),
                    ],
                  ).animate().fadeIn(delay: 200.ms),
                  const SizedBox(height: 14),

                  ref.watch(companyAssessmentsProvider(company.id)).when(
                    loading: () => const ShimmerCard(height: 120),
                    error: (_, __) => const SizedBox(),
                    data: (assessments) {
                      if (assessments.isEmpty) {
                        return Column(
                          children: [
                            _buildModuleCard(
                              context: context,
                              moduleNumber: 1,
                              category: 'TECHNICAL',
                              title: '${company.name} Technical & Aptitude Mock',
                              qsCount: 20,
                              durationMins: 30,
                              passPercentage: 60,
                              score: user?.moduleScores['mod_${company.id}_1'],
                              isLocked: isCompanyPaid,
                              onTap: () {
                                if (isCompanyPaid) {
                                  _showUpgradeModal(context);
                                } else {
                                  context.push('/exam/att_${company.id}_1');
                                }
                              },
                            ),
                          ],
                        );
                      }

                      return Column(
                        children: assessments.asMap().entries.map((entry) {
                          final idx = entry.key + 1;
                          final assessment = entry.value;
                          final score = user?.moduleScores[assessment.id];

                          return Padding(
                            padding: const EdgeInsets.only(bottom: 14),
                            child: _buildModuleCard(
                              context: context,
                              moduleNumber: idx,
                              category: assessment.difficulty.name.toUpperCase(),
                              title: '${company.name} - ${assessment.title}',
                              qsCount: assessment.questionCount,
                              durationMins: assessment.durationMinutes,
                              passPercentage: 60,
                              score: score,
                              isLocked: isCompanyPaid || assessment.isLocked,
                              onTap: () {
                                if (isCompanyPaid || assessment.isLocked) {
                                  _showUpgradeModal(context);
                                } else {
                                  context.push('/exam/att_${assessment.id}');
                                }
                              },
                            ),
                          );
                        }).toList(),
                      );
                    },
                  ),
                  const SizedBox(height: 24),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Widget _buildMiniStat(String label, String value) {
    return Column(
      children: [
        Text(value, style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w700)),
        const SizedBox(height: 2),
        Text(label, style: AppTextStyles.label.copyWith(fontSize: 10)),
      ],
    );
  }

  Widget _buildModuleCard({
    required BuildContext context,
    required int moduleNumber,
    required String category,
    required String title,
    required int qsCount,
    required int durationMins,
    required int passPercentage,
    required double? score,
    required bool isLocked,
    required VoidCallback onTap,
  }) {
    // Determine status badge
    String statusBadge = 'NOT ATTEMPTED';
    Color badgeColor = AppColors.textMuted;
    String actionLabel = 'Start Exam';

    if (isLocked) {
      statusBadge = 'PAID LOCKED';
      badgeColor = AppColors.accentYellow;
      actionLabel = 'Upgrade to Unlock';
    } else if (score != null) {
      if (score >= passPercentage) {
        statusBadge = 'PASSED (${score.toInt()}%)';
        badgeColor = AppColors.primaryGreen;
        actionLabel = 'Retake Exam';
      } else {
        statusBadge = 'FAILED (${score.toInt()}%)';
        badgeColor = AppColors.danger;
        actionLabel = 'Retake Exam';
      }
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surfaceCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isLocked ? AppColors.accentYellow.withOpacity(0.3) : AppColors.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: AppColors.surfaceInput,
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  'MODULE-$moduleNumber • $category',
                  style: AppTextStyles.label.copyWith(
                    color: AppColors.textSecondary,
                    fontSize: 10,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: badgeColor.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(color: badgeColor.withOpacity(0.4), width: 1),
                ),
                child: Text(
                  statusBadge,
                  style: AppTextStyles.label.copyWith(
                    color: badgeColor,
                    fontSize: 10,
                    fontWeight: FontWeight.w800,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Text(title, style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          Text(
            '$qsCount Qs · $durationMins mins · Pass: $passPercentage%',
            style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary, fontSize: 12),
          ),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            height: 44,
            child: isLocked
                ? SecondaryButton(
                    text: actionLabel,
                    icon: const Icon(Icons.lock_rounded, size: 16, color: AppColors.accentYellow),
                    borderColor: AppColors.accentYellow.withOpacity(0.5),
                    textColor: AppColors.accentYellow,
                    onPressed: onTap,
                  )
                : PrimaryButton(
                    text: actionLabel,
                    height: 44,
                    onPressed: onTap,
                  ),
          ),
        ],
      ),
    );
  }

  void _showUpgradeModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: AppColors.surfaceCardElevated,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (ctx) => Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 54,
              height: 54,
              decoration: BoxDecoration(
                color: AppColors.accentYellow.withOpacity(0.12),
                shape: BoxShape.circle,
              ),
              child: const Icon(Icons.lock_rounded, color: AppColors.accentYellow, size: 28),
            ),
            const SizedBox(height: 16),
            Text(
              'Premium Content Locked',
              style: AppTextStyles.h2.copyWith(color: AppColors.accentYellow),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'This company assessment is exclusively available for Premium members. Upgrade your plan to get full access.',
              style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.accentYellow,
                  foregroundColor: Colors.black,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  elevation: 0,
                ),
                onPressed: () {
                  Navigator.pop(ctx);
                  context.push('/plans');
                },
                child: Text(
                  'View Premium Plans',
                  style: AppTextStyles.button.copyWith(color: Colors.black, fontWeight: FontWeight.w800),
                ),
              ),
            ),
            const SizedBox(height: 10),
          ],
        ),
      ),
    );
  }
}
