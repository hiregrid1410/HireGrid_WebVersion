import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/text_styles.dart';
import '../../core/constants/dummy_assets.dart';
import '../../shared/widgets/brand_logo.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(milliseconds: 2200), () {
      if (mounted) {
        context.go('/login');
      }
    });
  }

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
            // Mountain Background Silhouette
            Positioned(
              bottom: 0,
              left: 0,
              right: 0,
              height: 220,
              child: CustomPaint(
                painter: MountainSilhouettePainter(
                  primaryColor: AppColors.primaryGreenDark,
                  secondaryColor: AppColors.deepBlueSlate,
                  opacity: 0.6,
                ),
              ),
            ),
            SafeArea(
              child: Center(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Spacer(),
                      // Brand Logo & Animation
                      const HireGridLogo(
                        size: 72,
                        subtitle: 'Learn · Practice · Get Placed',
                      )
                          .animate()
                          .fadeIn(duration: 800.ms)
                          .scale(begin: const Offset(0.85, 0.85), end: const Offset(1, 1), curve: Curves.easeOutBack),
                      const SizedBox(height: 32),
                      // Tagline Banner
                      Text(
                        'Better Skills, Bigger Opportunities\nYour Future, Our Mission',
                        textAlign: TextAlign.center,
                        style: AppTextStyles.bodyMd.copyWith(
                          color: AppColors.textSecondary,
                          height: 1.6,
                          fontWeight: FontWeight.w500,
                        ),
                      ).animate().fadeIn(delay: 500.ms, duration: 600.ms),
                      const Spacer(),
                      // Subtle loader / indicator dots
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(3, (index) {
                          return Container(
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            width: index == 0 ? 20 : 6,
                            height: 6,
                            decoration: BoxDecoration(
                              color: index == 0 ? AppColors.primaryGreen : AppColors.borderSubtle,
                              borderRadius: BorderRadius.circular(3),
                            ),
                          );
                        }),
                      ).animate().fadeIn(delay: 800.ms),
                      const SizedBox(height: 48),
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
