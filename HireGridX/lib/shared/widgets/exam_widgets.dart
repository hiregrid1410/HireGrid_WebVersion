import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/text_styles.dart';

enum MCQState { defaultState, selected, correct, incorrect }

class MCQOptionTile extends StatelessWidget {
  final String optionLabel; // "A", "B", "C", "D"
  final String text;
  final MCQState state;
  final VoidCallback onTap;

  const MCQOptionTile({
    super.key,
    required this.optionLabel,
    required this.text,
    required this.state,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    Color borderColor = AppColors.borderSubtle;
    Color bgColor = AppColors.surfaceCard;
    Color labelBgColor = AppColors.surfaceInput;
    Color labelTextColor = AppColors.textSecondary;

    switch (state) {
      case MCQState.selected:
        borderColor = AppColors.primaryGreen;
        bgColor = AppColors.primaryGreen.withOpacity(0.08);
        labelBgColor = AppColors.primaryGreen;
        labelTextColor = Colors.white;
        break;
      case MCQState.correct:
        borderColor = AppColors.primaryGreen;
        bgColor = AppColors.primaryGreen.withOpacity(0.15);
        labelBgColor = AppColors.primaryGreen;
        labelTextColor = Colors.white;
        break;
      case MCQState.incorrect:
        borderColor = AppColors.danger;
        bgColor = AppColors.danger.withOpacity(0.12);
        labelBgColor = AppColors.danger;
        labelTextColor = Colors.white;
        break;
      case MCQState.defaultState:
        break;
    }

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: borderColor, width: state == MCQState.defaultState ? 1 : 1.5),
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            child: Row(
              children: [
                Container(
                  width: 32,
                  height: 32,
                  decoration: BoxDecoration(
                    color: labelBgColor,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: Center(
                    child: Text(
                      optionLabel,
                      style: AppTextStyles.bodyMd.copyWith(
                        color: labelTextColor,
                        fontWeight: FontWeight.w700,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Text(
                    text,
                    style: AppTextStyles.bodyMd.copyWith(
                      color: AppColors.textPrimary,
                      fontWeight: state == MCQState.selected ? FontWeight.w600 : FontWeight.w400,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

class CountdownTimerPill extends StatelessWidget {
  final int remainingSeconds;

  const CountdownTimerPill({
    super.key,
    required this.remainingSeconds,
  });

  @override
  Widget build(BuildContext context) {
    final isCritical = remainingSeconds <= 60;
    final minutes = remainingSeconds ~/ 60;
    final seconds = remainingSeconds % 60;
    final timeStr = '${minutes.toString().padLeft(2, '0')}:${seconds.toString().padLeft(2, '0')}';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: isCritical ? AppColors.danger.withOpacity(0.15) : AppColors.primaryGreen.withOpacity(0.15),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(
          color: isCritical ? AppColors.danger : AppColors.primaryGreen,
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            Icons.timer_outlined,
            color: isCritical ? AppColors.danger : AppColors.primaryGreen,
            size: 16,
          ),
          const SizedBox(width: 6),
          Text(
            timeStr,
            style: AppTextStyles.numeric.copyWith(
              fontSize: 14,
              color: isCritical ? AppColors.danger : AppColors.primaryGreen,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

class AvatarRing extends StatelessWidget {
  final int rank;
  final String name;
  final double size;
  final String? avatarUrl;

  const AvatarRing({
    super.key,
    required this.rank,
    required this.name,
    this.size = 54,
    this.avatarUrl,
  });

  @override
  Widget build(BuildContext context) {
    Color ringColor = AppColors.primaryGreen;
    if (rank == 1) ringColor = AppColors.accentYellow;
    if (rank == 2) ringColor = const Color(0xFF94A3B8); // Silver
    if (rank == 3) ringColor = const Color(0xFFD97706); // Bronze

    return Stack(
      alignment: Alignment.center,
      clipBehavior: Clip.none,
      children: [
        Container(
          width: size,
          height: size,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: ringColor, width: 2.5),
          ),
          padding: const EdgeInsets.all(2),
          child: Container(
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: AppColors.surfaceCardElevated,
            ),
            child: Center(
              child: Text(
                name.isNotEmpty ? name.substring(0, 1).toUpperCase() : 'U',
                style: AppTextStyles.h3.copyWith(
                  color: ringColor,
                  fontWeight: FontWeight.w700,
                ),
              ),
            ),
          ),
        ),
        if (rank == 1)
          Positioned(
            top: -12,
            child: const Icon(
              Icons.emoji_events_rounded,
              color: AppColors.accentYellow,
              size: 20,
            ),
          ),
      ],
    );
  }
}
