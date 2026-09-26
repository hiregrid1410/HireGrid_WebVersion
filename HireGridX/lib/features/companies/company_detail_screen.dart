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

            return SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Company Header Banner Card
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
                                color: AppColors.primaryGreen,
                                fontWeight: FontWeight.w800,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(company.name, style: AppTextStyles.h1),
                        const SizedBox(height: 6),
                        TierBadge(isPremium: company.tier == CompanyTier.premium),
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
                  const SizedBox(height: 24),

                  // Placement Criteria Card
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
                            const Icon(Icons.verified_outlined, color: AppColors.primaryGreen, size: 20),
                            const SizedBox(width: 8),
                            Text('Placement Eligibility Criteria', style: AppTextStyles.h3),
                          ],
                        ),
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
                    ),
                  ).animate().fadeIn(delay: 150.ms),
                  const SizedBox(height: 24),

                  // Assessments List
                  Text('Company Assessments', style: AppTextStyles.h2).animate().fadeIn(delay: 200.ms),
                  const SizedBox(height: 12),

                  _buildAssessmentCard(
                    context: context,
                    title: '${company.name} - Cognitive & Reasoning',
                    subtitle: 'Aptitude • 20 Qs • 30 mins',
                    statusText: 'Passed 85%',
                    statusColor: AppColors.primaryGreen,
                    buttonText: 'Retake Exam',
                    isLocked: false,
                    onTap: () => context.push('/exam/att_demo_1'),
                  ).animate().fadeIn(delay: 250.ms),
                  const SizedBox(height: 12),

                  _buildAssessmentCard(
                    context: context,
                    title: '${company.name} - Technical Assessment',
                    subtitle: 'Core CS • 25 Qs • 40 mins',
                    statusText: 'Not Started',
                    statusColor: AppColors.textMuted,
                    buttonText: 'Start Exam',
                    isLocked: false,
                    onTap: () => context.push('/exam/att_demo_2'),
                  ).animate().fadeIn(delay: 300.ms),
                  const SizedBox(height: 12),

                  _buildAssessmentCard(
                    context: context,
                    title: '${company.name} - Advanced Coding Mock',
                    subtitle: 'Algorithms • 15 Qs • 45 mins',
                    statusText: 'Locked (Premium)',
                    statusColor: AppColors.accentYellow,
                    buttonText: 'Upgrade to Unlock',
                    isLocked: true,
                    onTap: () => context.push('/plans'),
                  ).animate().fadeIn(delay: 350.ms),
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

  Widget _buildAssessmentCard({
    required BuildContext context,
    required String title,
    required String subtitle,
    required String statusText,
    required Color statusColor,
    required String buttonText,
    required bool isLocked,
    required VoidCallback onTap,
  }) {
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
          Row(
            children: [
              Expanded(
                child: Text(title, style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w600)),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  statusText,
                  style: AppTextStyles.label.copyWith(color: statusColor, fontSize: 10),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          Text(subtitle, style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary)),
          const SizedBox(height: 14),
          SizedBox(
            width: double.infinity,
            height: 44,
            child: isLocked
                ? SecondaryButton(
                    text: buttonText,
                    icon: const Icon(Icons.lock_rounded, size: 16, color: AppColors.accentYellow),
                    borderColor: AppColors.accentYellow.withOpacity(0.5),
                    textColor: AppColors.accentYellow,
                    onPressed: onTap,
                  )
                : PrimaryButton(
                    text: buttonText,
                    height: 44,
                    onPressed: onTap,
                  ),
          ),
        ],
      ),
    );
  }
}
