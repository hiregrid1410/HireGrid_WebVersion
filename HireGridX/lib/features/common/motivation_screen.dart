import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/text_styles.dart';
import '../../core/constants/dummy_assets.dart';
import '../../shared/widgets/brand_logo.dart';
import '../../shared/widgets/app_buttons.dart';

class MotivationEndScreen extends StatelessWidget {
  const MotivationEndScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        width: double.infinity,
        height: double.infinity,
        decoration: const BoxDecoration(
          gradient: AppColors.heroBlueGreenGradient,
        ),
        child: Stack(
          children: [
            // Mountain Background
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              height: 260,
              child: CustomPaint(
                painter: MountainSilhouettePainter(
                  primaryColor: AppColors.primaryGreenDark,
                  secondaryColor: AppColors.deepBlueSlate,
                  opacity: 0.8,
                ),
              ),
            ),
            SafeArea(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Spacer(),
                    // Brand Logo
                    const HireGridLogo(
                      size: 64,
                      subtitle: 'Learn · Practice · Get Placed',
                    ).animate().scale(curve: Curves.easeOutBack),
                    const SizedBox(height: 36),

                    // Motivational Quote
                    Text(
                      'Your next opportunity is just a practice away…',
                      textAlign: TextAlign.center,
                      style: AppTextStyles.h2.copyWith(
                        color: AppColors.textPrimary,
                        height: 1.5,
                        fontWeight: FontWeight.w700,
                      ),
                    ).animate().fadeIn(delay: 200.ms),
                    const SizedBox(height: 12),

                    Text(
                      'Every module completed and every test attempted takes you one step closer to top company offers.',
                      textAlign: TextAlign.center,
                      style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary, height: 1.5),
                    ).animate().fadeIn(delay: 350.ms),
                    const Spacer(),

                    PrimaryButton(
                      text: 'Back to Dashboard',
                      onPressed: () => context.go('/home'),
                    ).animate().fadeIn(delay: 500.ms),
                    const SizedBox(height: 20),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class NoInternetStateWidget extends StatelessWidget {
  final VoidCallback onRetry;

  const NoInternetStateWidget({super.key, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                color: AppColors.surfaceCardElevated,
                shape: BoxShape.circle,
                border: Border.all(color: AppColors.borderSubtle),
              ),
              child: const Icon(Icons.wifi_off_rounded, size: 40, color: AppColors.textMuted),
            ),
            const SizedBox(height: 20),
            Text('No Internet Connection', style: AppTextStyles.h2),
            const SizedBox(height: 8),
            Text(
              'Please check your network settings and try again.',
              textAlign: TextAlign.center,
              style: AppTextStyles.bodyMd.copyWith(color: AppColors.textSecondary),
            ),
            const SizedBox(height: 24),
            PrimaryButton(
              text: 'Retry',
              isFullWidth: false,
              onPressed: onRetry,
            ),
          ],
        ),
      ),
    );
  }
}
