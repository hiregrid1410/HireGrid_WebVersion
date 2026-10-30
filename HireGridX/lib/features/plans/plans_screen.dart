import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/text_styles.dart';
import '../../data/models/plan_model.dart';
import '../../shared/widgets/app_buttons.dart';
import '../../shared/widgets/utility_widgets.dart';
import '../../providers/app_providers.dart';

class PlansScreen extends ConsumerWidget {
  const PlansScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final plansAsync = ref.watch(plansListProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Plans & Pricing'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Intro Banner
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(18),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [AppColors.paleMint, AppColors.warmCream],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: AppColors.softBeigeGrey),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Choose Your Plan',
                      style: AppTextStyles.h2.copyWith(color: AppColors.forestGreen, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Get unlimited access to all company exams, speed tests, and revision modules.',
                      style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ).animate().fadeIn(duration: 400.ms),
              const SizedBox(height: 20),

              // Plans Cards
              plansAsync.when(
                loading: () => ListView.separated(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  itemCount: 3,
                  separatorBuilder: (_, __) => const SizedBox(height: 16),
                  itemBuilder: (_, __) => const ShimmerCard(height: 240, borderRadius: 18),
                ),
                error: (err, _) => EmptyStateWidget(title: 'Error', message: err.toString()),
                data: (plans) {
                  if (plans.isEmpty) {
                    return const EmptyStateWidget(
                      title: "No Plans Available",
                      message: "There are currently no active plans for the mobile application. Please check back later.",
                    );
                  }
                  return ListView.separated(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: plans.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 16),
                    itemBuilder: (context, index) {
                      final plan = plans[index];
                      return _buildPlanCard(context, plan);
                    },
                  );
                },
              ),
              const SizedBox(height: 24),

              // Trust Badges Footer
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surfaceCard,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.borderSubtle),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildTrustItem(Icons.verified_user_outlined, 'Secure UPI / Cards'),
                    _buildTrustItem(Icons.bolt_rounded, 'Instant Activation'),
                    _buildTrustItem(Icons.headset_mic_outlined, '24/7 Support'),
                  ],
                ),
              ).animate().fadeIn(delay: 300.ms),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPlanCard(BuildContext context, PlanModel plan) {
    final isPopular = plan.isPopular;

    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceCard,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(
          color: isPopular ? AppColors.accentYellow : AppColors.borderSubtle,
          width: isPopular ? 1.5 : 1,
        ),
        boxShadow: isPopular
            ? [
                BoxShadow(
                  color: AppColors.accentYellow.withOpacity(0.12),
                  blurRadius: 16,
                  offset: const Offset(0, 4),
                ),
              ]
            : null,
      ),
      child: Stack(
        children: [
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (isPopular) const SizedBox(height: 8),
                Text(plan.title, style: AppTextStyles.h2),
                const SizedBox(height: 2),
                Text(plan.subtitle, style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary)),
                const SizedBox(height: 14),

                // Price Row
                Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Text(
                      '₹${plan.priceInr}',
                      style: AppTextStyles.displayLg.copyWith(
                        color: isPopular ? AppColors.accentYellow : AppColors.primaryGreen,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(width: 6),
                    Text(plan.billingPeriod, style: AppTextStyles.bodyMd.copyWith(color: AppColors.textMuted)),
                  ],
                ),
                const SizedBox(height: 16),
                const Divider(),
                const SizedBox(height: 14),

                // Features list
                ...plan.features.map((feat) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: Row(
                      children: [
                        Icon(
                          Icons.check_circle_rounded,
                          color: isPopular ? AppColors.accentYellow : AppColors.primaryGreen,
                          size: 16,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            feat,
                            style: AppTextStyles.bodySm.copyWith(color: AppColors.textPrimary),
                          ),
                        ),
                      ],
                    ),
                  );
                }),
                const SizedBox(height: 18),

                // Select CTA
                isPopular
                    ? PrimaryButton(
                        text: 'Select Premium',
                        height: 48,
                        onPressed: () => context.push('/plans/checkout/${plan.id}'),
                      )
                    : SecondaryButton(
                        text: 'Select Plan',
                        onPressed: () => context.push('/plans/checkout/${plan.id}'),
                      ),
              ],
            ),
          ),
          if (isPopular)
            Positioned(
              top: 0,
              right: 20,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: const BoxDecoration(
                  color: AppColors.sandBeige,
                  borderRadius: BorderRadius.vertical(bottom: Radius.circular(8)),
                ),
                child: Text(
                  'MOST POPULAR',
                  style: AppTextStyles.label.copyWith(
                    color: AppColors.forestGreen,
                    fontSize: 10,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildTrustItem(IconData icon, String text) {
    return Expanded(
      child: Column(
        children: [
          Icon(icon, color: AppColors.primaryGreen, size: 20),
          const SizedBox(height: 4),
          Text(
            text,
            textAlign: TextAlign.center,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
            style: AppTextStyles.label.copyWith(fontSize: 9, color: AppColors.textSecondary),
          ),
        ],
      ),
    );
  }
}
