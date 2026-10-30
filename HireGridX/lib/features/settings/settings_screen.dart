import 'package:permission_handler/permission_handler.dart';
import '../../core/notifications/notification_permission_service.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/text_styles.dart';
import '../../shared/widgets/utility_widgets.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _emailNotifications = true;
  bool _pushNotifications = false;
  bool _screenshotBlocker = true;
  bool _appLock = false;

  @override
  void initState() {
    super.initState();
    _checkPermission();
  }

  Future<void> _checkPermission() async {
    final status = await NotificationPermissionService.getStatus();
    if (mounted) {
      setState(() => _pushNotifications = status.isGranted);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_rounded, size: 20),
          onPressed: () => context.pop(),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Section 1: Account
              Text('Account', style: AppTextStyles.label.copyWith(color: AppColors.textMuted)),
              const SizedBox(height: 8),

              SettingsTile(
                icon: Icons.lock_reset_rounded,
                title: 'Change Password',
                onTap: () => context.push('/forgot-password'),
              ),
              SettingsTile(
                icon: Icons.notifications_active_outlined,
                title: 'Push Notifications',
                subtitle: _pushNotifications ? 'Allowed by operating system' : 'Disabled (Tap to enable)',
                trailing: Switch.adaptive(
                  value: _pushNotifications,
                  activeColor: AppColors.primaryGreen,
                  onChanged: (v) async {
                    if (v) {
                      final granted = await NotificationPermissionService.requestDirectly();
                      setState(() => _pushNotifications = granted);
                    } else {
                      await openAppSettings();
                    }
                  },
                ),
              ),
              SettingsTile(
                icon: Icons.mail_outline_rounded,
                title: 'Email Notifications',
                trailing: Switch.adaptive(
                  value: _emailNotifications,
                  activeColor: AppColors.primaryGreen,
                  onChanged: (v) => setState(() => _emailNotifications = v),
                ),
              ),

              const SizedBox(height: 24),

              // Section 2: App Preferences
              Text('App Preferences', style: AppTextStyles.label.copyWith(color: AppColors.textMuted)),
              const SizedBox(height: 8),

              SettingsTile(
                icon: Icons.palette_outlined,
                title: 'Theme',
                subtitle: 'Forest Green & Cream (Light)',
                trailing: Text(
                  'Light',
                  style: AppTextStyles.bodySm.copyWith(
                    color: AppColors.forestGreen,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              SettingsTile(
                icon: Icons.language_rounded,
                title: 'Language',
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text('English', style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary)),
                    const SizedBox(width: 4),
                    const Icon(Icons.chevron_right_rounded, color: AppColors.textMuted, size: 20),
                  ],
                ),
                onTap: () {},
              ),
              const SizedBox(height: 24),

              // Section 3: Security & Exam Integrity
              Text('Security', style: AppTextStyles.label.copyWith(color: AppColors.textMuted)),
              const SizedBox(height: 8),

              SettingsTile(
                icon: Icons.shield_outlined,
                title: 'Screenshot Blocker',
                subtitle: 'Block capture during company assessments',
                trailing: Switch.adaptive(
                  value: _screenshotBlocker,
                  activeColor: AppColors.primaryGreen,
                  onChanged: (v) => setState(() => _screenshotBlocker = v),
                ),
              ),
              SettingsTile(
                icon: Icons.fingerprint_rounded,
                title: 'App Lock / Biometrics',
                trailing: Switch.adaptive(
                  value: _appLock,
                  activeColor: AppColors.primaryGreen,
                  onChanged: (v) => setState(() => _appLock = v),
                ),
              ),
              const SizedBox(height: 32),

              // App Version
              Center(
                child: Text(
                  'HireGridX Student v1.0.0 (Build 1410)',
                  style: AppTextStyles.bodySm.copyWith(color: AppColors.textMuted),
                ),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}
