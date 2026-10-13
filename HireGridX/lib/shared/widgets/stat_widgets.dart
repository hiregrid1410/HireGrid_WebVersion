import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/text_styles.dart';

// ==========================================
// 1. STAT CHIP (COMPACT ICON + NUMBER + LABEL)
// ==========================================
class StatChip extends StatelessWidget {
  final Widget icon;
  final String value;
  final String label;
  final Color? backgroundColor;

  const StatChip({
    super.key,
    required this.icon,
    required this.value,
    required this.label,
    this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: backgroundColor ?? AppColors.surfaceCard,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.borderSubtle),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          icon,
          const SizedBox(width: 8),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                label.toUpperCase(),
                style: AppTextStyles.label.copyWith(fontSize: 10),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w700),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

// ==========================================
// 2. STAT CARD MINI (DASHBOARD 5 TELEMETRY CARDS)
// ==========================================
class StatCardMini extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String value;
  final String? subtitle;

  const StatCardMini({
    super.key,
    required this.icon,
    required this.iconColor,
    required this.title,
    required this.value,
    this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
      decoration: BoxDecoration(
        color: AppColors.surfaceCard,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: iconColor.withOpacity(0.12),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: iconColor, size: 18),
              ),
              if (subtitle != null) ...[
                const SizedBox(width: 4),
                Flexible(
                  child: Text(
                    subtitle!,
                    style: AppTextStyles.bodySm.copyWith(
                      color: AppColors.textMuted,
                      fontSize: 10,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ],
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: AppTextStyles.h2.copyWith(
              fontWeight: FontWeight.w800,
              fontSize: 17,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 2),
          Text(
            title,
            style: AppTextStyles.label.copyWith(
              color: AppColors.textSecondary,
              fontSize: 10,
              fontWeight: FontWeight.w600,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

// ==========================================
// 3. MEDAL / RANK PILL (MATCHING WEB HEADER)
// ==========================================
class MedalRankPill extends StatelessWidget {
  final String medalTier;
  final VoidCallback? onTap;

  const MedalRankPill({
    super.key,
    required this.medalTier,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final lower = medalTier.toLowerCase();
    Color badgeColor = const Color(0xFFCD7F32); // Bronze
    IconData icon = Icons.military_tech_outlined;

    if (lower.contains('silver')) {
      badgeColor = const Color(0xFFC0C0C0);
    } else if (lower.contains('gold')) {
      badgeColor = AppColors.accentYellow;
      icon = Icons.emoji_events_outlined;
    } else if (lower.contains('platinum') || lower.contains('diamond')) {
      badgeColor = const Color(0xFF38BDF8);
      icon = Icons.diamond_outlined;
    } else if (lower.contains('crown') || lower.contains('ace') || lower.contains('conqueror')) {
      badgeColor = const Color(0xFFA855F7);
      icon = Icons.workspace_premium_rounded;
    }

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(999),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: badgeColor.withOpacity(0.12),
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: badgeColor.withOpacity(0.4), width: 1),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: badgeColor, size: 14),
            const SizedBox(width: 5),
            Text(
              medalTier,
              style: AppTextStyles.label.copyWith(
                color: badgeColor,
                fontWeight: FontWeight.w700,
                fontSize: 11,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ==========================================
// 4. STREAK PILL (MATCHING WEB HEADER)
// ==========================================
class StreakPill extends StatelessWidget {
  final int streakDays;

  const StreakPill({
    super.key,
    required this.streakDays,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
      decoration: BoxDecoration(
        color: const Color(0xFFF97316).withOpacity(0.12),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: const Color(0xFFF97316).withOpacity(0.4), width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.local_fire_department_rounded, color: Color(0xFFF97316), size: 14),
          const SizedBox(width: 5),
          Text(
            '$streakDays Day Streak',
            style: AppTextStyles.label.copyWith(
              color: const Color(0xFFF97316),
              fontWeight: FontWeight.w700,
              fontSize: 11,
            ),
          ),
        ],
      ),
    );
  }
}

// ==========================================
// 5. PROGRESS RING & LEVEL PROGRESS CARD
// ==========================================
class YourProgressCard extends StatelessWidget {
  final int completedModules;
  final int totalModules;
  final int currentXp;
  final String medalTier;
  final String nextMedalTier;

  const YourProgressCard({
    super.key,
    required this.completedModules,
    required this.totalModules,
    required this.currentXp,
    required this.medalTier,
    required this.nextMedalTier,
  });

  @override
  Widget build(BuildContext context) {
    final completionRate = totalModules > 0 ? (completedModules / totalModules).clamp(0.0, 1.0) : 0.0;
    final percentInt = (completionRate * 100).round();

    // XP progress in tier (0 to 1000 XP)
    final xpInLevel = currentXp % 1000;
    const maxXpLevel = 1000;
    final xpProgress = (xpInLevel / maxXpLevel).clamp(0.0, 1.0);

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surfaceCard,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.borderSubtle),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('Your Progress', style: AppTextStyles.h2),
              MedalRankPill(medalTier: medalTier),
            ],
          ),
          const SizedBox(height: 18),
          Row(
            children: [
              // Radial Progress
              SizedBox(
                width: 72,
                height: 72,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    CircularProgressIndicator(
                      value: completionRate,
                      strokeWidth: 7,
                      backgroundColor: AppColors.surfaceInput,
                      valueColor: const AlwaysStoppedAnimation<Color>(AppColors.primaryGreen),
                    ),
                    Text(
                      '$percentInt%',
                      style: AppTextStyles.h3.copyWith(fontWeight: FontWeight.w800),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 18),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Overall Completion',
                      style: AppTextStyles.bodyMd.copyWith(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      '$completedModules / $totalModules Modules Completed',
                      style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 18),
          const Divider(color: AppColors.borderSubtle, height: 1),
          const SizedBox(height: 14),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'XP Progress',
                style: AppTextStyles.label.copyWith(color: AppColors.textSecondary, fontSize: 11),
              ),
              Text(
                '$xpInLevel / $maxXpLevel XP to $nextMedalTier',
                style: AppTextStyles.label.copyWith(
                  color: AppColors.accentYellow,
                  fontWeight: FontWeight.w700,
                  fontSize: 11,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: xpProgress,
              minHeight: 6,
              backgroundColor: AppColors.surfaceInput,
              valueColor: const AlwaysStoppedAnimation<Color>(AppColors.accentYellow),
            ),
          ),
        ],
      ),
    );
  }
}

// ==========================================
// 6. LOCKED CONTENT CARD (PREMIUM GATING)
// ==========================================
class LockedContentCard extends StatelessWidget {
  final String title;
  final String description;
  final VoidCallback onUpgrade;

  const LockedContentCard({
    super.key,
    required this.title,
    required this.description,
    required this.onUpgrade,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: AppColors.surfaceCard,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.accentYellow.withOpacity(0.3)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 56,
            height: 56,
            decoration: BoxDecoration(
              color: AppColors.accentYellow.withOpacity(0.12),
              shape: BoxShape.circle,
            ),
            child: const Center(
              child: Icon(Icons.lock_outline_rounded, color: AppColors.accentYellow, size: 28),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: AppTextStyles.h2.copyWith(
              color: AppColors.accentYellow,
              fontWeight: FontWeight.w800,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            description,
            style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 20),
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
              onPressed: onUpgrade,
              child: Text(
                'Upgrade to Premium Membership',
                style: AppTextStyles.button.copyWith(color: Colors.black, fontWeight: FontWeight.w800),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ==========================================
// 7. SECTION HEADER & BADGES
// ==========================================
class SectionHeader extends StatelessWidget {
  final String title;
  final String? actionText;
  final VoidCallback? onActionTap;

  const SectionHeader({
    super.key,
    required this.title,
    this.actionText,
    this.onActionTap,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(title, style: AppTextStyles.h2),
        if (actionText != null)
          GestureDetector(
            onTap: onActionTap,
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  actionText!,
                  style: AppTextStyles.bodySm.copyWith(
                    color: AppColors.primaryGreen,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(width: 4),
                const Icon(
                  Icons.arrow_forward_ios_rounded,
                  size: 12,
                  color: AppColors.primaryGreen,
                ),
              ],
            ),
          ),
      ],
    );
  }
}

class TierBadge extends StatelessWidget {
  final bool isPremium;
  final String? customText;

  const TierBadge({
    super.key,
    required this.isPremium,
    this.customText,
  });

  @override
  Widget build(BuildContext context) {
    if (isPremium) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: AppColors.accentYellow.withOpacity(0.15),
          borderRadius: BorderRadius.circular(999),
          border: Border.all(color: AppColors.accentYellow.withOpacity(0.6), width: 1),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.lock_rounded, size: 10, color: AppColors.accentYellow),
            const SizedBox(width: 3),
            Text(
              customText ?? 'PAID',
              style: AppTextStyles.label.copyWith(
                color: AppColors.accentYellow,
                fontWeight: FontWeight.w800,
                fontSize: 9,
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.primaryGreen.withOpacity(0.12),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: AppColors.primaryGreen.withOpacity(0.5), width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Icon(Icons.check_circle_outline_rounded, size: 10, color: AppColors.primaryGreen),
          const SizedBox(width: 3),
          Text(
            customText ?? 'UNLOCKED',
            style: AppTextStyles.label.copyWith(
              color: AppColors.primaryGreen,
              fontWeight: FontWeight.w800,
              fontSize: 9,
            ),
          ),
        ],
      ),
    );
  }
}

class GradientBannerCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final String actionText;
  final VoidCallback onTap;
  final Widget? trailingIcon;
  final Gradient? gradient;

  const GradientBannerCard({
    super.key,
    required this.title,
    required this.subtitle,
    required this.actionText,
    required this.onTap,
    this.trailingIcon,
    this.gradient,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: gradient ??
            LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                const Color(0xFF14532D).withOpacity(0.9),
                const Color(0xFF0D1B2A).withOpacity(0.95),
              ],
            ),
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: AppColors.primaryGreen.withOpacity(0.3)),
        boxShadow: [
          BoxShadow(
            color: AppColors.primaryGreen.withOpacity(0.12),
            blurRadius: 16,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          borderRadius: BorderRadius.circular(18),
          onTap: onTap,
          child: Padding(
            padding: const EdgeInsets.all(18),
            child: Row(
              children: [
                Container(
                  width: 44,
                  height: 44,
                  decoration: BoxDecoration(
                    color: AppColors.accentYellow.withOpacity(0.2),
                    shape: BoxShape.circle,
                  ),
                  child: const Center(
                    child: Icon(Icons.star_rounded, color: AppColors.accentYellow, size: 26),
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: AppTextStyles.h3.copyWith(
                          color: AppColors.accentYellow,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        subtitle,
                        style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 8),
                      Text(
                        actionText,
                        style: AppTextStyles.bodySm.copyWith(
                          color: AppColors.primaryGreen,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
                if (trailingIcon != null) ...[
                  const SizedBox(width: 8),
                  trailingIcon!,
                ],
              ],
            ),
          ),
        ),
      ),
    );
  }
}
