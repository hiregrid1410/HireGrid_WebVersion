import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/text_styles.dart';
import '../../shared/widgets/app_buttons.dart';

class PaymentStatusScreen extends StatelessWidget {
  final String planId;

  const PaymentStatusScreen({super.key, required this.planId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Spacer(),
              // Pending/Success Verification Illustration
              Container(
                width: 88,
                height: 88,
                decoration: BoxDecoration(
                  color: AppColors.accentYellow.withOpacity(0.15),
                  shape: BoxShape.circle,
                  border: Border.all(color: AppColors.accentYellow, width: 2),
                ),
                child: const Center(
                  child: Icon(Icons.hourglass_top_rounded, color: AppColors.accentYellow, size: 44),
                ),
              ).animate().scale(curve: Curves.easeOutBack),
              const SizedBox(height: 24),

              Text('Payment Request Submitted!', style: AppTextStyles.h1, textAlign: TextAlign.center),
              const SizedBox(height: 10),
              Text(
                'Your payment screenshot and transaction details are being verified by our team. Access will be unlocked shortly (usually within 15–30 mins).',
                textAlign: TextAlign.center,
                style: AppTextStyles.bodyMd.copyWith(color: AppColors.textSecondary, height: 1.5),
              ),
              const SizedBox(height: 28),

              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surfaceCard,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.borderSubtle),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Status', style: AppTextStyles.bodyMd.copyWith(color: AppColors.textMuted)),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: AppColors.warning.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        'Pending Verification',
                        style: AppTextStyles.label.copyWith(color: AppColors.warning, fontWeight: FontWeight.w700),
                      ),
                    ),
                  ],
                ),
              ),
              const Spacer(),

              SecondaryButton(
                text: 'View Payment History',
                onPressed: () => context.push('/profile/subscriptions'),
              ),
              const SizedBox(height: 12),

              PrimaryButton(
                text: 'Back to Plans',
                onPressed: () => context.go('/plans'),
              ),
              const SizedBox(height: 16),
            ],
          ),
        ),
      ),
    );
  }
}
