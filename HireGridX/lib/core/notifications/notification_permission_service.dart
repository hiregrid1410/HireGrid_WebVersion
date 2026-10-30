import 'package:flutter/material.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../theme/app_colors.dart';
import '../theme/text_styles.dart';

class NotificationPermissionService {
  static const String _prefKeyAsked = 'hiregridx_notification_permission_prompted';
  static const String _prefKeyLastPromptTime = 'hiregridx_notification_last_prompt_time';

  /// Check current notification permission status from the operating system
  static Future<PermissionStatus> getStatus() async {
    return await Permission.notification.status;
  }

  /// Request directly through OS prompt
  static Future<bool> requestDirectly() async {
    final status = await Permission.notification.request();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_prefKeyAsked, true);
    await prefs.setInt(_prefKeyLastPromptTime, DateTime.now().millisecondsSinceEpoch);
    return status.isGranted;
  }

  /// Check whether the in-app permission prompt should appear on app opening
  static Future<bool> shouldPromptOnStartup() async {
    final status = await Permission.notification.status;
    if (status.isGranted) return false;

    final prefs = await SharedPreferences.getInstance();
    final alreadyAsked = prefs.getBool(_prefKeyAsked) ?? false;
    if (!alreadyAsked) return true;

    // If asked previously but denied, re-prompt gently after 3 days
    final lastTime = prefs.getInt(_prefKeyLastPromptTime) ?? 0;
    if (lastTime > 0) {
      final elapsed = DateTime.now().difference(DateTime.fromMillisecondsSinceEpoch(lastTime));
      if (elapsed.inDays >= 3 && !status.isPermanentlyDenied) {
        return true;
      }
    }

    return false;
  }

  /// Display a themed, friendly pre-permission modal sheet on startup and request OS permission
  static Future<bool> promptPermissionOnStartup(BuildContext context, {bool force = false}) async {
    if (!force) {
      final shouldPrompt = await shouldPromptOnStartup();
      if (!shouldPrompt) return false;
    }

    if (!context.mounted) return false;

    final granted = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) => _NotificationPermissionBottomSheet(),
    );

    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_prefKeyAsked, true);
    await prefs.setInt(_prefKeyLastPromptTime, DateTime.now().millisecondsSinceEpoch);

    return granted ?? false;
  }
}

class _NotificationPermissionBottomSheet extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surfaceCardElevated,
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      padding: EdgeInsets.fromLTRB(
        24,
        16,
        24,
        MediaQuery.of(context).padding.bottom + 24,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Drag handle
          Container(
            width: 44,
            height: 4,
            decoration: BoxDecoration(
              color: AppColors.borderSubtle,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 24),

          // Icon Hero
          Container(
            width: 68,
            height: 68,
            decoration: BoxDecoration(
              color: AppColors.primaryGreen.withOpacity(0.12),
              shape: BoxShape.circle,
              border: Border.all(color: AppColors.primaryGreen.withOpacity(0.3), width: 1.5),
            ),
            child: const Icon(
              Icons.notifications_active_rounded,
              color: AppColors.primaryGreen,
              size: 32,
            ),
          ),
          const SizedBox(height: 18),

          // Title & Subtitle
          Text(
            'Stay Updated on Placements',
            style: AppTextStyles.h2.copyWith(fontSize: 20),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 8),
          Text(
            'Turn on notifications to never miss high-priority assessment alerts and spaced repetition reviews.',
            style: AppTextStyles.bodyMd.copyWith(color: AppColors.textSecondary),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 22),

          // Features List
          _buildFeatureRow(
            icon: Icons.military_tech_rounded,
            iconColor: AppColors.accentYellow,
            title: 'Placement Mission Alerts',
            subtitle: 'Instant alerts when weekly company challenges unlock',
          ),
          const SizedBox(height: 14),
          _buildFeatureRow(
            icon: Icons.auto_stories_rounded,
            iconColor: const Color(0xFF10B981),
            title: 'Spaced Repetition Reminders',
            subtitle: 'Day 1, 3, & 7 schedule notifications to retain 95%+ concepts',
          ),
          const SizedBox(height: 14),
          _buildFeatureRow(
            icon: Icons.local_fire_department_rounded,
            iconColor: const Color(0xFFF97316),
            title: 'Daily Streak Protection',
            subtitle: 'Gentle alerts before your daily streak resets at midnight',
          ),
          const SizedBox(height: 24),

          // Primary Allow Button
          SizedBox(
            width: double.infinity,
            height: 52,
            child: ElevatedButton(
              onPressed: () async {
                final status = await Permission.notification.request();
                if (context.mounted) {
                  Navigator.of(context).pop(status.isGranted);
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primaryGreen,
                foregroundColor: Colors.white,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: Text(
                'Allow Notifications',
                style: AppTextStyles.button.copyWith(color: Colors.white, fontSize: 15),
              ),
            ),
          ),
          const SizedBox(height: 10),

          // Secondary Dismiss Button
          SizedBox(
            width: double.infinity,
            height: 44,
            child: TextButton(
              onPressed: () {
                Navigator.of(context).pop(false);
              },
              child: Text(
                'Maybe Later',
                style: AppTextStyles.button.copyWith(
                  color: AppColors.textMuted,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureRow({
    required IconData icon,
    required Color iconColor,
    required String title,
    required String subtitle,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: iconColor.withOpacity(0.12),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: iconColor, size: 18),
        ),
        const SizedBox(width: 14),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: AppTextStyles.bodyMd.copyWith(
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: AppTextStyles.bodySm.copyWith(
                  color: AppColors.textSecondary,
                  fontSize: 12,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}
