import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_animate/flutter_animate.dart';
import '../../core/theme/app_colors.dart';
import '../../core/theme/text_styles.dart';
import '../../shared/widgets/stat_widgets.dart';
import '../../shared/widgets/utility_widgets.dart';
import '../../providers/app_providers.dart';

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  void _showLogoutDialog(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        backgroundColor: AppColors.surfaceCardElevated,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        title: Text('Log Out?', style: AppTextStyles.h2),
        content: Text('Are you sure you want to log out of HireGridX?', style: AppTextStyles.bodyMd),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel', style: AppTextStyles.bodyMd.copyWith(color: AppColors.textMuted)),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              await ref.read(authRepositoryProvider).logout();
              ref.read(currentUserProvider.notifier).clearUser();
              if (context.mounted) {
                context.go('/login');
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.danger,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: Text('Log Out', style: AppTextStyles.button.copyWith(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userAsync = ref.watch(currentUserProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Profile'),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          child: Column(
            children: [
              // User Avatar & Name Card
              userAsync.when(
                loading: () => const ShimmerCard(height: 140, borderRadius: 18),
                error: (_, __) => const SizedBox(),
                data: (user) {
                  final name = user?.name ?? 'Jevin Parmar';
                  final email = user?.email ?? 'jevin@example.com';
                  final branch = user?.branch ?? 'Computer Engineering';
                  final sem = user?.semester ?? '6th Sem';

                  return Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      gradient: AppColors.cardGradient,
                      borderRadius: BorderRadius.circular(18),
                      border: Border.all(color: AppColors.borderSubtle),
                    ),
                    child: Column(
                      children: [
                        CircleAvatar(
                          radius: 36,
                          backgroundColor: AppColors.primaryGreen.withOpacity(0.15),
                          child: Text(
                            name.substring(0, 1).toUpperCase(),
                            style: AppTextStyles.h1.copyWith(
                              color: AppColors.primaryGreen,
                              fontSize: 28,
                              fontWeight: FontWeight.w800,
                            ),
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(name, style: AppTextStyles.h2),
                        const SizedBox(height: 2),
                        Text(email, style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary)),
                        const SizedBox(height: 10),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.primaryGreen.withOpacity(0.12),
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: Text(
                                'Student',
                                style: AppTextStyles.label.copyWith(color: AppColors.primaryGreen, fontWeight: FontWeight.w700),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.surfaceInput,
                                borderRadius: BorderRadius.circular(999),
                              ),
                              child: Text(
                                '$branch • $sem',
                                style: AppTextStyles.label.copyWith(color: AppColors.textSecondary),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                },
              ).animate().fadeIn(duration: 400.ms),
              const SizedBox(height: 16),

              // Stat Chips Row (XP, Rank, Streak)
              userAsync.when(
                loading: () => const Row(
                  children: [
                    Expanded(child: ShimmerCard(height: 60)),
                    SizedBox(width: 8),
                    Expanded(child: ShimmerCard(height: 60)),
                    SizedBox(width: 8),
                    Expanded(child: ShimmerCard(height: 60)),
                  ],
                ),
                error: (_, __) => const SizedBox(),
                data: (user) {
                  return Row(
                    children: [
                      Expanded(
                        child: StatChip(
                          icon: const Icon(Icons.star_rounded, color: AppColors.accentYellow, size: 20),
                          value: '${user?.totalXp ?? 2450}',
                          label: 'XP',
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: StatChip(
                          icon: const Icon(Icons.local_fire_department_rounded, color: Color(0xFFF97316), size: 20),
                          value: '${user?.currentStreak ?? 12}',
                          label: 'Streak',
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: StatChip(
                          icon: const Icon(Icons.leaderboard_rounded, color: AppColors.primaryGreen, size: 20),
                          value: '#${user?.currentRank ?? 8}',
                          label: 'Rank',
                        ),
                      ),
                    ],
                  );
                },
              ).animate().fadeIn(delay: 100.ms),
              const SizedBox(height: 24),

              // Menu Tiles
              SettingsTile(
                icon: Icons.edit_outlined,
                title: 'Edit Profile',
                subtitle: 'Name, semester and college info',
                onTap: () => context.push('/profile/edit'),
              ),
              SettingsTile(
                icon: Icons.workspace_premium_outlined,
                title: 'My Subscriptions',
                subtitle: 'Active plan & payment history',
                onTap: () => context.push('/profile/subscriptions'),
              ),
              SettingsTile(
                icon: Icons.account_tree_outlined,
                title: 'Change Branch',
                subtitle: 'Computer Engineering',
                onTap: () => context.push('/settings/branch'),
              ),
              SettingsTile(
                icon: Icons.settings_outlined,
                title: 'Settings',
                subtitle: 'Security, device management & preferences',
                onTap: () => context.push('/settings'),
              ),
              SettingsTile(
                icon: Icons.help_outline_rounded,
                title: 'Help & Support',
                subtitle: 'FAQs, student guide & contact',
                onTap: () => context.push('/support'),
              ),
              SettingsTile(
                icon: Icons.celebration_outlined,
                title: 'Motivation & Milestone',
                subtitle: 'View your placement milestones',
                onTap: () => context.push('/motivation'),
              ),
              const SizedBox(height: 8),

              // Log Out Tile
              SettingsTile(
                icon: Icons.logout_rounded,
                title: 'Log Out',
                iconColor: AppColors.danger,
                textColor: AppColors.danger,
                trailing: const SizedBox(),
                onTap: () => _showLogoutDialog(context, ref),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }
}
