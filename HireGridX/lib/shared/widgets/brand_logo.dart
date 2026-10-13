import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/text_styles.dart';

class HireGridLogo extends StatelessWidget {
  final double size;
  final bool showText;
  final String? subtitle;

  const HireGridLogo({
    super.key,
    this.size = 56,
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
            // HX Mark
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    'H',
                    style: TextStyle(
                      fontFamily: 'Poppins',
                      fontSize: size * 0.75,
                      fontWeight: FontWeight.w900,
                      color: AppColors.primaryGreen,
                      letterSpacing: -1,
                    ),
                  ),
                  Text(
                    'X',
                    style: TextStyle(
                      fontFamily: 'Poppins',
                      fontSize: size * 0.75,
                      fontWeight: FontWeight.w900,
                      color: AppColors.accentYellow,
                      letterSpacing: -1,
                    ),
                  ),
                ],
              ),
            ),
            if (showText) ...[
              const SizedBox(width: 4),
              RichText(
                text: TextSpan(
                  children: [
                    TextSpan(
                      text: 'HireGrid',
                      style: AppTextStyles.displayLg.copyWith(
                        fontSize: size * 0.55,
                        fontWeight: FontWeight.w800,
                        color: Colors.white,
                      ),
                    ),
                    TextSpan(
                      text: 'X',
                      style: AppTextStyles.displayLg.copyWith(
                        fontSize: size * 0.55,
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
          const SizedBox(height: 4),
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
