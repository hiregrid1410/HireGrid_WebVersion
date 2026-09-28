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
        title: const Text('Operator Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit_note_rounded, size: 26, color: AppColors.primaryGreen),
            onPressed: () => context.push('/profile/edit'),
          ),
        ],
      ),
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.primaryGreen,
          backgroundColor: AppColors.surfaceCardElevated,
          onRefresh: () async {
            ref.refresh(currentUserProvider);
          },
          child: SingleChildScrollView(
            physics: const AlwaysScrollableScrollPhysics(),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // 1. User Avatar & Info Card (Web Left Card Parity)
                userAsync.when(
                  loading: () => const ShimmerCard(height: 140, borderRadius: 18),
                  error: (_, __) => const SizedBox(),
                  data: (user) {
                    final name = user?.name ?? 'Student';
                    final email = user?.email ?? '';
                    final branch = user?.branch ?? 'Electrical Engineering';
                    final sem = user?.semester ?? 'Semester 4';

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
                              name.isNotEmpty ? name.substring(0, 1).toUpperCase() : 'S',
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
                          Wrap(
                            alignment: WrapAlignment.center,
                            crossAxisAlignment: WrapCrossAlignment.center,
                            spacing: 8,
                            runSpacing: 8,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: AppColors.primaryGreen.withOpacity(0.12),
                                  borderRadius: BorderRadius.circular(999),
                                ),
                                child: Text(
                                  'Student Operator',
                                  style: AppTextStyles.label.copyWith(color: AppColors.primaryGreen, fontWeight: FontWeight.w700),
                                ),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: AppColors.surfaceInput,
                                  borderRadius: BorderRadius.circular(999),
                                ),
                                child: Text(
                                  '$branch • $sem',
                                  style: AppTextStyles.label.copyWith(color: AppColors.textSecondary),
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
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

                // 2. XP Rank and Streak Boxes (Web Parity)
                userAsync.when(
                  loading: () => const Row(
                    children: [
                      Expanded(child: ShimmerCard(height: 70)),
                      SizedBox(width: 12),
                      Expanded(child: ShimmerCard(height: 70)),
                    ],
                  ),
                  error: (_, __) => const SizedBox(),
                  data: (user) {
                    final xp = user?.totalXp ?? 0;
                    final streak = user?.currentStreak ?? 0;

                    return Row(
                      children: [
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: AppColors.surfaceCard,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: AppColors.borderSubtle),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    const Icon(Icons.bolt_rounded, color: AppColors.accentYellow, size: 18),
                                    const SizedBox(width: 6),
                                    Text('XP RANK', style: AppTextStyles.label.copyWith(fontSize: 10)),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text('$xp XP', style: AppTextStyles.h2.copyWith(fontWeight: FontWeight.w800)),
                              ],
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Container(
                            padding: const EdgeInsets.all(14),
                            decoration: BoxDecoration(
                              color: AppColors.surfaceCard,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(color: AppColors.borderSubtle),
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    const Icon(Icons.local_fire_department_rounded, color: Color(0xFFF97316), size: 18),
                                    const SizedBox(width: 6),
                                    Text('STREAK', style: AppTextStyles.label.copyWith(fontSize: 10)),
                                  ],
                                ),
                                const SizedBox(height: 6),
                                Text('$streak Days', style: AppTextStyles.h2.copyWith(fontWeight: FontWeight.w800)),
                              ],
                            ),
                          ),
                        ),
                      ],
                    );
                  },
                ).animate().fadeIn(delay: 100.ms),
                const SizedBox(height: 20),

                // 3. PERFORMANCE SUMMARY (Web Parity Table / Card)
                Text('PERFORMANCE SUMMARY', style: AppTextStyles.h3).animate().fadeIn(delay: 150.ms),
                const SizedBox(height: 10),

                userAsync.when(
                  loading: () => const ShimmerCard(height: 140),
                  error: (_, __) => const SizedBox(),
                  data: (user) {
                    final modulesCompleted = user?.moduleScores.length ?? 0;
                    double avgScore = 0.0;
                    if (user != null && user.moduleScores.isNotEmpty) {
                      final sum = user.moduleScores.values.fold(0.0, (prev, val) => prev + val);
                      avgScore = sum / user.moduleScores.length;
                    }
                    final medal = user?.medalTier ?? 'Bronze V';
                    final plan = user?.planStatus == 'premium' ? 'Premium Membership' : 'Free Entitlement';

                    return Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: AppColors.surfaceCard,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(color: AppColors.borderSubtle),
                      ),
                      child: Column(
                        children: [
                          _buildSummaryRow('Practice Modules Completed', '$modulesCompleted / 27'),
                          const Divider(height: 18, color: AppColors.borderSubtle),
                          _buildSummaryRow('Average Accuracy Score', '${avgScore.toStringAsFixed(0)}%'),
                          const Divider(height: 18, color: AppColors.borderSubtle),
                          _buildSummaryRow('Rank Level Medal', medal),
                          const Divider(height: 18, color: AppColors.borderSubtle),
                          _buildSummaryRow('Plan Subscription', plan, valueColor: user?.planStatus == 'premium' ? AppColors.accentYellow : AppColors.primaryGreen),
                        ],
                      ),
                    );
                  },
                ).animate().fadeIn(delay: 200.ms),
                const SizedBox(height: 24),

                // 4. Quick Actions
                Text('SETTINGS & SUPPORT', style: AppTextStyles.h3).animate().fadeIn(delay: 250.ms),
                const SizedBox(height: 10),

                _buildActionTile(
                  icon: Icons.person_outline_rounded,
                  title: 'Operator Profile Settings',
                  subtitle: 'Branch, Semester, College & University',
                  onTap: () => context.push('/profile/edit'),
                ),
                _buildActionTile(
                  icon: Icons.workspace_premium_outlined,
                  title: 'Subscriptions & Plans',
                  subtitle: 'View entitlements and active membership',
                  onTap: () => context.push('/plans'),
                ),
                _buildActionTile(
                  icon: Icons.feedback_outlined,
                  title: 'Send Feedback',
                  subtitle: 'Report a bug or suggest improvements',
                  onTap: () => context.push('/support/feedback'),
                ),
                _buildActionTile(
                  icon: Icons.devices_rounded,
                  title: 'Device Management',
                  subtitle: 'Authorized sessions and hardware devices',
                  onTap: () => context.push('/settings/devices'),
                ),
                const SizedBox(height: 16),

                // 5. Logout Button
                InkWell(
                  borderRadius: BorderRadius.circular(14),
                  onTap: () => _showLogoutDialog(context, ref),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    decoration: BoxDecoration(
                      color: AppColors.danger.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.danger.withOpacity(0.3)),
                    ),
                    child: Center(
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.logout_rounded, color: AppColors.danger, size: 20),
                          const SizedBox(width: 8),
                          Text(
                            'Log Out of Account',
                            style: AppTextStyles.button.copyWith(color: AppColors.danger),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value, {Color? valueColor}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary)),
        Text(
          value,
          style: AppTextStyles.bodyMd.copyWith(
            fontWeight: FontWeight.w700,
            color: valueColor ?? AppColors.textPrimary,
          ),
        ),
      ],
    );
  }

  Widget _buildActionTile({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: InkWell(
        borderRadius: BorderRadius.circular(14),
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.surfaceCard,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.borderSubtle),
          ),
          child: Row(
            children: [
              Container(
                width: 38,
                height: 38,
                decoration: BoxDecoration(
                  color: AppColors.surfaceInput,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: AppColors.primaryGreen, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(title, style: AppTextStyles.bodyMd.copyWith(fontWeight: FontWeight.w600)),
                    const SizedBox(height: 2),
                    Text(subtitle, style: AppTextStyles.bodySm.copyWith(color: AppColors.textSecondary, fontSize: 11)),
                  ],
                ),
              ),
              const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: AppColors.textMuted),
            ],
          ),
        ),
      ),
    );
  }
}
