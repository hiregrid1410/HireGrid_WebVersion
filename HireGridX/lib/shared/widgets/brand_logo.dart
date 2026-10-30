import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/text_styles.dart';

class HireGridLogo extends StatelessWidget {
  final double size;
  final bool showText;
  final String? subtitle;

  const HireGridLogo({
    super.key,
    this.size = 40,
    this.showText = true,
    this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Row(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            // Application Logo Image
            ClipRRect(
              borderRadius: BorderRadius.circular(size * 0.2),
              child: Image.asset(
                'assets/images/Application logo.png',
                width: size,
                height: size,
                fit: BoxFit.contain,
                errorBuilder: (context, error, stackTrace) {
                  return Image.asset(
                    'assets/images/app_logo.png',
                    width: size,
                    height: size,
                    fit: BoxFit.contain,
                  );
                },
              ),
            ),
            if (showText) ...[
              const SizedBox(width: 10),
              RichText(
                text: TextSpan(
                  children: [
                    TextSpan(
                      text: 'HireGrid',
                      style: AppTextStyles.displayLg.copyWith(
                        fontSize: size * 0.52,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primaryGreen,
                      ),
                    ),
                    TextSpan(
                      text: 'X',
                      style: AppTextStyles.displayLg.copyWith(
                        fontSize: size * 0.52,
                        fontWeight: FontWeight.w800,
                        color: AppColors.accentYellow,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
        if (subtitle != null) ...[
          const SizedBox(height: 6),
          Text(
            subtitle!,
            style: AppTextStyles.bodySm.copyWith(
              color: AppColors.textSecondary,
              letterSpacing: 0.5,
            ),
          ),
        ],
      ],
    );
  }
}
